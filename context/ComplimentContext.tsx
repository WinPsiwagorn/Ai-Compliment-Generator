import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

type ComplimentType = "animal" | "object" | "skill" | "random"
type SpecificityLevel = "low" | "medium" | "high"

interface SavedCompliment {
  id: string
  text: string
  date: string
  category?: string
}

interface ComplimentContextType {
  complimentType: ComplimentType
  setComplimentType: (type: ComplimentType) => void
  specificity: SpecificityLevel
  setSpecificity: (level: SpecificityLevel) => void
  workSafe: boolean
  setWorkSafe: (safe: boolean) => void
  recipientName: string
  setRecipientName: (name: string) => void
  savedCompliments: SavedCompliment[]
  saveCompliment: (compliment: string, category?: string) => void
  removeCompliment: (id: string) => void
  complimentHistory: string[]
  clearHistory: () => void
  categories: string[]
  addCategory: (category: string) => void
  removeCategory: (category: string) => void
}

const ComplimentContext = createContext<ComplimentContextType | undefined>(undefined)

export const ComplimentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [complimentType, setComplimentType] = useState<ComplimentType>("random")
  const [specificity, setSpecificity] = useState<SpecificityLevel>("medium")
  const [workSafe, setWorkSafe] = useState(true)
  const [recipientName, setRecipientName] = useState("")
  const [savedCompliments, setSavedCompliments] = useState<SavedCompliment[]>([])
  const [complimentHistory, setComplimentHistory] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>(["Funny", "Inspirational", "Clever", "Sweet"])

  // Load saved preferences and compliments from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedType = await AsyncStorage.getItem("complimentType")
        const storedSpecificity = await AsyncStorage.getItem("specificity")
        const storedWorkSafe = await AsyncStorage.getItem("workSafe")
        const storedRecipientName = await AsyncStorage.getItem("recipientName")
        const storedCompliments = await AsyncStorage.getItem("savedCompliments")
        const storedHistory = await AsyncStorage.getItem("complimentHistory")
        const storedCategories = await AsyncStorage.getItem("categories")

        if (storedType) setComplimentType(storedType as ComplimentType)
        if (storedSpecificity) setSpecificity(storedSpecificity as SpecificityLevel)
        if (storedWorkSafe) setWorkSafe(storedWorkSafe === "true")
        if (storedRecipientName) setRecipientName(storedRecipientName)
        if (storedCompliments) setSavedCompliments(JSON.parse(storedCompliments))
        if (storedHistory) setComplimentHistory(JSON.parse(storedHistory))
        if (storedCategories) setCategories(JSON.parse(storedCategories))
      } catch (error) {
        console.error("Error loading data from storage:", error)
      }
    }

    loadData()
  }, [])

  // Save preferences to storage when they change
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await AsyncStorage.setItem("complimentType", complimentType)
        await AsyncStorage.setItem("specificity", specificity)
        await AsyncStorage.setItem("workSafe", workSafe.toString())
        await AsyncStorage.setItem("recipientName", recipientName)
      } catch (error) {
        console.error("Error saving preferences to storage:", error)
      }
    }

    savePreferences()
  }, [complimentType, specificity, workSafe, recipientName])

  // Save compliments to storage when they change
  useEffect(() => {
    const saveCompliments = async () => {
      try {
        await AsyncStorage.setItem("savedCompliments", JSON.stringify(savedCompliments))
      } catch (error) {
        console.error("Error saving compliments to storage:", error)
      }
    }

    saveCompliments()
  }, [savedCompliments])

  const saveCompliment = async (compliment: string, category?: string) => {
    const newCompliment: SavedCompliment = {
      id: Date.now().toString(),
      text: compliment,
      date: new Date().toISOString(),
      category,
    }

    // Add to history as well
    if (!complimentHistory.includes(compliment)) {
      const newHistory = [compliment, ...complimentHistory].slice(0, 50) // Keep last 50
      setComplimentHistory(newHistory)
      await AsyncStorage.setItem("complimentHistory", JSON.stringify(newHistory))
    }

    setSavedCompliments([newCompliment, ...savedCompliments])
  }

  const removeCompliment = (id: string) => {
    setSavedCompliments(savedCompliments.filter((c) => c.id !== id))
  }

  const clearHistory = async () => {
    setComplimentHistory([])
    await AsyncStorage.removeItem("complimentHistory")
  }

  const addCategory = async (category: string) => {
    if (!categories.includes(category)) {
      const newCategories = [...categories, category]
      setCategories(newCategories)
      await AsyncStorage.setItem("categories", JSON.stringify(newCategories))
    }
  }

  const removeCategory = async (category: string) => {
    const newCategories = categories.filter((c) => c !== category)
    setCategories(newCategories)
    await AsyncStorage.setItem("categories", JSON.stringify(newCategories))
  }

  return (
    <ComplimentContext.Provider
      value={{
        complimentType,
        setComplimentType,
        specificity,
        setSpecificity,
        workSafe,
        setWorkSafe,
        recipientName,
        setRecipientName,
        savedCompliments,
        saveCompliment,
        removeCompliment,
        complimentHistory,
        clearHistory,
        categories,
        addCategory,
        removeCategory,
      }}
    >
      {children}
    </ComplimentContext.Provider>
  )
}

export const useCompliments = () => {
  const context = useContext(ComplimentContext)
  if (context === undefined) {
    throw new Error("useCompliments must be used within a ComplimentProvider")
  }
  return context
}
