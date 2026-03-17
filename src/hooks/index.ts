import { useEffect, useCallback, useState } from 'react'
import { haptic } from '@/lib/haptics'
import { useStore } from '@/store/useStore'

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function useAutoAnalyze() { /* AI nudges removed */ }

export function useGardenData() {
  const { entries, selectedGardenMonth: { year, month } } = useStore()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dayEntries = entries.filter(e => {
      const d = new Date(e.createdAt)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
    return { day, mood: dayEntries[0]?.mood ?? null, hasEntry: dayEntries.length > 0 }
  })
  return { cells, year, month }
}

export function useStreak() {
  return useStore(s => s.getStreakCount())
}

export function useSaveEntry() {
  const { saveEntry, resetDraft, isSaving, draftContent } = useStore()
  const canSave = draftContent.trim().length > 0 && !isSaving
  const handleSave = useCallback(async () => {
    const entry = await saveEntry()
    if (entry) {
      resetDraft()
      haptic('success')
    }
  }, [saveEntry, resetDraft])
  return { handleSave, canSave, isSaving }
}

export function useLofi() {
  return {
    lofiMode: 'off' as const,
    isPlaying: false,
    setLofiMode: (_m: string) => {},
    togglePlay: () => {},
  }
}
