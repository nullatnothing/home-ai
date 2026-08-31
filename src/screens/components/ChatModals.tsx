import React from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { styles } from "../../theme/styles";
import { TranslationStrings } from "../../types";

type ModelPickerModalProps = {
  availableModels: string[];
  isOpen: boolean;
  selectedModel: string;
  strings: TranslationStrings;
  onClose: () => void;
  onSelect: (model: string) => void;
};

export function ModelPickerModal({
  availableModels,
  isOpen,
  selectedModel,
  strings,
  onClose,
  onSelect,
}: ModelPickerModalProps) {
  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.dialogCard} onPress={() => undefined}>
          <Text style={styles.modalTitle}>{strings.chooseModel}</Text>
          {availableModels.length ? (
            availableModels.map((model) => (
              <Pressable
                key={model}
                style={[
                  styles.modelOption,
                  selectedModel === model && styles.modelOptionSelected,
                ]}
                onPress={() => onSelect(model)}
              >
                <Text
                  style={[
                    styles.modelOptionText,
                    selectedModel === model && styles.modelOptionTextSelected,
                  ]}
                >
                  {model}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyText}>{strings.noModelsFoundYet}</Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type RenameChatModalProps = {
  isOpen: boolean;
  strings: TranslationStrings;
  value: string;
  onCancel: () => void;
  onChangeText: (text: string) => void;
  onSave: () => void;
};

export function RenameChatModal({
  isOpen,
  strings,
  value,
  onCancel,
  onChangeText,
  onSave,
}: RenameChatModalProps) {
  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.dialogCard} onPress={() => undefined}>
          <Text style={styles.modalTitle}>{strings.renameChat}</Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            style={styles.renameInput}
            placeholder={strings.enterChatTitle}
            autoFocus
          />
          <View style={styles.renameActions}>
            <Pressable onPress={onCancel} style={[styles.secondaryButton, styles.renameActionButton]}>
              <Text style={styles.secondaryButtonText}>{strings.cancel}</Text>
            </Pressable>
            <Pressable onPress={onSave} style={[styles.primaryButton, styles.renameActionButton]}>
              <Text style={styles.primaryButtonText}>{strings.save}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

