"use client"

import { NavigationContainer, NavigationProp, RouteProp } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import HomeScreen from "./screens/HomeScreen"
import SettingsScreen from "./screens/SettingsScreen"
import SavedComplimentsScreen from "./screens/SavedComplimentsScreen"
import HistoryScreen from "./screens/HistoryScreen"
import { ComplimentProvider } from "./context/ComplimentContext"
import { Feather } from "@expo/vector-icons"
import { StyleSheet, Platform } from "react-native"
import { ThemeProvider, useTheme } from "./context/ThemeContext"
import { GestureHandlerRootView } from "react-native-gesture-handler"

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function HomeTabs() {
  const { colors, isDark } = useTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Use a simple header
        headerStyle: {
          backgroundColor: colors.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
        },
        // Use the default tab bar with minimal customization and explicit numeric values
        tabBarStyle: {
          backgroundColor: isDark ? '#222' : '#fff',
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          elevation: 0,
          shadowOpacity: 0,
          height: 60, // explicit numeric value
          paddingBottom: 8, // explicit numeric value
          paddingTop: 8, // explicit numeric value
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? '#999' : '#777',
        // Use explicit numeric size
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarIconStyle: {
          width: 24,
          height: 24,
        },
        tabBarIcon: ({ focused, color }) => {
          // Use explicit numeric size
          const iconSize = 24;
          let iconName;
          
          if (route.name === 'HomeTab') {
            iconName = 'star';
          } else if (route.name === 'SavedTab') {
            iconName = 'heart';
          } else if (route.name === 'HistoryTab') {
            iconName = 'clock';
          } else if (route.name === 'SettingsTab') {
            iconName = 'settings';
          } else {
            iconName = 'circle';
          }
          
          return <Feather name={iconName} size={iconSize} color={color} />;
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
  )
}

// No styles needed anymore with the simplified implementation
