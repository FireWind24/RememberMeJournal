import { useEffect, useState, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { Confetti } from '@/components/Confetti'
import { haptic } from '@/lib/haptics'
import { useNotifications } from '@/hooks/useNotifications'
import { JournalEditor } from '@/components/JournalEditor'
import { MoodGarden } from '@/components/MoodGarden'
import { EntriesList } from '@/components/EntriesList'
import { Settings } from '@/components/Settings'
import { EntryModal } from '@/components/EntryModal'
import { NewStickerToast } from '@/components/index'

const TABS = [
  { key: 'write',    label: 'Write',   icon: '✏' },
  { key: 'garden',   label: 'Garden',  icon: '❀' },
  { key: 'entries',  label: 'Entries', icon: '✦' },
  { key: 'settings', label: 'You',     icon: '☽' },
] as const

const TAB_TITLES: Record<string, string> = {
  write:    'Remember me ✿',
  garden:   'Mood garden',
  entries:  'Your entries',
  settings: 'Your space',
}

function InstallTip({ onClose }: { onClose: () => void }) {
  const isIOS     = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isAndroid = /android/i.test(navigator.userAgent)
  if (!isIOS && !isAndroid) return null
  return (
    <div style={{
      position: 'absolute', bottom: 76, left: 12, right: 12, zIndex: 200,
      background: 'var(--white)', border: '1.5px solid var(--border)',
      borderRadius: 16, padding: '14px 16px',
      boxShadow: '0 8px 32px rgba(74,63,74,0.18)',
      animation: 'nudgeIn 0.3s var(--spring)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🏡</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>Add to home screen</p>
          <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, lineHeight: 1.5 }}>
            {isIOS
              ? 'Tap the share button ⎦ below, then "Add to Home Screen" for the full app experience ✿'
              : 'Tap the menu ⋮ in your browser, then "Add to Home Screen" for the full app experience ✿'}
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--muted)', flexShrink: 0, lineHeight: 1 }}>×</button>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Hey'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Hey'
}

export function App() {
  const { activeTab, setActiveTab, newStickerUnlocked, clearNewSticker, selectedEntryId, darkMode, toggleDarkMode, entries, setSelectedEntry, displayName } = useStore()
  const [showInstallTip, setShowInstallTip] = useState(false)
  const [unlockedCapsule, setUnlockedCapsule] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useNotifications()

  const streak = useStore(s => s.getStreakCount())
  const prevStreakRef = useRef(0)
  useEffect(() => {
    const milestones = [7, 14, 30]
    if (milestones.includes(streak) && streak > prevStreakRef.current) {
      setShowConfetti(true)
      haptic('success')
    }
    prevStreakRef.current = streak
  }, [streak])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    if (newStickerUnlocked) {
      const t = setTimeout(clearNewSticker, 3000)
      return () => clearTimeout(t)
    }
  }, [newStickerUnlocked, clearNewSticker])

  // Check for newly unlocked time capsules on load
  useEffect(() => {
    const now = new Date()
    const justUnlocked = entries.find(e =>
      e.timeCapsuleDate &&
      new Date(e.timeCapsuleDate) <= now &&
      !e.timeCapsuleDelivered
    )
    if (justUnlocked) {
      setUnlockedCapsule(justUnlocked.id)
    }
  }, [entries])

  // Show install tip once on mobile, 3s after load
  useEffect(() => {
    const seen       = localStorage.getItem('rm-install-seen')
    const isMobile   = /iphone|ipad|ipod|android/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (!seen && isMobile && !isStandalone) {
      const t = setTimeout(() => setShowInstallTip(true), 3000)
      return () => clearTimeout(t)
    }
  }, [])

  const dismissInstallTip = () => {
    setShowInstallTip(false)
    localStorage.setItem('rm-install-seen', '1')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-title">
          {activeTab === 'write' && displayName
            ? `${getGreeting()}, ${displayName} ✿`
            : TAB_TITLES[activeTab]}
        </span>
        <button className="sun-btn" onClick={toggleDarkMode} title={darkMode ? 'Light mode' : 'Dark mode'} aria-label="Toggle dark mode">
          {darkMode ? '🌙' : '☀'}
        </button>
      </header>

      <main className="app-content">
        {activeTab === 'write'    && <JournalEditor />}
        {activeTab === 'garden'   && <MoodGarden />}
        {activeTab === 'entries'  && <EntriesList />}
        {activeTab === 'settings' && <Settings />}
      </main>

      <nav className="bottom-nav">
        {TABS.map(tab => (
          <button key={tab.key} className={`nav-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)} aria-label={tab.label}>
            <span className="nav-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {showInstallTip && <InstallTip onClose={dismissInstallTip} />}

      {/* Time capsule unlock notification */}
      {unlockedCapsule && (
        <div style={{
          position: 'absolute', bottom: 76, left: 12, right: 12, zIndex: 200,
          background: 'var(--white)', border: '1.5px solid var(--rose)',
          borderRadius: 16, padding: '14px 16px',
          boxShadow: '0 8px 32px rgba(74,63,74,0.18)',
          animation: 'nudgeIn 0.3s var(--spring)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>⏳</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>Time capsule unlocked!</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>A past entry is ready to read ✨</p>
            </div>
            <button onClick={() => { setSelectedEntry(unlockedCapsule); setUnlockedCapsule(null) }}
              style={{ background: 'var(--rose)', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: 'Quicksand', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              Open
            </button>
            <button onClick={() => setUnlockedCapsule(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--muted)', padding: 0 }}>×</button>
          </div>
        </div>
      )}
      {selectedEntryId && <EntryModal />}
      {newStickerUnlocked && <NewStickerToast stickerKey={newStickerUnlocked} onClose={clearNewSticker} />}
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
    </div>
  )
}
