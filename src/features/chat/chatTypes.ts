import { ChatThread } from '../../types';

export type ChatRuntimeState = {
  threads: ChatThread[];
  activeThreadId: string;
  messageText: string;
  isSending: boolean;
  isModelPickerVisible: boolean;
  isRenameVisible: boolean;
  renameValue: string;
  copiedMessageId: string | null;
  drawerOpen: boolean;
};
