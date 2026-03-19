/// <reference types="vite/client" />
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { JournalEntry, UserProfile, MoodKey, StickerKey, Collection, ThemeKey } from '@/types'
import { countWords, calculateStreak, checkNewStickers, getAllEarnedStickers, extractTags } from '@/lib/utils'
import { getAiNudge } from '@/lib/ai'
import { STICKERS, THEMES, THEMES_DARK } from '@/lib/constants'

interface AppState {
  user: UserProfile | null
  isAuthenticated: boolean
  entries: JournalEntry[]
  collections: Collection[]
  isLoadingEntries: boolean
  earnedStickers: StickerKey[]
  wordCountGoal: number
  theme: ThemeKey
  pinnedEntryId: string | null
  displayName: string

  // Editor
  draftContent: string
  draftSubject: string
  draftMood: MoodKey | null
  draftCollectionId: string | null
  draftTimeCapsuleDate: string | null
  isSaving: boolean
  currentNudge: string | null
  currentTags: string[]
  isAnalyzing: boolean

  // Edit mode
  editingEntryId: string | null
  editContent: string
  editSubject: string
  editMood: MoodKey | null

  // Garden
  selectedGardenMonth: { year: number; month: number }

  // UI
  activeTab: 'write' | 'garden' | 'entries' | 'settings'
  searchQuery: string
  newStickerUnlocked: StickerKey | null
  darkMode: boolean
  selectedEntryId: string | null
  activeCollection: string | null
  showFavoritesOnly: boolean
  dateFilter: 'all' | '7d' | '30d' | '90d' | 'custom'
  dateFilterFrom: string | null
  dateFilterTo: string | null

  // Actions
  setUser: (u: UserProfile | null) => void
  setEntries: (e: JournalEntry[]) => void
  addEntry: (e: JournalEntry) => void
  updateEntry: (id: string, patch: Partial<JournalEntry>) => void
  deleteEntry: (id: string) => void
  toggleFavorite: (id: string) => void
  setDraftContent: (c: string) => void
  setDraftSubject: (s: string) => void
  setDraftMood: (m: MoodKey | null) => void
  setDraftCollection: (id: string | null) => void
  setDraftTimeCapsuleDate: (d: string | null) => void
  analyzeContent: (content: string, mood: MoodKey | null) => Promise<void>
  saveEntry: () => Promise<JournalEntry | null>
  resetDraft: () => void
  setGardenMonth: (y: number, m: number) => void
  setActiveTab: (t: AppState['activeTab']) => void
  setSearchQuery: (q: string) => void
  clearNewSticker: () => void
  toggleDarkMode: () => void
  setTheme: (t: ThemeKey) => void
  setWordCountGoal: (n: number) => void
  setDisplayName: (n: string) => void
  setSelectedEntry: (id: string | null) => void
  startEditing: (id: string) => void
  cancelEditing: () => void
  setEditContent: (c: string) => void
  setEditSubject: (s: string) => void
  setEditMood: (m: MoodKey | null) => void
  saveEdit: () => void
  addCollection: (name: string, emoji: string) => void
  deleteCollection: (id: string) => void
  setActiveCollection: (id: string | null) => void
  setShowFavoritesOnly: (v: boolean) => void
  setDateFilter: (f: AppState['dateFilter']) => void
  setDateFilterFrom: (d: string | null) => void
  setDateFilterTo: (d: string | null) => void

  // Derived
  getFilteredEntries: () => JournalEntry[]
  getStreakCount: () => number
  getDisplayStickers: () => StickerKey[]
  getOnThisDay: () => JournalEntry | null
  getWeeklyRecap: () => { totalWords: number; topMood: MoodKey | null; streak: number; entryCount: number } | null
}

function applyTheme(theme: ThemeKey, dark: boolean) {
  const t = THEMES.find(x => x.key === theme)
  if (!t) return
  const d = dark ? THEMES_DARK[theme] : {}
  const root = document.documentElement
  root.style.setProperty('--vanilla',    d.vanilla    ?? t.vanilla)
  root.style.setProperty('--cream',      d.cream      ?? t.cream)
  root.style.setProperty('--sage',       d.sage       ?? t.sage)
  root.style.setProperty('--sage-light', d.sageLight  ?? t.sageLight)
  root.style.setProperty('--rose',       d.rose       ?? t.rose)
}

export const useStore = create<AppState>()(
  persist(
    (set: (partial: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void, get: () => AppState) => ({
      user: null, isAuthenticated: false,
      entries: [], collections: [], isLoadingEntries: false,
      earnedStickers: [], wordCountGoal: 0, theme: 'vanilla', pinnedEntryId: null, displayName: '',
      draftContent: '', draftSubject: '', draftMood: null, draftCollectionId: null, draftTimeCapsuleDate: null,
      isSaving: false, currentNudge: null, currentTags: [], isAnalyzing: false,
      editingEntryId: null, editContent: '', editSubject: '', editMood: null,
      selectedGardenMonth: { year: new Date().getFullYear(), month: new Date().getMonth() },
      activeTab: 'write', searchQuery: '',
      newStickerUnlocked: null, darkMode: false, selectedEntryId: null,
      activeCollection: null, showFavoritesOnly: false,
      dateFilter: 'all', dateFilterFrom: null, dateFilterTo: null,

      setUser: (user: UserProfile | null) => set({ user, isAuthenticated: !!user }),
      setEntries: (entries: JournalEntry[]) => set({ entries }),
      addEntry: (entry: JournalEntry) => set((s: AppState) => ({ entries: [entry, ...s.entries] })),
      updateEntry: (id: string, patch: Partial<JournalEntry>) => set((s: AppState) => ({
        entries: s.entries.map((e: JournalEntry) => e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e)
      })),
      deleteEntry: (id: string) => set((s: AppState) => ({ entries: s.entries.filter((e: JournalEntry) => e.id !== id) })),
      toggleFavorite: (id: string) => set((s: AppState) => ({
        entries: s.entries.map((e: JournalEntry) => e.id === id ? { ...e, isFavorite: !e.isFavorite } : e)
      })),

      setDraftContent: (draftContent: string) => set({ draftContent }),
      setDraftSubject: (draftSubject: string) => set({ draftSubject }),
      setDraftMood: (draftMood: MoodKey | null) => set({ draftMood }),
      setDraftCollection: (draftCollectionId: string | null) => set({ draftCollectionId }),
      setDraftTimeCapsuleDate: (draftTimeCapsuleDate: string | null) => set({ draftTimeCapsuleDate }),

      analyzeContent: async (content: string, mood: MoodKey | null) => {
        if (content.length < 20) { set({ currentNudge: null, currentTags: [] }); return }
        set({ isAnalyzing: true })
        try {
          const { nudge, tags } = await getAiNudge(content, mood)
          set({ currentNudge: nudge, currentTags: tags, isAnalyzing: false })
        } catch {
          set({ currentTags: extractTags(content), isAnalyzing: false })
        }
      },

      saveEntry: async () => {
        set({ isSaving: true })
        try {
          const { draftContent, draftSubject, draftMood, draftCollectionId, draftTimeCapsuleDate, currentTags, currentNudge, entries, earnedStickers } = get()
          if (!draftContent.trim()) return null
          const newEntry: JournalEntry = {
            id: uuidv4(), userId: get().user?.id ?? 'local',
            subject: draftSubject, content: draftContent, mood: draftMood,
            tags: currentTags, aiNudge: currentNudge,
            timeCapsuleDate: draftTimeCapsuleDate, timeCapsuleDelivered: false,
            isFavorite: false, collectionId: draftCollectionId,
            wordCount: countWords(draftContent),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          const updatedEntries = [newEntry, ...entries]
          set({ entries: updatedEntries })

          const streak = calculateStreak(updatedEntries.map(e => e.createdAt))
          const usedMoods = new Set(updatedEntries.map(e => e.mood).filter(Boolean) as MoodKey[])
          const allTags = updatedEntries.flatMap(e => e.tags)
          const newlyUnlocked = checkNewStickers(
            updatedEntries.length, streak, usedMoods, allTags,
            new Date().getHours(), newEntry.wordCount,
            earnedStickers, !!draftTimeCapsuleDate
          )
          if (newlyUnlocked.length > 0) {
            set((s: AppState) => ({
              earnedStickers: [...new Set([...s.earnedStickers, ...newlyUnlocked])],
              newStickerUnlocked: newlyUnlocked[0],
            }))
            // Persist stickers to Supabase so they survive cross-device login
            const { user, earnedStickers: current } = get()
            if (user) {
              import('@/lib/supabase').then(({ upsertProfile }) => {
                upsertProfile({ id: user.id, earnedStickers: [...new Set([...current, ...newlyUnlocked])] })
              })
            }
          }
          return newEntry
        } finally { set({ isSaving: false }) }
      },

      resetDraft: () => set({ draftContent: '', draftSubject: '', draftMood: null, draftCollectionId: null, draftTimeCapsuleDate: null, currentNudge: null, currentTags: [], isAnalyzing: false }),
      setGardenMonth: (year: number, month: number) => set({ selectedGardenMonth: { year, month } }),
      setActiveTab: (activeTab: AppState['activeTab']) => set({ activeTab }),
      setSearchQuery: (searchQuery: string) => set({ searchQuery }),
      clearNewSticker: () => set({ newStickerUnlocked: null }),
      setSelectedEntry: (selectedEntryId: string | null) => set({ selectedEntryId }),
      setShowFavoritesOnly: (showFavoritesOnly: boolean) => set({ showFavoritesOnly }),
      setActiveCollection: (activeCollection: string | null) => set({ activeCollection }),
      setDateFilter: (dateFilter) => set({ dateFilter }),
      setDateFilterFrom: (dateFilterFrom) => set({ dateFilterFrom }),
      setDateFilterTo: (dateFilterTo) => set({ dateFilterTo }),

      toggleDarkMode: () => {
        const next = !get().darkMode
        set({ darkMode: next })
        document.documentElement.classList.toggle('dark', next)
        applyTheme(get().theme, next)
      },

      setTheme: (theme: ThemeKey) => {
        set({ theme })
        applyTheme(theme, get().darkMode)
      },

      setWordCountGoal: (wordCountGoal: number) => set({ wordCountGoal }),
      setDisplayName: (displayName: string) => set({ displayName }),

      startEditing: (id: string) => {
        const entry = get().entries.find((e: JournalEntry) => e.id === id)
        if (!entry) return
        set({ editingEntryId: id, editContent: entry.content, editSubject: entry.subject ?? '', editMood: entry.mood })
      },
      cancelEditing: () => set({ editingEntryId: null, editContent: '', editSubject: '', editMood: null }),
      setEditContent: (editContent: string) => set({ editContent }),
      setEditSubject: (editSubject: string) => set({ editSubject }),
      setEditMood: (editMood: MoodKey | null) => set({ editMood }),
      saveEdit: () => {
        const { editingEntryId, editContent, editSubject, editMood } = get()
        if (!editingEntryId || !editContent.trim()) return
        get().updateEntry(editingEntryId, {
          subject: editSubject, content: editContent, mood: editMood,
          wordCount: countWords(editContent), tags: extractTags(editContent),
        })
        set({ editingEntryId: null, editContent: '', editSubject: '', editMood: null })
      },

      addCollection: (name: string, emoji: string) => {
        const newCol: Collection = { id: uuidv4(), name, emoji, color: '#8AB49A', createdAt: new Date().toISOString() }
        set((s: AppState) => {
          const updated = [...s.collections, newCol]
          // unlock collector sticker
          if (updated.length >= 3 && !s.earnedStickers.includes('collector')) {
            return { collections: updated, earnedStickers: [...s.earnedStickers, 'collector'], newStickerUnlocked: 'collector' }
          }
          return { collections: updated }
        })
      },
      deleteCollection: (id: string) => set((s: AppState) => ({
        collections: s.collections.filter((c: Collection) => c.id !== id),
        entries: s.entries.map((e: JournalEntry) => e.collectionId === id ? { ...e, collectionId: null } : e),
        activeCollection: s.activeCollection === id ? null : s.activeCollection,
      })),

      getFilteredEntries: () => {
        const { entries, searchQuery, activeCollection, showFavoritesOnly, dateFilter, dateFilterFrom, dateFilterTo } = get()
        let result: JournalEntry[] = entries

        // Date filter
        if (dateFilter !== 'all') {
          const now = new Date()
          let from: Date | null = null
          if (dateFilter === '7d')  { from = new Date(); from.setDate(now.getDate() - 7) }
          if (dateFilter === '30d') { from = new Date(); from.setDate(now.getDate() - 30) }
          if (dateFilter === '90d') { from = new Date(); from.setDate(now.getDate() - 90) }
          if (dateFilter === 'custom') {
            if (dateFilterFrom) from = new Date(dateFilterFrom)
            const to = dateFilterTo ? new Date(dateFilterTo) : null
            if (to) to.setHours(23, 59, 59)
            result = result.filter((e: JournalEntry) => {
              const d = new Date(e.createdAt)
              return (!from || d >= from) && (!to || d <= to)
            })
          } else if (from) {
            result = result.filter((e: JournalEntry) => new Date(e.createdAt) >= from!)
          }
        }
        if (showFavoritesOnly) result = result.filter((e: JournalEntry) => e.isFavorite)
        if (activeCollection) result = result.filter((e: JournalEntry) => e.collectionId === activeCollection)
        if (!searchQuery.trim()) return result
        const q = searchQuery.toLowerCase()
        return result.filter((e: JournalEntry) =>
          e.content.toLowerCase().includes(q) ||
          e.subject?.toLowerCase().includes(q) ||
          e.tags.some((t: string) => t.toLowerCase().includes(q))
        )
      },

      getStreakCount: () => calculateStreak(get().entries.map((e: JournalEntry) => e.createdAt)),

      getDisplayStickers: () => {
        const { entries, earnedStickers } = get()
        const streak = calculateStreak(entries.map((e: JournalEntry) => e.createdAt))
        const usedMoods = new Set(entries.map((e: JournalEntry) => e.mood).filter(Boolean) as MoodKey[])
        const allTags = entries.flatMap((e: JournalEntry) => e.tags)
        return getAllEarnedStickers(entries.length, streak, usedMoods, allTags, earnedStickers)
      },

      getOnThisDay: () => {
        const { entries } = get()
        const today = new Date()
        const thisMonth = today.getMonth(), thisDay = today.getDate()
        return entries.find((e: JournalEntry) => {
          const d = new Date(e.createdAt)
          return d.getMonth() === thisMonth && d.getDate() === thisDay &&
            d.getFullYear() < today.getFullYear()
        }) ?? null
      },

      getWeeklyRecap: () => {
        const { entries } = get()
        const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const weekEntries = entries.filter((e: JournalEntry) => new Date(e.createdAt) >= oneWeekAgo)
        if (weekEntries.length === 0) return null
        const totalWords = weekEntries.reduce((a: number, e: JournalEntry) => a + e.wordCount, 0)
        const moodCounts = weekEntries.reduce((acc: Record<string, number>, e: JournalEntry) => {
          if (e.mood) acc[e.mood] = (acc[e.mood] ?? 0) + 1
          return acc
        }, {} as Record<string, number>)
        const sorted = Object.entries(moodCounts).sort((a, b) => (b[1] as number) - (a[1] as number))
        const topMood = (sorted[0]?.[0] ?? null) as MoodKey | null
        return { totalWords, topMood, streak: calculateStreak(entries.map((e: JournalEntry) => e.createdAt)), entryCount: weekEntries.length }
      },
    }),
    {
      name: 'remember-me-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (s: AppState) => ({
        entries: s.entries, collections: s.collections,
        earnedStickers: s.earnedStickers, wordCountGoal: s.wordCountGoal,
        displayName: s.displayName,
        theme: s.theme, user: s.user, isAuthenticated: s.isAuthenticated,
        selectedGardenMonth: s.selectedGardenMonth, darkMode: s.darkMode,
      }),
      onRehydrateStorage: () => (state: AppState | undefined) => {
        if (state?.darkMode) document.documentElement.classList.add('dark')
        if (state?.theme) applyTheme(state.theme, state.darkMode ?? false)
      },
    }
  )
)

export const getStickerMeta = (key: StickerKey) =>
  STICKERS.find(s => s.key === key) ?? STICKERS[0]
