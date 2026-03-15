import { useEffect, useState } from 'react'

export type NotifPermission = 'granted' | 'denied' | 'default' | 'unsupported'

// Convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return new Uint8Array([...rawData].map((ch: string) => ch.charCodeAt(0)))
}

// VAPID public key — generated for this app
// To generate your own: npx web-push generate-vapid-keys
// Then set VITE_VAPID_PUBLIC_KEY in .env.local and add the private key as a Supabase secret
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export function useNotifications() {
  const [permission, setPermission] = useState<NotifPermission>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    return Notification.permission as NotifPermission
  })

  const request = async (): Promise<NotifPermission> => {
    if (!('Notification' in window)) return 'unsupported'
    const result = await Notification.requestPermission()
    setPermission(result as NotifPermission)
    return result as NotifPermission
  }

  const subscribe = async (): Promise<PushSubscription | null> => {
    if (!('serviceWorker' in navigator) || !VAPID_PUBLIC_KEY) return null
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) return existing
      return await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
      })
    } catch {
      return null
    }
  }

  const scheduleReminder = async (hour: number, minute: number) => {
    localStorage.setItem('rm-reminder', JSON.stringify({ hour, minute }))
    if (permission !== 'granted') await request()
    // Subscribe to push if VAPID key available
    if (VAPID_PUBLIC_KEY) await subscribe()
  }

  const clearReminder = () => localStorage.removeItem('rm-reminder')

  const getReminderTime = (): { hour: number; minute: number } | null => {
    const s = localStorage.getItem('rm-reminder')
    return s ? JSON.parse(s) : null
  }

  // Fallback: fire notification when app is open near reminder time
  useEffect(() => {
    if (permission !== 'granted') return
    const reminder = getReminderTime()
    if (!reminder) return
    const todayKey = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem('rm-reminder-fired') === todayKey) return
    const now = new Date()
    const target = new Date(); target.setHours(reminder.hour, reminder.minute, 0, 0)
    if (Math.abs(now.getTime() - target.getTime()) < 30 * 60 * 1000) {
      new Notification('Remember Me ✿', {
        body: "Time to write in your journal 🌸",
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'remember-me-reminder',
      })
      localStorage.setItem('rm-reminder-fired', todayKey)
    }
  }, [permission])

  return { permission, request, scheduleReminder, clearReminder, getReminderTime }
}
