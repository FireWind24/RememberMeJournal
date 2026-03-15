import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'
import { AUTO_TAGS } from './constants'
import type { MoodKey, StickerKey, AiNudgeResponse } from '@/types'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function formatEntryDate(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d, yyyy')
}
export function formatRelative(dateStr: string): string { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }) }
export function formatMonthYear(dateStr: string): string { return format(parseISO(dateStr), 'MMMM yyyy') }
export function getDaysInMonth(year: number, month: number): number { return new Date(year, month + 1, 0).getDate() }
export function getDateKey(date: Date): string { return format(date, 'yyyy-MM-dd') }
export function countWords(text: string): number { return text.trim().split(/\s+/).filter(Boolean).length }

export function extractTags(content: string): string[] {
  const found = new Set<string>()
  for (const { pattern, tag } of AUTO_TAGS) {
    if (pattern.test(content)) found.add(tag)
    if (found.size >= 4) break
  }
  return Array.from(found)
}

export function detectSentiment(content: string): 'positive' | 'neutral' | 'negative' {
  const lower = content.toLowerCase()
  const neg = ['sad','upset','hurt','pain','angry','tough','hard','bad','terrible','awful','miss','cry','tired','exhausted','anxious','worried','scared','alone','lost'].filter(w => lower.includes(w)).length
  const pos = ['happy','joy','grateful','love','excited','wonderful','amazing','great','blessed','thankful','smile','laugh','hope','proud','peaceful','calm'].filter(w => lower.includes(w)).length
  if (neg > pos + 1) return 'negative'
  if (pos > neg + 1) return 'positive'
  return 'neutral'
}

export function getLocalNudge(content: string): AiNudgeResponse {
  const sentiment = detectSentiment(content)
  const nudge = sentiment === 'negative' ? "Hey, I see you. It's okay to feel this way. 🌧"
    : sentiment === 'positive' ? "This joy is real — hold onto it! 🌟"
    : "Thank you for showing up for yourself today. 🌿"
  return { nudge, tags: extractTags(content), sentiment }
}

export function calculateStreak(entryDates: string[]): number {
  if (!entryDates.length) return 0
  const uniqueDays = [...new Set(entryDates.map(d => d.slice(0, 10)))].sort((a, b) => b.localeCompare(a))
  const today = getDateKey(new Date())
  const yesterday = getDateKey(new Date(Date.now() - 86400000))
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]); prev.setDate(prev.getDate() - 1)
    if (getDateKey(prev) === uniqueDays[i]) streak++
    else break
  }
  return streak
}

export function checkNewStickers(
  totalEntries: number, streak: number, usedMoods: Set<MoodKey>,
  tags: string[], hour: number, wordCount: number, alreadyEarned: StickerKey[], hasTimeCapsule = false
): StickerKey[] {
  const earned = new Set(alreadyEarned)
  const newOnes: StickerKey[] = []
  const check = (key: StickerKey, condition: boolean) => { if (condition && !earned.has(key)) newOnes.push(key) }
  check('first_entry',    totalEntries >= 1)
  check('streak_3',       streak >= 3)
  check('streak_7',       streak >= 7)
  check('streak_14',      streak >= 14)
  check('streak_30',      streak >= 30)
  check('mood_variety',   usedMoods.size >= 6)
  check('night_owl',      hour >= 0 && hour < 5)
  check('early_bird',     hour >= 5 && hour < 7)
  check('word_warrior',   wordCount >= 500)
  check('time_traveler',  hasTimeCapsule)
  const gratitude = tags.filter(t => t === '#Gratitude').length
  const dreams    = tags.filter(t => t === '#Dream').length
  check('gratitude_week', gratitude >= 7)
  check('dream_journal',  dreams >= 5)
  return newOnes
}

export function getAllEarnedStickers(
  totalEntries: number, streak: number, usedMoods: Set<MoodKey>,
  tags: string[], persistedStickers: StickerKey[]
): StickerKey[] {
  const all = new Set(persistedStickers)
  if (totalEntries >= 1)   all.add('first_entry')
  if (streak >= 3)         all.add('streak_3')
  if (streak >= 7)         all.add('streak_7')
  if (streak >= 14)        all.add('streak_14')
  if (streak >= 30)        all.add('streak_30')
  if (usedMoods.size >= 6) all.add('mood_variety')
  if (tags.filter(t => t === '#Gratitude').length >= 7) all.add('gratitude_week')
  if (tags.filter(t => t === '#Dream').length >= 5)     all.add('dream_journal')
  return [...all]
}

export function semanticSearch(query: string, entries: { id: string; content: string; tags: string[] }[]): string[] {
  const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  return entries
    .map(e => ({ id: e.id, score: qWords.reduce((acc, w) => acc + ((e.content + ' ' + e.tags.join(' ')).toLowerCase().match(new RegExp(w, 'g')) || []).length, 0) }))
    .filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.id)
}

export function getRandomPrompt(mood?: MoodKey | null): string {
  const PROMPTS = [
    { mood: 'joy',   prompt: "Describe a moment today that made your heart feel full." },
    { mood: 'calm',  prompt: "What does peace feel like in your body right now?" },
    { mood: 'sad',   prompt: "Write a letter to yourself from someone who loves you unconditionally." },
    { mood: 'love',  prompt: "Who in your life would you most like to thank, and why?" },
    { mood: 'fire',  prompt: "What bold thing would you do if you knew you couldn't fail?" },
    { mood: 'dream', prompt: "Describe the life you're slowly building, in vivid detail." },
    { mood: null,    prompt: "What's something you've been carrying that you can finally set down?" },
    { mood: null,    prompt: "List three things that are true about you that you sometimes forget." },
    { mood: null,    prompt: "If today were a chapter in a book, what would it be called?" },
  ]
  const pool = mood ? PROMPTS.filter(p => p.mood === mood) : PROMPTS.filter(p => !p.mood)
  return pool[Math.floor(Math.random() * pool.length)]?.prompt ?? PROMPTS[6].prompt
}
