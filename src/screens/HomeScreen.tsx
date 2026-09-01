import * as Clipboard from "expo-clipboard";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  Share,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatDrawer } from "./components/ChatDrawer";
import { ChatHeader } from "./components/ChatHeader";
import { ChatMessageList } from "./components/ChatMessageList";
import { ModelPickerModal, RenameChatModal } from "./components/ChatModals";
import { MessageComposer } from "./components/MessageComposer";
import { AppState } from "../hooks/useAppBootstrap";
import { fetchJson } from "../services/api";
import {
  loadChatThreads,
  persistChatThreads,
} from "../features/chat/chatStorage";
import { styles } from "../theme/styles";
import { ChatMessage, ChatThread, TranslationStrings } from "../types";

type Props = {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  strings: TranslationStrings;
};

export const KEYBOARD_LAYOUT = Object.freeze({
  closedOffset: 0,
  openedOffset: 0,
} as const);


export function getThreadTitle(question: string, fallback: string) {
  const singleLineQuestion = question.replace(/\s+/g, " ").trim();
  return singleLineQuestion.slice(0, 48) || fallback;
}

export function buildChatRequest(
  selectedModel: string,
  previousMessages: ChatMessage[],
  nextUserText: string,
) {
  return {
    model: selectedModel,
    messages: [
      ...previousMessages.map(({ role, text: content }) => ({ role, content })),
      { role: "user", content: nextUserText },
    ],
  };
}

export function resolveAssistantText(
  response:
    | { message?: { content?: string }; content?: string; response?: string }
    | undefined,
  fallback: string,
) {
  if (typeof response?.message?.content === "string")
    return response.message.content;
  if (typeof response?.content === "string") return response.content;
  if (typeof response?.response === "string") return response.response;
  return fallback;
}

function parseOllamaStreamMessage(raw: string): {
  text: string;
  done: boolean;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { text: "", done: false };

  try {
    const parsed = JSON.parse(trimmed) as {
      message?: { content?: string };
      content?: string;
      response?: string;
      done?: boolean;
      error?: string;
    };
    if (typeof parsed.error === "string") {
      throw new Error(parsed.error);
    }
    const text = resolveAssistantText(parsed, "");
    return { text, done: Boolean(parsed.done) };
  } catch {
    return { text: "", done: false };
  }
}

export function getConnectionStatus(
  appState: AppState,
  strings: TranslationStrings,
) {
  return appState.lastConnectionState === "success"
    ? {
        label: strings.connectionSuccessful || strings.connectionOk,
        color: "#22C55E",
      }
    : appState.lastConnectionState === "error"
      ? { label: strings.connectionFailed, color: "#EF4444" }
      : { label: strings.noConnectionTestYet, color: "#94A3B8" };
}

const formatTimestamp = (value: number) => {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const makeThread = (title: string, welcomeText: string): ChatThread => {
  const now = Date.now();
  const welcomeMessage: ChatMessage = {
    id: `${now}-welcome`,
    role: "assistant",
    text: welcomeText,
  };
  return {
    id: String(now),
    title,
    messages: [welcomeMessage],
    createdAt: now,
    updatedAt: now,
  };
};

const normalizeWelcomeMessage = (
  thread: ChatThread,
  welcomeText: string,
): ChatThread => ({
  ...thread,
  messages: thread.messages.map((message) =>
    message.role === "assistant" && message.id.endsWith("-welcome")
      ? { ...message, text: welcomeText }
      : message,
  ),
});

export { normalizeWelcomeMessage, parseOllamaStreamMessage };

export function normalizeThreadTitle(thread: ChatThread, newChatTitle: string) {
  if (thread.title !== newChatTitle) return thread;

  const firstUserMessage = thread.messages.find(
    (message) => message.role === "user",
  );
  return firstUserMessage
    ? { ...thread, title: getThreadTitle(firstUserMessage.text, newChatTitle) }
    : thread;
}

export function HomeScreen({ appState, setAppState, strings }: Props) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const lastBubbleTopRef = useRef(0);
  const lastModelRefreshKey = useRef("");

  useEffect(() => {
    loadChatThreads()
      .then(({ threads: loaded, activeThreadId: stored }) => {
        const normalized = loaded.map((thread) =>
          normalizeThreadTitle(
            normalizeWelcomeMessage(thread, strings.welcomeMessage),
            strings.newChat,
          ),
        );
        setThreads(normalized);
        setActiveThreadId(stored || normalized[0]?.id || "");
      })
      .catch(() => undefined);
  }, [strings.newChat, strings.welcomeMessage]);

  useEffect(() => {
    persistChatThreads(threads, activeThreadId).catch(() => undefined);
  }, [threads, activeThreadId]);

  useEffect(() => {
    if (threads.length === 0) {
      const thread = makeThread(strings.newChat, strings.welcomeMessage);
      setThreads([thread]);
      setActiveThreadId(thread.id);
      return;
    }

    if (!activeThreadId || !threads.some((thread) => thread.id === activeThreadId)) {
      setActiveThreadId(threads[0].id);
    }
  }, [activeThreadId, strings.newChat, strings.welcomeMessage, threads]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );
  const messageCount = activeThread?.messages.length ?? 0;
  const lastMessage = activeThread?.messages[messageCount - 1] ?? null;
  const connectionStatus = getConnectionStatus(appState, strings);
  const insets = useSafeAreaInsets();
  const keyboardInset = Math.max(insets.bottom, 0);
  const keyboardBottomOffset = Platform.OS === "ios" ? keyboardInset + 5 : 0;

  useEffect(() => {
    if (!activeThread || !lastMessage || !scrollViewRef.current) return;

    requestAnimationFrame(() => {
      if (lastMessage.role === "user") {
        scrollViewRef.current?.scrollToEnd({ animated: true });
        return;
      }

      const targetY = lastBubbleTopRef.current > 0 ? lastBubbleTopRef.current : 0;
      scrollViewRef.current?.scrollTo({ x: 0, y: targetY, animated: true });
    });
  }, [activeThread, lastMessage, messageCount]);

  useEffect(() => {
    if (!appState.serverUrl) return;
    const refreshKey = `${appState.serverUrl}|${appState.lastConnectionState}`;
    if (refreshKey === lastModelRefreshKey.current) return;
    lastModelRefreshKey.current = refreshKey;

    let isActive = true;
    const refreshModels = async () => {
      try {
        const result = await fetchJson<{ models?: { name: string }[] }>(
          `${appState.serverUrl}/api/tags`,
        );
        if (!isActive) return;
        const nextModels = result.models?.map((model) => model.name) ?? [];
        setAppState((current) => {
          const nextSelectedModel = nextModels.includes(current.selectedModel)
            ? current.selectedModel
            : (nextModels[0] ?? "");
          return {
            ...current,
            availableModels: nextModels,
            selectedModel: nextSelectedModel,
            lastConnectionState: "success",
            lastConnectionMessage:
              current.lastConnectionMessage || strings.connectionSuccessful,
          };
        });
      } catch (error: any) {
        if (!isActive) return;
        setAppState((current) => ({
          ...current,
          lastConnectionState: "error",
          lastConnectionMessage: error?.message ?? strings.unknownError,
        }));
      }
    };

    refreshModels();
    return () => {
      isActive = false;
    };
  }, [
    appState.serverUrl,
    appState.lastConnectionState,
    setAppState,
    strings.connectionSuccessful,
    strings.unknownError,
  ]);

  const updateThread = (
    id: string,
    updater: (thread: ChatThread) => ChatThread,
  ) =>
    setThreads((current) =>
      current.map((thread) => (thread.id === id ? updater(thread) : thread)),
    );

  const startNewChat = () => {
    const thread = makeThread(strings.newChat, strings.welcomeMessage);
    setThreads((current) => [thread, ...current]);
    setActiveThreadId(thread.id);
    setMessageText("");
    setDrawerOpen(false);
  };

  const deleteThread = (id: string) => {
    setThreads((current) => current.filter((thread) => thread.id !== id));
    if (activeThreadId === id) {
      const next = threads.find((thread) => thread.id !== id);
      setActiveThreadId(next?.id ?? "");
    }
  };

  const requestDeleteThread = (id: string) => {
    setAppState((current) => ({
      ...current,
      dialog: {
        title: strings.deleteChatTitle,
        message: strings.deleteChatMessage,
        confirmText: strings.delete,
        cancelText: strings.cancel,
        onConfirm: () => deleteThread(id),
      },
    }));
  };

  const renameThread = () => {
    if (!renameTargetId) return;
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    setThreads((current) =>
      current.map((thread) =>
        thread.id === renameTargetId
          ? { ...thread, title: trimmed, updatedAt: Date.now() }
          : thread,
      ),
    );
    setRenameTargetId(null);
    setRenameValue("");
  };

  const sendMessage = async () => {
    const text = messageText.trim();
    if (!text || isSending) return;
    if (!appState.selectedModel) {
      setAppState((current) => ({
        ...current,
        dialog: {
          title: strings.chooseModel,
          message: strings.noModelsAvailable,
          confirmText: strings.ok,
        },
      }));
      return;
    }
    if (!appState.serverUrl) {
      setAppState((current) => ({
        ...current,
        dialog: {
          title: strings.noServerUrlTitle,
          message: strings.noServerUrlMessage,
          confirmText: strings.ok,
        },
      }));
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text,
    };
    let threadId = activeThreadId;
    if (!threadId) {
      const thread = makeThread(
        getThreadTitle(text, strings.newChat),
        strings.welcomeMessage,
      );
      threadId = thread.id;
      setThreads((current) => [thread, ...current]);
      setActiveThreadId(threadId);
    }
    setMessageText("");
    setIsSending(true);
    updateThread(threadId, (thread) => ({
      ...thread,
      messages: [...thread.messages, userMessage],
      updatedAt: Date.now(),
      title: thread.messages.some((message) => message.role === "user")
        ? thread.title
        : getThreadTitle(text, strings.newChat),
    }));
    try {
      const baseUrl = appState.serverUrl.replace(/\/+$/, "");
      const threadMessages =
        threads.find((thread) => thread.id === threadId)?.messages ?? [];
      const requestBody = buildChatRequest(
        appState.selectedModel,
        threadMessages,
        text,
      );

      console.debug("[HomeAI] sending chat request", {
        url: `${baseUrl}/api/chat`,
        model: appState.selectedModel,
        messageCount: requestBody.messages.length,
        lastUserMessage: text,
      });

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          Accept: "application/x-ndjson",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...requestBody, stream: true }),
      });

      if (!response.ok) {
        const rawError = await response.text();
        let message =
          rawError || `Request failed with status ${response.status}`;
        try {
          const parsed = JSON.parse(rawError) as {
            error?: string;
            message?: string;
            detail?: string;
          };
          message =
            typeof parsed.error === "string"
              ? parsed.error
              : typeof parsed.message === "string"
                ? parsed.message
                : typeof parsed.detail === "string"
                  ? parsed.detail
                  : message;
        } catch {
          // Ignore invalid fallback payloads and use the raw text instead.
        }
        throw new Error(message);
      }

      if (!response.body) {
        throw new Error(strings.noResponseReceived);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split(/\r?\n/);
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const parsed = parseOllamaStreamMessage(chunk);
          if (parsed.text) {
            assistantText += parsed.text;
          }
        }
      }

      if (buffer.trim()) {
        const finalChunk = parseOllamaStreamMessage(buffer);
        if (finalChunk.text) {
          assistantText += finalChunk.text;
        }
      }

      const finalAssistantText = assistantText || strings.noResponseReceived;
      console.debug("[HomeAI] Ollama response", {
        url: `${baseUrl}/api/chat`,
        assistantPreview: finalAssistantText.slice(0, 500),
      });

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        text: finalAssistantText,
      };
      updateThread(threadId, (thread) => ({
        ...thread,
        messages: [...thread.messages, assistantMessage],
        updatedAt: Date.now(),
      }));
    } catch (error: any) {
      console.error("[HomeAI] chat request failed", error);
      setAppState((current) => ({
        ...current,
        dialog: {
          title: strings.chatFailed,
          message: error?.message ?? strings.unknownError,
          confirmText: strings.ok,
        },
      }));
    } finally {
      setIsSending(false);
    }
  };

  const copyMessage = async (text: string, id: string) => {
    try {
      if (Platform.OS === "web" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        await Clipboard.setStringAsync(text);
      }
      setCopiedMessageId(id);
      setTimeout(
        () =>
          setCopiedMessageId((current) => (current === id ? null : current)),
        1200,
      );
    } catch {
      setAppState((current) => ({
        ...current,
        dialog: {
          title: strings.copyFailedTitle,
          message: strings.copyFailedMessage,
          confirmText: strings.ok,
        },
      }));
    }
  };

  const shareMessage = async (text: string) => {
    try {
      await Share.share({
        message: text,
        title: "Share response",
      });
    } catch {
      setAppState((current) => ({
        ...current,
        dialog: {
          title: strings.copyFailedTitle,
          message: strings.copyFailedMessage,
          confirmText: strings.ok,
        },
      }));
    }
  };

  useEffect(() => {
    const keyboardListener = Keyboard.addListener("keyboardDidShow", () => {
      if (!activeThread || !scrollViewRef.current) return;
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
    });

    return () => keyboardListener.remove();
  }, [activeThread]);

  return (
    <View style={styles.chatScreen}>
      <ChatHeader
        connectionStatus={connectionStatus}
        selectedModel={appState.selectedModel}
        serverUrl={appState.serverUrl}
        strings={strings}
        onMenuPress={() => setDrawerOpen(true)}
        onModelPress={() => setIsModelPickerOpen(true)}
        onNewChatPress={startNewChat}
      />

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? keyboardBottomOffset : 0}
        enabled
      >
        <ScrollView
          style={styles.chatScrollContainer}
          contentContainerStyle={styles.chatScrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onScrollBeginDrag={Keyboard.dismiss}
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
        >
          <ChatMessageList
            copiedMessageId={copiedMessageId}
            isSending={isSending}
            messages={activeThread?.messages ?? []}
            strings={strings}
            onCopy={copyMessage}
            onLastAssistantLayout={(event) => {
              lastBubbleTopRef.current = event.nativeEvent.layout.y;
            }}
            onShare={shareMessage}
          />
        </ScrollView>
        <MessageComposer
          isSending={isSending}
          messageText={messageText}
          strings={strings}
          onChangeText={setMessageText}
          onClear={() => setMessageText("")}
          onSend={sendMessage}
        />
      </KeyboardAvoidingView>

      {drawerOpen ? (
        <ChatDrawer
          activeThreadId={activeThreadId}
          formatTimestamp={formatTimestamp}
          strings={strings}
          threads={threads}
          onClose={() => setDrawerOpen(false)}
          onDelete={requestDeleteThread}
          onNewChat={startNewChat}
          onRename={(id, title) => {
            setRenameTargetId(id);
            setRenameValue(title);
          }}
          onSelect={(id) => {
            setActiveThreadId(id);
            setDrawerOpen(false);
          }}
        />
      ) : null}

      <ModelPickerModal
        availableModels={appState.availableModels}
        isOpen={isModelPickerOpen}
        selectedModel={appState.selectedModel}
        strings={strings}
        onClose={() => setIsModelPickerOpen(false)}
        onSelect={(model) => {
          setAppState((current) => ({ ...current, selectedModel: model }));
          setIsModelPickerOpen(false);
        }}
      />
      <RenameChatModal
        isOpen={!!renameTargetId}
        strings={strings}
        value={renameValue}
        onCancel={() => setRenameTargetId(null)}
        onChangeText={setRenameValue}
        onSave={renameThread}
      />
    </View>
  );
}
