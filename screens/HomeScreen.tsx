"use client"

import React from "react"
import { useState, useRef, useEffect } from "react"
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Share,
  ScrollView,
  Alert,
  Dimensions,
  Easing,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Feather } from "@expo/vector-icons"
import { useCompliments } from "../context/ComplimentContext"
import { generateCompliment } from "../utils/complimentGenerator"
import { useTheme } from "../context/ThemeContext"
import { LinearGradient } from "expo-linear-gradient"
import * as Haptics from "expo-haptics"
import { useFocusEffect } from "@react-navigation/native"
import { BlurView } from "expo-blur"
import { PanGestureHandler, GestureHandlerStateChangeEvent, PanGestureHandlerGestureEvent, State } from "react-native-gesture-handler"
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg"
import LottieView from "lottie-react-native"

const { width, height } = Dimensions.get("window")
const CARD_HEIGHT = height * 0.45

export default function HomeScreen() {
  const navigation = useNavigation()
  const { complimentType, specificity, saveCompliment, workSafe, recipientName } = useCompliments()
  const { colors, isDark } = useTheme()
  const [compliment, setCompliment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const translateY = useRef(new Animated.Value(0)).current
  const confettiOpacity = useRef(new Animated.Value(0)).current
  const buttonScale = useRef(new Animated.Value(1)).current
  const buttonOpacity = useRef(new Animated.Value(1)).current
  const loadingProgress = useRef(new Animated.Value(0)).current
  const swipeThreshold = 100

  // Lottie animation ref
  const lottieRef = useRef<LottieView | null>(null)

  useFocusEffect(
    React.useCallback(() => {
      // Refresh the compliment when the screen comes into focus
      if (!compliment) {
        handleGenerateCompliment()
      }
      return () => {}
    }, []),
  )

  // Reset error state when parameters change
  useEffect(() => {
    setError(null)
    setRetryCount(0)
  }, [complimentType, specificity, workSafe])

  const animateButton = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(buttonScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }

  const playLottieAnimation = () => {
    if (lottieRef.current) {
      lottieRef.current.play();
    }
  }

  const handleGenerateCompliment = async () => {
    setLoading(true)
    setError(null)
    fadeAnim.setValue(0)
    scaleAnim.setValue(0.95)
    translateY.setValue(80)

    // Animate loading progress
    Animated.timing(loadingProgress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start()

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      const newCompliment = await generateCompliment(complimentType, specificity, recipientName, workSafe)
      setCompliment(newCompliment)
      setRetryCount(0)

      // Animate the new compliment - slower flying upward motion
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1500,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Show confetti after compliment appears
        setShowConfetti(true)
        Animated.timing(confettiOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          playLottieAnimation();

          // Hide confetti after animation
          setTimeout(() => {
            Animated.timing(confettiOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => setShowConfetti(false))
          }, 2500)
        })
      })
    } catch (error) {
      console.error("Error generating compliment:", error)
      setError("Couldn't connect to our compliment AI. Please check your connection and try again.")
      setRetryCount((prev) => prev + 1)

      // If we've failed multiple times, suggest using offline mode
      if (retryCount >= 2) {
        Alert.alert(
          "Connection Issues",
          "We're having trouble connecting to our AI. Would you like to use offline mode instead?",
          [
            { text: "Try Again", style: "cancel" },
            {
              text: "Use Offline Mode",
              onPress: async () => {
                try {
                  const offlineCompliment = await generateCompliment(
                    complimentType,
                    specificity,
                    recipientName,
                    workSafe,
                  )
                  setCompliment(offlineCompliment)
                  setError(null)

                  // Animate the new compliment - update this animation to match the one above
                  Animated.parallel([
                    Animated.timing(fadeAnim, {
                      toValue: 1,
                      duration: 800,
                      useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                      toValue: 1,
                      duration: 800,
                      useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                      toValue: 0,
                      duration: 1500,
                      easing: Easing.bezier(0.23, 1, 0.32, 1),
                      useNativeDriver: true,
                    }),
                  ]).start()
                } catch (err) {
                  setError("Something went wrong. Please try again later.")
                }
              },
            },
          ],
        )
      }
    } finally {
      setLoading(false)
      loadingProgress.setValue(0)
    }
  }

  const handleSaveCompliment = () => {
    if (compliment) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      saveCompliment(compliment)

      // Show success animation
      if (lottieRef.current) {
        setShowConfetti(true)
        Animated.timing(confettiOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          playLottieAnimation();

          // Hide confetti after animation
          setTimeout(() => {
            Animated.timing(confettiOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => setShowConfetti(false))
          }, 2500)
        })
      }

      Alert.alert("Success", "Compliment saved to favorites!")
    }
  }

  const handleShareCompliment = async () => {
    if (compliment) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        await Share.share({
          message: `${compliment}\n\n- Sent from Quirky Compliments app`,
        })
      } catch (error) {
        console.error("Error sharing compliment:", error)
        Alert.alert("Sharing Failed", "Unable to share the compliment. Please try again.")
      }
    }
  }

  const onGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }], {
    useNativeDriver: true,
  })

  const onHandlerStateChange = (event: GestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Check if swipe is past threshold
      const translationY = (event.nativeEvent as any).translationY as number;
      if (Math.abs(translationY) > swipeThreshold) {
        // Swiped down - generate new compliment
        if (translationY > 0) {
          Animated.spring(translateY, {
            toValue: height,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0)
            handleGenerateCompliment()
          })
        }
        // Swiped up - save compliment
        else {
          Animated.spring(translateY, {
            toValue: -height,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0)
            handleSaveCompliment()
          })
        }
      } else {
        // Return to original position if swipe isn't far enough
        Animated.spring(translateY, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }).start()
      }
    }
  }

  const getBackgroundPattern = () => {
    const patternColor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
    
    // Create the rectangle path string properly
    const rectPath = `M0,0 L${width},0 L${width},${height} L0,${height} Z`;

    return (
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={isDark ? "#FF6B95" : "#FF6B95"} stopOpacity="0.1" />
            <Stop offset="1" stopColor={isDark ? "#FF8FB1" : "#FF8FB1"} stopOpacity="0.05" />
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

  const renderLoadingState = () => {
    const progressWidth = loadingProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    })

    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
        <BlurView intensity={isDark ? 30 : 70} tint={isDark ? "dark" : "light"} style={styles.blurBackground} />
        <ActivityIndicator size={36} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Crafting something special...</Text>
        <View style={[styles.progressBarContainer, { backgroundColor: isDark ? "#333" : "#eee" }]}>
          <Animated.View style={[styles.progressBar, { backgroundColor: colors.primary, width: progressWidth }]} />
        </View>
      </View>
    )
  }

  const renderErrorState = () => (
    <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
      <BlurView intensity={isDark ? 30 : 70} tint={isDark ? "dark" : "light"} style={styles.blurBackground} />
      <Feather name="wifi-off" size={40} color={colors.primary} style={styles.errorIcon} />
      <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={handleGenerateCompliment}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  )

  const renderCompliment = () => (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      enabled={!loading && !error}
    >
      <Animated.View
        style={[
          styles.complimentBox,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY }
            ],
            backgroundColor: colors.card,
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          },
        ]}
      >
        <BlurView intensity={isDark ? 30 : 70} tint={isDark ? "dark" : "light"} style={styles.blurBackground} />
        <LinearGradient
          colors={
            isDark
              ? ["rgba(42, 42, 42, 0.8)", "rgba(51, 51, 51, 0.8)"]
              : ["rgba(255, 255, 255, 0.8)", "rgba(249, 249, 249, 0.8)"]
          }
          style={styles.complimentGradient}
        >
          <View style={styles.complimentContent}>
            <Text style={[styles.complimentText, { color: colors.text }]}>{compliment}</Text>
            <View style={styles.swipeIndicator}>
              <Feather name="chevrons-up" size={20} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
              <Text style={[styles.swipeText, { color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }]}>
                Swipe up to save
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </PanGestureHandler>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {getBackgroundPattern()}

      {showConfetti && (
        <Animated.View style={[styles.confettiContainer, { opacity: confettiOpacity }]}>
          <LottieView
            ref={lottieRef}
            source={require("../assets/confetti.json")}
            style={styles.confetti}
            autoPlay={false}
            loop={false}
          />
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.complimentContainer}>
          {loading ? renderLoadingState() : error ? renderErrorState() : renderCompliment()}
        </View>

        <View style={styles.buttonContainer}>
          <Animated.View
            style={{
              transform: [{ scale: buttonScale }],
              opacity: buttonOpacity,
            }}
          >
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                animateButton()
                handleGenerateCompliment()
              }}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FF6B95", "#FF8FB1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Generate New Compliment</Text>
                <Feather name="refresh-cw" size={18} color="white" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}
              onPress={handleSaveCompliment}
              disabled={!compliment || loading || !!error}
            >
              <BlurView intensity={isDark ? 20 : 60} tint={isDark ? "dark" : "light"} style={styles.blurBackground} />
              <Feather
                name="heart"
                size={24}
                color={!compliment || loading || !!error ? colors.muted : colors.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}
              onPress={handleShareCompliment}
              disabled={!compliment || loading || !!error}
            >
              <BlurView intensity={isDark ? 20 : 60} tint={isDark ? "dark" : "light"} style={styles.blurBackground} />
              <Feather
                name="share-2"
                size={24}
                color={!compliment || loading || !!error ? colors.muted : colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tipContainer}>
          <Text style={[styles.tipText, { color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }]}>
            Swipe down on a compliment to generate a new one
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  complimentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginVertical: 30,
  },
  complimentBox: {
    borderRadius: 24,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    width: "100%",
    height: CARD_HEIGHT,
    overflow: "hidden",
    borderWidth: 1,
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  complimentGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    borderRadius: 24,
  },
  complimentContent: {
    padding: 25,
    justifyContent: "space-between",
    height: "100%",
  },
  complimentText: {
    fontSize: 24,
    textAlign: "center",
    lineHeight: 36,
    fontWeight: "600",
    paddingHorizontal: 10,
  },
  swipeIndicator: {
    alignItems: "center",
    marginTop: 20,
  },
  swipeText: {
    fontSize: 12,
    marginTop: 5,
  },
  loadingContainer: {
    borderRadius: 24,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    width: "100%",
    height: CARD_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 30,
  },
  progressBarContainer: {
    width: "80%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  errorContainer: {
    borderRadius: 24,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    width: "100%",
    height: CARD_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  generateButton: {
    borderRadius: 30,
    marginBottom: 30,
    shadowColor: "#FF6B95",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tipContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  tipText: {
    fontSize: 14,
    textAlign: "center",
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    pointerEvents: "none",
  },
  confetti: {
    width: "100%",
    height: "100%",
  },
})
