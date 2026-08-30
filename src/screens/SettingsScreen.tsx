import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AppState } from '../hooks/useAppBootstrap';
import { fetchJson, sanitizeUrl } from '../services/api';
import { styles } from '../theme/styles';
import { TranslationStrings } from '../types';

type Props = { appState: AppState; setAppState: React.Dispatch<React.SetStateAction<AppState>>; strings: TranslationStrings };

export function SettingsScreen({ appState, setAppState, strings }: Props) {
  const [serverUrl, setServerUrl] = useState(appState.serverUrl);
  const [testing, setTesting] = useState(false);

  const saveServerUrl = () => setAppState((current) => ({ ...current, serverUrl: sanitizeUrl(serverUrl) }));

  const testConnection = async () => {
    const normalized = sanitizeUrl(serverUrl);
    if (!normalized) return Alert.alert(strings.noServerUrlTitle, strings.noServerUrlMessage);
    setTesting(true);
    try {
      const result = await fetchJson<{ models?: { name: string }[] }>(`${normalized}/api/tags`);
      setAppState((current) => ({ ...current, serverUrl: normalized, availableModels: result.models?.map((model) => model.name) ?? current.availableModels, lastConnectionState: 'success', lastConnectionMessage: strings.connectionSuccessful }));
      Alert.alert(strings.connectionSuccessful, `${strings.connectedTo} ${normalized}`);
    } catch (error: any) {
      setAppState((current) => ({ ...current, serverUrl: normalized, lastConnectionState: 'error', lastConnectionMessage: error?.message ?? strings.unknownError }));
      Alert.alert(strings.connectionFailed, error?.message ?? strings.unknownError);
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView style={styles.safeArea} contentContainerStyle={styles.settingsScrollContent}>
      <View style={styles.settingsCard}>
        <Text style={styles.heading}>{strings.settingsTitle}</Text>
        <Text style={[styles.label, styles.settingsLabelSpacing]}>{strings.ollamaServerUrl}</Text>
        <TextInput value={serverUrl} onChangeText={setServerUrl} style={styles.renameInput} placeholder={strings.ollamaServerUrl} />
        <View style={styles.buttonRow}>
          <Pressable style={[styles.primaryButton, styles.fullWidth]} onPress={saveServerUrl}><Text style={styles.primaryButtonText}>{strings.saveServerUrl}</Text></Pressable>
          <Pressable style={[styles.secondaryButton, styles.fullWidth, testing && styles.buttonDisabled]} onPress={testConnection} disabled={testing}><Text style={styles.secondaryButtonText}>{testing ? strings.testing : strings.testConnection}</Text></Pressable>
        </View>
      </View>
      <View style={styles.settingsCard}>
        <Text style={styles.heading}>{strings.modelsTitle}</Text>
        {appState.availableModels.length ? appState.availableModels.map((model) => <Text key={model} style={styles.modelListItem}>{model}</Text>) : <Text style={styles.emptyText}>{strings.noModelsFoundYet}</Text>}
      </View>
    </ScrollView>
  );
}
