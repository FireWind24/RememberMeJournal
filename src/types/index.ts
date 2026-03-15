// ─── Mood ─────────────────────────────────────────────────────────────────────
export type MoodKey = 'joy' | 'calm' | 'sad' | 'love' | 'fire' | 'dream'

export interface Mood {
  key: MoodKey
  label: string
  color: string
  description: string
  prompt: string
}

// ─── Journal Entry ────────────────────────────────────────────────────────────
export interface JournalEntry {
  id: string
  userId: string
  subject: string
  content: string
  mood: MoodKey | null
  tags: string[]
  aiNudge: string | null
  timeCapsuleDate: string | null
  timeCapsuleDelivered: boolean
  wordCount: number
  isFavorite: boolean
  collectionId: string | null
  createdAt: string
  updatedAt: string
}

// ─── Collection / Notebook ────────────────────────────────────────────────────
export interface Collection {
  id: string
  name: string
  emoji: string
  color: string
  createdAt: string
}

// ─── User / Auth ──────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  streakCount: number
  longestStreak: number
  totalEntries: number
  earnedStickers: StickerKey[]
  wordCountGoal: number
  theme: ThemeKey
  fontSize: 'sm' | 'md' | 'lg'
  createdAt: string
  preferences: UserPreferences
}

export interface UserPreferences {
  lofiMode: LofiMode
  showAiNudges: boolean
  darkMode: boolean
  fontSize: 'sm' | 'md' | 'lg'
}

// ─── Stickers ─────────────────────────────────────────────────────────────────
export type StickerKey =
  | 'first_entry' | 'streak_3' | 'streak_7' | 'streak_14' | 'streak_30'
  | 'mood_variety' | 'night_owl' | 'early_bird' | 'gratitude_week' | 'dream_journal'
  | 'word_warrior' | 'time_traveler' | 'collector'

export interface Sticker {
  key: StickerKey
  emoji: string
  label: string
  description: string
  unlockCondition: string
}

// ─── Lo-Fi ────────────────────────────────────────────────────────────────────
export type LofiMode = 'rainy_cafe' | 'summer_meadow' | 'deep_focus' | 'off'

// ─── Garden ───────────────────────────────────────────────────────────────────
export interface GardenDay {
  date: string
  mood: MoodKey | null
  hasEntry: boolean
}

// ─── Time Capsule ─────────────────────────────────────────────────────────────
export interface TimeCapsule {
  entryId: string
  deliverAt: string
  email: string
  delivered: boolean
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export interface AiNudgeResponse {
  nudge: string
  tags: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
}

// ─── Theme ────────────────────────────────────────────────────────────────────
export type ThemeKey = 'vanilla' | 'lavender' | 'ocean' | 'forest' | 'peach'

export interface Theme {
  key: ThemeKey
  label: string
  emoji: string
  vanilla: string
  cream: string
  sage: string
  sageLight: string
  rose: string
}

// ─── Search ───────────────────────────────────────────────────────────────────
export interface SearchResult {
  entry: JournalEntry
  score: number
  snippet: string
}
