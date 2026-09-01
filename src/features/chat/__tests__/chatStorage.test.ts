import { STORAGE_KEYS } from "../../../constants";
import { storage } from "../../../services/storage";
import { loadChatThreads, persistChatThreads } from "../chatStorage";

jest.mock("../../../services/storage", () => ({
  storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(storage);

describe("chat storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads valid threads and the active id", async () => {
    const threads = [{ id: "1", title: "Chat", messages: [], createdAt: 1, updatedAt: 1 }];
    mockedStorage.getItem
      .mockResolvedValueOnce(JSON.stringify(threads))
      .mockResolvedValueOnce("1");

    await expect(loadChatThreads()).resolves.toEqual({ threads, activeThreadId: "1" });
    expect(mockedStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.threadHistory);
    expect(mockedStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.activeThreadId);
  });

  it.each([null, "", JSON.stringify({ nope: true }), "not-json"])(
    "falls back to an empty thread list for malformed or missing data (%s)",
    async (raw) => {
      mockedStorage.getItem.mockResolvedValueOnce(raw).mockResolvedValueOnce(null);
      await expect(loadChatThreads()).resolves.toEqual({ threads: [], activeThreadId: null });
    },
  );

  it("persists threads and an active id", async () => {
    mockedStorage.setItem.mockResolvedValue(undefined);
    const threads = [{ id: "1", title: "Chat", messages: [], createdAt: 1, updatedAt: 1 }];
    await persistChatThreads(threads, "1");
    expect(mockedStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.threadHistory,
      JSON.stringify(threads),
    );
    expect(mockedStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.activeThreadId, "1");
  });

  it("does not write an empty active id", async () => {
    mockedStorage.setItem.mockResolvedValue(undefined);
    await persistChatThreads([], null);
    expect(mockedStorage.setItem).toHaveBeenCalledTimes(1);
    expect(mockedStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.threadHistory, "[]");
  });
});

