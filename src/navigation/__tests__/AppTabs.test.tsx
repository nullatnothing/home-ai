import React from "react";
import { render } from "@testing-library/react-native";
import { AppTabs } from "../AppTabs";
import { translations } from "../../constants";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("@react-navigation/bottom-tabs", () => {
  const react = require("react");
  const { View } = require("react-native");
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) =>
        react.createElement(View, null, children),
      Screen: ({ children }: { children: ((props?: any) => React.ReactNode) | React.ReactNode }) =>
        react.createElement(
          View,
          null,
          typeof children === "function" ? children() : children,
        ),
    }),
  };
});

jest.mock("../../screens/HomeScreen", () => ({
  HomeScreen: () => require("react").createElement("Text", null, "HomeScreen"),
}));

jest.mock("../../screens/SettingsScreen", () => ({
  SettingsScreen: () => require("react").createElement("Text", null, "SettingsScreen"),
}));

describe("AppTabs", () => {
  it("renders both home and settings tabs", async () => {
    const appState = {
      serverUrl: "http://localhost:11434",
      selectedModel: "llama3",
      availableModels: ["llama3"],
      language: "en" as const,
      lastConnectionState: "success" as const,
      lastConnectionMessage: "ok",
      dialog: null,
    };

    const { getByText } = await render(
      <AppTabs appState={appState} setAppState={jest.fn()} strings={translations.en} />,
    );

    expect(getByText("HomeScreen")).toBeTruthy();
    expect(getByText("SettingsScreen")).toBeTruthy();
  });
});
