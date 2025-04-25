"use client"

import { useState, useRef, useEffect } from "react"
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Share,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  Easing,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useCompliments } from "../context/ComplimentContext"
import { useTheme } from "../context/ThemeContext"
import * as Haptics from "expo-haptics"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler"
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg"

const { width, height } = Dimensions.get("window")

// Define a type for the compliment object
interface Compliment {
  id: string;
  text: string;
  category?: string;
  date: string;
}

export default function SavedComplimentsScreen() {
  const { savedCompliments, removeCompliment, categories } = useCompliments()
  const { colors, isDark } = useTheme()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map())
  const animationValues = useRef(new Map<string, Animated.Value>()).current
  const floatAnimations = useRef(new Map<string, Animated.Value>()).current

  const filteredCompliments = selectedCategory
    ? savedCompliments.filter((c) => c.category === selectedCategory)
    : savedCompliments

  const handleShareCompliment = async (compliment: Compliment) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await Share.share({
        message: `${compliment.text}\n\n- Sent from Quirky Compliments app`,
      })
    } catch (error) {
      console.error("Error sharing compliment:", error)
    }
  }

  const confirmDelete = (id: string) => {
    Alert.alert("Delete Compliment", "Are you sure you want to delete this saved compliment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          removeCompliment(id)
        },
      },
    ])
  }

  const getBackgroundPattern = () => {
    const patternColor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
    
    // Create the rectangle path string properly
    const rectPath = `M0,0 L${width},0 L${width},${height} L0,${height} Z`;

    return (
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={isDark ? "#FF6B95" : "#FF6B95"} stopOpacity="0.05" />
            <Stop offset="1" stopColor={isDark ? "#FF8FB1" : "#FF8FB1"} stopOpacity="0.02" />
          </SvgGradient>
        </Defs>
        <Path d={rectPath} fill="url(#grad)" opacity="0.5" />
        {Array.from({ length: 10 }).map((_, i) => {
          // Create each path string separately
          const x1 = Math.random() * width;
          const y1 = Math.random() * height;
          const x2 = Math.random() * width;
          const y2 = Math.random() * height;
          const x3 = Math.random() * width;
          const y3 = Math.random() * height;
          const curvePath = `M${x1},${y1} Q${x2},${y2} ${x3},${y3}`;
          
          return (
            <Path
              key={i}
              d={curvePath}
              stroke={patternColor}
              strokeWidth="1"
              fill="none"
            />
          );
        })}
      </Svg>
    )
  }

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Feather name="heart" size={60} color={colors.secondary} style={styles.emptyIcon} />
      <Text style={[styles.emptyText, { color: colors.text }]}>
        {selectedCategory ? `No compliments in "${selectedCategory}" category` : "No saved compliments yet"}
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.text }]}>
        {selectedCategory
          ? "Try saving some compliments with this category"
          : "When you find a compliment you love, tap the heart icon to save it here!"}
      </Text>
    </View>
  )

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, id: string) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: "clamp",
    })

    return (
      <View style={styles.rightActions}>
        <Animated.View
          style={[
            styles.actionButton,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={() => {
              swipeableRefs.current.get(id)?.close()
              confirmDelete(id)
            }}
          >
            <Feather name="trash-2" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    )
  }

  const renderComplimentItem = ({ item, index }: { item: Compliment; index: number }) => {
    if (!animationValues.has(item.id)) {
      animationValues.set(item.id, new Animated.Value(0))
    }
    
    if (!floatAnimations.has(item.id)) {
      floatAnimations.set(item.id, new Animated.Value(0))
    }
    
    const fadeAnim = animationValues.get(item.id) as Animated.Value
    const floatAnim = floatAnimations.get(item.id) as Animated.Value

    return (
      <Animated.View
        style={{
          transform: [
            {
              translateY: Animated.add(
                // Initial entrance animation
                fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
                // Continuous floating animation
                floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8],
                })
              ),
            },
          ],
          opacity: fadeAnim,
        }}
      >
        <Swipeable
          ref={(ref) => {
            if (ref) swipeableRefs.current.set(item.id, ref)
          }}
          renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
          friction={2}
          rightThreshold={40}
        >
          <View style={[styles.complimentItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <BlurView intensity={isDark ? 30 : 70} tint={isDark ? "dark" : "light"} style={styles.blurBackground} />
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(42, 42, 42, 0.8)", "rgba(51, 51, 51, 0.8)"]
                  : ["rgba(255, 255, 255, 0.8)", "rgba(249, 249, 249, 0.8)"]
              }
              style={styles.complimentGradient}
            >
              <Text style={[styles.complimentText, { color: colors.text }]}>{item.text}</Text>

              {item.category && (
                <View style={[styles.categoryTag, { backgroundColor: colors.primary }]}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" },
                  ]}
                  onPress={() => handleShareCompliment(item)}
                >
                  <BlurView
                    intensity={isDark ? 20 : 60}
                    tint={isDark ? "dark" : "light"}
                    style={styles.blurBackground}
                  />
                  <Feather name="share-2" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Swipeable>
      </Animated.View>
    )
  }

  // Initial entrance animation effect
  useEffect(() => {
    filteredCompliments.forEach((compliment, index) => {
      if (!animationValues.has(compliment.id)) {
        animationValues.set(compliment.id, new Animated.Value(0))
      }
      const fadeAnim = animationValues.get(compliment.id) as Animated.Value
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: index * 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start()
    })
  }, [filteredCompliments])

  // Continuous floating animation effect
  useEffect(() => {
    filteredCompliments.forEach((compliment) => {
      if (!floatAnimations.has(compliment.id)) {
        floatAnimations.set(compliment.id, new Animated.Value(0))
      }
      
      const floatAnim = floatAnimations.get(compliment.id) as Animated.Value
      
      // Create continuous floating animation
      const startFloatingAnimation = () => {
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          })
        ]).start(() => startFloatingAnimation())
      }
      
      startFloatingAnimation()
    })
    
    // Clean up animations when component unmounts
    return () => {
      filteredCompliments.forEach((compliment) => {
        const floatAnim = floatAnimations.get(compliment.id)
        if (floatAnim) {
          floatAnim.stopAnimation()
        }
      })
    }
  }, [filteredCompliments])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {getBackgroundPattern()}

      <View style={styles.categoriesWrapper}>
        <BlurView intensity={isDark ? 30 : 70} tint={isDark ? "dark" : "light"} style={styles.categoriesBlur}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === null && {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                  elevation: 5,
                },
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === null && { color: "white" }]}>All</Text>
            </TouchableOpacity>

            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                    elevation: 5,
                  },
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.categoryButtonText, selectedCategory === category && { color: "white" }]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BlurView>
      </View>

      <FlatList
        data={filteredCompliments}
        renderItem={renderComplimentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.swipeHintContainer}>
        <Text style={[styles.swipeHint, { color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }]}>
          Swipe left on a compliment to delete
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoriesWrapper: {
    height: 70,
    marginTop: 10,
    zIndex: 10,
  },
  categoriesBlur: {
    borderRadius: 20,
    overflow: "hidden",
    margin: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  categoriesContent: {
    paddingHorizontal: 10,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  categoryButtonText: {
    fontWeight: "600",
    fontSize: 14,
    color: "#666",
  },
  listContainer: {
    padding: 15,
    paddingBottom: 40,
    flexGrow: 1,
  },
  complimentItem: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    overflow: "hidden",
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  complimentGradient: {
    padding: 20,
  },
  complimentText: {
    fontSize: 18,
    marginBottom: 20,
    lineHeight: 28,
  },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 15,
  },
  categoryText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  rightActions: {
    width: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  deleteButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  swipeHintContainer: {
    alignItems: "center",
    paddingVertical: 15,
  },
  swipeHint: {
    fontSize: 14,
  },
})
