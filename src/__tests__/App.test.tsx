import React from "react";
import { render } from "@testing-library/react-native";
import App from "../App";
import { translations } from "../constants";

const mockUseAppBootstrap = jest.fn();

jest.mock("../hooks/useAppBootstrap", () => ({
  useAppBootstrap: (...args: any[]) => mockUseAppBootstrap(...args),
}));

jest.mock("@react-navigation/native", () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("react-native-keyboard-controller", () => ({
  KeyboardProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("../components/AppDialog", () => ({
  AppDialog: () => require("react").createElement("Text", null, "Dialog"),
}));

jest.mock("../navigation/AppTabs", () => ({
  AppTabs: () => require("react").createElement("Text", null, "Tabs"),
}));

describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the loading state while the app is hydrating", async () => {
    mockUseAppBootstrap.mockReturnValue({
      isHydrated: false,
      dialog: null,
      strings: translations.en,
      appState: {
        serverUrl: "http://localhost:11434",
        selectedModel: "llama3",
        availableModels: ["llama3"],
        language: "en",
        lastConnectionState: "idle",
        lastConnectionMessage: "",
        dialog: null,
      },
      setAppState: jest.fn(),
      dismissDialog: jest.fn(),
    });

    const { getByText } = await render(<App />);
    expect(getByText(translations.en.loading)).toBeTruthy();
  });

  it("renders tabs and dialog once the app is hydrated", async () => {
    mockUseAppBootstrap.mockReturnValue({
      isHydrated: true,
      dialog: { title: "Info", message: "Hello" },
      strings: translations.en,
      appState: {
        serverUrl: "http://localhost:11434",
        selectedModel: "llama3",
        availableModels: ["llama3"],
        language: "en",
        lastConnectionState: "success",
        lastConnectionMessage: "ok",
        dialog: null,
      },
      setAppState: jest.fn(),
      dismissDialog: jest.fn(),
    });

    const { getByText } = await render(<App />);
    expect(getByText("Tabs")).toBeTruthy();
    expect(getByText("Dialog")).toBeTruthy();
  });
});
