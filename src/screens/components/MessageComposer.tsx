import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Keyboard, Pressable, TextInput, View } from "react-native";
import { styles } from "../../theme/styles";
import { TranslationStrings } from "../../types";
import { AnimatedTypingDots } from "./AnimatedTypingDots";

type MessageComposerProps = {
  isSending: boolean;
  messageText: string;
  strings: TranslationStrings;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onSend: () => void;
};

export function MessageComposer({
  isSending,
  messageText,
  strings,
  onChangeText,
  onClear,
  onSend,
}: MessageComposerProps) {
  const hasMessage = messageText.trim().length > 0;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const showKeyboardDismissButton = !hasMessage && isKeyboardVisible;

  return (
    <View style={styles.inputComposer}>
      <View style={styles.inputRow}>
        <TextInput
          value={messageText}
          onChangeText={onChangeText}
          placeholder={strings.messagePlaceholder}
          style={styles.input}
          multiline
        />
        {hasMessage ? (
          <Pressable
            style={styles.composerIconButton}
            onPress={onClear}
            accessibilityLabel="Clear message"
          >
            <Ionicons name="close-circle" size={22} color="#94A3B8" />
          </Pressable>
        ) : showKeyboardDismissButton ? (
          <Pressable
            style={styles.composerIconButton}
            onPress={Keyboard.dismiss}
            accessibilityLabel="Dismiss keyboard"
          >
            <Ionicons name="chevron-down" size={22} color="#64748B" />
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            onSend();
          }}
          style={[
            styles.sendButton,
            (isSending || !hasMessage) && styles.sendButtonDisabled,
          ]}
          disabled={isSending || !hasMessage}
          accessibilityLabel={strings.send}
        >
          {isSending ? (
            <AnimatedTypingDots compact />
          ) : (
            <Ionicons name="send" size={18} color="#FFF" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
