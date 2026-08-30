import { STORAGE_KEYS } from '../../constants';
import { storage } from '../../services/storage';
import { ChatThread } from '../../types';

export async function loadChatThreads(): Promise<{ threads: ChatThread[]; activeThreadId: string | null }> {
  const [threadsRaw, activeThreadId] = await Promise.all([
    storage.getItem(STORAGE_KEYS.threadHistory),
    storage.getItem(STORAGE_KEYS.activeThreadId),
  ]);

  let threads: ChatThread[] = [];
  if (threadsRaw) {
    try {
      const parsed = JSON.parse(threadsRaw) as ChatThread[];
      if (Array.isArray(parsed)) threads = parsed;
    } catch {
      threads = [];
    }
  }

  return { threads, activeThreadId: activeThreadId ?? null };
}

export async function persistChatThreads(threads: ChatThread[], activeThreadId: string | null): Promise<void> {
  await Promise.all([
    storage.setItem(STORAGE_KEYS.threadHistory, JSON.stringify(threads)),
    activeThreadId ? storage.setItem(STORAGE_KEYS.activeThreadId, activeThreadId) : Promise.resolve(),
  ]);
}
