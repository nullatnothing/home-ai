jest.mock("@react-navigation/bottom-tabs", () => ({
  useBottomTabBarHeight: () => 49,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAvoidingView: ({ children }: { children: React.ReactNode }) =>
    children,
}));

import {
  KEYBOARD_AVOIDING_BEHAVIOR,
  KEYBOARD_BOTTOM_BUFFER,
  KEYBOARD_LAYOUT,
  KEYBOARD_VERTICAL_OFFSET,
  getComposerBottomPadding,
  getKeyboardVerticalOffset,
} from "../HomeScreen";

import type { ReactNode } from "react";

describe("keyboard layout regression guard", () => {
  it("pins the exact keyboard layout contract", () => {
    expect(Object.isFrozen(KEYBOARD_LAYOUT)).toBe(true);
    expect(KEYBOARD_LAYOUT).toEqual({
      behavior: "padding",
      verticalOffset: 88,
      bottomBuffer: 20,
    });
    expect(KEYBOARD_AVOIDING_BEHAVIOR).toBe("padding");
    expect(KEYBOARD_VERTICAL_OFFSET).toBe(88);
    expect(KEYBOARD_BOTTOM_BUFFER).toBe(20);
  });

  it("keeps iOS offsets above the tab bar and safe area", () => {
    expect(getKeyboardVerticalOffset("ios", 49, 20)).toBe(108);
    expect(getKeyboardVerticalOffset("ios", 70, 34)).toBe(124);
    expect(getKeyboardVerticalOffset("android", 49, 20)).toBe(0);
  });

  it("keeps the composer padding aligned with the unsafe bottom inset", () => {
    expect(getComposerBottomPadding("ios", 20)).toBe(40);
    expect(getComposerBottomPadding("android", 20)).toBe(0);
  });
});
