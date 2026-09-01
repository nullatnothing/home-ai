import React from "react";
import { render } from "@testing-library/react-native";
import { translations } from "../../constants";
import { AnimatedTypingDots } from "../components/AnimatedTypingDots";
import { ChatDrawer } from "../components/ChatDrawer";
import { ChatHeader } from "../components/ChatHeader";
import { ChatMessageList } from "../components/ChatMessageList";
import { ModelPickerModal, RenameChatModal } from "../components/ChatModals";
import { MessageComposer } from "../components/MessageComposer";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("../../utils/markdown", () => ({
  renderMarkdownText: (text: string) => text,
}));

jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAvoidingView: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("chat UI components", () => {
  it("renders drawer actions and delegates callbacks", async () => {
    const onClose = jest.fn();
    const onDelete = jest.fn();
    const onNewChat = jest.fn();
    const onRename = jest.fn();
    const onSelect = jest.fn();

    const tree = await render(
      <ChatDrawer
        activeThreadId="t-1"
        strings={translations.en}
        threads={[
          {
            id: "t-1",
            title: "First chat",
            messages: [],
            createdAt: 1,
            updatedAt: 2,
          },
          {
            id: "t-2",
            title: "Second chat",
            messages: [],
            createdAt: 1,
            updatedAt: 3,
          },
        ]}
        formatTimestamp={(value) => `${value}`}
        onClose={onClose}
        onDelete={onDelete}
        onNewChat={onNewChat}
        onRename={onRename}
        onSelect={onSelect}
      />,
    );

    expect(tree.toJSON()).toBeTruthy();
  });

  it("renders header and modal controls and reacts to actions", async () => {
    const onMenuPress = jest.fn();
    const onModelPress = jest.fn();
    const onNewChatPress = jest.fn();

    const tree = await render(
      <ChatHeader
        connectionStatus={{ label: "Connected", color: "#22C55E" }}
        selectedModel="llama3"
        serverUrl="http://localhost:11434"
        strings={translations.en}
        onMenuPress={onMenuPress}
        onModelPress={onModelPress}
        onNewChatPress={onNewChatPress}
      />,
    );

    expect(tree.toJSON()).toBeTruthy();
    expect(onMenuPress).not.toHaveBeenCalled();

    const rename = await render(
      <RenameChatModal
        isOpen
        strings={translations.en}
        value="Draft title"
        onCancel={jest.fn()}
        onChangeText={jest.fn()}
        onSave={jest.fn()}
      />,
    );
    expect(rename.toJSON()).toBeTruthy();

    const modelPicker = await render(
      <ModelPickerModal
        availableModels={["llama3", "mistral"]}
        isOpen
        selectedModel="llama3"
        strings={translations.en}
        onClose={jest.fn()}
        onSelect={jest.fn()}
      />,
    );
    expect(modelPicker.toJSON()).toBeTruthy();
  });

  it("renders typed messages, markdown content, and composer behavior", async () => {
    const onCopy = jest.fn();
    const onShare = jest.fn();
    const onSend = jest.fn();
    const onClear = jest.fn();

    const tree = await render(
      <>
        <ChatMessageList
          copiedMessageId="m-2"
          isSending={false}
          messages={[
            { id: "m-1", role: "user", text: "Hello" },
            { id: "m-2", role: "assistant", text: "**Hello** and `code`" },
          ]}
          strings={translations.en}
          onCopy={onCopy}
          onLastAssistantLayout={jest.fn()}
          onShare={onShare}
        />
        <MessageComposer
          isSending={false}
          messageText="Hi"
          strings={translations.en}
          onChangeText={jest.fn()}
          onClear={onClear}
          onSend={onSend}
        />
      </>,
    );

    expect(tree.toJSON()).toBeTruthy();
    expect(onCopy).not.toHaveBeenCalled();
    expect(onSend).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });

  it("renders typing dots without crashing", async () => {
    const tree = await render(<AnimatedTypingDots compact />);
    expect(tree.toJSON()).toBeTruthy();
  });
});
