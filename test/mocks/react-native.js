const React = require("react");
const platform = { OS: "ios" };

const host =
  (tag) =>
  ({ children, ...props }) =>
    React.createElement(tag, props, children);

module.exports = {
  Platform: platform,
  __setPlatformOS(value) {
    platform.OS = value;
  },
  View: host("View"),
  Text: host("Text"),
  TextInput: ({ value, onChangeText, ...props }) =>
    React.createElement("TextInput", { value, onChangeText, ...props }),
  Pressable: ({ children, onPress, ...props }) =>
    React.createElement("Pressable", { onPress, ...props }, children),
  ScrollView: ({ children, ...props }) =>
    React.createElement("ScrollView", props, children),
  KeyboardAvoidingView: ({ children, ...props }) =>
    React.createElement("KeyboardAvoidingView", props, children),
  Modal: ({ visible, children, ...props }) =>
    visible ? React.createElement("Modal", props, children) : null,
  Alert: { alert: jest.fn() },
  StyleSheet: { create: (styles) => styles },
};
