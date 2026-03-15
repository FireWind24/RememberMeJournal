import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { EntryCard } from './EntryCard'
import { SearchBar } from './index'

export function EntriesList() {
  const { collections, activeCollection, setActiveCollection, showFavoritesOnly, setShowFavoritesOnly, getFilteredEntries, searchQuery, setSearchQuery, dateFilter, setDateFilter, dateFilterFrom, setDateFilterFrom, dateFilterTo, setDateFilterTo, entries: allEntries } = useStore()
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColEmoji, setNewColEmoji] = useState('📓')
  const { addCollection } = useStore()
  const entries = getFilteredEntries()

  const handleAddCollection = () => {
    if (!newColName.trim()) return
    addCollection(newColName.trim(), newColEmoji)
    setNewColName(''); setNewColEmoji('📓'); setShowNewCollection(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="animate-fade-up">
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setActiveCollection(null) }}
          style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${showFavoritesOnly ? 'var(--rose)' : 'var(--border)'}`, background: showFavoritesOnly ? 'var(--rose-light)' : 'transparent', fontFamily: 'Quicksand', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: showFavoritesOnly ? 'var(--rose)' : 'var(--text)' }}>
          ♥ Favorites <span style={{ opacity: 0.6, fontWeight: 600 }}>({allEntries.filter(e => e.isFavorite).length})</span>
        </button>
        <button onClick={() => { setActiveCollection(null); setShowFavoritesOnly(false) }}
          style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${!activeCollection && !showFavoritesOnly ? 'var(--sage)' : 'var(--border)'}`, background: !activeCollection && !showFavoritesOnly ? 'var(--sage-light)' : 'transparent', fontFamily: 'Quicksand', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--text)' }}>
          All
        </button>
        {collections.map(c => (
          <button key={c.id} onClick={() => { setActiveCollection(c.id); setShowFavoritesOnly(false) }}
            style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${activeCollection === c.id ? 'var(--sage)' : 'var(--border)'}`, background: activeCollection === c.id ? 'var(--sage-light)' : 'transparent', fontFamily: 'Quicksand', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--text)' }}>
            {c.emoji} {c.name} <span style={{ opacity: 0.6, fontWeight: 600 }}>({allEntries.filter(e => e.collectionId === c.id).length})</span>
          </button>
        ))}
        <button onClick={() => setShowNewCollection(!showNewCollection)}
          style={{ padding: '4px 10px', borderRadius: 20, border: '1.5px dashed var(--border)', background: 'transparent', fontFamily: 'Quicksand', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--muted)' }}>
          + notebook
        </button>
      </div>

      {/* Date filter — compact dropdown */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowDateFilter(!showDateFilter)}
          style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${dateFilter !== 'all' ? 'var(--sage)' : 'var(--border)'}`, background: dateFilter !== 'all' ? 'var(--sage-light)' : 'transparent', fontFamily: 'Quicksand', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 5 }}>
          🗓 {dateFilter === 'all' ? 'All time' : dateFilter === '7d' ? 'Last 7 days' : dateFilter === '30d' ? 'Last 30 days' : dateFilter === '90d' ? 'Last 90 days' : `${dateFilterFrom ?? '…'} → ${dateFilterTo ?? '…'}`}
          <span style={{ fontSize: 9 }}>{showDateFilter ? '▲' : '▼'}</span>
        </button>

        {showDateFilter && (
          <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 100, background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '8px', boxShadow: '0 8px 24px rgba(74,63,74,0.14)', minWidth: 180 }}>
            {(['all','7d','30d','90d','custom'] as const).map(f => (
              <button key={f} onClick={() => { setDateFilter(f); if (f !== 'custom') setShowDateFilter(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 9, border: 'none', background: dateFilter === f ? 'var(--sage-light)' : 'transparent', fontFamily: 'Quicksand', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: dateFilter === f ? 'var(--sage-mid)' : 'var(--text)' }}>
                {f === 'all' ? '✦ All time' : f === '7d' ? 'Last 7 days' : f === '30d' ? 'Last 30 days' : f === '90d' ? 'Last 90 days' : '📅 Custom range'}
              </button>
            ))}
            {dateFilter === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 4px 2px' }}>
                <input type="date" value={dateFilterFrom ?? ''} onChange={e => setDateFilterFrom(e.target.value || null)}
                  style={{ padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 9, fontFamily: 'Quicksand', fontSize: 12, fontWeight: 600, color: 'var(--text)', background: 'var(--cream)', outline: 'none' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--sage)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                <input type="date" value={dateFilterTo ?? ''} onChange={e => setDateFilterTo(e.target.value || null)}
                  style={{ padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 9, fontFamily: 'Quicksand', fontSize: 12, fontWeight: 600, color: 'var(--text)', background: 'var(--cream)', outline: 'none' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--sage)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                <button onClick={() => setShowDateFilter(false)}
                  style={{ padding: '6px', background: 'var(--sage)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Quicksand', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  Apply
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New collection form */}
      {showNewCollection && (
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', padding: '10px 12px', background: 'var(--white)', borderRadius: 12, border: '1.5px solid var(--border)' }}>
          <input value={newColEmoji} onChange={e => setNewColEmoji(e.target.value)}
            style={{ width: 36, padding: '6px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'Quicksand', fontSize: 16, textAlign: 'center', background: 'var(--cream)', outline: 'none' }} maxLength={2} />
          <input value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="Notebook name"
            onKeyDown={e => e.key === 'Enter' && handleAddCollection()}
            style={{ flex: 1, padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'Quicksand', fontSize: 13, fontWeight: 600, color: 'var(--text)', background: 'var(--cream)', outline: 'none' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--sage)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
          <button onClick={handleAddCollection} style={{ padding: '6px 12px', background: 'var(--sage)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Quicksand', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add</button>
          <button onClick={() => setShowNewCollection(false)} style={{ padding: '6px 8px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✿</div>
          <p style={{ fontSize: 14, fontWeight: 700 }}>
            {showFavoritesOnly ? 'No favorites yet — heart an entry ♥' : 'No entries yet — start writing ✏'}
          </p>
        </div>
      ) : (
        entries.map(e => <EntryCard key={e.id} entry={e} />)
      )}
    </div>
  )
}
