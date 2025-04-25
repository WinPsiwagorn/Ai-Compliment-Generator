// import { generateText } from "ai"
// import { openai } from "@ai-sdk/openai"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Cache structure to store previously generated compliments
interface ComplimentCache {
  [key: string]: {
    compliments: string[]
    timestamp: number
  }
}

// Track recently shown compliments to avoid repetition
interface RecentCompliments {
  compliments: string[]
  maxSize: number
}

// Type definitions for parameters
export type ComplimentType = "random" | "animal" | "object" | "skill"
export type SpecificityLevel = "low" | "medium" | "high"

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000

// Keep track of recently shown compliments (in-memory)
const recentComplimentsHistory: RecentCompliments = {
  compliments: [],
  maxSize: 5 // Don't repeat within 5 compliments
}

/**
 * Generate a personalized compliment using local fallbacks
 * @param type The type of compliment to generate
 * @param specificity How specific the compliment should be
 * @param recipientName Optional name of the recipient
 * @param workSafe Whether to ensure the compliment is work-appropriate
 * @returns A promise that resolves to a compliment string
 */
export const generateCompliment = async (
  type: ComplimentType = "random",
  specificity: SpecificityLevel = "medium",
  recipientName?: string,
  workSafe = true,
): Promise<string> => {
  // Create a cache key based on the parameters
  const cacheKey = `${type}-${specificity}-${workSafe ? "safe" : "any"}`

  try {
    // Try to get compliments from cache first
    const cachedCompliments = await getCachedCompliments(cacheKey)
    
    // Get available compliments that haven't been shown recently
    let availableCompliments: string[] = []
    
    if (cachedCompliments && cachedCompliments.length > 0) {
      // Filter out recently shown compliments from the cached ones
      availableCompliments = cachedCompliments.filter(
        compliment => !recentComplimentsHistory.compliments.includes(compliment)
      )
      
      // If we've filtered out too many and have few options left, just use the full cache
      if (availableCompliments.length < 3 && cachedCompliments.length > 5) {
        availableCompliments = cachedCompliments
      }
    }
    
    let compliment: string
    
    if (availableCompliments.length > 0) {
      // Return a random compliment from the available ones
      const randomIndex = Math.floor(Math.random() * availableCompliments.length)
      compliment = personalizeCompliment(availableCompliments[randomIndex], recipientName)
    } else {
      // If no suitable cache or all cached compliments were recently shown, generate a new one
      compliment = getFallbackCompliment(type, specificity, recipientName)
      
      // Make sure we don't give the same one we just showed recently
      let attempts = 0
      const maxAttempts = 5
      
      while (recentComplimentsHistory.compliments.includes(compliment) && attempts < maxAttempts) {
        compliment = getFallbackCompliment(type, specificity, recipientName)
        attempts++
      }
      
      // Add the new compliment to the cache
      await addComplimentToCache(cacheKey, compliment)
    }
    
    // Add to recently shown compliments
    addToRecentHistory(compliment)

    // Return the personalized compliment
    return compliment
  } catch (error) {
    console.error("Error generating compliment:", error)

    // Fallback to predefined compliments if anything fails
    const compliment = getFallbackCompliment(type, specificity, recipientName)
    addToRecentHistory(compliment)
    return compliment
  }
}

/**
 * Add a compliment to the recently shown history
 */
const addToRecentHistory = (compliment: string): void => {
  // Add the new compliment to the front of the array
  recentComplimentsHistory.compliments.unshift(compliment)
  
  // If we've exceeded the max size, remove the oldest one
  if (recentComplimentsHistory.compliments.length > recentComplimentsHistory.maxSize) {
    recentComplimentsHistory.compliments.pop()
  }
}

// We've completely removed the AI-based generation and will only use local fallbacks

/**
 * Personalize a compliment with the recipient's name if provided
 */
const personalizeCompliment = (compliment: string, recipientName?: string): string => {
  if (!recipientName) return compliment

  // If the compliment starts with "You", replace it with the recipient's name
  if (compliment.startsWith("You")) {
    return `${recipientName} ${compliment.substring(3).trim()}`
  }

  // If the compliment contains "your", try to replace some instances with "[name]'s"
  if (compliment.includes("your")) {
    // Only replace the first instance to avoid awkward phrasing
    return compliment.replace("your", `${recipientName}'s`)
  }

  // Otherwise, just prepend the name
  return `${recipientName}, ${compliment.charAt(0).toLowerCase()}${compliment.slice(1)}`
}

/**
 * Get cached compliments for a specific type and specificity
 */
const getCachedCompliments = async (cacheKey: string): Promise<string[] | null> => {
  try {
    const cacheData = await AsyncStorage.getItem("complimentCache")
    if (!cacheData) return null

    const cache: ComplimentCache = JSON.parse(cacheData)
    const cachedEntry = cache[cacheKey]

    // Check if cache exists and hasn't expired
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_EXPIRATION) {
      return cachedEntry.compliments
    }

    return null
  } catch (error) {
    console.error("Error retrieving from cache:", error)
    return null
  }
}

/**
 * Add a new compliment to the cache
 */
const addComplimentToCache = async (cacheKey: string, compliment: string): Promise<void> => {
  try {
    // Get existing cache
    const cacheData = await AsyncStorage.getItem("complimentCache")
    const cache: ComplimentCache = cacheData ? JSON.parse(cacheData) : {}

    // Update or create cache entry
    if (!cache[cacheKey]) {
      cache[cacheKey] = {
        compliments: [],
        timestamp: Date.now(),
      }
    }

    // Add new compliment if it doesn't already exist
    if (!cache[cacheKey].compliments.includes(compliment)) {
      cache[cacheKey].compliments.push(compliment)

      // Limit cache size to 20 compliments per type
      if (cache[cacheKey].compliments.length > 20) {
        cache[cacheKey].compliments.shift()
      }

      // Update timestamp
      cache[cacheKey].timestamp = Date.now()
    }

    // Save updated cache
    await AsyncStorage.setItem("complimentCache", JSON.stringify(cache))
  } catch (error) {
    console.error("Error adding to cache:", error)
  }
}

/**
 * Get a fallback compliment
 */
const getFallbackCompliment = (type: ComplimentType, specificity: SpecificityLevel, recipientName?: string): string => {
  // Expanded set of predefined compliments
  const compliments = {
    animal: [
      "Your smile is like a dolphin's - it somehow makes everyone around you happier.",
      "You have the determination of a honey badger trying to get the last drop of honey.",
      "Your laugh is like a penguin's waddle - unexpectedly delightful and impossible not to love.",
      "Your energy reminds me of a hummingbird - vibrant, quick, and somehow defying the laws of physics.",
      "Your loyalty is like that of an elephant - deep, unwavering, and something people talk about for generations.",
      "Your creativity flows like an octopus changing colors - fluid, surprising, and captivating to watch.",
      "Your adaptability is like a chameleon's - seamless, impressive, and always perfectly suited to the situation.",
      "Your problem-solving skills are like a crow using tools - unexpectedly sophisticated and worthy of scientific study.",
      "You're as tenacious as a terrier with a new toy - persistent, focused, and adorably determined.",
      "Your memory is like an elephant's - impressive, reliable, and sometimes surprising even to yourself.",
      "Your resilience is like a tardigrade - able to survive incredible challenges while staying remarkably cheerful.",
      "Your presence is like a therapy dog - somehow making everyone feel better just by being there.",
    ],
    object: [
      "Your creativity is like a Swiss Army knife that somehow also includes a cappuccino maker.",
      "Your problem-solving skills are like a vintage calculator - reliable, impressive, and somehow cooler than the newer models.",
      "Your style is like that perfect corner piece in a jigsaw puzzle - distinctive and exactly where it needs to be.",
      "Your ideas are like those fancy Japanese pencils everyone covets but nobody actually buys.",
      "Your presence in a room is like finding an Easter egg in a video game - unexpected and delightful.",
      "Your attention to detail is like a perfectly aligned bookshelf - satisfying in ways that most people wouldn't even notice.",
      "Your thoughtfulness is like finding the perfect playlist already made for the exact mood you're in.",
      "Your reliability is like that one pen that never runs out of ink, even though you've had it for years.",
      "Your mind works like a Rubik's cube solver - handling complexity with fascinating precision.",
      "Your ability to focus is like noise-canceling headphones in a busy coffee shop.",
      "Your organization skills are like a perfectly packed suitcase where everything fits just right.",
      "Your laughter is like finding the perfect meme at exactly the right moment.",
    ],
    skill: [
      "The way you remember song lyrics is like having a musical library card catalog in your brain.",
      "Your ability to parallel park would make a NASA engineer jealous of your spatial awareness.",
      "The way you explain complex topics makes Wikipedia entries look unnecessarily verbose.",
      "Your talent for finding the perfect GIF for any situation should be studied by communication experts.",
      "The way you can identify any song within three seconds would put Shazam out of business.",
      "Your knack for remembering people's coffee orders makes baristas question their career choices.",
      "Your ability to find the perfect word is like having a thesaurus that also knows the exact emotional context needed.",
      "The way you navigate social situations is like watching a master chess player who's thinking ten moves ahead.",
      "Your knack for finding shortcuts in apps that even the developers forgot about is eerily impressive.",
      "Your gift for remembering obscure trivia would make you the ultimate phone-a-friend lifeline.",
      "Your talent for perfectly timing jokes in conversation should be studied by comedians.",
      "The way you can eyeball measurements while cooking puts measuring cups to shame.",
    ],
    random: [
      "Your enthusiasm is like finding an extra french fry at the bottom of the bag - unexpected and delightful.",
      "Your sense of humor is like finding the perfect avocado - rare, precious, and worth celebrating.",
      "Your kindness is like a phone that never needs charging - reliable, powerful, and always there when needed.",
      "Your taste in music is like a perfectly curated playlist that somehow knows exactly what mood I'm in.",
      "Your cooking skills are like that one local restaurant that never advertises but always has a line out the door.",
      "Your text messages are like those rare YouTube videos with zero ads - refreshing and worth waiting for.",
      "Your fashion sense is like the perfect amount of hot sauce - bold enough to be noticed, but never overwhelming.",
      "Your advice is like finding money in an old jacket pocket - unexpected, valuable, and exactly what I needed.",
      "Your perspective is like that one documentary that completely changes how you see the world.",
      "Your organization skills are like the satisfaction of watching those videos where they power-wash dirty surfaces.",
      "Your imagination is like a Swiss Army knife with tools nobody knew existed but everyone suddenly needs.",
      "Your dedication is like those people who build elaborate domino patterns - meticulous, patient, and impressive to witness.",
      "Your unique perspective is like finding a hidden track on your favorite album - unexpected and instantly valuable.",
      "Your voice is like the perfect podcast host - engaging enough that I could listen to you explain anything.",
      "Your way of thinking is like those satisfying cooking videos where everything is precisely measured and perfectly timed.",
      "Your conversation skills are like finding a TV show with zero bad episodes - consistently excellent.",
    ],
  }

  // Add specificity modifier based on the specificity level
  const specificityModifiers: { [key in SpecificityLevel]: string[] } = {
    low: [
      "quite nice",
      "rather pleasant",
      "generally impressive",
      "noticeably good",
      "rather charming",
      "decidedly pleasant"
    ],
    medium: [
      "remarkably impressive",
      "distinctly unique",
      "particularly fascinating",
      "wonderfully distinctive",
      "genuinely outstanding"
    ],
    high: [
      "extraordinarily exceptional",
      "mind-blowingly impressive",
      "absolutely unparalleled",
      "genuinely world-class",
      "profoundly awe-inspiring"
    ]
  };

  // Get compliments for the specified type, or random if type not found
  const complimentsList = compliments[type] || compliments.random;

  // Get a random compliment
  const randomIndex = Math.floor(Math.random() * complimentsList.length);
  const baseCompliment = complimentsList[randomIndex];
  
  // For medium and high specificity, we can add some modifier phrases
  if (specificity !== "low") {
    const modifiers = specificityModifiers[specificity];
    const randomModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    
    // Insert the modifier if it makes sense
    if (Math.random() > 0.5 && !baseCompliment.includes(" like ")) {
      // Create a more specific version by adding the modifier
      const enhancedCompliment = baseCompliment.replace(/is|are/, `is ${randomModifier}`);
      return personalizeCompliment(enhancedCompliment, recipientName);
    }
  }

  // Personalize the compliment if a recipient name is provided
  return personalizeCompliment(baseCompliment, recipientName);
}

/**
 * Clear the compliment cache
 */
export const clearComplimentCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("complimentCache")
  } catch (error) {
    console.error("Error clearing compliment cache:", error)
  }
}

// Export the getComplimentStats function as well
export const getComplimentStats = async (): Promise<{
  cachedTypes: number;
  totalCachedCompliments: number;
}> => {
  try {
    const cacheData = await AsyncStorage.getItem("complimentCache");
    if (!cacheData) {
      return {
        cachedTypes: 0,
        totalCachedCompliments: 0,
      };
    }

    const cache: ComplimentCache = JSON.parse(cacheData);
    const types = Object.keys(cache);
    let totalCompliments = 0;

    types.forEach((type) => {
      totalCompliments += cache[type].compliments.length;
    });

    return {
      cachedTypes: types.length,
      totalCachedCompliments: totalCompliments,
    };
  } catch (error) {
    console.error("Error getting compliment stats:", error);
    return {
      cachedTypes: 0,
      totalCachedCompliments: 0,
    };
  }
};
