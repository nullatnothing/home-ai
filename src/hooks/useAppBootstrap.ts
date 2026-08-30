import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_MODELS, DEFAULT_SERVER_URL, STORAGE_KEYS, translations } from '../constants';
import { sanitizeUrl } from '../services/api';
import { storage } from '../services/storage';
import { AppDialogConfig, Language } from '../types';

export type AppState = {
  serverUrl: string;
  selectedModel: string;
  availableModels: string[];
  language: Language;
  lastConnectionState: 'idle' | 'success' | 'error';
  lastConnectionMessage: string;
  dialog: AppDialogConfig | null;
};

export function useAppBootstrap() {
  const [appState, setAppState] = useState<AppState>({
    serverUrl: DEFAULT_SERVER_URL,
    selectedModel: DEFAULT_MODELS[0] ?? '',
    availableModels: DEFAULT_MODELS,
    language: 'en',
    lastConnectionState: 'idle',
    lastConnectionMessage: '',
    dialog: null,
  });
  const [isHydrated, setIsHydrated] = useState(false);

  const strings = translations[appState.language];

  useEffect(() => {
    const hydrate = async () => {
      const [storedUrl, storedModel, storedLanguage] = await Promise.all([
        storage.getItem(STORAGE_KEYS.serverUrl),
        storage.getItem(STORAGE_KEYS.selectedModel),
        storage.getItem(STORAGE_KEYS.language),
      ]);

      setAppState((current) => ({
        ...current,
        serverUrl: sanitizeUrl(storedUrl ?? DEFAULT_SERVER_URL),
        selectedModel: storedModel ?? current.selectedModel,
        language: storedLanguage && storedLanguage in translations ? (storedLanguage as Language) : current.language,
      }));
      setIsHydrated(true);
    };

    hydrate().catch(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    storage.setItem(STORAGE_KEYS.serverUrl, appState.serverUrl).catch(() => undefined);
  }, [appState.serverUrl, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    storage.setItem(STORAGE_KEYS.selectedModel, appState.selectedModel).catch(() => undefined);
  }, [appState.selectedModel, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    storage.setItem(STORAGE_KEYS.language, appState.language).catch(() => undefined);
  }, [appState.language, isHydrated]);

  return useMemo(
    () => ({
      isHydrated,
      dialog: appState.dialog,
      strings,
      appState,
      setAppState,
      dismissDialog: () => setAppState((current) => ({ ...current, dialog: null })),
    }),
    [appState, isHydrated, strings],
  );
}
