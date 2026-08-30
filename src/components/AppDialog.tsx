import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { styles } from "../theme/styles";
import { AppDialogConfig, TranslationStrings } from "../types";

export function AppDialog({
  dialog,
  strings,
  onDismiss,
}: {
  dialog: AppDialogConfig | null;
  strings: TranslationStrings;
  onDismiss: () => void;
}) {
  return (
    <Modal
      visible={!!dialog}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.modalOverlay} onPress={onDismiss}>
        <Pressable style={styles.dialogCard} onPress={() => undefined}>
          <Text style={styles.modalTitle}>{dialog?.title ?? strings.info}</Text>
          <Text style={styles.dialogMessage}>{dialog?.message ?? ""}</Text>
          <View style={styles.dialogActions}>
            {dialog?.cancelText && (
              <Pressable
                onPress={() => {
                  dialog?.onCancel?.();
                  onDismiss();
                }}
                style={[styles.secondaryButton, styles.dialogButton]}
              >
                <Text style={styles.secondaryButtonText}>
                  {dialog.cancelText}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                dialog?.onConfirm?.();
                onDismiss();
              }}
              style={[
                styles.primaryButton,
                styles.dialogButton,
                !dialog && styles.primaryButtonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {dialog?.confirmText ?? strings.ok}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
