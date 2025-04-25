import { useState } from "react"
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Share } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useCompliments } from "../context/ComplimentContext"
import { useTheme } from "../context/ThemeContext"
import * as Haptics from "expo-haptics"

export default function HistoryScreen() {
  const { complimentHistory, clearHistory, saveCompliment, categories } = useCompliments()
  const { colors } = useTheme()
  const [selectedCompliment, setSelectedCompliment] = useState<string | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  const handleShareCompliment = async (compliment: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await Share.share({
        message: `${compliment}\n\n- Sent from Quirky Compliments app`,
      })
    } catch (error) {
      console.error("Error sharing compliment:", error)
    }
  }

  const handleSaveWithCategory = async (category?: string) => {
    if (selectedCompliment) {
      saveCompliment(selectedCompliment, category)
      setSelectedCompliment(null)
      setShowCategoryModal(false)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert("Success", "Compliment saved to favorites!")
    }
  }

  const handleSave = async (compliment: string) => {
    setSelectedCompliment(compliment)
    if (categories.length > 0) {
      setShowCategoryModal(true)
    } else {
      saveCompliment(compliment)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert("Success", "Compliment saved to favorites!")
    }
  }

  const confirmClearHistory = () => {
    Alert.alert("Clear History", "Are you sure you want to clear your compliment history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          clearHistory()
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        },
      },
    ])
  }

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Feather name="clock" size={60} color={colors.secondary} style={styles.emptyIcon} />
      <Text style={[styles.emptyText, { color: colors.text }]}>No history yet</Text>
      <Text style={[styles.emptySubtext, { color: colors.text }]}>
        Generate some compliments and they'll appear here for easy access
      </Text>
    </View>
  )

  const renderComplimentItem = ({ item, index }: { item: string; index: number }) => (
    <View style={[styles.complimentItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.complimentText, { color: colors.text }]}>{item}</Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.muted }]}
          onPress={() => handleSave(item)}
        >
          <Feather name="heart" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.muted }]}
          onPress={() => handleShareCompliment(item)}
        >
          <Feather name="share-2" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {complimentHistory.length > 0 && (
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: colors.primary }]}
          onPress={confirmClearHistory}
        >
          <Feather name="trash-2" size={16} color="white" />
          <Text style={styles.clearButtonText}>Clear History</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={complimentHistory}
        renderItem={renderComplimentItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
      />

      {showCategoryModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select a Category</Text>

            <TouchableOpacity
              style={[styles.categoryOption, { backgroundColor: colors.muted }]}
              onPress={() => handleSaveWithCategory(undefined)}
            >
              <Text style={[styles.categoryOptionText, { color: colors.text }]}>No Category</Text>
            </TouchableOpacity>

            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryOption, { backgroundColor: colors.muted }]}
                onPress={() => handleSaveWithCategory(category)}
              >
                <Text style={[styles.categoryOptionText, { color: colors.text }]}>{category}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => {
                setSelectedCompliment(null)
                setShowCategoryModal(false)
              }}
            >
              <Text style={[styles.cancelButtonText, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 15,
  },
  clearButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 6,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 40,
    flexGrow: 1,
  },
  complimentItem: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  complimentText: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 100,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    width: "80%",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  categoryOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryOptionText: {
    fontSize: 16,
    textAlign: "center",
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
})
