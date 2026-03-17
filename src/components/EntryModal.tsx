import { useEffect } from 'react'
import React from 'react'
import { useStore } from '@/store/useStore'
import { useDeleteEntry } from '@/hooks/useSupabaseSync'
import { MOOD_MAP, MOODS } from '@/lib/constants'
import { countWords } from '@/lib/utils'
import { TagPill } from './index'
import { format } from 'date-fns'


function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Divider
    if (line.trim() === '---') return <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
    // Blockquote
    if (line.startsWith('> ')) {
      const content = line.slice(2)
      return <blockquote key={i} style={{ borderLeft: '3px solid var(--sage)', paddingLeft: 12, margin: '4px 0', color: 'var(--muted)', fontStyle: 'italic', fontSize: 13 }}>{content}</blockquote>
    }
    // Inline formatting: bold, italic, underline
    const parts: React.ReactNode[] = []
    let remaining = line
    let key = 0
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/)
      const italicMatch = remaining.match(/^(.*?)\*(.+?)\*/)
      const underlineMatch = remaining.match(/^(.*?)__(.+?)__/)
      const matches = [boldMatch, italicMatch, underlineMatch].filter(Boolean) as RegExpMatchArray[]
      if (matches.length === 0) { parts.push(<span key={key++}>{remaining}</span>); break }
      const first = matches.sort((a, b) => a[1].length - b[1].length)[0]
      if (first[1]) parts.push(<span key={key++}>{first[1]}</span>)
      if (first === boldMatch)      parts.push(<strong key={key++} style={{ fontWeight: 700 }}>{first[2]}</strong>)
      else if (first === italicMatch)   parts.push(<em key={key++}>{first[2]}</em>)
      else if (first === underlineMatch) parts.push(<u key={key++}>{first[2]}</u>)
      remaining = remaining.slice(first[1].length + first[0].length - first[1].length)
    }
    return <p key={i} style={{ margin: '2px 0', lineHeight: 1.8 }}>{parts}</p>
  })
}

export function EntryModal() {
  const handleDelete = useDeleteEntry()
  const { updateEntry } = useStore()
  const {
    entries, selectedEntryId, setSelectedEntry, toggleFavorite,
    editingEntryId, editContent, editSubject, editMood,
    startEditing, cancelEditing, setEditContent, setEditSubject, setEditMood, saveEdit,
    collections,
  } = useStore()

  const entry = entries.find(e => e.id === selectedEntryId)

  // Mark time capsule as delivered once opened
  useEffect(() => {
    if (entry?.timeCapsuleDate && new Date(entry.timeCapsuleDate) <= new Date() && !entry.timeCapsuleDelivered) {
      updateEntry(entry.id, { timeCapsuleDelivered: true })
    }
  }, [entry?.id])

  if (!entry) return null

  const mood      = entry.mood ? MOOD_MAP[entry.mood] : null
  const isEditing = editingEntryId === entry.id
  const createdAt = new Date(entry.createdAt)
  const updatedAt = new Date(entry.updatedAt)
  const wasEdited = entry.updatedAt !== entry.createdAt
  const collection = collections.find(c => c.id === entry.collectionId)

  return (
    <div className="entry-overlay" onClick={e => { if (e.target === e.currentTarget) { cancelEditing(); setSelectedEntry(null) } }}>
      <div className="entry-modal">
        <div style={{ width: 32, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 14px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
              {format(createdAt, 'EEEE, MMMM d yyyy')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>🕐 {format(createdAt, 'h:mm a')}</span>
              {mood && (
                <span style={{ fontSize: 11, color: mood.color, fontWeight: 700, background: `${mood.color}22`, padding: '2px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50% 50% 0 50%', background: mood.color, display: 'inline-block' }} />
                  {mood.label}
                </span>
              )}
              {collection && (
                <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, background: 'var(--cream-dark)', padding: '2px 7px', borderRadius: 20 }}>
                  {collection.emoji} {collection.name}
                </span>
              )}
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{countWords(entry.content)}w</span>
              {wasEdited && <span style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>edited {format(updatedAt, 'MMM d')}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => toggleFavorite(entry.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: entry.isFavorite ? 'var(--rose)' : 'var(--muted)', padding: 0 }}>
              {entry.isFavorite ? '♥' : '♡'}
            </button>
            <button onClick={() => { cancelEditing(); setSelectedEntry(null) }}
              style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--sage-light)', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              ×
            </button>
          </div>
        </div>

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {MOODS.map(m => (
                <button key={m.key} onClick={() => setEditMood(m.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20,
                  border: `1.5px solid ${editMood === m.key ? m.color : 'var(--border)'}`,
                  background: editMood === m.key ? `${m.color}22` : 'var(--white)',
                  cursor: 'pointer', fontFamily: 'Quicksand', fontSize: 12, fontWeight: 700, color: 'var(--text)',
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50% 50% 0 50%', background: m.color, display: 'inline-block', flexShrink: 0 }} />
                  {m.label}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Title (optional)" value={editSubject} onChange={e => setEditSubject(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 11, fontFamily: 'Quicksand', fontSize: 14, fontWeight: 700, color: 'var(--text)', background: 'var(--white)', outline: 'none' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--sage)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
              className="journal-textarea" style={{ minHeight: 140, resize: 'vertical' }} autoFocus />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={cancelEditing} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={saveEdit} className="btn-primary" style={{ flex: 2 }} disabled={!editContent.trim()}>Save changes</button>
            </div>
          </div>
        ) : (
          <>
            {/* Time capsule unlock banner */}
            {entry.timeCapsuleDate && new Date(entry.timeCapsuleDate) <= new Date() && !entry.timeCapsuleDelivered && (
              <div style={{ padding: '12px 14px', background: 'var(--rose-light)', border: '1.5px solid var(--rose)', borderRadius: 12, marginBottom: 14, textAlign: 'center' }}>
                <p style={{ fontSize: 20, marginBottom: 4 }}>🎉</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--rose)' }}>Your time capsule just unlocked!</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 3 }}>
                  Written {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · opened today ✨
                </p>
              </div>
            )}
            {entry.timeCapsuleDate && new Date(entry.timeCapsuleDate) > new Date() && (
              <div style={{ padding: '10px 14px', background: 'var(--cream-dark)', borderRadius: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>⏳</span>
                <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                  Locked until {new Date(entry.timeCapsuleDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
            {entry.subject && (
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10, lineHeight: 1.3 }}>{entry.subject}</p>
            )}
            <div style={{ fontSize: 14, color: 'var(--text)', wordBreak: 'break-word', marginBottom: 14 }}>
              {renderMarkdown(entry.content)}
            </div>
            {entry.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {entry.tags.map(t => <TagPill key={t} label={t} />)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => startEditing(entry.id)} className="btn-secondary" style={{ flex: 1 }}>✏ Edit</button>
              <button onClick={() => { handleDelete(entry.id); setSelectedEntry(null) }}
                style={{ flex: 1, padding: '10px', background: 'var(--rose-light)', color: 'var(--rose)', border: 'none', borderRadius: 11, cursor: 'pointer', fontFamily: 'Quicksand', fontSize: 13, fontWeight: 700 }}>
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
