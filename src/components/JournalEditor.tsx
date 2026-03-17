import { useRef, useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { useSaveEntry } from '@/hooks'
import { MoodPetals } from './MoodPetals'
import { TagPill } from './index'
import { countWords } from '@/lib/utils'
import { haptic } from '@/lib/haptics'
import type { MoodKey } from '@/types'

// ─── Formatting toolbar ───────────────────────────────────────────────────────
function FormatBar({ onFormat }: { onFormat: (type: string) => void }) {
  const btns = [
    { label: 'B', title: 'Bold',          type: 'bold',      style: { fontWeight: 700 } },
    { label: 'I', title: 'Italic',         type: 'italic',    style: { fontStyle: 'italic' } },
    { label: 'U', title: 'Underline',      type: 'underline', style: { textDecoration: 'underline' } },
    { label: '❝', title: 'Quote',          type: 'quote',     style: {} },
    { label: '—', title: 'Divider',        type: 'divider',   style: {} },
  ]
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {btns.map(b => (
        <button key={b.type} title={b.title} onClick={() => onFormat(b.type)}
          style={{ padding: '4px 8px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--white)', cursor: 'pointer', fontFamily: 'Quicksand', fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1, ...b.style }}>
          {b.label}
        </button>
      ))}
    </div>
  )
}

// ─── Entry saved toast ────────────────────────────────────────────────────────
function SavedToast({ show }: { show: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: `translateX(-50%) translateY(${show ? 0 : 20}px)`,
      opacity: show ? 1 : 0, transition: 'all 0.35s var(--spring)',
      background: 'var(--sage)', color: '#fff',
      padding: '10px 20px', borderRadius: 24,
      fontSize: 13, fontWeight: 700,
      boxShadow: '0 4px 20px rgba(74,63,74,0.2)',
      pointerEvents: 'none', zIndex: 300,
      display: 'flex', alignItems: 'center', gap: 7,
      whiteSpace: 'nowrap',
    }}>
      ✿ Entry added!
    </div>
  )
}

export function JournalEditor() {
  const {
    draftContent, draftSubject, draftMood, draftCollectionId, draftTimeCapsuleDate,
    setDraftContent, setDraftSubject, setDraftMood, setDraftCollection, setDraftTimeCapsuleDate,
    currentTags,
    collections, wordCountGoal, entries,
  } = useStore()
  const { handleSave, canSave, isSaving } = useSaveEntry()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showCapsule, setShowCapsule] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const el = textareaRef.current; if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`
  }, [draftContent])

  const words = countWords(draftContent)
  const todayWords = entries
    .filter(e => e.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((a, e) => a + e.wordCount, 0) + words
  const goalProgress = wordCountGoal > 0 ? Math.min(todayWords / wordCountGoal, 1) : 0

  const onThisDay = useStore(s => s.getOnThisDay())

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().slice(0, 10)

  // Apply markdown-style formatting with smart cursor placement
  const handleFormat = (type: string) => {
    const el = textareaRef.current; if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = draftContent.slice(start, end)
    const before = draftContent.slice(0, start)
    const after = draftContent.slice(end)
    const hasSelection = start !== end

    let replacement = ''
    let cursorOffset = 0 // where to place cursor inside the wrapper

    if (type === 'bold') {
      replacement = hasSelection ? `**${selected}**` : `****`
      cursorOffset = hasSelection ? replacement.length : 2
    }
    if (type === 'italic') {
      replacement = hasSelection ? `*${selected}*` : `**`
      cursorOffset = hasSelection ? replacement.length : 1
    }
    if (type === 'underline') {
      replacement = hasSelection ? `__${selected}__` : `____`
      cursorOffset = hasSelection ? replacement.length : 2
    }
    if (type === 'quote') {
      replacement = `\n> ${selected || ''}`
      cursorOffset = replacement.length
    }
    if (type === 'divider') {
      replacement = `\n---\n`
      cursorOffset = replacement.length
    }

    const newContent = before + replacement + after
    setDraftContent(newContent)

    setTimeout(() => {
      el.focus()
      const pos = start + cursorOffset
      el.setSelectionRange(pos, pos)
    }, 0)
    haptic('light')
  }

  const handleSaveWithToast = async () => {
    await handleSave()
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="animate-fade-up">

      {/* On this day */}
      {onThisDay && (
        <div style={{ padding: '10px 14px', background: 'var(--sage-light)', borderRadius: 14, border: '1px solid var(--sage)', cursor: 'pointer' }}
          onClick={() => useStore.getState().setSelectedEntry(onThisDay.id)}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--sage-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
            ✦ On this day {new Date(onThisDay.createdAt).getFullYear()}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
            {onThisDay.subject || onThisDay.content.slice(0, 80)}…
          </p>
        </div>
      )}

      <MoodPetals selected={draftMood} onSelect={(m: MoodKey) => setDraftMood(m)} />

      {/* Subject */}
      <input type="text" placeholder="Title — what's this about? (optional)"
        value={draftSubject} onChange={e => setDraftSubject(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 12, fontFamily: 'Quicksand, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', background: 'var(--white)', outline: 'none', transition: 'border-color 0.2s' }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--sage)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
      />

      {/* Format bar */}
      <FormatBar onFormat={handleFormat} />

      {/* Content */}
      <div style={{ position: 'relative' }}>
        <textarea ref={textareaRef} className="journal-textarea"
          placeholder="What's on your heart today? ✨"
          value={draftContent} onChange={e => setDraftContent(e.target.value)} />
        {words > 0 && (
          <span style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>
            {words}w
          </span>
        )}
      </div>

      {/* Word count goal progress */}
      {wordCountGoal > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>Daily goal</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: goalProgress >= 1 ? 'var(--sage-mid)' : 'var(--muted)' }}>
              {todayWords} / {wordCountGoal}w {goalProgress >= 1 ? '✓' : ''}
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${goalProgress * 100}%`, background: 'var(--sage)', borderRadius: 2, transition: 'width 0.4s var(--ease)' }} />
          </div>
        </div>
      )}

      {/* Tags */}
      {currentTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>Auto-tagged:</span>
          {currentTags.map(tag => <TagPill key={tag} label={tag} />)}
        </div>
      )}

      {/* Bottom row: notebook + time capsule */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {collections.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>📓</span>
            <button onClick={() => setDraftCollection(null)}
              style={{ padding: '3px 9px', borderRadius: 20, border: `1.5px solid ${draftCollectionId === null ? 'var(--sage)' : 'var(--border)'}`, background: draftCollectionId === null ? 'var(--sage-light)' : 'transparent', fontFamily: 'Quicksand', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--text)' }}>
              None
            </button>
            {collections.map(c => (
              <button key={c.id} onClick={() => setDraftCollection(c.id)}
                style={{ padding: '3px 9px', borderRadius: 20, border: `1.5px solid ${draftCollectionId === c.id ? 'var(--sage)' : 'var(--border)'}`, background: draftCollectionId === c.id ? 'var(--sage-light)' : 'transparent', fontFamily: 'Quicksand', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--text)' }}>
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setShowCapsule(!showCapsule)}
          style={{ padding: '5px 11px', borderRadius: 20, border: `1.5px solid ${draftTimeCapsuleDate ? 'var(--rose)' : 'var(--border)'}`, background: draftTimeCapsuleDate ? 'var(--rose-light)' : 'transparent', fontFamily: 'Quicksand', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: draftTimeCapsuleDate ? 'var(--rose)' : 'var(--muted)', whiteSpace: 'nowrap' }}>
          ⏳ {draftTimeCapsuleDate ? `Locked until ${draftTimeCapsuleDate}` : 'Time capsule'}
        </button>
      </div>

      {/* Time capsule date picker */}
      {showCapsule && (
        <div style={{ padding: '12px 14px', background: 'var(--cream-dark)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>⏳ Lock until a future date</p>
          <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, lineHeight: 1.5 }}>
            This entry will be hidden until the date you choose.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" min={minDate} value={draftTimeCapsuleDate ?? ''}
              onChange={e => setDraftTimeCapsuleDate(e.target.value || null)}
              style={{ flex: 1, padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontFamily: 'Quicksand', fontSize: 13, fontWeight: 600, color: 'var(--text)', background: 'var(--white)', outline: 'none' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--sage)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            {draftTimeCapsuleDate && (
              <button onClick={() => { setDraftTimeCapsuleDate(null); setShowCapsule(false) }}
                style={{ padding: '8px 12px', background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontFamily: 'Quicksand', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      <button className={`btn-primary ${isSaving ? 'saved' : ''}`} onClick={handleSaveWithToast} disabled={!canSave}>
        {isSaving ? 'Saving…' : draftTimeCapsuleDate ? '⏳ Save & lock entry' : "Save today's entry ✿"}
      </button>

      <SavedToast show={showToast} />
    </div>
  )
}
