import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useAppBootstrap } from "../useAppBootstrap";
import { STORAGE_KEYS, translations } from "../../constants";
import { storage } from "../../services/storage";

jest.mock("../../services/storage", () => ({
  storage: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("useAppBootstrap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hydrates persisted values and persists state once ready", async () => {
    (storage.getItem as jest.Mock).mockImplementation((key: string) => {
      const values: Record<string, string> = {
        [STORAGE_KEYS.serverUrl]: "https://example.com/",
        [STORAGE_KEYS.selectedModel]: "llama3",
        [STORAGE_KEYS.language]: "fr",
      };
      return Promise.resolve(values[key] ?? null);
    });

    const hook = await renderHook(() => useAppBootstrap());
    const { result } = hook;

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(result.current.appState.serverUrl).toBe("https://example.com");
    expect(result.current.appState.selectedModel).toBe("llama3");
    expect(result.current.appState.language).toBe("fr");
    expect(result.current.strings).toBe(translations.fr);

    await waitFor(() =>
      expect(storage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.serverUrl,
        "https://example.com",
      ),
    );
    expect(storage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.selectedModel,
      "llama3",
    );
    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.language, "fr");
  });

  it("falls back to defaults when hydration fails and allows dismissing dialogs", async () => {
    (storage.getItem as jest.Mock).mockRejectedValue(new Error("bad storage"));

    const hook = await renderHook(() => useAppBootstrap());
    const { result } = hook;

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(result.current.appState.serverUrl).toBe(
      "http://192.168.88.13:11434",
    );
    expect(result.current.dialog).toBeNull();

    await act(async () => {
      result.current.setAppState((current) => ({
        ...current,
        dialog: { title: "Info", message: "Hi" },
      }));
    });
    expect(result.current.dialog).toEqual({ title: "Info", message: "Hi" });

    await act(async () => {
      result.current.dismissDialog();
    });
    expect(result.current.dialog).toBeNull();
  });
});
