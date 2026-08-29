import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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

const DEFAULT_SERVER_URL = 'http://localhost:11434';
const DEFAULT_MODELS = ['llama3.2', 'llama3.1', 'mistral'];

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
    return DEFAULT_SERVER_URL;
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
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0]);
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
      } catch (error) {
        console.warn('Failed to read saved settings', error);
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

    storage.setItem(STORAGE_KEYS.serverUrl, serverUrl).catch((error) => {
      console.warn('Failed to save server url', error);
    });
  }, [serverUrl, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    storage.setItem(STORAGE_KEYS.selectedModel, selectedModel).catch((error) => {
      console.warn('Failed to save selected model', error);
    });
  }, [selectedModel, isHydrated]);

  const refreshModels = useCallback(async (url = serverUrl) => {
    try {
      const response = await fetchJson<{ models?: ModelInfo[] }>(`${sanitizeUrl(url)}/api/tags`);
      const models = (response.models ?? []).map((item) => item.name).filter(Boolean);
      if (models.length > 0) {
        setAvailableModels(models);
        setSelectedModel((current) => {
          if (models.includes(current)) {
            return current;
          }
          return models[0];
        });
      }
    } catch (error) {
      console.warn('Failed to load models', error);
      setAvailableModels(DEFAULT_MODELS);
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
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Home"
          screenOptions={{
            tabBarActiveTintColor: '#4F46E5',
            tabBarStyle: { backgroundColor: '#0F172A', borderTopWidth: 0 },
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#F8FAFC',
          }}
        >
          <Tab.Screen name="Home">
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! Ask anything using your local Ollama model.',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const statusColor = useMemo(() => {
    if (lastConnectionState === 'success') {
      return '#16A34A';
    }
    if (lastConnectionState === 'error') {
      return '#DC2626';
    }
    return '#94A3B8';
  }, [lastConnectionState]);

  const sendMessage = useCallback(async () => {
    const trimmedMessage = draft.trim();
    if (!trimmedMessage || isSending) {
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

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setDraft('');
    setIsSending(true);

    try {
      const response = await fetchJson<{ message?: { content?: string }; content?: string }>(`${sanitizeUrl(serverUrl)}/api/chat`, {
        method: 'POST',
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: trimmedMessage }],
          stream: false,
        }),
      });

      const assistantText = response.message?.content ?? response.content ?? 'No response received.';
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id ? { ...message, text: assistantText } : message,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessage.id ? { ...item, text: `Error: ${message}` } : item,
        ),
      );
      Alert.alert('Chat failed', message);
    } finally {
      setIsSending(false);
    }
  }, [draft, isSending, selectedModel, serverUrl]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.heading}>Home</Text>
          <Text style={styles.serverText}>{serverUrl}</Text>
        </View>
        <Pressable onPress={() => refreshModels()} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={styles.connectionRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={styles.connectionLabel}>
          {lastConnectionMessage || 'No connection test yet'}
        </Text>
      </View>

      <View style={styles.modelSection}>
        <Text style={styles.label}>Available AI</Text>
        <View style={styles.modelPickerWrap}>
          {availableModels.map((model) => {
            const active = model === selectedModel;
            return (
              <Pressable
                key={model}
                onPress={() => setSelectedModel(model)}
                style={[styles.modelChip, active && styles.modelChipActive]}
              >
                <Text style={[styles.modelChipText, active && styles.modelChipTextActive]}>{model}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={styles.messageText}>{item.text || '…'}</Text>
          </View>
        )}
        contentContainerStyle={styles.chatList}
        keyboardShouldPersistTaps="handled"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
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
      </KeyboardAvoidingView>
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
    setServerUrl(normalized);
    refreshModels().catch(() => undefined);
    Alert.alert('Server updated', `Using: ${normalized}`);
  }, [draftUrl, refreshModels, setServerUrl]);

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    const target = sanitizeUrl(draftUrl);

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
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: '#0F172A',
  },
  heading: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
  },
  serverText: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  refreshText: {
    color: '#FFF',
    fontWeight: '600',
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
  modelSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  label: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
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
  chatList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 4,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
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
