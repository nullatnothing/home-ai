import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AppState } from '../hooks/useAppBootstrap';
import { fetchJson } from '../services/api';
import { loadChatThreads, persistChatThreads } from '../features/chat/chatStorage';
import { styles } from '../theme/styles';
import { ChatMessage, ChatThread, TranslationStrings } from '../types';

type Props = { appState: AppState; setAppState: React.Dispatch<React.SetStateAction<AppState>>; strings: TranslationStrings };

const makeThread = (title: string): ChatThread => {
  const now = Date.now();
  return { id: String(now), title, messages: [], createdAt: now, updatedAt: now };
};

export function HomeScreen({ appState, setAppState, strings }: Props) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  useEffect(() => { loadChatThreads().then(({ threads: loaded, activeThreadId: stored }) => { setThreads(loaded); setActiveThreadId(stored || loaded[0]?.id || ''); }).catch(() => undefined); }, []);
  useEffect(() => { persistChatThreads(threads, activeThreadId).catch(() => undefined); }, [threads, activeThreadId]);

  const activeThread = useMemo(() => threads.find((thread) => thread.id === activeThreadId) ?? null, [threads, activeThreadId]);

  const updateThread = (id: string, updater: (thread: ChatThread) => ChatThread) => setThreads((current) => current.map((thread) => (thread.id === id ? updater(thread) : thread)));

  const startNewChat = () => {
    const thread = makeThread(strings.newChat);
    setThreads((current) => [thread, ...current]);
    setActiveThreadId(thread.id);
    setDrawerOpen(false);
  };

  const sendMessage = async () => {
    const text = messageText.trim();
    if (!text || isSending) return;
    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: 'user', text };
    let threadId = activeThreadId;
    if (!threadId) {
      const thread = makeThread(text.slice(0, 24) || strings.newChat);
      threadId = thread.id;
      setThreads((current) => [thread, ...current]);
      setActiveThreadId(threadId);
    }
    setMessageText('');
    setIsSending(true);
    updateThread(threadId, (thread) => ({ ...thread, messages: [...thread.messages, userMessage], updatedAt: Date.now(), title: thread.messages.length ? thread.title : text.slice(0, 24) }));
    try {
      const baseUrl = appState.serverUrl.replace(/\/+$/, '');
      const response = await fetchJson<{ message?: string }>(`${baseUrl}/api/chat`, { method: 'POST', body: JSON.stringify({ model: appState.selectedModel, messages: [...(threads.find((thread) => thread.id === threadId)?.messages ?? []), userMessage] }) });
      const assistantMessage: ChatMessage = { id: `${Date.now()}-assistant`, role: 'assistant', text: response.message || strings.noResponseReceived };
      updateThread(threadId, (thread) => ({ ...thread, messages: [...thread.messages, assistantMessage], updatedAt: Date.now() }));
    } catch (error: any) {
      Alert.alert(strings.chatFailed, error?.message ?? strings.unknownError);
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
      Alert.alert(strings.copyFailedTitle, strings.copyFailedMessage);
    }
  };

  return (
    <View style={styles.chatScreen}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => setDrawerOpen(true)}><Ionicons name="menu" size={18} color="#FFF" /></Pressable>
        <Text style={[styles.heading, styles.topBarHeading]}>{strings.home}</Text>
        <Pressable style={styles.iconButton} onPress={startNewChat}><Ionicons name="add" size={18} color="#FFF" /></Pressable>
      </View>
      <View style={styles.modelSection}>
        <Text style={styles.label}>{strings.currentModel}</Text>
        <Pressable style={styles.dropdown} onPress={() => setAppState((current) => ({ ...current }))}>
          <Text style={styles.dropdownText}>{appState.selectedModel || strings.noModelsAvailable}</Text>
          <Ionicons name="chevron-down" size={16} color="#FFF" />
        </Pressable>
      </View>
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
          <Pressable onPress={sendMessage} style={[styles.sendButton, isSending && styles.sendButtonDisabled]}><Text style={styles.sendButtonText}>{isSending ? strings.sendLoading : strings.send}</Text></Pressable>
        </View>
      </View>
      {drawerOpen ? (
        <Pressable style={styles.drawerOverlay} onPress={() => setDrawerOpen(false)}>
          <View style={styles.drawerScrim} />
          <View style={styles.drawerPanel}>
            <View style={styles.drawerHeader}><Text style={styles.drawerTitle}>{strings.chatHistory}</Text></View>
            <Pressable style={styles.drawerNewChatButton} onPress={startNewChat}><Text style={styles.drawerNewChatText}>{strings.newChat}</Text></Pressable>
            <ScrollView contentContainerStyle={styles.historyList}>
              {threads.map((thread) => (
                <Pressable key={thread.id} onPress={() => setActiveThreadId(thread.id)} style={[styles.historyItem, thread.id === activeThreadId && styles.historyItemActive]}>
                  <Text style={[styles.historyItemText, thread.id === activeThreadId && styles.historyItemTextActive]}>{thread.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
