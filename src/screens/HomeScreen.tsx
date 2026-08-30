import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AppState } from '../hooks/useAppBootstrap';
import { fetchJson } from '../services/api';
import { loadChatThreads, persistChatThreads } from '../features/chat/chatStorage';
import { styles } from '../theme/styles';
import { ChatMessage, ChatThread, TranslationStrings } from '../types';

type Props = { appState: AppState; setAppState: React.Dispatch<React.SetStateAction<AppState>>; strings: TranslationStrings };

const formatTimestamp = (value: number) => {
  if (!value) return '';
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
};

const makeThread = (title: string, welcomeText: string): ChatThread => {
  const now = Date.now();
  const welcomeMessage: ChatMessage = { id: `${now}-welcome`, role: 'assistant', text: welcomeText };
  return { id: String(now), title, messages: [welcomeMessage], createdAt: now, updatedAt: now };
};

const normalizeWelcomeMessage = (thread: ChatThread, welcomeText: string): ChatThread => ({
  ...thread,
  messages: thread.messages.map((message) => (
    message.role === 'assistant' && message.id.endsWith('-welcome')
      ? { ...message, text: welcomeText }
      : message
  )),
});

export function HomeScreen({ appState, setAppState, strings }: Props) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    loadChatThreads().then(({ threads: loaded, activeThreadId: stored }) => {
      const normalized = loaded.map((thread) => normalizeWelcomeMessage(thread, strings.welcomeMessage));
      setThreads(normalized);
      setActiveThreadId(stored || normalized[0]?.id || '');
    }).catch(() => undefined);
  }, [strings.welcomeMessage]);

  useEffect(() => { persistChatThreads(threads, activeThreadId).catch(() => undefined); }, [threads, activeThreadId]);

  const activeThread = useMemo(() => threads.find((thread) => thread.id === activeThreadId) ?? null, [threads, activeThreadId]);
  const connectionStatus = appState.lastConnectionState === 'success'
    ? { label: strings.connectionSuccessful || strings.connectionOk, color: '#22C55E' }
    : appState.lastConnectionState === 'error'
      ? { label: strings.connectionFailed, color: '#EF4444' }
      : { label: strings.noConnectionTestYet, color: '#94A3B8' };
  const lastModelRefreshKey = useRef('');

  useEffect(() => {
    if (!appState.serverUrl) return;
    const refreshKey = `${appState.serverUrl}|${appState.lastConnectionState}`;
    if (refreshKey === lastModelRefreshKey.current) return;
    lastModelRefreshKey.current = refreshKey;

    let isActive = true;
    const refreshModels = async () => {
      try {
        const result = await fetchJson<{ models?: { name: string }[] }>(`${appState.serverUrl}/api/tags`);
        if (!isActive) return;
        const nextModels = result.models?.map((model) => model.name) ?? [];
        setAppState((current) => {
          const nextSelectedModel = nextModels.includes(current.selectedModel) ? current.selectedModel : nextModels[0] ?? '';
          return { ...current, availableModels: nextModels, selectedModel: nextSelectedModel, lastConnectionState: 'success', lastConnectionMessage: current.lastConnectionMessage || strings.connectionSuccessful };
        });
      } catch (error: any) {
        if (!isActive) return;
        setAppState((current) => ({ ...current, lastConnectionState: 'error', lastConnectionMessage: error?.message ?? strings.unknownError }));
      }
    };

    refreshModels();
    return () => { isActive = false; };
  }, [appState.serverUrl, appState.lastConnectionState, strings.connectionSuccessful, strings.unknownError]);

  const updateThread = (id: string, updater: (thread: ChatThread) => ChatThread) => setThreads((current) => current.map((thread) => (thread.id === id ? updater(thread) : thread)));

  const startNewChat = () => {
    const thread = makeThread(strings.newChat, strings.welcomeMessage);
    setThreads((current) => [thread, ...current]);
    setActiveThreadId(thread.id);
    setMessageText('');
    setDrawerOpen(false);
  };

  const deleteThread = (id: string) => {
    setThreads((current) => current.filter((thread) => thread.id !== id));
    if (activeThreadId === id) {
      const next = threads.find((thread) => thread.id !== id);
      setActiveThreadId(next?.id ?? '');
    }
  };

  const renameThread = () => {
    if (!renameTargetId) return;
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    setThreads((current) => current.map((thread) => (thread.id === renameTargetId ? { ...thread, title: trimmed, updatedAt: Date.now() } : thread)));
    setRenameTargetId(null);
    setRenameValue('');
  };

  const sendMessage = async () => {
    const text = messageText.trim();
    if (!text || isSending) return;
    if (!appState.selectedModel) {
      setAppState((current) => ({ ...current, dialog: { title: strings.chooseModel, message: strings.noModelsAvailable, confirmText: strings.ok } }));
      return;
    }
    if (!appState.serverUrl) {
      setAppState((current) => ({ ...current, dialog: { title: strings.noServerUrlTitle, message: strings.noServerUrlMessage, confirmText: strings.ok } }));
      return;
    }

    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: 'user', text };
    let threadId = activeThreadId;
    if (!threadId) {
      const thread = makeThread(text.slice(0, 24) || strings.newChat, strings.welcomeMessage);
      threadId = thread.id;
      setThreads((current) => [thread, ...current]);
      setActiveThreadId(threadId);
    }
    setMessageText('');
    setIsSending(true);
    updateThread(threadId, (thread) => ({ ...thread, messages: [...thread.messages, userMessage], updatedAt: Date.now(), title: thread.messages.length ? thread.title : text.slice(0, 24) }));
    try {
      const baseUrl = appState.serverUrl.replace(/\/+$/, '');
      const response = await fetchJson<{ message?: string }>(`${baseUrl}/api/chat`, {
        method: 'POST',
        body: JSON.stringify({ model: appState.selectedModel, messages: [...(threads.find((thread) => thread.id === threadId)?.messages ?? []), userMessage] }),
      });
      const assistantMessage: ChatMessage = { id: `${Date.now()}-assistant`, role: 'assistant', text: response.message || strings.noResponseReceived };
      updateThread(threadId, (thread) => ({ ...thread, messages: [...thread.messages, assistantMessage], updatedAt: Date.now() }));
    } catch (error: any) {
      setAppState((current) => ({ ...current, dialog: { title: strings.chatFailed, message: error?.message ?? strings.unknownError, confirmText: strings.ok } }));
    } finally {
      setIsSending(false);
    }
  };

  const copyMessage = async (text: string, id: string) => {
    try {
      if (Platform.OS === 'web' && navigator.clipboard) await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId((current) => (current === id ? null : current)), 1200);
    } catch {
      setAppState((current) => ({ ...current, dialog: { title: strings.copyFailedTitle, message: strings.copyFailedMessage, confirmText: strings.ok } }));
    }
  };

  return (
    <View style={styles.chatScreen}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable style={styles.iconButton} onPress={() => setDrawerOpen(true)}><Ionicons name="menu" size={18} color="#FFF" /></Pressable>
          <View style={styles.headerMeta}>
            <Text style={[styles.heading, styles.topBarHeading]}>{strings.home}</Text>
            <Text style={styles.serverText}>{appState.serverUrl || strings.noServerUrlConfigured}</Text>
          </View>
        </View>
        <View style={styles.topBarActions}>
          <Pressable style={styles.iconButton} onPress={startNewChat}><Ionicons name="add" size={18} color="#FFF" /></Pressable>
        </View>
      </View>

      <View style={styles.connectionRow}>
        <View style={[styles.statusDot, { backgroundColor: connectionStatus.color }]} />
        <Text style={styles.connectionLabel}>{connectionStatus.label}</Text>
      </View>

      <View style={styles.modelSection}>
        <View style={styles.modelRow}>
          <Text style={styles.label}>{strings.currentModel}</Text>
          <Pressable style={styles.dropdown} onPress={() => setIsModelPickerOpen(true)}>
            <Text style={styles.dropdownText}>{appState.selectedModel || strings.noModelsAvailable}</Text>
            <Ionicons name="chevron-down" size={16} color="#FFF" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView contentContainerStyle={styles.chatList}>
          {activeThread?.messages.length ? activeThread.messages.map((message) => (
            <Pressable key={message.id} onLongPress={() => copyMessage(message.text, message.id)} style={[styles.messageBubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <Text style={[styles.messageText, message.role === 'user' && styles.userMessageText]}>{message.text}</Text>
              {copiedMessageId === message.id ? <Text style={styles.copiedHint}>{strings.copied}</Text> : null}
            </Pressable>
          )) : <Text style={styles.emptyChatText}>{strings.startConversation}</Text>}
        </ScrollView>
        <View style={styles.inputComposer}>
          <View style={styles.inputRow}>
            <TextInput value={messageText} onChangeText={setMessageText} placeholder={strings.messagePlaceholder} style={styles.input} multiline />
            <Pressable onPress={sendMessage} style={[styles.sendButton, isSending && styles.sendButtonDisabled]} disabled={isSending}><Text style={styles.sendButtonText}>{isSending ? strings.sendLoading : strings.send}</Text></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {drawerOpen ? (
        <Pressable style={styles.drawerOverlay} onPress={() => setDrawerOpen(false)}>
          <View style={styles.drawerScrim} />
          <View style={styles.drawerPanel}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{strings.chatHistory}</Text>
              <Pressable style={styles.drawerCloseButton} onPress={() => setDrawerOpen(false)}>
                <Ionicons name="close" size={16} color="#FFF" />
              </Pressable>
            </View>
            <Pressable style={styles.drawerNewChatButton} onPress={startNewChat}>
              <View style={styles.drawerNewChatContent}>
                <Ionicons name="add-circle-outline" size={16} color="#FFF" />
                <Text style={styles.drawerNewChatText}>{strings.newChat}</Text>
              </View>
            </Pressable>
            <ScrollView contentContainerStyle={styles.historyList}>
              {threads.map((thread) => (
                <View key={thread.id} style={[styles.historyItem, thread.id === activeThreadId && styles.historyItemActive]}>
                  <Pressable onPress={() => { setActiveThreadId(thread.id); setDrawerOpen(false); }} style={{ flex: 1 }}>
                    <Text style={[styles.historyItemText, thread.id === activeThreadId && styles.historyItemTextActive]}>{thread.title}</Text>
                    <Text style={[styles.historyTimestamp, thread.id === activeThreadId && styles.historyTimestampActive]}>{formatTimestamp(thread.updatedAt)}</Text>
                  </Pressable>
                  <View style={styles.historyActions}>
                    <Pressable onPress={(event) => { event.stopPropagation(); setRenameTargetId(thread.id); setRenameValue(thread.title); }} style={styles.historyActionButton}><Ionicons name="pencil" size={14} color={thread.id === activeThreadId ? '#FFF' : '#0F172A'} /></Pressable>
                    <Pressable onPress={(event) => { event.stopPropagation(); deleteThread(thread.id); }} style={styles.historyActionButton}><Ionicons name="trash" size={14} color={thread.id === activeThreadId ? '#FFF' : '#0F172A'} /></Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      ) : null}

      <Modal visible={isModelPickerOpen} transparent animationType="fade" onRequestClose={() => setIsModelPickerOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsModelPickerOpen(false)}>
          <Pressable style={styles.dialogCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>{strings.chooseModel}</Text>
            {appState.availableModels.length ? appState.availableModels.map((model) => (
              <Pressable key={model} style={[styles.modelOption, appState.selectedModel === model && styles.modelOptionSelected]} onPress={() => { setAppState((current) => ({ ...current, selectedModel: model })); setIsModelPickerOpen(false); }}>
                <Text style={[styles.modelOptionText, appState.selectedModel === model && styles.modelOptionTextSelected]}>{model}</Text>
              </Pressable>
            )) : <Text style={styles.emptyText}>{strings.noModelsFoundYet}</Text>}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!renameTargetId} transparent animationType="fade" onRequestClose={() => setRenameTargetId(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setRenameTargetId(null)}>
          <Pressable style={styles.dialogCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>{strings.renameChat}</Text>
            <TextInput value={renameValue} onChangeText={setRenameValue} style={styles.renameInput} placeholder={strings.enterChatTitle} autoFocus />
            <View style={styles.renameActions}>
              <Pressable onPress={() => setRenameTargetId(null)} style={[styles.secondaryButton, styles.renameActionButton]}><Text style={styles.secondaryButtonText}>{strings.cancel}</Text></Pressable>
              <Pressable onPress={renameThread} style={[styles.primaryButton, styles.renameActionButton]}><Text style={styles.primaryButtonText}>{strings.save}</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
