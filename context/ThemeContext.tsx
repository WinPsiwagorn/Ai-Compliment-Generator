import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useColorScheme } from "react-native"

export type ThemeType = "light" | "dark" | "system"

interface ThemeColors {
  background: string
  card: string
  text: string
  border: string
  primary: string
  secondary: string
  accent: string
  muted: string
  success: string
  warning: string
  error: string
  info: string
  surface: string
  surfaceHighlight: string
}

interface ThemeContextType {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
  colors: ThemeColors
  isDark: boolean
}

const lightColors: ThemeColors = {
  background: "#FFF5F7",
  card: "#FFFFFF",
  text: "#333333",
  border: "#EEEEEE",
  primary: "#FF6B95",
  secondary: "#FFB3C6",
  accent: "#FF8FB1",
  muted: "#F8F8F8",
  success: "#4CAF50",
  warning: "#FFC107",
  error: "#F44336",
  info: "#2196F3",
  surface: "#FFFFFF",
  surfaceHighlight: "#FFF0F3",
}

const darkColors: ThemeColors = {
  background: "#1A1A1A",
  card: "#2A2A2A",
  text: "#F5F5F5",
  border: "#444444",
  primary: "#FF6B95",
  secondary: "#D35D7D",
  accent: "#FF8FB1",
  muted: "#333333",
  success: "#4CAF50",
  warning: "#FFC107",
  error: "#F44336",
  info: "#2196F3",
  surface: "#222222",
  surfaceHighlight: "#3A2A2E",
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme()
  const [theme, setTheme] = useState<ThemeType>("system")
  const [colors, setColors] = useState<ThemeColors>(systemColorScheme === "dark" ? darkColors : lightColors)

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme")
        if (savedTheme) {
          setTheme(savedTheme as ThemeType)
        }
      } catch (error) {
        console.error("Error loading theme:", error)
      }
    }

    loadTheme()
  }, [])

  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem("theme", theme)
      } catch (error) {
        console.error("Error saving theme:", error)
      }
    }

    saveTheme()
  }, [theme])

  useEffect(() => {
    if (theme === "light") {
      setColors(lightColors)
    } else if (theme === "dark") {
      setColors(darkColors)
    } else {
      // System theme
      setColors(systemColorScheme === "dark" ? darkColors : lightColors)
    }
  }, [theme, systemColorScheme])

  const isDark = theme === "dark" || (theme === "system" && systemColorScheme === "dark")

  return <ThemeContext.Provider value={{ theme, setTheme, colors, isDark }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
