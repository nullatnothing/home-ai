import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  threadHistory: 'homeai.threadHistory',
  activeThreadId: 'homeai.activeThreadId',
  language: 'homeai.language',
};

type Language = 'en' | 'de' | 'es' | 'it' | 'fr';

type TranslationStrings = {
  loading: string;
  home: string;
  settings: string;
  newChat: string;
  messagePlaceholder: string;
  send: string;
  sendLoading: string;
  startConversation: string;
  chatHistory: string;
  availableAi: string;
  availableModels: string;
  currentModel: string;
  chooseModel: string;
  noModelsAvailable: string;
  noModelsFoundYet: string;
  renameChat: string;
  enterChatTitle: string;
  cancel: string;
  save: string;
  saveServerUrl: string;
  testing: string;
  testConnection: string;
  ollamaServerUrl: string;
  language: string;
  settingsTitle: string;
  modelsTitle: string;
  serverUpdatedTitle: string;
  noServerUrlTitle: string;
  noServerUrlMessage: string;
  noAiServerConfigured: string;
  noAiServerConfiguredMessage: string;
  noConnectionTestYet: string;
  copyTextTitle: string;
  copyTextMessage: string;
  copyAction: string;
  copyFailedTitle: string;
  copyFailedMessage: string;
  copied: string;
  ok: string;
  info: string;
  chatFailed: string;
  connectionSuccessful: string;
  connectionFailed: string;
  serverUpdatedMessage: string;
  usingLabel: string;
  connectedTo: string;
  modelsFound: string;
  noModelsReturned: string;
  connectionOk: string;
  selectModel: string;
  modelsRefreshed: string;
  refreshComplete: string;
  noResponseReceived: string;
  serverRespondedAt: string;
  noServerUrlConfigured: string;
  unknownError: string;
  justNow: string;
};

const translations: Record<Language, TranslationStrings> = {
  en: {
    loading: 'Loading HomeAI…',
    home: 'Home',
    settings: 'Settings',
    newChat: 'New chat',
    messagePlaceholder: 'Message the AI...',
    send: 'Send',
    sendLoading: '...',
    startConversation: 'Start a new conversation',
    chatHistory: 'Chat history',
    availableAi: 'Available AI',
    availableModels: 'Available models',
    currentModel: 'Current model',
    chooseModel: 'Choose model',
    noModelsAvailable: 'No models available',
    noModelsFoundYet: 'No models found yet.',
    renameChat: 'Rename chat',
    enterChatTitle: 'Enter a chat title',
    cancel: 'Cancel',
    save: 'Save',
    saveServerUrl: 'Save',
    testing: 'Testing...',
    testConnection: 'Test connection',
    ollamaServerUrl: 'Ollama server URL',
    language: 'Language',
    settingsTitle: 'Settings',
    modelsTitle: 'Models',
    serverUpdatedTitle: 'Server updated',
    noServerUrlTitle: 'No server URL',
    noServerUrlMessage: 'Please enter your Ollama server URL first.',
    noAiServerConfigured: 'No AI server configured',
    noAiServerConfiguredMessage: 'Please set your Ollama URL in Settings first.',
    noConnectionTestYet: 'No connection test yet',
    copyTextTitle: 'Copy text',
    copyTextMessage: 'Copy this message to the clipboard?',
    copyAction: 'Copy',
    copyFailedTitle: 'Copy failed',
    copyFailedMessage: 'Unable to copy this message.',
    copied: 'Copied',
    ok: 'OK',
    info: 'Info',
    chatFailed: 'Chat failed',
    connectionSuccessful: 'Connection successful',
    connectionFailed: 'Connection failed',
    serverUpdatedMessage: 'Using:',
    usingLabel: 'Using',
    connectedTo: 'Connected to',
    modelsFound: 'model(s) found',
    noModelsReturned: 'No models were returned from the server yet.',
    connectionOk: 'Connection OK',
    selectModel: 'Select model',
    modelsRefreshed: 'Models refreshed',
    refreshComplete: 'Refresh complete',
    noResponseReceived: 'No response received.',
    serverRespondedAt: 'Server responded at',
    noServerUrlConfigured: 'No server URL configured.',
    unknownError: 'Unknown error',
    justNow: 'Just now',
  },
  de: {
    loading: 'HomeAI wird geladen…',
    home: 'Startseite',
    settings: 'Einstellungen',
    newChat: 'Neues Gespräch',
    messagePlaceholder: 'AI nach etwas fragen...',
    send: 'Senden',
    sendLoading: '...',
    startConversation: 'Starte eine neue Unterhaltung',
    chatHistory: 'Chatverlauf',
    availableAi: 'Verfügbare KI',
    availableModels: 'Verfügbare Modelle',
    currentModel: 'Aktuelles Modell',
    chooseModel: 'Modell wählen',
    noModelsAvailable: 'Keine Modelle verfügbar',
    noModelsFoundYet: 'Noch keine Modelle gefunden.',
    renameChat: 'Gespräch umbenennen',
    enterChatTitle: 'Gesprächstitel eingeben',
    cancel: 'Abbrechen',
    save: 'Speichern',
    saveServerUrl: 'Speichern',
    testing: 'Testen...',
    testConnection: 'Verbindung testen',
    ollamaServerUrl: 'Ollama-Server-URL',
    language: 'Sprache',
    settingsTitle: 'Einstellungen',
    modelsTitle: 'Modelle',
    serverUpdatedTitle: 'Server aktualisiert',
    noServerUrlTitle: 'Keine Server-URL',
    noServerUrlMessage: 'Bitte gib zuerst deine Ollama-Server-URL ein.',
    noAiServerConfigured: 'Keine KI-Server konfiguriert',
    noAiServerConfiguredMessage: 'Bitte richte deine Ollama-URL in den Einstellungen ein.',
    noConnectionTestYet: 'Noch kein Verbindungsstatus',
    copyTextTitle: 'Text kopieren',
    copyTextMessage: 'Diesen Text in die Zwischenablage kopieren?',
    copyAction: 'Kopieren',
    copyFailedTitle: 'Kopieren fehlgeschlagen',
    copyFailedMessage: 'Dieser Text konnte nicht kopiert werden.',
    copied: 'Kopiert',
    ok: 'OK',
    info: 'Info',
    chatFailed: 'Chat fehlgeschlagen',
    connectionSuccessful: 'Verbindung erfolgreich',
    connectionFailed: 'Verbindung fehlgeschlagen',
    serverUpdatedMessage: 'Verwendet:',
    usingLabel: 'Verwendet',
    connectedTo: 'Verbunden mit',
    modelsFound: 'Modell(e) gefunden',
    noModelsReturned: 'Noch keine Modelle vom Server zurückgegeben.',
    connectionOk: 'Verbindung OK',
    selectModel: 'Modell auswählen',
    modelsRefreshed: 'Modelle aktualisiert',
    refreshComplete: 'Aktualisierung abgeschlossen',
    noResponseReceived: 'Keine Antwort erhalten.',
    serverRespondedAt: 'Server antwortete unter',
    noServerUrlConfigured: 'Keine Server-URL konfiguriert.',
    unknownError: 'Unbekannter Fehler',
    justNow: 'Gerade eben',
  },
  es: {
    loading: 'Cargando HomeAI…',
    home: 'Inicio',
    settings: 'Configuración',
    newChat: 'Nuevo chat',
    messagePlaceholder: 'Escribe al AI...',
    send: 'Enviar',
    sendLoading: '...',
    startConversation: 'Inicia una nueva conversación',
    chatHistory: 'Historial de chat',
    availableAi: 'IA disponible',
    availableModels: 'Modelos disponibles',
    currentModel: 'Modelo actual',
    chooseModel: 'Elegir modelo',
    noModelsAvailable: 'No hay modelos disponibles',
    noModelsFoundYet: 'Todavía no se encontraron modelos.',
    renameChat: 'Renombrar chat',
    enterChatTitle: 'Introduce un título',
    cancel: 'Cancelar',
    save: 'Guardar',
    saveServerUrl: 'Guardar',
    testing: 'Probando...',
    testConnection: 'Probar conexión',
    ollamaServerUrl: 'URL del servidor Ollama',
    language: 'Idioma',
    settingsTitle: 'Configuración',
    modelsTitle: 'Modelos',
    serverUpdatedTitle: 'Servidor actualizado',
    noServerUrlTitle: 'Sin URL del servidor',
    noServerUrlMessage: 'Primero introduce la URL del servidor Ollama.',
    noAiServerConfigured: 'No hay servidor de IA configurado',
    noAiServerConfiguredMessage: 'Configura la URL de Ollama en Configuración primero.',
    noConnectionTestYet: 'Todavía no se ha probado la conexión',
    copyTextTitle: 'Copiar texto',
    copyTextMessage: '¿Copiar este mensaje al portapapeles?',
    copyAction: 'Copiar',
    copyFailedTitle: 'Error al copiar',
    copyFailedMessage: 'No se pudo copiar este mensaje.',
    copied: 'Copiado',
    ok: 'Aceptar',
    info: 'Información',
    chatFailed: 'Error del chat',
    connectionSuccessful: 'Conexión correcta',
    connectionFailed: 'Conexión fallida',
    serverUpdatedMessage: 'Usando:',
    usingLabel: 'Usando',
    connectedTo: 'Conectado a',
    modelsFound: 'modelo(s) encontrados',
    noModelsReturned: 'Todavía no hubo modelos del servidor.',
    connectionOk: 'Conexión OK',
    selectModel: 'Seleccionar modelo',
    modelsRefreshed: 'Modelos actualizados',
    refreshComplete: 'Actualización completada',
    noResponseReceived: 'No se recibió respuesta.',
    serverRespondedAt: 'El servidor respondió en',
    noServerUrlConfigured: 'No hay URL del servidor configurada.',
    unknownError: 'Error desconocido',
    justNow: 'Ahora mismo',
  },
  it: {
    loading: 'Caricamento HomeAI…',
    home: 'Home',
    settings: 'Impostazioni',
    newChat: 'Nuova chat',
    messagePlaceholder: 'Scrivi all’AI...',
    send: 'Invia',
    sendLoading: '...',
    startConversation: 'Avvia una nuova conversazione',
    chatHistory: 'Cronologia chat',
    availableAi: 'AI disponibile',
    availableModels: 'Modelli disponibili',
    currentModel: 'Modello attuale',
    chooseModel: 'Scegli modello',
    noModelsAvailable: 'Nessun modello disponibile',
    noModelsFoundYet: 'Nessun modello trovato ancora.',
    renameChat: 'Rinomina chat',
    enterChatTitle: 'Inserisci un titolo',
    cancel: 'Annulla',
    save: 'Salva',
    saveServerUrl: 'Salva',
    testing: 'Verifica...',
    testConnection: 'Verifica connessione',
    ollamaServerUrl: 'URL server Ollama',
    language: 'Lingua',
    settingsTitle: 'Impostazioni',
    modelsTitle: 'Modelli',
    serverUpdatedTitle: 'Server aggiornato',
    noServerUrlTitle: 'Nessun URL del server',
    noServerUrlMessage: 'Inserisci prima l’URL del server Ollama.',
    noAiServerConfigured: 'Nessun server AI configurato',
    noAiServerConfiguredMessage: 'Imposta l’URL Ollama nelle Impostazioni prima.',
    noConnectionTestYet: 'Nessun test di connessione ancora',
    copyTextTitle: 'Copia testo',
    copyTextMessage: 'Copiare questo messaggio negli appunti?',
    copyAction: 'Copia',
    copyFailedTitle: 'Copia fallita',
    copyFailedMessage: 'Impossibile copiare questo messaggio.',
    copied: 'Copiato',
    ok: 'OK',
    info: 'Info',
    chatFailed: 'Chat fallita',
    connectionSuccessful: 'Connessione riuscita',
    connectionFailed: 'Connessione fallita',
    serverUpdatedMessage: 'In uso:',
    usingLabel: 'In uso',
    connectedTo: 'Connesso a',
    modelsFound: 'modello/i trovati',
    noModelsReturned: 'Nessun modello restituito dal server ancora.',
    connectionOk: 'Connessione OK',
    selectModel: 'Seleziona modello',
    modelsRefreshed: 'Modelli aggiornati',
    refreshComplete: 'Aggiornamento completato',
    noResponseReceived: 'Nessuna risposta ricevuta.',
    serverRespondedAt: 'Il server ha risposto su',
    noServerUrlConfigured: 'Nessun URL del server configurato.',
    unknownError: 'Errore sconosciuto',
    justNow: 'Proprio ora',
  },
  fr: {
    loading: 'Chargement de HomeAI…',
    home: 'Accueil',
    settings: 'Réglages',
    newChat: 'Nouveau chat',
    messagePlaceholder: 'Écrire à l’IA...',
    send: 'Envoyer',
    sendLoading: '...',
    startConversation: 'Démarrer une nouvelle conversation',
    chatHistory: 'Historique du chat',
    availableAi: 'IA disponible',
    availableModels: 'Modèles disponibles',
    currentModel: 'Modèle actuel',
    chooseModel: 'Choisir un modèle',
    noModelsAvailable: 'Aucun modèle disponible',
    noModelsFoundYet: 'Aucun modèle trouvé pour le moment.',
    renameChat: 'Renommer le chat',
    enterChatTitle: 'Saisir un titre',
    cancel: 'Annuler',
    save: 'Enregistrer',
    saveServerUrl: 'Enregistrer',
    testing: 'Test en cours...',
    testConnection: 'Tester la connexion',
    ollamaServerUrl: 'URL du serveur Ollama',
    language: 'Langue',
    settingsTitle: 'Réglages',
    modelsTitle: 'Modèles',
    serverUpdatedTitle: 'Serveur mis à jour',
    noServerUrlTitle: 'Aucune URL de serveur',
    noServerUrlMessage: 'Veuillez d’abord saisir l’URL du serveur Ollama.',
    noAiServerConfigured: 'Aucun serveur IA configuré',
    noAiServerConfiguredMessage: 'Veuillez définir l’URL Ollama dans les réglages.',
    noConnectionTestYet: 'Aucun test de connexion pour le moment',
    copyTextTitle: 'Copier le texte',
    copyTextMessage: 'Copier ce message dans le presse-papiers ?',
    copyAction: 'Copier',
    copyFailedTitle: 'Échec de la copie',
    copyFailedMessage: 'Impossible de copier ce message.',
    copied: 'Copié',
    ok: 'OK',
    info: 'Info',
    chatFailed: 'Échec du chat',
    connectionSuccessful: 'Connexion réussie',
    connectionFailed: 'Connexion échouée',
    serverUpdatedMessage: 'Utilisation :',
    usingLabel: 'Utilisation',
    connectedTo: 'Connecté à',
    modelsFound: 'modèle(s) trouvé(s)',
    noModelsReturned: 'Aucun modèle n’a encore été retourné par le serveur.',
    connectionOk: 'Connexion OK',
    selectModel: 'Sélectionner le modèle',
    modelsRefreshed: 'Modèles actualisés',
    refreshComplete: 'Actualisation terminée',
    noResponseReceived: 'Aucune réponse reçue.',
    serverRespondedAt: 'Le serveur a répondu sur',
    noServerUrlConfigured: 'Aucune URL de serveur configurée.',
    unknownError: 'Erreur inconnue',
    justNow: 'À l’instant',
  },
};

const languageOptions: Language[] = ['en', 'de', 'es', 'it', 'fr'];

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
  createdAt: number;
  updatedAt: number;
};

type AppDialogConfig = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
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
  const [language, setLanguage] = useState<Language>('en');
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastConnectionState, setLastConnectionState] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastConnectionMessage, setLastConnectionMessage] = useState('');
  const [dialog, setDialog] = useState<AppDialogConfig | null>(null);

  const strings = translations[language];

  const showDialog = useCallback((config: AppDialogConfig) => {
    setDialog(config);
  }, []);

  const dismissDialog = useCallback(() => {
    setDialog(null);
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedUrl = await storage.getItem(STORAGE_KEYS.serverUrl);
        const storedModel = await storage.getItem(STORAGE_KEYS.selectedModel);
        const storedLanguage = await storage.getItem(STORAGE_KEYS.language) as Language | null;

        const url = sanitizeUrl(storedUrl ?? DEFAULT_SERVER_URL);
        setServerUrl(url);
        if (storedModel) {
          setSelectedModel(storedModel);
        }
        if (storedLanguage && storedLanguage in translations) {
          setLanguage(storedLanguage);
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

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    storage.setItem(STORAGE_KEYS.language, language).catch(() => undefined);
  }, [language, isHydrated]);

  const refreshModels = useCallback(async (url = serverUrl) => {
    const normalizedUrl = sanitizeUrl(url);
    if (!normalizedUrl) {
      setAvailableModels([]);
      setLastConnectionState('error');
    setLastConnectionMessage(strings.noServerUrlConfigured);
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
        setLastConnectionState('success');
      setLastConnectionMessage(`${strings.connectedTo} ${normalizedUrl} • ${models.length} ${strings.modelsFound}`);
      } else {
        setAvailableModels([]);
        setLastConnectionState('success');
      setLastConnectionMessage(`${strings.connectedTo} ${normalizedUrl} • ${strings.noModelsFoundYet}`);
      }
    } catch (error) {
    const message = error instanceof Error ? error.message : strings.unknownError;
      setAvailableModels([]);
      setLastConnectionState('error');
    setLastConnectionMessage(`${strings.connectionFailed}: ${message}`);
    }
  }, [serverUrl, strings.connectedTo, strings.connectionFailed, strings.modelsFound, strings.noModelsFoundYet, strings.noServerUrlConfigured, strings.unknownError]);

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
        <Text style={styles.loadingText}>{strings.loading}</Text>
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
                  showDialog={showDialog}
                  strings={strings}
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
                  showDialog={showDialog}
                  language={language}
                  setLanguage={setLanguage}
                  strings={strings}
                />
              )}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>

        <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={dismissDialog}>
          <Pressable style={styles.modalOverlay} onPress={dismissDialog}>
            <Pressable style={styles.dialogCard} onPress={() => undefined}>
              <Text style={styles.modalTitle}>{dialog?.title ?? strings.info}</Text>
              <Text style={styles.dialogMessage}>{dialog?.message ?? ''}</Text>
              <View style={styles.dialogActions}>
                {dialog?.cancelText && (
                  <Pressable
                    onPress={() => {
                      dialog?.onCancel?.();
                      dismissDialog();
                    }}
                    style={[styles.secondaryButton, styles.dialogButton]}
                  >
                    <Text style={styles.secondaryButtonText}>{dialog.cancelText}</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    dialog?.onConfirm?.();
                    dismissDialog();
                  }}
                  style={[styles.primaryButton, styles.dialogButton, !dialog && styles.primaryButtonDisabled]}
                >
                  <Text style={styles.primaryButtonText}>{dialog?.confirmText ?? strings.ok}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
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
  showDialog: (config: AppDialogConfig) => void;
  strings: TranslationStrings;
};

function HomeScreen({
  serverUrl,
  availableModels,
  selectedModel,
  setSelectedModel,
  refreshModels,
  lastConnectionState,
  lastConnectionMessage,
  showDialog,
  strings,
}: HomeScreenProps) {
  const createWelcomeThread = useCallback((): ChatThread => ({
    id: 'welcome-thread',
    title: strings.newChat,
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        text: 'Hi! Ask anything using your local Ollama model.',
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }), [strings.newChat]);

  const [threads, setThreads] = useState<ChatThread[]>([createWelcomeThread()]);
  const [activeThreadId, setActiveThreadId] = useState('welcome-thread');
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const scrollRef = React.useRef<any>(null);

  useEffect(() => {
    const hydrateHistory = async () => {
      try {
        const storedThreads = await storage.getItem(STORAGE_KEYS.threadHistory);
        const storedActiveId = await storage.getItem(STORAGE_KEYS.activeThreadId);

        if (storedThreads) {
          const parsed = JSON.parse(storedThreads) as Partial<ChatThread>[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalized = parsed.map((thread) => ({
              id: thread.id ?? `thread-${Date.now()}-${Math.random()}`,
              title: thread.title || strings.newChat,
              messages: Array.isArray(thread.messages) ? thread.messages : [],
              createdAt: thread.createdAt ?? Date.now(),
              updatedAt: thread.updatedAt ?? thread.createdAt ?? Date.now(),
            }));
            setThreads(normalized);
            if (storedActiveId && normalized.some((thread) => thread.id === storedActiveId)) {
              setActiveThreadId(storedActiveId);
            } else {
              setActiveThreadId(normalized[0].id);
            }
            return;
          }
        }

        if (storedActiveId) {
          setActiveThreadId(storedActiveId);
        }
      } catch {
        // Ignore invalid persisted history and keep defaults.
      }
    };

    hydrateHistory();
  }, []);

  useEffect(() => {
    storage.setItem(STORAGE_KEYS.threadHistory, JSON.stringify(threads)).catch(() => undefined);
  }, [threads]);

  useEffect(() => {
    storage.setItem(STORAGE_KEYS.activeThreadId, activeThreadId).catch(() => undefined);
  }, [activeThreadId]);

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
      title: strings.newChat,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setThreads((current) => [newThread, ...current]);
    setActiveThreadId(newThreadId);
    setDraft('');
  }, [strings.newChat]);

  const handleRefreshModels = useCallback(() => {
    void refreshModels().then(() => {
      const count = availableModels.length;
      if (count > 0) {
        showDialog({ title: strings.modelsRefreshed, message: `${count} ${strings.modelsFound}.`, confirmText: strings.ok });
      } else {
        showDialog({ title: strings.refreshComplete, message: strings.noModelsReturned, confirmText: strings.ok });
      }
    });
  }, [availableModels.length, refreshModels, showDialog, strings.modelsFound, strings.modelsRefreshed, strings.noModelsReturned, strings.ok, strings.refreshComplete]);

  const deleteThread = useCallback((threadId: string) => {
    setThreads((current) => {
      const remaining = current.filter((thread) => thread.id !== threadId);
      if (remaining.length === 0) {
        const fallback = createWelcomeThread();
        setActiveThreadId(fallback.id);
        return [fallback];
      }

      if (threadId === activeThreadId) {
        setActiveThreadId(remaining[0].id);
      }

      return remaining;
    });
  }, [activeThreadId, createWelcomeThread]);

  const [renameThreadId, setRenameThreadId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const renameThread = useCallback((threadId: string) => {
    const thread = threads.find((item) => item.id === threadId);
    if (!thread) {
      return;
    }

    setRenameThreadId(threadId);
    setRenameDraft(thread.title);
  }, [threads]);

  const finalizeRenameThread = useCallback(() => {
    if (!renameThreadId) {
      return;
    }

    const trimmed = renameDraft.trim();
    if (!trimmed) {
      return;
    }

    setThreads((current) =>
      current.map((item) =>
        item.id === renameThreadId ? { ...item, title: trimmed, updatedAt: Date.now() } : item,
      ),
    );
    setRenameThreadId(null);
    setRenameDraft('');
  }, [renameDraft, renameThreadId]);

  const updateActiveThread = useCallback((updater: (thread: ChatThread) => ChatThread) => {
    setThreads((current) =>
      current.map((thread) =>
        thread.id === activeThreadId ? { ...updater(thread), updatedAt: Date.now() } : thread,
      ),
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
      let shouldCopy = true;

      if (Platform.OS !== 'web') {
        shouldCopy = await new Promise<boolean>((resolve) => {
          showDialog({
            title: strings.copyTextTitle,
            message: strings.copyTextMessage,
            confirmText: strings.copyAction,
            cancelText: strings.cancel,
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
      }

      if (!shouldCopy) {
        return;
      }

      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        }
      } else {
        await Clipboard.setStringAsync(text);
      }

      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 1200);
    } catch (error) {
      console.warn('Clipboard copy failed', error);
      showDialog({ title: strings.copyFailedTitle, message: strings.copyFailedMessage, confirmText: strings.ok });
    }
  }, [showDialog, strings.copyFailedMessage, strings.copyFailedTitle, strings.ok]);

  const formatThreadTimestamp = useCallback((value: number) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return strings.justNow;
    }

    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [strings.justNow]);

  const sendMessage = useCallback(async () => {
    const trimmedMessage = draft.trim();
    if (!trimmedMessage || isSending || !activeThread) {
      return;
    }

    if (!serverUrl) {
      showDialog({ title: strings.noAiServerConfigured, message: strings.noAiServerConfiguredMessage, confirmText: strings.ok });
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
      title: thread.messages.length === 0 ? trimmedMessage.slice(0, 22) || strings.newChat : thread.title,
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

      const assistantText = response.message?.content ?? response.content ?? strings.noResponseReceived;
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
      showDialog({ title: strings.chatFailed, message, confirmText: strings.ok });
    } finally {
      setIsSending(false);
    }
  }, [activeThread, draft, isSending, selectedModel, serverUrl, scrollToBottom, showDialog, strings.chatFailed, strings.noResponseReceived, strings.ok, updateActiveThread]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable onPress={() => setSidebarOpen((value) => !value)} style={styles.iconButton}>
            <Ionicons name={sidebarOpen ? 'close' : 'menu'} size={18} color="#FFF" />
          </Pressable>
          <View style={styles.headerMeta}>
           <Text style={[styles.heading, styles.topBarHeading]}>{strings.home}</Text>
           <Text style={styles.serverText}>{serverUrl}</Text>
          </View>
        </View>
        <View style={styles.topBarActions}>
          <Pressable
            onPress={createNewThread}
           style={[styles.secondaryActionButton, activeThread?.title === strings.newChat && styles.secondaryActionButtonDisabled]}
           disabled={activeThread?.title === strings.newChat}
          >
            <View style={styles.secondaryActionContent}>
              <Ionicons name="add" size={14} color="#FFF" />
             <Text style={styles.secondaryActionText}>{strings.newChat}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.connectionRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={styles.connectionLabel}>
          {lastConnectionMessage || strings.noConnectionTestYet}
        </Text>
      </View>

      <View style={styles.modelSection}>
        <View style={styles.modelHeaderRow}>
          <Text style={styles.label}>{strings.availableAi}</Text>
          <View style={styles.aiActionsRow}>
            <Pressable
              onPress={handleRefreshModels}
              style={styles.refreshIconButton}
              hitSlop={8}
            >
              <Ionicons name="refresh" size={16} color="#FFF" />
            </Pressable>
            <Pressable style={styles.dropdown} onPress={() => setShowModelPicker(true)}>
             <Text numberOfLines={1} ellipsizeMode="tail" style={styles.dropdownText}>{selectedModel || strings.selectModel}</Text>
              <Ionicons name="chevron-down" size={16} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </View>

      <View pointerEvents={sidebarOpen ? 'auto' : 'none'} style={styles.drawerOverlay}>
        <Pressable
          style={[styles.drawerScrim, { opacity: sidebarOpen ? 1 : 0 }]}
          onPress={() => setSidebarOpen(false)}
        />
        <View style={[styles.drawerPanel, { transform: [{ translateX: sidebarOpen ? 0 : -320 }] }]}>
          <View style={styles.drawerHeader}>
           <Text style={styles.drawerTitle}>{strings.chatHistory}</Text>
            <Pressable onPress={() => setSidebarOpen(false)} style={styles.drawerCloseButton}>
              <Ionicons name="close" size={20} color="#FFF" />
            </Pressable>
          </View>
          <Pressable onPress={() => { createNewThread(); setSidebarOpen(false); }} style={styles.drawerNewChatButton}>
           <View style={styles.drawerNewChatContent}>
             <Ionicons name="add" size={18} color="#FFF" />
             <Text style={styles.drawerNewChatText}>{strings.newChat}</Text>
           </View>
          </Pressable>
          <View style={styles.historyList}>
            {threads.map((thread) => (
              <View key={thread.id} style={styles.historyItemRow}>
                <Pressable
                  onPress={() => {
                    setActiveThreadId(thread.id);
                    setSidebarOpen(false);
                  }}
                  style={[styles.historyItem, activeThreadId === thread.id && styles.historyItemActive, { flex: 1 }]}
                >
                  <Text style={[styles.historyItemText, activeThreadId === thread.id && styles.historyItemTextActive]}>
                   {thread.title || strings.newChat}
                  </Text>
                 <Text style={[styles.historyTimestamp, activeThreadId === thread.id && styles.historyTimestampActive]}>
                   {formatThreadTimestamp(thread.updatedAt ?? thread.createdAt ?? Date.now())}
                 </Text>
               </Pressable>
               <Pressable
                 onPress={() => renameThread(thread.id)}
                 style={styles.historyActionButton}
                 hitSlop={8}
               >
                 <Ionicons name="pencil-outline" size={15} color={activeThreadId === thread.id ? '#FFF' : '#475569'} />
               </Pressable>
               <Pressable
                 onPress={() => deleteThread(thread.id)}
                 style={styles.historyActionButton}
                 hitSlop={8}
               >
                 <Ionicons name="trash-outline" size={16} color={activeThreadId === thread.id ? '#FFF' : '#475569'} />
               </Pressable>
             </View>
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
             <Text style={styles.emptyChatText}>{strings.startConversation}</Text>
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
                     <Text style={styles.copiedHint}>{strings.copied}</Text>
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
             placeholder={strings.messagePlaceholder}
              multiline
              style={styles.input}
            />
            <Pressable
              onPress={sendMessage}
              disabled={isSending || !draft.trim()}
              style={[styles.sendButton, (isSending || !draft.trim()) && styles.sendButtonDisabled]}
            >
             <Text style={styles.sendButtonText}>{isSending ? strings.sendLoading : strings.send}</Text>
            </Pressable>
          </View>
        </KeyboardStickyView>
      </View>

      <Modal visible={showModelPicker} transparent animationType="fade" onRequestClose={() => setShowModelPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowModelPicker(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
           <Text style={styles.modalTitle}>{strings.chooseModel}</Text>
            {availableModels.length === 0 ? (
             <Text style={styles.emptyText}>{strings.noModelsAvailable}</Text>
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

      <Modal visible={!!renameThreadId} transparent animationType="fade" onRequestClose={() => setRenameThreadId(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setRenameThreadId(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
           <Text style={styles.modalTitle}>{strings.renameChat}</Text>
            <TextInput
              value={renameDraft}
              onChangeText={setRenameDraft}
             placeholder={strings.enterChatTitle}
              autoFocus
              style={styles.renameInput}
            />
            <View style={styles.renameActions}>
              <Pressable onPress={() => setRenameThreadId(null)} style={[styles.secondaryButton, styles.renameActionButton]}>
               <Text style={styles.secondaryButtonText}>{strings.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={finalizeRenameThread}
                disabled={!renameDraft.trim()}
                style={[styles.primaryButton, styles.renameActionButton, !renameDraft.trim() && styles.primaryButtonDisabled]}
              >
               <Text style={[styles.primaryButtonText, !renameDraft.trim() && styles.primaryButtonTextDisabled]}>{strings.save}</Text>
              </Pressable>
            </View>
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
  showDialog: (config: AppDialogConfig) => void;
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  strings: TranslationStrings;
};

function SettingsScreen({
  serverUrl,
  setServerUrl,
  selectedModel,
  availableModels,
  refreshModels,
  setLastConnectionState,
  setLastConnectionMessage,
  showDialog,
  language,
  setLanguage,
  strings,
}: SettingsScreenProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [draftUrl, setDraftUrl] = useState(serverUrl);

  useEffect(() => {
    setDraftUrl(serverUrl);
  }, [serverUrl]);

  const isSaveDisabled = !draftUrl.trim() || draftUrl === serverUrl;

  const handleSave = useCallback(() => {
    const normalized = sanitizeUrl(draftUrl);
    if (!normalized) {
      showDialog({ title: strings.noServerUrlTitle, message: strings.noServerUrlMessage, confirmText: strings.ok });
      return;
    }

    setServerUrl(normalized);
    refreshModels().catch(() => undefined);
    showDialog({ title: strings.serverUpdatedTitle, message: `${strings.serverUpdatedMessage} ${normalized}`, confirmText: strings.ok });
  }, [draftUrl, refreshModels, setServerUrl, showDialog, strings]);

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    const target = sanitizeUrl(draftUrl);

    if (!target) {
      setLastConnectionState('error');
      setLastConnectionMessage(strings.noServerUrlTitle);
      showDialog({ title: strings.noServerUrlTitle, message: strings.noServerUrlMessage, confirmText: strings.ok });
      setIsTesting(false);
      return;
    }

    try {
      const result = await fetchJson<{ models?: ModelInfo[] }>(`${target}/api/tags`);
      const models = result.models ?? [];
      const summary = models.length > 0 ? `${models.length} ${strings.modelsFound}` : strings.connectionOk;
      setLastConnectionState('success');
      setLastConnectionMessage(`${strings.connectedTo} ${target} • ${summary}`);
      showDialog({ title: strings.connectionSuccessful, message: `Server responded at ${target}`, confirmText: strings.ok });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLastConnectionState('error');
      setLastConnectionMessage(`${strings.connectionFailed}: ${message}`);
      showDialog({ title: strings.connectionFailed, message, confirmText: strings.ok });
    } finally {
      setIsTesting(false);
    }
  }, [draftUrl, setLastConnectionMessage, setLastConnectionState, showDialog, strings]);

  return (
    <SafeAreaView style={styles.safeAreaContent}>
      <KeyboardAwareScrollView
        bottomOffset={20}
        contentContainerStyle={styles.settingsScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.settingsCard}>
          <Text style={styles.heading}>{strings.settingsTitle}</Text>
          <Text style={[styles.label, styles.settingsLabelSpacing]}>{strings.ollamaServerUrl}</Text>
          <TextInput
            value={draftUrl}
            onChangeText={setDraftUrl}
            placeholder="http://192.168.1.10:11434"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.primaryButton, styles.fullWidth, isSaveDisabled && styles.primaryButtonDisabled]}
              onPress={handleSave}
              disabled={isSaveDisabled}
            >
              <Text style={[styles.primaryButtonText, isSaveDisabled && styles.primaryButtonTextDisabled]}>{strings.save}</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, styles.fullWidth, isTesting && styles.buttonDisabled]}
              onPress={handleTestConnection}
              disabled={isTesting}
            >
              <Text style={styles.secondaryButtonText}>{isTesting ? strings.testing : strings.testConnection}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.heading}>{strings.language}</Text>
          <View style={styles.languageSelector}>
            {languageOptions.map((option) => (
              <Pressable
                key={option}
                onPress={() => setLanguage(option)}
                style={[styles.languageChip, language === option && styles.languageChipSelected]}
              >
                <Text style={[styles.languageChipText, language === option && styles.languageChipTextSelected]}>{option.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.heading}>{strings.modelsTitle}</Text>
          <Text style={[styles.label, styles.settingsLabelSpacing]}>{strings.currentModel}</Text>
          <Text style={styles.valueText}>{selectedModel}</Text>
          <Text style={styles.label}>{strings.availableModels}</Text>
          {availableModels.length > 0 ? (
            <View style={styles.modelList}>
              {availableModels.map((model) => (
                <Text key={model} style={styles.modelListItem}>{model}</Text>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>{strings.noModelsFoundYet}</Text>
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
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  topBarHeading: {
    color: '#F8FAFC',
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
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  secondaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryActionText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  secondaryActionButtonDisabled: {
    opacity: 0.5,
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
    paddingTop: 21,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  drawerTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  drawerCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
  },
  drawerNewChatButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  drawerNewChatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  drawerNewChatText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
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
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  historyActionButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyItemText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
  },
  historyItemTextActive: {
    color: '#FFF',
  },
  historyTimestamp: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },
  historyTimestampActive: {
    color: '#E2E8F0',
  },
  modelSection: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  homeSectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
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
  settingsLabelSpacing: {
    marginTop: 12,
  },
  aiActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  refreshIconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 200,
    maxWidth: '70%',
  },
  dropdownText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
    flexShrink: 1,
    textAlign: 'left',
    maxWidth: '80%',
    overflow: 'hidden',
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
  dialogCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  dialogMessage: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  dialogButton: {
    flex: 0,
    minWidth: 100,
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
  renameInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    marginBottom: 12,
  },
  renameActions: {
    flexDirection: 'row',
    gap: 10,
  },
  renameActionButton: {
    flex: 1,
  },
  languageSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  languageChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  languageChipSelected: {
    backgroundColor: '#4F46E5',
  },
  languageChipText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  languageChipTextSelected: {
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
  primaryButtonDisabled: {
    backgroundColor: '#4F46E5',
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  primaryButtonTextDisabled: {
    color: '#FFF',
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
