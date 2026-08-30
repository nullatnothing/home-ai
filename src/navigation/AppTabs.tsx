import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { AppState } from "../hooks/useAppBootstrap";
import { TranslationStrings } from "../types";
import { HomeScreen } from "../screens/HomeScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export function AppTabs({
  appState,
  setAppState,
  strings,
}: {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  strings: TranslationStrings;
}) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: { backgroundColor: "#0F172A", borderTopWidth: 0 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={(route.name === "Home" ? "home" : "settings") as any}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home">
        {() => (
          <HomeScreen
            appState={appState}
            setAppState={setAppState}
            strings={strings}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Settings">
        {() => (
          <SettingsScreen
            appState={appState}
            setAppState={setAppState}
            strings={strings}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
