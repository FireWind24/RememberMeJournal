import { useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import {
  supabase, isSupabaseConfigured,
  fetchEntries, upsertEntry, deleteEntryRemote,
  fetchProfile,
} from '@/lib/supabase'
import type { JournalEntry } from '@/types'

// Entries that failed to sync while offline — keyed by `id-updatedAt`
const pendingSync = new Set<string>()

async function pushPendingEntries(userId: string) {
  const { entries } = useStore.getState()
  for (const entry of entries) {
    const key = `${entry.id}-${entry.updatedAt}`
    if (pendingSync.has(key)) {
      try {
        await upsertEntry({ ...entry, userId })
        pendingSync.delete(key)
      } catch {
        // still offline, leave in pending
      }
    }
  }
}

async function syncUser(sbUser: { id: string; email?: string; created_at: string; user_metadata?: Record<string, string> }) {
  const { setUser, setEntries } = useStore.getState()
  const profile = await fetchProfile(sbUser.id)

  setUser({
    id: sbUser.id,
    email: sbUser.email ?? '',
    displayName: profile?.displayName ?? sbUser.user_metadata?.full_name ?? sbUser.email?.split('@')[0] ?? 'User',
    avatarUrl: profile?.avatarUrl ?? sbUser.user_metadata?.avatar_url ?? null,
    streakCount: 0, longestStreak: 0, totalEntries: 0,
    earnedStickers: profile?.earnedStickers ?? [],
    wordCountGoal: 0, theme: 'vanilla' as const, fontSize: 'md' as const,
    createdAt: sbUser.created_at,
    preferences: { lofiMode: 'off', showAiNudges: true, darkMode: false, fontSize: 'md' },
  })

  const remote = await fetchEntries(sbUser.id)
  const localEntries = useStore.getState().entries.filter(e => e.userId === 'local')
  for (const e of localEntries) {
    await upsertEntry({ ...e, userId: sbUser.id })
  }
  const remoteIds = new Set(remote.map(e => e.id))
  const localOnly = localEntries.filter(e => !remoteIds.has(e.id))
  const merged = [...remote, ...localOnly].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  setEntries(merged)

  // Restore earnedStickers into store top-level (not just user object)
  if (profile?.earnedStickers?.length) {
    useStore.setState(s => ({
      earnedStickers: [...new Set([...s.earnedStickers, ...profile.earnedStickers])]
    }))
  }
}

export function useSupabaseSync() {
  const { setUser, setEntries, entries } = useStore()
  const handledRef = useRef(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setEntries([])
        handledRef.current = false
        return
      }
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
        if (handledRef.current) return
        handledRef.current = true
        await syncUser(session.user as Parameters<typeof syncUser>[0])
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setEntries])

  // Sync entries to Supabase — mark failures as pending
  const lastSyncedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const { isAuthenticated, user } = useStore.getState()
    if (!isAuthenticated || !user) return

    entries.forEach((entry: JournalEntry) => {
      const key = `${entry.id}-${entry.updatedAt}`
      if (!lastSyncedRef.current.has(key)) {
        lastSyncedRef.current.add(key)
        upsertEntry({ ...entry, userId: user.id }).catch(() => {
          // Failed — probably offline. Mark as pending.
          pendingSync.add(key)
        })
      }
    })
  }, [entries])

  // Listen for coming back online — push all pending entries
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const handleOnline = async () => {
      const { isAuthenticated, user } = useStore.getState()
      if (!isAuthenticated || !user || pendingSync.size === 0) return
      await pushPendingEntries(user.id)
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  return { isSupabaseConfigured }
}

export function useDeleteEntry() {
  const { deleteEntry, isAuthenticated, user } = useStore()
  return async (id: string) => {
    deleteEntry(id)
    if (isAuthenticated && user && isSupabaseConfigured) {
      await deleteEntryRemote(id)
    }
  }
}
