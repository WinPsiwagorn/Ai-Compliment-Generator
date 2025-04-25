"use client"

import { useState } from "react"
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Switch, ScrollView, Alert } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useCompliments } from "../context/ComplimentContext"
import { useTheme } from "../context/ThemeContext"
import * as Haptics from "expo-haptics"
import { clearComplimentCache, getComplimentStats } from "../utils/complimentGenerator"

const complimentTypes = [
  { id: "animal", label: "Animal Comparisons" },
  { id: "object", label: "Object Analogies" },
  { id: "skill", label: "Skill Observations" },
  { id: "random", label: "Completely Random" },
]

const specificityLevels = [
  { id: "low", label: "Mildly Specific" },
  { id: "medium", label: "Quite Specific" },
  { id: "high", label: "Extremely Specific" },
]

export default function SettingsScreen() {
  const {
    complimentType,
    setComplimentType,
    specificity,
    setSpecificity,
    workSafe,
    setWorkSafe,
    recipientName,
    setRecipientName,
    categories,
    addCategory,
    removeCategory,
  } = useCompliments()
  const { theme, setTheme, colors, isDark } = useTheme()
  const [newCategory, setNewCategory] = useState("")
  const [cacheStats, setCacheStats] = useState({ cachedTypes: 0, totalCachedCompliments: 0 })
  const [showingStats, setShowingStats] = useState(false)

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory.trim())
      setNewCategory("")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  const confirmDeleteCategory = (category) => {
    Alert.alert("Delete Category", `Are you sure you want to delete "${category}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeCategory(category)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        },
      },
    ])
  }

  const handleClearCache = () => {
    Alert.alert(
      "Clear AI Cache",
      "This will clear all cached compliments. The app will need to generate new compliments from the AI. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Cache",
          style: "destructive",
          onPress: async () => {
            await clearComplimentCache()
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            Alert.alert("Success", "Compliment cache has been cleared.")
            setCacheStats({ cachedTypes: 0, totalCachedCompliments: 0 })
          },
        },
      ],
    )
  }

  const showCacheStats = async () => {
    try {
      const stats = await getComplimentStats()
      setCacheStats(stats)
      setShowingStats(true)
    } catch (error) {
      console.error("Error getting cache stats:", error)
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
        <Text style={[styles.sectionDescription, { color: colors.text }]}>Choose your preferred app appearance</Text>

        <TouchableOpacity
          style={[
            styles.optionButton,
            theme === "light" && styles.selectedOption,
            { backgroundColor: theme === "light" ? colors.primary : colors.muted },
          ]}
          onPress={() => setTheme("light")}
        >
          <Text
            style={[
              styles.optionText,
              theme === "light" && styles.selectedOptionText,
              { color: theme === "light" ? "white" : colors.text },
            ]}
          >
            Light
          </Text>
          {theme === "light" && <Feather name="check" size={20} color="white" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            theme === "dark" && styles.selectedOption,
            { backgroundColor: theme === "dark" ? colors.primary : colors.muted },
          ]}
          onPress={() => setTheme("dark")}
        >
          <Text
            style={[
              styles.optionText,
              theme === "dark" && styles.selectedOptionText,
              { color: theme === "dark" ? "white" : colors.text },
            ]}
          >
            Dark
          </Text>
          {theme === "dark" && <Feather name="check" size={20} color="white" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            theme === "system" && styles.selectedOption,
            { backgroundColor: theme === "system" ? colors.primary : colors.muted },
          ]}
          onPress={() => setTheme("system")}
        >
          <Text
            style={[
              styles.optionText,
              theme === "system" && styles.selectedOptionText,
              { color: theme === "system" ? "white" : colors.text },
            ]}
          >
            System Default
          </Text>
          {theme === "system" && <Feather name="check" size={20} color="white" />}
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Compliment Style</Text>
        <Text style={[styles.sectionDescription, { color: colors.text }]}>
          Choose what kind of quirky compliments you'd like to generate
        </Text>

        {complimentTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.optionButton,
              complimentType === type.id && styles.selectedOption,
              { backgroundColor: complimentType === type.id ? colors.primary : colors.muted },
            ]}
            onPress={() => setComplimentType(type.id)}
          >
            <Text
              style={[
                styles.optionText,
                complimentType === type.id && styles.selectedOptionText,
                { color: complimentType === type.id ? "white" : colors.text },
              ]}
            >
              {type.label}
            </Text>
            {complimentType === type.id && <Feather name="check" size={20} color="white" />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Specificity Level</Text>
        <Text style={[styles.sectionDescription, { color: colors.text }]}>
          How oddly specific should your compliments be?
        </Text>

        {specificityLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.optionButton,
              specificity === level.id && styles.selectedOption,
              { backgroundColor: specificity === level.id ? colors.primary : colors.muted },
            ]}
            onPress={() => setSpecificity(level.id)}
          >
            <Text
              style={[
                styles.optionText,
                specificity === level.id && styles.selectedOptionText,
                { color: specificity === level.id ? "white" : colors.text },
              ]}
            >
              {level.label}
            </Text>
            {specificity === level.id && <Feather name="check" size={20} color="white" />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Personalization</Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Recipient's Name (Optional)</Text>
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.muted, color: colors.text, borderColor: colors.border },
            ]}
            value={recipientName}
            onChangeText={setRecipientName}
            placeholder="Enter name"
            placeholderTextColor={isDark ? "#999" : "#777"}
          />
          <Text style={[styles.inputDescription, { color: colors.text }]}>
            Personalizes compliments with the recipient's name
          </Text>
        </View>

        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>Work-Safe Mode</Text>
          <Switch
            trackColor={{ false: "#ccc", true: colors.secondary }}
            thumbColor={workSafe ? colors.primary : "#f4f3f4"}
            ios_backgroundColor="#ccc"
            onValueChange={() => setWorkSafe(!workSafe)}
            value={workSafe}
          />
        </View>
        <Text style={[styles.switchDescription, { color: colors.text }]}>
          Ensures all compliments are appropriate for professional settings
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
        <Text style={[styles.sectionDescription, { color: colors.text }]}>
          Manage categories for organizing your saved compliments
        </Text>

        <View style={styles.categoryInputContainer}>
          <TextInput
            style={[
              styles.categoryInput,
              { backgroundColor: colors.muted, color: colors.text, borderColor: colors.border },
            ]}
            value={newCategory}
            onChangeText={setNewCategory}
            placeholder="Add new category"
            placeholderTextColor={isDark ? "#999" : "#777"}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddCategory}
            disabled={!newCategory.trim()}
          >
            <Feather name="plus" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesList}>
          {categories.map((category) => (
            <View key={category} style={[styles.categoryItem, { backgroundColor: colors.muted }]}>
              <Text style={[styles.categoryItemText, { color: colors.text }]}>{category}</Text>
              <TouchableOpacity onPress={() => confirmDeleteCategory(category)}>
                <Feather name="x" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>AI & Performance</Text>
        <Text style={[styles.sectionDescription, { color: colors.text }]}>
          Manage AI-generated compliment cache and performance settings
        </Text>

        {showingStats && (
          <View style={[styles.statsContainer, { backgroundColor: colors.muted }]}>
            <Text style={[styles.statsText, { color: colors.text }]}>
              Cached compliment types: {cacheStats.cachedTypes}
            </Text>
            <Text style={[styles.statsText, { color: colors.text }]}>
              Total cached compliments: {cacheStats.totalCachedCompliments}
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={showCacheStats}>
            <Feather name="info" size={16} color="white" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Cache Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleClearCache}
          >
            <Feather name="trash-2" size={16} color="white" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 15,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: "#FF8FB1",
  },
  optionText: {
    fontSize: 16,
  },
  selectedOptionText: {
    color: "white",
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputDescription: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.7,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  switchLabel: {
    fontSize: 16,
  },
  switchDescription: {
    fontSize: 14,
    marginTop: 5,
  },
  categoryInputContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  categoryInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryItemText: {
    marginRight: 8,
    fontSize: 14,
  },
  statsContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  statsText: {
    fontSize: 14,
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 0.48,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
  },
})
