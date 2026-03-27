import { useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { isSupabaseConfigured, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } from '@/lib/supabase'
import { THEMES, STICKERS } from '@/lib/constants'
import type { JournalEntry, ThemeKey } from '@/types'
import { useNotifications } from '@/hooks/useNotifications'
import { HelpGuide } from './HelpGuide'

export function Settings() {
  const {
    user, entries, collections, darkMode, toggleDarkMode, setEntries,
    isAuthenticated, wordCountGoal, setWordCountGoal, theme, setTheme,
    deleteCollection, getDisplayStickers, displayName, setDisplayName,
  } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { permission, scheduleReminder, clearReminder, getReminderTime } = useNotifications()
  const [reminderTime, setReminderTime] = useState(() => {
    const t = getReminderTime()
    if (t) return `${String(t.hour).padStart(2,'0')}:${String(t.minute).padStart(2,'0')}`
    return ''
  })
  const [authMode, setAuthMode] = useState<'idle' | 'signin' | 'signup'>('idle')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [goalInput, setGoalInput] = useState(String(wordCountGoal || ''))

  const totalWords  = entries.reduce((acc, e) => acc + (e.wordCount ?? 0), 0)
  const moodsUsed   = new Set(entries.map(e => e.mood).filter(Boolean)).size
  const streak      = useStore(s => s.getStreakCount())
  const earned      = getDisplayStickers()
  const recap       = useStore(s => s.getWeeklyRecap())

  const handleSignOut = () => {
    // Clear everything locally first so UI responds immediately
    localStorage.removeItem('remember-me-store')
    // Clear all supabase auth keys
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('sb-')) localStorage.removeItem(k)
    })
    // Fire supabase signout in background then reload
    signOut().catch(() => {}).finally(() => {
      window.location.href = window.location.origin
    })
    // Reload anyway after 500ms in case signOut hangs
    setTimeout(() => { window.location.href = window.location.origin }, 500)
  }

  const handleEmailAuth = async () => {
    if (!email || !password) { setAuthError('Please enter email and password'); return }
    setAuthLoading(true); setAuthError('')
    const fn = authMode === 'signup' ? signUpWithEmail : signInWithEmail
    const { error } = await fn(email, password) as { error: { message: string } | null }
    if (error) setAuthError(error.message)
    setAuthLoading(false)
  }

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries }, null, 2)], { type: 'application/json' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `remember-me-backup-${new Date().toISOString().slice(0,10)}.json` })
    a.click(); URL.revokeObjectURL(a.href)
  }

  const handleExportMarkdown = () => {
    const lines = ['# Remember Me — Journal Export', `Exported: ${new Date().toLocaleDateString()}`, '']
    entries.forEach(e => {
      const d = new Date(e.createdAt)
      lines.push(`## ${d.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`)
      if (e.subject) lines.push(`### ${e.subject}`)
      if (e.mood) lines.push(`*Mood: ${e.mood}*`)
      lines.push('', e.content, '')
      if (e.tags.length) lines.push(`Tags: ${e.tags.join(' ')}`)
      lines.push('\n---\n')
    })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/markdown' })), download: `remember-me-journal-${new Date().toISOString().slice(0,10)}.md` })
    a.click(); URL.revokeObjectURL(a.href)
  }


  const handleExportPDF = () => {
    const moodColors: Record<string, string> = {
      joy: '#F6C95E', calm: '#8AB49A', sad: '#89A8C8',
      love: '#E8A0B4', fire: '#E8825A', dream: '#B8A0D8',
    }
    // Read current theme colors from CSS variables
    const root = document.documentElement
    const style = getComputedStyle(root)
    const bgColor = style.getPropertyValue('--vanilla').trim() || '#FFFDD0'
    const textColor = style.getPropertyValue('--text').trim() || '#4A3F4A'
    const borderColor = style.getPropertyValue('--border').trim() || '#E2D9CE'
    const mutedColor = style.getPropertyValue('--muted').trim() || '#9A8A9A'

    const renderContent = (text: string) =>
      text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/__(.+?)__/g, '<u>$1</u>')
        .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #8AB49A;padding-left:12px;color:#9A8A9A;font-style:italic;margin:6px 0">$1</blockquote>')
        .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #E2D9CE;margin:12px 0">')
        .replace(/\n/g, '<br>')

    const entryRows = entries.map(e => {
      const d = new Date(e.createdAt)
      const dot = e.mood ? moodColors[e.mood] ?? '#E2D9CE' : '#E2D9CE'
      const mood = e.mood ? e.mood.charAt(0).toUpperCase() + e.mood.slice(1) : ''
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      const subject = e.subject ? '<div class="subject">' + e.subject + '</div>' : ''
      const content = renderContent(e.content)
      return (
        '<div class="entry">' +
        '<div class="meta"><span class="dot" style="background:' + dot + '"></span>' + dateStr + ' &middot; ' + timeStr + (mood ? ' &middot; ' + mood : '') + '</div>' +
        subject +
        '<div class="body">' + content + '</div>' +
        '<div class="words">' + e.wordCount + ' words</div>' +
        '</div>'
      )
    }).join('')

    const exportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Remember Me</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">' +
      '<style>' +
      '* { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }' +
      'body { font-family: Lora, serif; background: ' + bgColor + '; color: ' + textColor + '; padding: 48px; max-width: 680px; margin: 0 auto; }' +
      '.cover { text-align:center; padding: 60px 0 48px; border-bottom: 1px solid ' + borderColor + '; margin-bottom: 48px; }' +
      '.cover h1 { font-family: Quicksand, sans-serif; font-size: 32px; font-weight: 700; margin-bottom: 8px; color: ' + textColor + '; }' +
      '.cover p { font-size: 13px; color: ' + mutedColor + '; font-family: Quicksand, sans-serif; }' +
      '.entry { margin-bottom: 48px; padding-bottom: 48px; border-bottom: 1px solid ' + borderColor + '; page-break-inside: avoid; }' +
      '.entry:last-child { border-bottom: none; }' +
      '.meta { font-family: Quicksand, sans-serif; font-size: 11px; font-weight: 700; color: ' + mutedColor + '; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }' +
      '.dot { width: 8px; height: 8px; border-radius: 50% 50% 0 50%; display: inline-block; flex-shrink: 0; }' +
      '.subject { font-family: Quicksand, sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 12px; line-height: 1.3; color: ' + textColor + '; }' +
      '.body { font-size: 15px; line-height: 1.9; color: ' + textColor + '; }' +
      '.words { font-family: Quicksand, sans-serif; font-size: 10px; color: ' + mutedColor + '; margin-top: 10px; }' +
      '@media print { body { background: ' + bgColor + ' !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }' +
      '</style></head><body>' +
      '<div class="cover"><h1>Remember Me ✿</h1><p>Exported ' + exportDate + '</p><p style="margin-top:4px">' + entries.length + ' entries</p></div>' +
      entryRows +
      '</body></html>'

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 800)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        const imported: JournalEntry[] = parsed.entries ?? parsed
        if (!Array.isArray(imported)) throw new Error()
        const existingIds = new Set(entries.map(e => e.id))
        const newEntries = imported.filter(e => !existingIds.has(e.id))
        setEntries([...newEntries, ...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
        alert(`✿ Imported ${newEntries.length} new entries!`)
      } catch { alert('Couldn\'t read that file.') }
    }
    reader.readAsText(file); e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="animate-fade-up">

      {/* Profile / Auth */}
      <div className="card">
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, overflow: 'hidden', flexShrink: 0 }}>
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🌿'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{user.email} · synced ✓</p>
            </div>
            <button className="btn-secondary" style={{ fontSize: 11, padding: '5px 10px', color: 'var(--rose)', flexShrink: 0 }} onClick={handleSignOut}>Sign out</button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌿</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Journaling locally</p>
                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>Sign in to sync across devices</p>
              </div>
            </div>
            {/* Display name */}
            <div style={{ marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Your name (e.g. Ammu ✿)"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 11, fontFamily: 'Quicksand', fontSize: 13, fontWeight: 600, color: 'var(--text)', background: 'var(--white)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--sage)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {isSupabaseConfigured ? (
              authMode === 'idle' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-primary" style={{ fontSize: 12, padding: '9px', flex: 2 }} onClick={signInWithGoogle}>Sign in with Google</button>
                  <button className="btn-secondary" style={{ fontSize: 11, flex: 1 }} onClick={() => setAuthMode('signin')}>Email</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                    style={{ padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 11, fontFamily: 'Quicksand', fontSize: 13, fontWeight: 600, color: 'var(--text)', background: 'var(--white)', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--sage)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                    style={{ padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 11, fontFamily: 'Quicksand', fontSize: 13, fontWeight: 600, color: 'var(--text)', background: 'var(--white)', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--sage)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    onKeyDown={e => e.key === 'Enter' && handleEmailAuth()} />
                  {authError && <p style={{ fontSize: 11, color: 'var(--rose)', fontWeight: 600 }}>{authError}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" style={{ flex: 1, fontSize: 11 }} onClick={() => { setAuthMode('idle'); setAuthError('') }}>Cancel</button>
                    <button className="btn-secondary" style={{ flex: 1, fontSize: 11 }} onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
                      {authMode === 'signin' ? 'Sign up' : 'Sign in'}
                    </button>
                    <button className="btn-primary" style={{ flex: 2, fontSize: 12, padding: '9px' }} onClick={handleEmailAuth} disabled={authLoading}>
                      {authLoading ? '...' : authMode === 'signup' ? 'Create' : 'Sign in'}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, background: 'var(--sage-light)', padding: '8px 10px', borderRadius: 8, lineHeight: 1.5 }}>
                Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable sync
              </p>
            )}
          </div>
        )}
      </div>

      {/* Weekly Recap */}
      {recap && (
        <div className="card" style={{ background: 'var(--sage-light)', border: '1px solid var(--sage)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 10, right: 14, fontSize: 28, opacity: 0.15 }}>🌿</div>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--sage-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>✦ This week</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.5, marginBottom: 10 }}>
            {recap.topMood
              ? `This week you felt ${recap.topMood} most, wrote ${recap.totalWords.toLocaleString()} words${recap.streak > 0 ? `, and kept a ${recap.streak} day streak` : ''} 🌿`
              : `You wrote ${recap.totalWords.toLocaleString()} words across ${recap.entryCount} ${recap.entryCount === 1 ? 'entry' : 'entries'} this week 🌿`}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Entries', value: recap.entryCount },
              { label: 'Words', value: recap.totalWords.toLocaleString() },
              { label: 'Streak', value: `${recap.streak}d` },
              { label: 'Mood', value: recap.topMood ?? '—' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.3)', borderRadius: 8, padding: '6px 4px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sage-mid)' }}>{s.value}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--sage-mid)', opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Entries',      value: entries.length },
          { label: 'Words',        value: totalWords.toLocaleString() },
          { label: 'Moods used',   value: moodsUsed },
          { label: 'Day streak',   value: streak },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text)', opacity: 0.65, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Stickers */}
      {earned.length > 0 && (
        <div className="card">
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Stickers</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STICKERS.map(s => {
              const isEarned = earned.includes(s.key)
              return (
                <div key={s.key} title={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, opacity: isEarned ? 1 : 0.25, filter: isEarned ? 'none' : 'grayscale(1)' }}>
                  <span style={{ fontSize: 22 }}>{s.emoji}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--muted)', textAlign: 'center', maxWidth: 44, lineHeight: 1.2 }}>{s.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Notebooks */}
      {collections.length > 0 && (
        <div className="card">
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Notebooks</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {collections.map(c => {
              const count = entries.filter(e => e.collectionId === c.id).length
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{c.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{count} entries</span>
                  <button onClick={() => deleteCollection(c.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--muted)', padding: '2px 4px' }}>×</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionLabel>Preferences</SectionLabel>

        <Row label="Dark mode" sub="Also tap ☀ in the header">
          <button className={`toggle ${darkMode ? 'on' : ''}`} onClick={toggleDarkMode} />
        </Row>
        <Divider />

        {/* Themes */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Theme</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {THEMES.map(t => (
              <button key={t.key} onClick={() => setTheme(t.key as ThemeKey)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 10px', borderRadius: 12, border: `2px solid ${theme === t.key ? 'var(--sage)' : 'var(--border)'}`, background: theme === t.key ? 'var(--sage-light)' : 'var(--cream)', cursor: 'pointer' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: t.vanilla, border: `3px solid ${t.sage}` }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)' }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Divider />

        {/* Word count goal */}
        <Row label="Daily word goal" sub="Track your writing progress">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
              placeholder="0"
              style={{ width: 60, padding: '5px 8px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'Quicksand', fontSize: 12, fontWeight: 700, color: 'var(--text)', background: 'var(--white)', outline: 'none', textAlign: 'center' }}
              onFocus={e => e.target.style.borderColor = 'var(--sage)'}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; setWordCountGoal(parseInt(goalInput) || 0) }} />
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>w/day</span>
          </div>
        </Row>
        <Divider />

        {/* Daily reminder */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Daily reminder</p>
          <p style={{ fontSize: 10, color: 'var(--text)', opacity: 0.5, marginBottom: 8 }}>Get a nudge to write each day</p>
          {permission === 'unsupported' ? (
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Notifications not supported on this browser</p>
          ) : permission === 'denied' ? (
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Notifications blocked — enable them in browser settings</p>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="time" value={reminderTime}
                onChange={async e => {
                  setReminderTime(e.target.value)
                  if (e.target.value) {
                    const [h, m] = e.target.value.split(':').map(Number)
                    scheduleReminder(h, m)
                                  } else {
                    clearReminder()
                                  }
                }}
                style={{ flex: 1, padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontFamily: 'Quicksand', fontSize: 13, fontWeight: 600, color: 'var(--text)', background: 'var(--white)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--sage)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              {reminderTime && (
                <button onClick={() => { setReminderTime(''); clearReminder() }}
                  style={{ padding: '8px 12px', background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontFamily: 'Quicksand', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                  Clear
                </button>
              )}
            </div>
          )}
          {permission === 'granted' && reminderTime && (
            <p style={{ fontSize: 10, color: 'var(--sage-mid)', fontWeight: 600, marginTop: 6 }}>
              ✓ Reminder set for {reminderTime} · opens within 30 min window
            </p>
          )}
        </div>
      </div>

      {/* Data */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionLabel>Your data</SectionLabel>
        <Row label="Export as JSON" sub="Full backup, re-importable">
          <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={handleExportJSON}>↓ JSON</button>
        </Row>
        <Divider />
        <Row label="Export as Markdown" sub="Readable in any text editor">
          <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={handleExportMarkdown}>↓ .md</button>
        </Row>
        <Divider />
        <Row label="Export as PDF" sub="Beautiful formatted journal">
          <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={handleExportPDF}>↓ PDF</button>
        </Row>
        <Divider />
        <Row label="Import backup" sub="Merge from a JSON backup file">
          <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => fileInputRef.current?.click()}>↑ Import</button>
        </Row>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      <HelpGuide />

      <div style={{ height: 4 }} />
      <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--muted)', paddingBottom: 8 }}>
        Made for Ammu with ❤️ by Umo
      </p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{children}</p>
}
function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
}
function Row({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{label}</p>
        <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{sub}</p>
      </div>
      {children}
    </div>
  )
}
