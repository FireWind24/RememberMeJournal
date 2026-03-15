import { STICKERS } from '@/lib/constants'
import type { StickerKey } from '@/types'

// AiNudge
interface AiNudgeProps { nudge: string; isLoading?: boolean }
export function AiNudge({ nudge, isLoading }: AiNudgeProps) {
  if (isLoading) return (
    <div className="nudge-box">
      <span style={{ fontSize: 14, flexShrink: 0 }}>🌿</span>
      <div className="skeleton" style={{ height: 14, flex: 1, borderRadius: 6 }} />
    </div>
  )
  return (
    <div className="nudge-box animate-nudge-in">
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🌿</span>
      <p style={{ fontSize: 12, color: 'var(--sage-mid)', fontWeight: 600, lineHeight: 1.5 }}>{nudge}</p>
    </div>
  )
}

// TagPill
interface TagPillProps { label: string; variant?: 'sage' | 'rose' }
export function TagPill({ label, variant = 'sage' }: TagPillProps) {
  return <span className={`tag-pill ${variant === 'rose' ? 'rose' : ''}`}>{label}</span>
}

// StickerBadge
interface StickerBadgeProps { stickerKey: StickerKey; earned?: boolean; delay?: number }
export function StickerBadge({ stickerKey, earned = false, delay = 0 }: StickerBadgeProps) {
  const meta = STICKERS.find(s => s.key === stickerKey)
  if (!meta) return null
  return (
    <div
      title={`${meta.label}: ${meta.description}`}
      style={{ fontSize: 22, opacity: earned ? 1 : 0.18, transition: 'transform 0.2s, opacity 0.3s', animationDelay: `${delay}ms`, cursor: 'default' }}
      className={earned ? 'animate-sticker-pop' : ''}
    >
      {meta.emoji}
    </div>
  )
}

// NewStickerToast
interface ToastProps { stickerKey: StickerKey; onClose: () => void }
export function NewStickerToast({ stickerKey, onClose }: ToastProps) {
  const meta = STICKERS.find(s => s.key === stickerKey)
  if (!meta) return null
  return (
    <div className="sticker-toast" onClick={onClose}>
      <span style={{ fontSize: 24 }} className="animate-sticker-pop">{meta.emoji}</span>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>New sticker!</p>
        <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{meta.label}</p>
      </div>
    </div>
  )
}

// SearchBar
interface SearchBarProps { value: string; onChange: (v: string) => void; placeholder?: string }
export function SearchBar({ value, onChange, placeholder = 'Search entries...' }: SearchBarProps) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--muted)', pointerEvents: 'none' }}>🔍</span>
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
        onFocus={e => (e.target.style.borderColor = 'var(--sage)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}
