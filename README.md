# Remember Me ✿

> A cross-platform, PWA journaling app with a calm, kawaii aesthetic and smart AI features.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18 + TypeScript | Type-safe, component-driven |
| Bundler | Vite 5 | Fast DX, PWA plugin |
| Styling | Tailwind CSS + CSS custom props | Design tokens, utility classes |
| Animation | CSS keyframes + Framer Motion | Spring physics micro-interactions |
| State | Zustand + `persist` middleware | Lightweight, localStorage-synced |
| Database | Supabase (Postgres + RLS) | Real-time sync, auth, pgvector |
| AI | Claude Sonnet (Anthropic API) | Nudges, tagging, semantic search |
| PWA | vite-plugin-pwa | Offline-first, installable |

---

## Project Structure

```
src/
├── components/
│   ├── index.tsx          # Small reusables: AiNudge, TagPill, SunWidget, LofiBar, etc.
│   ├── MoodPetals.tsx     # Petal mood selector
│   ├── JournalEditor.tsx  # Write tab — textarea + AI analysis
│   ├── EntryCard.tsx      # Single entry display
│   ├── EntriesList.tsx    # Entries tab with search
│   ├── MoodGarden.tsx     # Garden tab — petal calendar + streak + stickers
│   └── Settings.tsx       # Settings/profile tab
├── pages/                 # (extend for multi-page routing)
├── hooks/
│   └── index.ts           # useDebounce, useAutoAnalyze, useGardenData, useStreak, etc.
├── lib/
│   ├── constants.ts       # MOODS, STICKERS, LOFI_TRACKS, AI_NUDGES, AUTO_TAGS
│   ├── utils.ts           # cn(), formatEntryDate, countWords, extractTags, etc.
│   ├── supabase.ts        # Supabase client + typed DB helpers + SQL schema
│   └── ai.ts              # Claude API calls: getAiNudge, smartTag, generatePrompt
├── store/
│   └── useStore.ts        # Zustand store — all app state + actions
├── types/
│   └── index.ts           # All TypeScript types
├── styles/
│   └── globals.css        # Design tokens, component classes, keyframes
├── App.tsx                # Main shell: tabs, nav, header
└── main.tsx               # Entry point
```

---

## Features

### Core
- **Mood Blossom** — pick a petal colour; they form a flower garden over the month
- **AI Kindness Co-Pilot** — Claude suggests a gentle follow-up question as you write
- **Smart Auto-tagging** — NLP tags entries (`#Gratitude`, `#Dream`, `#Work`, etc.)
- **Magic Search** — semantic search across all entries
- **Sticker Book** — earn cute stickers for journaling milestones

### UX
- Bouncy spring animations on all buttons and petals
- Animated sun widget in the header
- Lo-fi radio with 3 modes (Rainy Cafe, Summer Meadow, Deep Focus)
- Word count on the textarea
- Expandable entry cards with delete

### Technical
- **PWA** — installable, offline-capable
- **Zustand + localStorage** — works before auth is set up
- **Supabase RLS** — every user only sees their own data
- **pgvector** — semantic search via embeddings
- **Graceful degradation** — AI features fall back to local logic if API is unavailable

---

## Setup

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Run Supabase schema
# Copy the SQL from src/lib/supabase.ts → SCHEMA_SQL
# Paste into Supabase SQL editor and run

# 4. Dev
npm run dev

# 5. Build
npm run build
```

---

## Extending

### Add a new mood
1. Add to `MOODS` array in `src/lib/constants.ts`
2. Add to `MoodKey` type in `src/types/index.ts`
3. Add to `tailwind.config.js` under `colors.petal`

### Add a new sticker
1. Add to `STICKERS` array in `src/lib/constants.ts`
2. Add `StickerKey` to the union in `src/types/index.ts`
3. Add unlock logic in `checkStickerUnlocks()` in `src/lib/utils.ts`

### Enable real AI nudges
Set `VITE_ANTHROPIC_API_KEY` in `.env.local`. The app auto-upgrades from local keyword matching to Claude API.

### Time Capsule (to implement)
- Add `timeCapsuleDate` field to the editor UI
- Create a Supabase Edge Function that runs daily and emails locked entries on delivery date
- Use Resend or SendGrid for the email

---

## Roadmap

- [ ] Supabase auth (Google + email)
- [ ] Real-time cloud sync
- [ ] Time Capsule email delivery (Supabase Edge Function + Resend)
- [ ] Semantic search via pgvector embeddings
- [ ] Dark mode
- [ ] Export journal as PDF
- [ ] Weekly insight summary (AI-generated)
- [ ] Shared garden (opt-in social feature)
