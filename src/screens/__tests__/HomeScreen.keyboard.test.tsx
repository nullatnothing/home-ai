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
  KeyboardStickyView: ({ children }: { children: React.ReactNode }) =>
    children,
}));

import {
  KEYBOARD_LAYOUT,
} from "../HomeScreen";

describe("keyboard layout regression guard", () => {
  it("pins the exact keyboard layout contract", () => {
    expect(Object.isFrozen(KEYBOARD_LAYOUT)).toBe(true);
    expect(KEYBOARD_LAYOUT).toEqual({
      closedOffset: 0,
      openedOffset: 0,
    });
  });
});
