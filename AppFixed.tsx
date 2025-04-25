import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ComplimentProvider } from "./context/ComplimentContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Import screens
import HomeScreen from "./screens/HomeScreen";
import SavedComplimentsScreen from "./screens/SavedComplimentsScreen";
import HistoryScreen from "./screens/HistoryScreen";
import SettingsScreen from "./screens/SettingsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Simplified bottom tab navigator
function HomeTabs() {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: colors.card,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: "700",
        },
        tabBarStyle: {
          backgroundColor: isDark ? "#222" : "#fff",
          borderTopWidth: 1,
          borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? "#999" : "#777",
        tabBarIcon: ({ color, size }) => {
          let iconName;
          
          if (route.name === "HomeTab") {
            iconName = "star";
          } else if (route.name === "SavedTab") {
            iconName = "heart";
          } else if (route.name === "HistoryTab") {
            iconName = "clock";
          } else if (route.name === "SettingsTab") {
            iconName = "settings";
          } else {
            iconName = "circle";
          }
          
          return <Feather name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: "Quirky Compliments",
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="SavedTab"
        component={SavedComplimentsScreen}
        options={{
          title: "My Favorites",
          tabBarLabel: "Saved",
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          title: "History",
          tabBarLabel: "History",
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: "Customize",
          tabBarLabel: "Settings",
        }}
      />
    </Tab.Navigator>
  );
}

// Main App component
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ComplimentProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Main" component={HomeTabs} />
            </Stack.Navigator>
          </NavigationContainer>
        </ComplimentProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
} 