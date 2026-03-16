import type { Mood, Sticker, Theme } from '@/types'

export const MOODS: Mood[] = [
  { key: 'joy',   label: 'Joyful',  color: '#F6C95E', description: 'Happy & bright',  prompt: 'What made you smile today?' },
  { key: 'calm',  label: 'Calm',    color: '#8AB49A', description: 'Peaceful & still', prompt: 'What brought you peace?' },
  { key: 'sad',   label: 'Sad',     color: '#89A8C8', description: 'Heavy & tender',   prompt: 'What are you holding right now?' },
  { key: 'love',  label: 'Loved',   color: '#E8A0B4', description: 'Warm & full',      prompt: 'Who or what do you feel grateful for?' },
  { key: 'fire',  label: 'Fired up',color: '#E8825A', description: 'Bold & driven',    prompt: 'What are you chasing right now?' },
  { key: 'dream', label: 'Dreamy',  color: '#B8A0D8', description: 'Soft & wandering', prompt: 'What are you imagining?' },
]

export const MOOD_MAP = Object.fromEntries(MOODS.map(m => [m.key, m])) as Record<string, Mood>

export const STICKERS: Sticker[] = [
  { key: 'first_entry',   emoji: '🌱', label: 'First Bloom',     description: 'Wrote your first entry',        unlockCondition: '1 entry' },
  { key: 'streak_3',      emoji: '🌿', label: 'Sprouting',       description: '3 day writing streak',          unlockCondition: '3 day streak' },
  { key: 'streak_7',      emoji: '🌸', label: 'In Bloom',        description: '7 day writing streak',          unlockCondition: '7 day streak' },
  { key: 'streak_14',     emoji: '🌺', label: 'Flourishing',     description: '14 day writing streak',         unlockCondition: '14 day streak' },
  { key: 'streak_30',     emoji: '🌳', label: 'Deep Roots',      description: '30 day writing streak',         unlockCondition: '30 day streak' },
  { key: 'mood_variety',  emoji: '🎨', label: 'Full Spectrum',   description: 'Used all 6 moods',              unlockCondition: 'All 6 moods' },
  { key: 'night_owl',     emoji: '🦉', label: 'Night Owl',       description: 'Wrote between midnight & 5am',  unlockCondition: 'Write at night' },
  { key: 'early_bird',    emoji: '🐦', label: 'Early Bird',      description: 'Wrote between 5am & 7am',       unlockCondition: 'Write at dawn' },
  { key: 'gratitude_week',emoji: '🙏', label: 'Grateful Heart',  description: '7 entries tagged #Gratitude',   unlockCondition: '7 gratitude entries' },
  { key: 'dream_journal', emoji: '✨', label: 'Dream Weaver',    description: '5 entries tagged #Dream',       unlockCondition: '5 dream entries' },
  { key: 'word_warrior',  emoji: '⚔️', label: 'Word Warrior',    description: 'Wrote 500+ words in one entry', unlockCondition: '500 words' },
  { key: 'time_traveler', emoji: '⏳', label: 'Time Traveler',   description: 'Sent a time capsule entry',     unlockCondition: 'Set a time capsule' },
  { key: 'collector',     emoji: '📚', label: 'Collector',       description: 'Created 3 collections',         unlockCondition: '3 collections' },
]

export const THEMES: Theme[] = [
  { key: 'vanilla',  label: 'Vanilla',  emoji: '🍦', vanilla: '#FFFDD0', cream: '#FAF7F0', sage: '#8AB49A', sageLight: '#E6F0E9', rose: '#D4848A' },
  { key: 'lavender', label: 'Lavender', emoji: '💜', vanilla: '#F5F0FF', cream: '#EDE8F8', sage: '#9B8EC4', sageLight: '#EDE8F8', rose: '#C4A0C8' },
  { key: 'ocean',    label: 'Ocean',    emoji: '🌊', vanilla: '#F0F8FF', cream: '#E8F4F8', sage: '#5B9BB5', sageLight: '#DFF0F8', rose: '#7BAFC4' },
  { key: 'forest',   label: 'Forest',   emoji: '🌲', vanilla: '#F0F5F0', cream: '#E8F0E8', sage: '#5A8A5A', sageLight: '#DCF0DC', rose: '#8A6A5A' },
  { key: 'peach',    label: 'Peach',    emoji: '🍑', vanilla: '#FFF5F0', cream: '#FAF0E8', sage: '#C4845A', sageLight: '#FAEAE0', rose: '#C47080' },
]

// Dark variants per theme — used when dark mode is active
export const THEMES_DARK: Record<string, Partial<Theme>> = {
  vanilla:  { vanilla: '#1A1820', cream: '#221F2A', sage: '#6A9E7E', sageLight: '#1C2C22', rose: '#C47078' },
  lavender: { vanilla: '#1A1828', cream: '#22203A', sage: '#9B8EC4', sageLight: '#1E1A30', rose: '#B490C0' },
  ocean:    { vanilla: '#181C28', cream: '#1E2430', sage: '#5B9BB5', sageLight: '#182030', rose: '#6090A8' },
  forest:   { vanilla: '#1A2018', cream: '#222E22', sage: '#6AAE6A', sageLight: '#1E2C1E', rose: '#A07868' },
  peach:    { vanilla: '#201A18', cream: '#2A2220', sage: '#C4845A', sageLight: '#281E18', rose: '#C47080' },
}

export const AUTO_TAGS = [
  { pattern: /\b(grateful|thankful|blessed|appreciate|gratitude)\b/i, tag: '#Gratitude' },
  { pattern: /\b(dream|dreamed|dreamt|nightmare|sleep)\b/i,           tag: '#Dream' },
  { pattern: /\b(anxious|anxiety|worried|stress|nervous|overwhelm)\b/i, tag: '#Anxiety' },
  { pattern: /\b(goal|achieve|accomplish|success|win|proud)\b/i,      tag: '#Goals' },
  { pattern: /\b(family|mom|dad|sister|brother|parent|child)\b/i,     tag: '#Family' },
  { pattern: /\b(friend|friendship|social|people|together)\b/i,       tag: '#Friends' },
  { pattern: /\b(work|job|career|project|meeting|boss|colleague)\b/i, tag: '#Work' },
  { pattern: /\b(health|exercise|workout|run|gym|body|eat|food)\b/i,  tag: '#Health' },
  { pattern: /\b(love|heart|relationship|partner|romance|miss)\b/i,   tag: '#Love' },
  { pattern: /\b(money|finance|budget|save|spend|cost|pay)\b/i,       tag: '#Money' },
]

export const AI_NUDGES = {
  positive: [
    "This joy is real and it matters. 🌟",
    "You're doing beautifully. 🌸",
    "Hold onto this feeling. ✨",
  ],
  neutral: [
    "Thank you for showing up for yourself today. 🌿",
    "Every word you write is an act of care. 💙",
    "This moment is worth remembering. ✿",
  ],
  negative: [
    "I see you. It's okay to feel this way. 🌧",
    "You're allowed to have hard days. 💙",
    "Being honest with yourself takes courage. 🌱",
  ],
}
