import { useMemo } from 'react'
import { useStore } from '@/store/useStore'

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from',
  'is','are','was','were','be','been','being','have','has','had','do','does','did',
  'will','would','could','should','may','might','can','i','me','my','we','our','you',
  'your','he','she','it','they','them','their','this','that','these','those','what',
  'so','if','as','up','out','about','into','than','then','when','there','just','not',
  'also','more','very','really','like','get','got','went','went','day','time','today',
  'felt','feel','feeling','know','think','thought','want','wanted','said','make','made',
  'still','back','its','its','even','much','too','how','all','one','two','some','been',
])

export function WordCloud() {
  const { entries } = useStore()

  const words = useMemo(() => {
    const freq: Record<string, number> = {}
    entries.forEach(e => {
      e.content.toLowerCase()
        .replace(/[^a-z\s']/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !STOP_WORDS.has(w))
        .forEach(w => { freq[w] = (freq[w] ?? 0) + 1 })
    })
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
  }, [entries])

  if (words.length === 0) return (
    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>
      <p style={{ fontSize: 13, fontWeight: 700 }}>Write more entries to see your word cloud ✿</p>
    </div>
  )

  const max = words[0][1]
  const min = words[words.length - 1][1]

  const COLORS = ['var(--sage)', 'var(--rose)', '#F6C95E', '#B8A0D8', '#89A8C8', '#E8825A']

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', padding: '8px 4px', alignItems: 'center' }}>
      {words.map(([word, count], i) => {
        const t = max === min ? 0.5 : (count - min) / (max - min)
        const size = 11 + Math.round(t * 16) // 11px to 27px
        const color = COLORS[i % COLORS.length]
        const opacity = 0.55 + t * 0.45
        return (
          <span key={word} style={{
            fontSize: size, fontWeight: size > 18 ? 700 : 600,
            color, opacity,
            lineHeight: 1.3,
            cursor: 'default',
            transition: 'opacity 0.2s',
          }}
            title={`${count} time${count !== 1 ? 's' : ''}`}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = String(opacity)}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}
