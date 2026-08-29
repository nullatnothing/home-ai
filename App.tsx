import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardEvents,
  KeyboardProvider,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_KEYS = {
  serverUrl: 'homeai.serverUrl',
  selectedModel: 'homeai.selectedModel',
};

const Tab = createBottomTabNavigator();

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type ModelInfo = {
  name: string;
};

type ChatThread = {
  id: string;
  title: string;
  messages: ChatMessage[];
};

const DEFAULT_SERVER_URL = 'http://192.168.88.13:11434';
const DEFAULT_MODELS: string[] = [];

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
    }

    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }

    await AsyncStorage.setItem(key, value);
  },
};

function sanitizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '');
  }

  return `http://${trimmed.replace(/\/+$/, '')}`;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export default function App() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0] ?? '');
  const [availableModels, setAvailableModels] = useState<string[]>(DEFAULT_MODELS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastConnectionState, setLastConnectionState] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastConnectionMessage, setLastConnectionMessage] = useState('');

  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedUrl = await storage.getItem(STORAGE_KEYS.serverUrl);
        const storedModel = await storage.getItem(STORAGE_KEYS.selectedModel);

        const url = sanitizeUrl(storedUrl ?? DEFAULT_SERVER_URL);
        setServerUrl(url);
        if (storedModel) {
          setSelectedModel(storedModel);
        }
      } catch {
        setServerUrl(DEFAULT_SERVER_URL);
      } finally {
        setIsHydrated(true);
      }
    };

    hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    storage.setItem(STORAGE_KEYS.serverUrl, serverUrl).catch(() => undefined);
  }, [serverUrl, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    storage.setItem(STORAGE_KEYS.selectedModel, selectedModel).catch(() => undefined);
  }, [selectedModel, isHydrated]);

  const refreshModels = useCallback(async (url = serverUrl) => {
    const normalizedUrl = sanitizeUrl(url);
    if (!normalizedUrl) {
      setAvailableModels([]);
      return;
    }

    try {
      const response = await fetchJson<{ models?: ModelInfo[] }>(`${normalizedUrl}/api/tags`);
      const models = (response.models ?? []).map((item) => item.name).filter(Boolean);
      if (models.length > 0) {
        setAvailableModels(models);
        setSelectedModel((current) => {
          if (models.includes(current)) {
            return current;
          }
          return models[0];
        });
      } else {
        setAvailableModels([]);
      }
    } catch {
      setAvailableModels([]);
    }
  }, [serverUrl]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    refreshModels(serverUrl).catch((error) => {
      console.warn('Model refresh failed', error);
    });
  }, [isHydrated, refreshModels, serverUrl]);

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading HomeAI…</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: '#4F46E5',
              tabBarInactiveTintColor: '#94A3B8',
              tabBarStyle: { backgroundColor: '#0F172A', borderTopWidth: 0 },
              headerStyle: { backgroundColor: '#0F172A' },
              headerTintColor: '#F8FAFC',
              tabBarIcon: ({ color, size }) => {
                const iconName = route.name === 'Home' ? 'home' : 'settings';
                return <Ionicons name={iconName as any} size={size} color={color} />;
              },
            })}
          >
            <Tab.Screen name="Home" options={{ headerShown: false }}>
              {() => (
                <HomeScreen
                  serverUrl={serverUrl}
                  availableModels={availableModels}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  refreshModels={() => refreshModels(serverUrl)}
                  lastConnectionState={lastConnectionState}
                  lastConnectionMessage={lastConnectionMessage}
                />
              )}
            </Tab.Screen>
            <Tab.Screen name="Settings">
              {() => (
                <SettingsScreen
                  serverUrl={serverUrl}
                  setServerUrl={setServerUrl}
                  selectedModel={selectedModel}
                  availableModels={availableModels}
                  refreshModels={() => refreshModels(serverUrl)}
                  setLastConnectionState={setLastConnectionState}
                  setLastConnectionMessage={setLastConnectionMessage}
                />
              )}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}

type HomeScreenProps = {
  serverUrl: string;
  availableModels: string[];
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  refreshModels: () => Promise<void>;
  lastConnectionState: 'idle' | 'success' | 'error';
  lastConnectionMessage: string;
};

function HomeScreen({
  serverUrl,
  availableModels,
  selectedModel,
  setSelectedModel,
  refreshModels,
  lastConnectionState,
  lastConnectionMessage,
}: HomeScreenProps) {
  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: 'welcome-thread',
      title: 'New chat',
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          text: 'Hi! Ask anything using your local Ollama model.',
        },
      ],
    },
  ]);
  const [activeThreadId, setActiveThreadId] = useState('welcome-thread');
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const scrollRef = React.useRef<any>(null);

  const activeThread = threads.find((thread) => thread.id === activeThreadId) ?? threads[0];
  const messages = activeThread?.messages ?? [];

  const statusColor = useMemo(() => {
    if (lastConnectionState === 'success') {
      return '#16A34A';
    }
    if (lastConnectionState === 'error') {
      return '#DC2626';
    }
    return '#94A3B8';
  }, [lastConnectionState]);

  const createNewThread = useCallback(() => {
    const newThreadId = `thread-${Date.now()}`;
    const newThread: ChatThread = {
      id: newThreadId,
      title: 'New chat',
      messages: [],
    };
    setThreads((current) => [newThread, ...current]);
    setActiveThreadId(newThreadId);
    setDraft('');
  }, []);

  const updateActiveThread = useCallback((updater: (thread: ChatThread) => ChatThread) => {
    setThreads((current) =>
      current.map((thread) => (thread.id === activeThreadId ? updater(thread) : thread)),
    );
  }, [activeThreadId]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    });
  }, []);

  useEffect(() => {
    const subscription = KeyboardEvents.addListener('keyboardDidShow', () => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd?.({ animated: true });
      });
    });

    return () => subscription.remove();
  }, []);

  const copyText = useCallback(async (text: string) => {
    if (!text) {
      return;
    }

    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        }
      } else {
        // not using a clipboard library; Android/iOS fallback: use native share-like prompt through Alert
        const copied = await new Promise<boolean>((resolve) => {
          Alert.alert('Copy text', 'Copy this message to the clipboard?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Copy', onPress: () => resolve(true) },
          ]);
        });

        if (!copied) {
          return;
        }
      }

      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 1200);
      Alert.alert('Copied', 'Message copied to clipboard.');
    } catch (error) {
      console.warn('Clipboard copy failed', error);
      Alert.alert('Copy failed', 'Unable to copy this message.');
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmedMessage = draft.trim();
    if (!trimmedMessage || isSending || !activeThread) {
      return;
    }

    if (!serverUrl) {
      Alert.alert('No AI server configured', 'Please set your Ollama URL in Settings first.');
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: trimmedMessage,
    };

    const assistantMessage: ChatMessage = {
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      text: '',
    };

    const conversationMessages = [...activeThread.messages, userMessage].map((message) => ({
      role: message.role,
      content: message.text,
    }));

    Keyboard.dismiss();
    setDraft('');
    setIsSending(true);
    updateActiveThread((thread) => ({
      ...thread,
      title: thread.messages.length === 0 ? trimmedMessage.slice(0, 22) || 'New chat' : thread.title,
      messages: [...thread.messages, userMessage, assistantMessage],
    }));
    requestAnimationFrame(() => scrollToBottom());

    try {
      const response = await fetchJson<{ message?: { content?: string }; content?: string }>(`${sanitizeUrl(serverUrl)}/api/chat`, {
        method: 'POST',
        body: JSON.stringify({
          model: selectedModel,
          messages: conversationMessages,
          stream: false,
        }),
      });

      const assistantText = response.message?.content ?? response.content ?? 'No response received.';
      updateActiveThread((thread) => ({
        ...thread,
        messages: thread.messages.map((message) =>
          message.id === assistantMessage.id ? { ...message, text: assistantText } : message,
        ),
      }));
      requestAnimationFrame(() => scrollToBottom());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      updateActiveThread((thread) => ({
        ...thread,
        messages: thread.messages.map((item) =>
          item.id === assistantMessage.id ? { ...item, text: `Error: ${message}` } : item,
        ),
      }));
      requestAnimationFrame(() => scrollToBottom());
      Alert.alert('Chat failed', message);
    } finally {
      setIsSending(false);
    }
  }, [activeThread, draft, isSending, selectedModel, serverUrl, scrollToBottom, updateActiveThread]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable onPress={() => setSidebarOpen((value) => !value)} style={styles.iconButton}>
            <Ionicons name={sidebarOpen ? 'close' : 'menu'} size={18} color="#FFF" />
          </Pressable>
          <View style={styles.headerMeta}>
            <Text style={styles.heading}>Home</Text>
            <Text style={styles.serverText}>{serverUrl}</Text>
          </View>
        </View>
        <View style={styles.topBarActions}>
          <Pressable onPress={createNewThread} style={styles.secondaryActionButton}>
            <Text style={styles.secondaryActionText}>New chat</Text>
          </Pressable>
          <Pressable onPress={() => refreshModels()} style={styles.refreshButton}>
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.connectionRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={styles.connectionLabel}>
          {lastConnectionMessage || 'No connection test yet'}
        </Text>
      </View>

      <View style={styles.modelSection}>
        <View style={styles.modelHeaderRow}>
          <Text style={styles.label}>Available AI</Text>
          <Pressable style={styles.dropdown} onPress={() => setShowModelPicker(true)}>
            <Text style={styles.dropdownText}>{selectedModel || 'Select model'}</Text>
            <Ionicons name="chevron-down" size={16} color="#FFF" />
          </Pressable>
        </View>
      </View>

      <View pointerEvents={sidebarOpen ? 'auto' : 'none'} style={styles.drawerOverlay}>
        <Pressable
          style={[styles.drawerScrim, { opacity: sidebarOpen ? 1 : 0 }]}
          onPress={() => setSidebarOpen(false)}
        />
        <View style={[styles.drawerPanel, { transform: [{ translateX: sidebarOpen ? 0 : -320 }] }]}>
          <Text style={styles.drawerTitle}>Chat history</Text>
          <View style={styles.historyList}>
            {threads.map((thread) => (
              <Pressable
                key={thread.id}
                onPress={() => {
                  setActiveThreadId(thread.id);
                  setSidebarOpen(false);
                }}
                style={[styles.historyItem, activeThreadId === thread.id && styles.historyItemActive]}
              >
                <Text style={[styles.historyItemText, activeThreadId === thread.id && styles.historyItemTextActive]}>
                  {thread.title || 'New chat'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.chatContainer}>
        <KeyboardAwareScrollView
          ref={scrollRef}
          style={styles.chatScreen}
          contentContainerStyle={styles.chatScrollContent}
          keyboardShouldPersistTaps="handled"
          bottomOffset={12}
          extraKeyboardSpace={0}
          mode="layout"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          <View style={styles.chatList}>
            {messages.length === 0 ? (
              <Text style={styles.emptyChatText}>Start a new conversation</Text>
            ) : (
              messages.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.messageBubble,
                    item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Pressable onLongPress={() => copyText(item.text)} style={styles.messagePressable}>
                    <Text style={[styles.messageText, item.role === 'user' && styles.userMessageText]}>{item.text || '…'}</Text>
                    {copiedText === item.text && (
                      <Text style={styles.copiedHint}>Copied</Text>
                    )}
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </KeyboardAwareScrollView>

        <KeyboardStickyView style={styles.inputComposer} offset={{ closed: 0, opened: 40 }}>
          <View style={styles.inputRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Message the AI..."
              multiline
              style={styles.input}
            />
            <Pressable
              onPress={sendMessage}
              disabled={isSending || !draft.trim()}
              style={[styles.sendButton, (isSending || !draft.trim()) && styles.sendButtonDisabled]}
            >
              <Text style={styles.sendButtonText}>{isSending ? '...' : 'Send'}</Text>
            </Pressable>
          </View>
        </KeyboardStickyView>
      </View>

      <Modal visible={showModelPicker} transparent animationType="fade" onRequestClose={() => setShowModelPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowModelPicker(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Choose model</Text>
            {availableModels.length === 0 ? (
              <Text style={styles.emptyText}>No models available</Text>
            ) : (
              availableModels.map((model) => (
                <Pressable
                  key={model}
                  onPress={() => {
                    setSelectedModel(model);
                    setShowModelPicker(false);
                  }}
                  style={[styles.modelOption, model === selectedModel && styles.modelOptionSelected]}
                >
                  <Text style={[styles.modelOptionText, model === selectedModel && styles.modelOptionTextSelected]}>{model}</Text>
                </Pressable>
              ))
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

type SettingsScreenProps = {
  serverUrl: string;
  setServerUrl: React.Dispatch<React.SetStateAction<string>>;
  selectedModel: string;
  availableModels: string[];
  refreshModels: () => Promise<void>;
  setLastConnectionState: React.Dispatch<React.SetStateAction<'idle' | 'success' | 'error'>>;
  setLastConnectionMessage: React.Dispatch<React.SetStateAction<string>>;
};

function SettingsScreen({
  serverUrl,
  setServerUrl,
  selectedModel,
  availableModels,
  refreshModels,
  setLastConnectionState,
  setLastConnectionMessage,
}: SettingsScreenProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [draftUrl, setDraftUrl] = useState(serverUrl);

  useEffect(() => {
    setDraftUrl(serverUrl);
  }, [serverUrl]);

  const handleSave = useCallback(() => {
    const normalized = sanitizeUrl(draftUrl);
    if (!normalized) {
      Alert.alert('No server URL', 'Please enter your Ollama server URL first.');
      return;
    }

    setServerUrl(normalized);
    refreshModels().catch(() => undefined);
    Alert.alert('Server updated', `Using: ${normalized}`);
  }, [draftUrl, refreshModels, setServerUrl]);

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    const target = sanitizeUrl(draftUrl);

    if (!target) {
      setLastConnectionState('error');
      setLastConnectionMessage('No server URL configured.');
      Alert.alert('No server URL', 'Please enter your Ollama server URL first.');
      setIsTesting(false);
      return;
    }

    try {
      const result = await fetchJson<{ models?: ModelInfo[] }>(`${target}/api/tags`);
      const models = result.models ?? [];
      const summary = models.length > 0 ? `${models.length} model(s) found` : 'Connection OK';
      setLastConnectionState('success');
      setLastConnectionMessage(`Connected to ${target} • ${summary}`);
      Alert.alert('Connection successful', `Server responded at ${target}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLastConnectionState('error');
      setLastConnectionMessage(`Connection failed: ${message}`);
      Alert.alert('Connection failed', message);
    } finally {
      setIsTesting(false);
    }
  }, [draftUrl, setLastConnectionMessage, setLastConnectionState]);

  return (
    <SafeAreaView style={styles.safeAreaContent}>
      <KeyboardAwareScrollView
        bottomOffset={20}
        contentContainerStyle={styles.settingsScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.settingsCard}>
          <Text style={styles.heading}>Settings</Text>
          <Text style={styles.label}>Ollama server URL</Text>
          <TextInput
            value={draftUrl}
            onChangeText={setDraftUrl}
            placeholder="http://192.168.1.10:11434"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <View style={styles.buttonRow}>
            <Pressable style={[styles.primaryButton, styles.fullWidth]} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, styles.fullWidth, isTesting && styles.buttonDisabled]}
              onPress={handleTestConnection}
              disabled={isTesting}
            >
              <Text style={styles.secondaryButtonText}>{isTesting ? 'Testing...' : 'Test connection'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.label}>Current model</Text>
          <Text style={styles.valueText}>{selectedModel}</Text>
          <Text style={styles.label}>Available models</Text>
          {availableModels.length > 0 ? (
            <View style={styles.modelList}>
              {availableModels.map((model) => (
                <Text key={model} style={styles.modelListItem}>{model}</Text>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No models found yet.</Text>
          )}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  settingsScrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#0F172A',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  headerMeta: {
    flexShrink: 1,
  },
  heading: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  serverText: {
    color: '#CBD5E1',
    fontSize: 10,
    marginTop: 2,
    maxWidth: 160,
  },
  refreshButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  refreshText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  secondaryActionText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#E2E8F0',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  connectionLabel: {
    color: '#1E293B',
    fontSize: 12,
    flexShrink: 1,
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
  },
  drawerScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  drawerPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 260,
    backgroundColor: '#FFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    paddingTop: 72,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  drawerTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  historySection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  historyItemActive: {
    backgroundColor: '#4F46E5',
  },
  historyItemText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
  },
  historyItemTextActive: {
    color: '#FFF',
  },
  modelSection: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  modelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 0,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 140,
    maxWidth: '68%',
  },
  dropdownText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
    flexShrink: 1,
  },
  modelPickerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modelChip: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modelChipActive: {
    backgroundColor: '#4F46E5',
  },
  modelChipText: {
    color: '#1E293B',
    fontWeight: '600',
  },
  modelChipTextActive: {
    color: '#FFF',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatScreen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatScrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
    paddingTop: 12,
  },
  chatList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 10,
  },
  emptyChatText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 6,
  },
  messagePressable: {
    flexDirection: 'column',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4F46E5',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0',
  },
  messageText: {
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFF',
  },
  copiedHint: {
    color: '#E2E8F0',
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
  },
  inputComposer: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    fontSize: 14,
    color: '#0F172A',
  },
  sendButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 78,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modelOption: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  modelOptionSelected: {
    backgroundColor: '#4F46E5',
  },
  modelOptionText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  modelOptionTextSelected: {
    color: '#FFF',
  },
  settingsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  valueText: {
    color: '#0F172A',
    fontSize: 16,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  fullWidth: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modelList: {
    gap: 8,
  },
  modelListItem: {
    color: '#1E293B',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  emptyText: {
    color: '#64748B',
  },
});
