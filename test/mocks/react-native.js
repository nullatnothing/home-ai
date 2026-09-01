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
  ScrollView: React.forwardRef(({ children, ...props }, ref) => {
    React.useImperativeHandle(ref, () => ({
      scrollTo: jest.fn(),
      scrollToEnd: jest.fn(),
    }));
    return React.createElement("ScrollView", props, children);
  }),
  KeyboardAvoidingView: ({ children, ...props }) =>
    React.createElement("KeyboardAvoidingView", props, children),
  Modal: ({ visible, children, ...props }) =>
    visible ? React.createElement("Modal", props, children) : null,
  Alert: { alert: jest.fn() },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (value) => {
      if (Array.isArray(value)) {
        return value.reduce((acc, item) => ({ ...acc, ...((item && typeof item === "object") || Array.isArray(item) ? item : {}) }), {});
      }
      return value ?? {};
    },
  },
  Keyboard: { addListener: jest.fn(() => ({ remove: jest.fn() })) },
  Animated: {
    View: host("View"),
    Value: class {
      constructor(value = 0) { this.value = value; }
      setValue(v) { this.value = v; }
    },
    sequence: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
    timing: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
    delay: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
    parallel: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
    loop: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
  },
};
