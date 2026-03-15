import { MOODS } from '@/lib/constants'
import type { MoodKey } from '@/types'

interface Props { selected: MoodKey | null; onSelect: (m: MoodKey) => void }

export function MoodPetals({ selected, onSelect }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
        How are you feeling?
      </span>
      <div className="mood-grid">
        {MOODS.map(mood => {
          const sel = selected === mood.key
          return (
            <button
              key={mood.key}
              onClick={() => onSelect(mood.key)}
              aria-pressed={sel}
              className={`mood-option ${sel ? 'selected' : ''}`}
              style={{ borderColor: sel ? mood.color : 'var(--border)', background: sel ? `${mood.color}18` : 'var(--white)' }}
            >
              <div className="mood-petal" style={{ background: mood.color }} />
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{mood.label}</div>
                <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600, lineHeight: 1.2 }}>{mood.description}</div>
              </div>
            </button>
          )
        })}
      </div>
      {selected && (
        <p style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: MOODS.find(m => m.key === selected)?.color, animation: 'fadeUp 0.3s var(--spring)' }}>
          {MOODS.find(m => m.key === selected)?.prompt}
        </p>
      )}
    </div>
  )
}
