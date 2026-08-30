import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppState } from "../hooks/useAppBootstrap";
import { fetchJson, sanitizeUrl } from "../services/api";
import { LANGUAGE_OPTIONS } from "../constants";
import { styles } from "../theme/styles";
import { TranslationStrings } from "../types";

type Props = {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  strings: TranslationStrings;
};

export function SettingsScreen({ appState, setAppState, strings }: Props) {
  const [serverUrl, setServerUrl] = useState(appState.serverUrl);
  const [testing, setTesting] = useState(false);

  const normalizedServerUrl = sanitizeUrl(serverUrl);
  const canSave =
    Boolean(normalizedServerUrl) && normalizedServerUrl !== appState.serverUrl;

  const saveServerUrl = () => {
    const nextUrl = sanitizeUrl(serverUrl);
    if (!nextUrl) {
      setAppState((current) => ({
        ...current,
        dialog: {
          title: strings.noServerUrlTitle,
          message: strings.noServerUrlMessage,
          confirmText: strings.ok,
        },
      }));
      return;
    }
    setAppState((current) => ({
      ...current,
      serverUrl: nextUrl,
      dialog: {
        title: strings.serverUpdatedTitle,
        message: `${strings.serverUpdatedMessage} ${nextUrl}`,
        confirmText: strings.ok,
      },
    }));
  };

  const testConnection = async () => {
    const normalized = sanitizeUrl(serverUrl);
    if (!normalized)
      return Alert.alert(strings.noServerUrlTitle, strings.noServerUrlMessage);
    setTesting(true);
    try {
      const result = await fetchJson<{ models?: { name: string }[] }>(
        `${normalized}/api/tags`,
      );
      setAppState((current) => ({
        ...current,
        serverUrl: normalized,
        availableModels:
          result.models?.map((model) => model.name) ?? current.availableModels,
        lastConnectionState: "success",
        lastConnectionMessage: strings.connectionSuccessful,
        dialog: {
          title: strings.connectionSuccessful,
          message: `${strings.connectedTo} ${normalized}`,
          confirmText: strings.ok,
        },
      }));
    } catch (error: any) {
      setAppState((current) => ({
        ...current,
        serverUrl: normalized,
        lastConnectionState: "error",
        lastConnectionMessage: error?.message ?? strings.unknownError,
        dialog: {
          title: strings.connectionFailed,
          message: error?.message ?? strings.unknownError,
          confirmText: strings.ok,
        },
      }));
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView
      style={styles.safeArea}
      contentContainerStyle={styles.settingsScrollContent}
    >
      <View style={[styles.topBar, styles.settingsTopBar]}>
        <View style={styles.topBarLeft}>
          <View style={styles.headerMeta}>
            <Text style={[styles.heading, styles.topBarHeading]}>
              {strings.settingsTitle}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsSectionTitle}>
          {strings.ollamaServerUrl}
        </Text>
        <TextInput
          value={serverUrl}
          onChangeText={setServerUrl}
          style={styles.renameInput}
          placeholder={strings.ollamaServerUrl}
        />
        <View style={styles.buttonRow}>
          <Pressable
            disabled={!canSave}
            style={[
              styles.primaryButton,
              styles.fullWidth,
              !canSave && styles.primaryButtonDisabled,
            ]}
            onPress={saveServerUrl}
          >
            <Text
              style={[
                styles.primaryButtonText,
                !canSave && styles.primaryButtonTextDisabled,
              ]}
            >
              {strings.saveServerUrl}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.secondaryButton,
              styles.fullWidth,
              testing && styles.buttonDisabled,
            ]}
            onPress={testConnection}
            disabled={testing}
          >
            <Text style={styles.secondaryButtonText}>
              {testing ? strings.testing : strings.testConnection}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.heading}>{strings.language}</Text>
        <View style={styles.languageSelector}>
          {LANGUAGE_OPTIONS.map((code) => (
            <Pressable
              key={code}
              onPress={() =>
                setAppState((current) => ({ ...current, language: code }))
              }
              style={[
                styles.languageChip,
                appState.language === code && styles.languageChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.languageChipText,
                  appState.language === code && styles.languageChipTextSelected,
                ]}
              >
                {code.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.heading}>{strings.modelsTitle}</Text>
        {appState.availableModels.length ? (
          appState.availableModels.map((model) => (
            <Text key={model} style={styles.modelListItem}>
              {model}
            </Text>
          ))
        ) : (
          <Text style={styles.emptyText}>{strings.noModelsFoundYet}</Text>
        )}
      </View>
    </ScrollView>
  );
}
