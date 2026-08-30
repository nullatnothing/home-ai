export type Language = "en" | "de" | "es" | "it" | "fr";

export type TranslationStrings = {
  loading: string;
  home: string;
  settings: string;
  newChat: string;
  messagePlaceholder: string;
  send: string;
  sendLoading: string;
  welcomeMessage: string;
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

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export type ChatThread = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export type ModelInfo = {
  name: string;
};

export type AppDialogConfig = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};
