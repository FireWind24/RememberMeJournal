import { useStore } from '@/store/useStore'
import { TagPill } from './index'
import { countWords } from '@/lib/utils'
import { MOOD_MAP } from '@/lib/constants'
import { format } from 'date-fns'
import { haptic } from '@/lib/haptics'
import type { JournalEntry } from '@/types'

export function EntryCard({ entry }: { entry: JournalEntry }) {
  const { setSelectedEntry, toggleFavorite } = useStore()
  const mood = entry.mood ? MOOD_MAP[entry.mood] : null
  const createdAt = new Date(entry.createdAt)

  // Time capsule locked
  const isLocked = !!entry.timeCapsuleDate && new Date(entry.timeCapsuleDate) > new Date()
  if (isLocked) {
    return (
      <div className="card animate-fade-up" style={{ opacity: 0.7, cursor: 'default', border: '1.5px dashed var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>⏳</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Time capsule</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
              Unlocks {new Date(entry.timeCapsuleDate!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="card animate-fade-up"
      onClick={() => setSelectedEntry(entry.id)}
      style={{ cursor: 'pointer', transition: 'transform 0.15s var(--spring), box-shadow 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(74,63,74,0.09)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
    >
      {/* Date + mood + favorite */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
        {mood && <div style={{ width: 10, height: 10, borderRadius: '50% 50% 0 50%', background: mood.color, flexShrink: 0 }} />}
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
          {format(createdAt, 'EEE, MMM d')} · {format(createdAt, 'h:mm a')}
        </span>
        {mood && (
          <span style={{ fontSize: 9, color: mood.color, fontWeight: 700, background: `${mood.color}22`, padding: '2px 6px', borderRadius: 20 }}>
            {mood.label}
          </span>
        )}
        <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto' }}>{countWords(entry.content)}w</span>
        <button
          onClick={e => { e.stopPropagation(); toggleFavorite(entry.id); haptic('light') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0, color: entry.isFavorite ? 'var(--rose)' : 'var(--border)', transition: 'color 0.2s' }}>
          {entry.isFavorite ? '♥' : '♡'}
        </button>
      </div>

      {entry.subject && (
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{entry.subject}</p>
      )}

      <p style={{ fontSize: 13, lineHeight: 1.55, color: entry.subject ? 'var(--muted)' : 'var(--text)', marginBottom: entry.tags.length ? 7 : 0 }}>
        {entry.content.slice(0, 110)}{entry.content.length > 110 && '…'}
      </p>

      {entry.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {entry.tags.map(t => <TagPill key={t} label={t} />)}
        </div>
      )}
    </div>
  )
}
