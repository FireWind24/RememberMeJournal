import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { useStreak } from '@/hooks'
import { MOOD_MAP, STICKERS } from '@/lib/constants'
import { format, getDaysInMonth, getDay } from 'date-fns'
import { YearInPixels } from './YearInPixels'
import { WordCloud } from './WordCloud'
import type { MoodKey } from '@/types'

const DAY_LABELS = ['S','M','T','W','T','F','S']

type GardenTab = 'month' | 'year' | 'words'

export function MoodGarden() {
  const { entries, selectedGardenMonth, setGardenMonth } = useStore()
  const streak    = useStreak()
  const earned    = useStore(s => s.getDisplayStickers())
  const { year, month } = selectedGardenMonth
  const [tab, setTab] = useState<GardenTab>('month')

  const todayDay    = new Date().getDate()
  const isThisMonth = new Date().getFullYear() === year && new Date().getMonth() === month
  const daysCount   = getDaysInMonth(new Date(year, month, 1))
  const startOffset = getDay(new Date(year, month, 1))

  const dayMap = new Map<number, MoodKey>()
  entries.forEach(e => {
    const d = new Date(e.createdAt)
    if (d.getFullYear() === year && d.getMonth() === month && e.mood) {
      if (!dayMap.has(d.getDate())) dayMap.set(d.getDate(), e.mood)
    }
  })

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysCount; d++) cells.push(d)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="animate-fade-up">

      {/* Streak */}
      {streak > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--sage-light)', borderRadius: 14, border: '1px solid var(--sage)' }}>
          <span style={{ fontSize: 20 }}>🔥</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{streak} day streak</p>
            <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>Keep writing every day ✿</p>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, background: 'var(--cream-dark)', borderRadius: 12, padding: 4 }}>
        {([['month','🌸 Month'],['year','🗓 Year'],['words','☁ Words']] as [GardenTab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, padding: '7px 4px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'Quicksand', fontSize: 12, fontWeight: 700,
              background: tab === key ? 'var(--white)' : 'transparent',
              color: tab === key ? 'var(--text)' : 'var(--muted)',
              boxShadow: tab === key ? '0 1px 4px rgba(74,63,74,0.08)' : 'none',
              transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'month' && (
        <div className="card" style={{ padding: '14px 12px' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={() => { const d = new Date(year, month - 1, 1); setGardenMonth(d.getFullYear(), d.getMonth()) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--muted)', padding: '4px 8px' }}>‹</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{format(new Date(year, month, 1), 'MMMM yyyy')}</span>
            <button onClick={() => { const d = new Date(year, month + 1, 1); setGardenMonth(d.getFullYear(), d.getMonth()) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--muted)', padding: '4px 8px' }}>›</button>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {DAY_LABELS.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'var(--muted)', paddingBottom: 2 }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const mood = dayMap.get(day)
              const isToday = isThisMonth && day === todayDay
              const bg = mood ? MOOD_MAP[mood]?.color : 'var(--cream-dark)'
              return (
                <div key={day} style={{
                  aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: mood ? bg : 'var(--cream-dark)',
                  opacity: mood ? 0.85 : 0.5,
                  outline: isToday ? '2px solid var(--sage)' : 'none', outlineOffset: 1,
                  position: 'relative',
                }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: mood ? '#fff' : 'var(--muted)' }}>{day}</span>
                </div>
              )
            })}
          </div>

          {/* Mood legend */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, justifyContent: 'center' }}>
            {Object.values(MOOD_MAP).map(m => (
              <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)' }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'year' && (
        <div className="card" style={{ padding: '14px 12px', overflowX: 'auto' }}>
          <YearInPixels />
        </div>
      )}

      {tab === 'words' && (
        <div className="card" style={{ padding: '14px 12px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Your most written words</p>
          <WordCloud />
        </div>
      )}

      {/* Stickers */}
      {earned.length > 0 && (
        <div className="card">
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Stickers earned</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {earned.map(key => {
              const s = STICKERS.find(x => x.key === key)
              return s ? (
                <div key={key} title={s.description} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 24 }}>{s.emoji}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--muted)', textAlign: 'center', maxWidth: 44 }}>{s.label}</span>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}
