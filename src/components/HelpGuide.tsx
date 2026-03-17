import { useState } from 'react'

interface Section {
  emoji: string
  title: string
  items: { tip: string; detail: string }[]
}

const SECTIONS: Section[] = [
  {
    emoji: '✏',
    title: 'Writing your entries',
    items: [
      { tip: 'Give it a title', detail: 'The little title field at the top is optional but it makes your entries so much easier to find later. Even just a few words like "rough day" or "something good happened" works.' },
      { tip: 'Pick a mood first', detail: 'Tap one of the six mood petals before you write — joyful, calm, sad, loved, fired up, or dreamy. It colors your garden and helps you see patterns over time.' },
      { tip: 'Formatting while writing', detail: 'You can use simple markdown as you type. Wrap words in **double stars** to make them bold, *single stars* for italic, and __double underscores__ to underline. When you read the entry it'll look beautiful.' },
      { tip: 'Word goal', detail: 'Set a daily word goal in the You tab and a little progress bar shows up as you write. Even 50 words a day adds up to something real.' },
      { tip: 'Time capsule', detail: 'Tap the ⏳ button before saving to lock an entry until a future date. You won\'t be able to read it until then — it\'s like writing a letter to your future self.' },
      { tip: 'Assign a notebook', detail: 'If you have notebooks set up, you can assign the entry to one before saving. Great for keeping dreams, gratitude, or work thoughts separate.' },
    ]
  },
  {
    emoji: '✦',
    title: 'Your entries',
    items: [
      { tip: 'Open an entry', detail: 'Just tap any card to open and read it in full.' },
      { tip: 'Heart it', detail: 'Tap the little ♡ on any card to favorite it. Then filter by favorites using the ♥ Favorites button at the top.' },
      { tip: 'Edit or delete', detail: 'Open an entry and scroll to the bottom — you\'ll see Edit and Delete buttons there.' },
      { tip: 'Close the entry', detail: 'Either tap the × button, tap outside the card, or grab the little bar at the top and drag it down.' },
      { tip: 'Filter by date', detail: 'Tap the 🗓 button to filter entries by last 7 days, 30 days, 90 days, or pick a custom range.' },
      { tip: 'Search', detail: 'The search bar at the top finds entries by words in the content, title, or tags.' },
    ]
  },
  {
    emoji: '📓',
    title: 'Notebooks',
    items: [
      { tip: 'Create a notebook', detail: 'Go to Entries, tap "+ notebook", give it an emoji and a name. Think of them like folders — Dreams, Gratitude, Rants, whatever you want.' },
      { tip: 'Assign entries', detail: 'When writing, tap the 📓 row to assign the entry to a notebook before saving.' },
      { tip: 'Filter by notebook', detail: 'In Entries, tap any notebook name in the filter row to see only those entries.' },
    ]
  },
  {
    emoji: '❀',
    title: 'Your garden',
    items: [
      { tip: 'Monthly view', detail: 'The default view shows this month as a calendar. Each day you write gets colored by your mood. Today has a little ring around it.' },
      { tip: 'Year in pixels', detail: 'Tap 🗓 Year to see your entire year at a glance — one tiny square per day, colored by mood. Swipe left to see past years.' },
      { tip: 'Word cloud', detail: 'Tap ☁ Words to see the words you write most often, sized by how frequently they appear.' },
      { tip: 'Stickers', detail: 'You earn stickers for milestones — first entry, writing streaks, using all moods, writing late at night, and more. They show in the garden once you unlock them.' },
    ]
  },
  {
    emoji: '☽',
    title: 'Your space (settings)',
    items: [
      { tip: 'Your name', detail: 'Type your name in the profile section and the Write tab will greet you — "Good morning, Ammu ✿" — based on the time of day.' },
      { tip: 'Themes', detail: 'Pick from Vanilla, Lavender, Ocean, Forest, or Peach. Each one has its own light and dark palette. Your choice is saved.' },
      { tip: 'Dark mode', detail: 'Tap the ☀ button in the header anytime, or toggle it in Settings. It remembers your preference.' },
      { tip: 'Daily reminder', detail: 'Set a time and the app will remind you to write when you open it around that hour.' },
      { tip: 'Weekly recap', detail: 'Every week you\'ll see a little summary of how you felt, how many words you wrote, and your streak.' },
      { tip: 'Export your journal', detail: 'Go to Your data and export as JSON (to back up and re-import) or Markdown (to read anywhere, like in Notes or Notion).' },
      { tip: 'Import a backup', detail: 'If you have a JSON backup, tap Import to merge it back in. It won\'t create duplicates.' },
    ]
  },
  {
    emoji: '✿',
    title: 'Little things worth knowing',
    items: [
      { tip: 'It works offline', detail: 'You can write entries even without internet. They save on your phone and sync to the cloud automatically when you\'re back online.' },
      { tip: 'Add to home screen', detail: 'Open the app in your browser, tap the share button, and choose "Add to Home Screen" — it\'ll feel like a real app with its own icon.' },
      { tip: 'Streak', detail: 'Write at least one entry every day to keep your streak going. Miss a day and it resets. Hit 7, 14, or 30 days and something special happens 🎉' },
      { tip: 'Tags are automatic', detail: 'The app reads what you write and quietly adds tags like #Gratitude, #Dream, #Work, #Anxiety without you doing anything.' },
    ]
  },
]

export function HelpGuide() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <button
        onClick={() => setOpen(open ? null : 'open')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textAlign: 'left' }}>How to use this app</p>
          <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textAlign: 'left' }}>Everything you need to know ✿</p>
        </div>
        <span style={{ fontSize: 16, color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>

      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SECTIONS.map(section => (
            <div key={section.title}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--sage-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                {section.emoji} {section.title}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.items.map(item => (
                  <div key={item.tip} style={{ paddingLeft: 10, borderLeft: '2px solid var(--sage-light)' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{item.tip}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, lineHeight: 1.6 }}>{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 4, padding: '12px 14px', background: 'var(--sage-light)', borderRadius: 12, border: '1px solid var(--sage)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--sage-mid)', marginBottom: 4 }}>One more thing ✿</p>
            <p style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600, lineHeight: 1.6 }}>
              This app was made just for you, with a lot of love. Write freely, write honestly, write badly — none of it has to be perfect. It's just yours.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
