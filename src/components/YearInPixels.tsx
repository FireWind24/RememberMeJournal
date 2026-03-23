import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { MOOD_MAP } from '@/lib/constants'
import { format, getDay } from 'date-fns'
import type { MoodKey } from '@/types'

function getDaysInYearCount(year: number) {
  return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365
}

const DOT = 9   // px per dot
const GAP = 3   // px gap

export function YearInPixels() {
  const { entries } = useStore()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const dayMap = new Map<string, MoodKey>()
  entries.forEach(e => {
    const localDate = new Date(e.createdAt)
    const d = localDate.getFullYear() + '-' +
      String(localDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(localDate.getDate()).padStart(2, '0')
    if (localDate.getFullYear() === year && !dayMap.has(d)) {
      if (e.mood) dayMap.set(d, e.mood)
      else dayMap.set(d, '__entry__' as MoodKey)
    }
  })

  const totalDays = getDaysInYearCount(year)
  const startOffset = getDay(new Date(year, 0, 1))

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthOffsets: { label: string; col: number }[] = []
  let col = startOffset
  for (let m = 0; m < 12; m++) {
    monthOffsets.push({ label: MONTHS[m], col: Math.floor(col / 7) })
    col += new Date(year, m + 1, 0).getDate()
  }

  const cells: (null | { key: string; mood: MoodKey | '__entry__' | undefined; isToday: boolean })[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 0; d < totalDays; d++) {
    const date = new Date(year, 0, d + 1)
    const key = format(date, 'yyyy-MM-dd')
    cells.push({ key, mood: dayMap.get(key), isToday: key === format(new Date(), 'yyyy-MM-dd') })
  }

  const totalCols = Math.ceil(cells.length / 7)
  const gridWidth = totalCols * (DOT + GAP) - GAP

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Year nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => setYear(y => y - 1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--muted)', padding: '4px 8px' }}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{year}</span>
        <button onClick={() => setYear(y => Math.min(y + 1, currentYear))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: year >= currentYear ? 'var(--border)' : 'var(--muted)', padding: '4px 8px' }}
          disabled={year >= currentYear}>›</button>
      </div>

      {/* Scrollable grid */}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ width: gridWidth, minWidth: gridWidth }}>

          {/* Month labels */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${totalCols}, ${DOT}px)`, gap: GAP, marginBottom: 4 }}>
            {Array.from({ length: totalCols }, (_, i) => {
              const mo = monthOffsets.find(m => m.col === i)
              return (
                <div key={i} style={{ fontSize: 7, fontWeight: 700, color: 'var(--muted)', textAlign: 'center', height: 10, whiteSpace: 'nowrap', overflow: 'visible' }}>
                  {mo ? mo.label : ''}
                </div>
              )
            })}
          </div>

          {/* Dot grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${totalCols}, ${DOT}px)`,
            gridTemplateRows: `repeat(7, ${DOT}px)`,
            gap: GAP,
            gridAutoFlow: 'column',
          }}>
            {cells.map((cell, i) => {
              if (!cell) return (
                <div key={`pad-${i}`} style={{ width: DOT, height: DOT, borderRadius: 2 }} />
              )
              const { mood, isToday, key } = cell
              const hasEntry = !!mood
              const bg = !hasEntry
                ? 'var(--border)'
                : mood === '__entry__'
                ? 'var(--muted)'
                : MOOD_MAP[mood]?.color ?? 'var(--sage)'

              return (
                <div key={key}
                  title={`${key}${hasEntry ? ' ✓' : ''}`}
                  style={{
                    width: DOT, height: DOT,
                    borderRadius: 2,
                    background: bg,
                    opacity: hasEntry ? 1 : 0.3,
                    outline: isToday ? `2px solid var(--sage)` : 'none',
                    outlineOffset: 1,
                    transition: 'opacity 0.15s, transform 0.15s',
                    cursor: hasEntry ? 'pointer' : 'default',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.opacity = '1'
                    if (hasEntry) el.style.transform = 'scale(1.3)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.opacity = hasEntry ? '1' : '0.3'
                    el.style.transform = ''
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 2 }}>
        {Object.values(MOOD_MAP).map(m => (
          <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: DOT, height: DOT, borderRadius: 2, background: m.color }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)' }}>{m.label}</span>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
          {dayMap.size} / {totalDays} days in {year}
        </span>
      </div>
    </div>
  )
}
