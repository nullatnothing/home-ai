import { translations } from "../../constants";
import {
  buildChatRequest,
  getConnectionStatus,
  getThreadTitle,
  normalizeThreadTitle,
  resolveAssistantText,
} from "../HomeScreen";
import { styles } from "../../theme/styles";

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("@react-navigation/bottom-tabs", () => ({
  useBottomTabBarHeight: jest.fn(() => 49),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, right: 0, bottom: 20, left: 0 })),
}));

jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAvoidingView: "KeyboardAvoidingView",
}));

describe("HomeScreen screen contracts", () => {
  it("builds the expected Ollama chat payload with the current model and prior messages", () => {
    const previousMessages = [
      { id: "m1", role: "assistant" as const, text: "Hi there" },
      { id: "m2", role: "user" as const, text: "hello" },
    ];

    expect(
      buildChatRequest("qwen2.5-coder:7b", previousMessages, "next question"),
    ).toEqual({
      model: "qwen2.5-coder:7b",
      messages: [
        { role: "assistant", content: "Hi there" },
        { role: "user", content: "hello" },
        { role: "user", content: "next question" },
      ],
    });
  });

  it("resolves the assistant response from the Ollama response format", () => {
    expect(
      resolveAssistantText(
        { message: { content: "hello from ollama" } },
        "fallback",
      ),
    ).toBe("hello from ollama");
    expect(resolveAssistantText({ content: "plain content" }, "fallback")).toBe(
      "plain content",
    );
    expect(
      resolveAssistantText({ response: "legacy response" }, "fallback"),
    ).toBe("legacy response");
    expect(resolveAssistantText(undefined, "fallback")).toBe("fallback");
  });

  it("returns the language-aware connection status label", () => {
    expect(
      getConnectionStatus(
        {
          serverUrl: "http://localhost:11434",
          selectedModel: "qwen2.5-coder:7b",
          availableModels: ["qwen2.5-coder:7b"],
          language: "en",
          lastConnectionState: "success",
          lastConnectionMessage: "Connection successful",
          dialog: null,
        },
        translations.en,
      ),
    ).toEqual({ label: "Connection successful", color: "#22C55E" });

    expect(
      getConnectionStatus(
        {
          serverUrl: "http://localhost:11434",
          selectedModel: "qwen2.5-coder:7b",
          availableModels: ["qwen2.5-coder:7b"],
          language: "fr",
          lastConnectionState: "error",
          lastConnectionMessage: "Connection failed",
          dialog: null,
        },
        translations.fr,
      ),
    ).toEqual({ label: "Connexion échouée", color: "#EF4444" });
  });

  it("uses the first question as a concise history title", () => {
    expect(getThreadTitle("  How do I insulate my attic?  ", "New chat")).toBe(
      "How do I insulate my attic?",
    );
    expect(getThreadTitle("What is\nthe best smart thermostat?", "New chat")).toBe(
      "What is the best smart thermostat?",
    );
    expect(getThreadTitle("   ", "New chat")).toBe("New chat");
  });

  it("repairs saved placeholder titles from the first user question", () => {
    const thread = {
      id: "thread-1",
      title: "New chat",
      createdAt: 1,
      updatedAt: 1,
      messages: [
        { id: "welcome", role: "assistant" as const, text: "Welcome" },
        {
          id: "question",
          role: "user" as const,
          text: "Can I automate my lights?",
        },
      ],
    };

    expect(normalizeThreadTitle(thread, "New chat").title).toBe(
      "Can I automate my lights?",
    );
    const renamedThread = { ...thread, title: "My custom title" };
    expect(normalizeThreadTitle(renamedThread, "New chat")).toBe(renamedThread);
  });

  it("keeps the message layout and composer controls compact", () => {
    expect(styles.messageBubble).toMatchObject({
      marginHorizontal: 16,
      maxWidth: "82%",
    });
    expect(styles.inputRow).toMatchObject({ alignItems: "center", gap: 6 });
    expect(styles.composerIconButton).toMatchObject({ width: 36, height: 36 });
    expect(styles.sendButton).toMatchObject({ width: 44, minHeight: 44 });
  });
});
