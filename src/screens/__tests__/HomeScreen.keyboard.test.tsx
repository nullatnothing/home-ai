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

describe("keyboard layout regression guard", () => {
  it("pins the exact keyboard layout contract", () => {
    expect(Object.isFrozen(KEYBOARD_LAYOUT)).toBe(true);
    expect(KEYBOARD_LAYOUT).toEqual({
      behavior: "padding",
      verticalOffset: 0,
      bottomBuffer: 0,
      automaticOffset: true,
    });
    expect(KEYBOARD_AVOIDING_BEHAVIOR).toBe("padding");
    expect(KEYBOARD_VERTICAL_OFFSET).toBe(0);
    expect(KEYBOARD_BOTTOM_BUFFER).toBe(0);
  });

  it("does not add a second tab-bar or safe-area offset on iOS", () => {
    expect(getKeyboardVerticalOffset("ios", 49, 20)).toBe(0);
    expect(getKeyboardVerticalOffset("ios", 70, 34)).toBe(0);
    expect(getKeyboardVerticalOffset("android", 49, 20)).toBe(0);
  });

  it("does not add safe-area padding while the keyboard avoider is active", () => {
    expect(getComposerBottomPadding("ios", 20)).toBe(0);
    expect(getComposerBottomPadding("android", 20)).toBe(0);
  });
});
