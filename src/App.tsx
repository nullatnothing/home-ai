import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppDialog } from './components/AppDialog';
import { AppTabs } from './navigation/AppTabs';
import { useAppBootstrap } from './hooks/useAppBootstrap';
import { styles } from './theme/styles';

export default function App() {
  const { isHydrated, dialog, dismissDialog, strings, appState, setAppState } = useAppBootstrap();

  if (!isHydrated) {
    return (
      <SafeAreaProvider>
        <SafeAreaView edges={['top', 'bottom']} style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{strings.loading}</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <StatusBar style="dark" />
        <SafeAreaView edges={['top', 'bottom']} style={styles.appShell}>
          <NavigationContainer>
            <AppTabs appState={appState} setAppState={setAppState} strings={strings} />
          </NavigationContainer>
        </SafeAreaView>
        <AppDialog dialog={dialog} strings={strings} onDismiss={dismissDialog} />
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
