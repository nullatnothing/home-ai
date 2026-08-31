import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "../../theme/styles";
import { ChatThread, TranslationStrings } from "../../types";

type ChatDrawerProps = {
  activeThreadId: string;
  strings: TranslationStrings;
  threads: ChatThread[];
  formatTimestamp: (timestamp: number) => string;
  onClose: () => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, title: string) => void;
  onSelect: (id: string) => void;
};

export function ChatDrawer({
  activeThreadId,
  strings,
  threads,
  formatTimestamp,
  onClose,
  onDelete,
  onNewChat,
  onRename,
  onSelect,
}: ChatDrawerProps) {
  return (
    <Pressable style={styles.drawerOverlay} onPress={onClose}>
      <View style={styles.drawerScrim} />
      <View style={styles.drawerPanel}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>{strings.chatHistory}</Text>
          <Pressable style={styles.drawerCloseButton} onPress={onClose}>
            <Ionicons name="close" size={16} color="#FFF" />
          </Pressable>
        </View>
        <Pressable style={styles.drawerNewChatButton} onPress={onNewChat}>
          <View style={styles.drawerNewChatContent}>
            <Ionicons name="add-circle-outline" size={16} color="#FFF" />
            <Text style={styles.drawerNewChatText}>{strings.newChat}</Text>
          </View>
        </Pressable>
        <ScrollView contentContainerStyle={styles.historyList}>
          {threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <View
                key={thread.id}
                style={[styles.historyItem, isActive && styles.historyItemActive]}
              >
                <Pressable onPress={() => onSelect(thread.id)} style={{ flex: 1 }}>
                  <Text style={[styles.historyItemText, isActive && styles.historyItemTextActive]}>
                    {thread.title}
                  </Text>
                  <Text style={[styles.historyTimestamp, isActive && styles.historyTimestampActive]}>
                    {formatTimestamp(thread.updatedAt)}
                  </Text>
                </Pressable>
                <View style={styles.historyActions}>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      onRename(thread.id, thread.title);
                    }}
                    style={styles.historyActionButton}
                  >
                    <Ionicons name="pencil" size={14} color={isActive ? "#FFF" : "#0F172A"} />
                  </Pressable>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      onDelete(thread.id);
                    }}
                    style={styles.historyActionButton}
                  >
                    <Ionicons name="trash" size={14} color={isActive ? "#FFF" : "#0F172A"} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Pressable>
  );
}

