import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import { styles } from "../../theme/styles";
import { ChatMessage, TranslationStrings } from "../../types";
import { renderMarkdownText } from "../../utils/markdown";
import { AnimatedTypingDots } from "./AnimatedTypingDots";

type ChatMessageListProps = {
  copiedMessageId: string | null;
  isSending: boolean;
  messages: ChatMessage[];
  strings: TranslationStrings;
  onCopy: (text: string, id: string) => void;
  onLastAssistantLayout: (event: LayoutChangeEvent) => void;
  onShare: (text: string) => void;
};

export function ChatMessageList({
  copiedMessageId,
  isSending,
  messages,
  strings,
  onCopy,
  onLastAssistantLayout,
  onShare,
}: ChatMessageListProps) {
  return (
    <>
      {messages.length ? (
        messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;

          return (
            <Pressable
              key={message.id}
              onLongPress={() => onCopy(message.text, message.id)}
              onLayout={
                isLastMessage && message.role === "assistant"
                  ? onLastAssistantLayout
                  : undefined
              }
              style={[
                styles.messageBubble,
                message.role === "user"
                  ? styles.userBubble
                  : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === "user" && styles.userMessageText,
                ]}
              >
                {message.role === "assistant"
                  ? renderMarkdownText(message.text)
                  : message.text}
              </Text>

              {message.role === "assistant" ? (
                <View style={styles.messageActions}>
                  <Pressable
                    style={styles.messageActionButton}
                    onPress={() => onShare(message.text)}
                    accessibilityLabel="Share response"
                  >
                    <Ionicons name="share-outline" size={14} color="#0F172A" />
                  </Pressable>
                  <Pressable
                    style={styles.messageActionButton}
                    onPress={() => onCopy(message.text, message.id)}
                    accessibilityLabel="Copy message"
                  >
                    <Ionicons name="copy-outline" size={14} color="#0F172A" />
                  </Pressable>
                </View>
              ) : null}

              {copiedMessageId === message.id ? (
                <Text style={styles.copiedHint}>{strings.copied}</Text>
              ) : null}
            </Pressable>
          );
        })
      ) : (
        <Text style={styles.emptyChatText}>{strings.startConversation}</Text>
      )}
      {isSending ? (
        <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
          <View style={styles.sendButtonContent}>
            <AnimatedTypingDots compact />
            <Text style={[styles.sendButtonText, styles.sendButtonTextDisabled]}>
              {strings.send}
            </Text>
          </View>
        </View>
      ) : null}
    </>
  );
}

