import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { styles } from "../../theme/styles";
import { TranslationStrings } from "../../types";

type ChatHeaderProps = {
  connectionStatus: { label: string; color: string };
  selectedModel: string;
  serverUrl: string;
  strings: TranslationStrings;
  onMenuPress: () => void;
  onModelPress: () => void;
  onNewChatPress: () => void;
};

export function ChatHeader({
  connectionStatus,
  selectedModel,
  serverUrl,
  strings,
  onMenuPress,
  onModelPress,
  onNewChatPress,
}: ChatHeaderProps) {
  return (
    <>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable style={styles.iconButton} onPress={onMenuPress}>
            <Ionicons name="menu" size={18} color="#FFF" />
          </Pressable>
          <View style={styles.headerMeta}>
            <Text style={[styles.heading, styles.topBarHeading]}>
              {strings.home}
            </Text>
            <Text style={styles.serverText}>
              {serverUrl || strings.noServerUrlConfigured}
            </Text>
          </View>
        </View>
        <View style={styles.topBarActions}>
          <Pressable style={styles.iconButton} onPress={onNewChatPress}>
            <Ionicons name="add" size={18} color="#FFF" />
          </Pressable>
        </View>
      </View>

      <View style={styles.connectionRow}>
        <View style={[styles.statusDot, { backgroundColor: connectionStatus.color }]} />
        <Text style={styles.connectionLabel}>{connectionStatus.label}</Text>
      </View>

      <View style={styles.modelSection}>
        <View style={styles.modelRow}>
          <Text style={styles.label}>{strings.currentModel}</Text>
          <Pressable style={styles.dropdown} onPress={onModelPress}>
            <Text style={styles.dropdownText}>
              {selectedModel || strings.noModelsAvailable}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#FFF" />
          </Pressable>
        </View>
      </View>
    </>
  );
}

