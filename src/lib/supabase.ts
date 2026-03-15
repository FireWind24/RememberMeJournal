/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'
import type { JournalEntry, UserProfile } from '@/types'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = (supabaseUrl && supabaseAnon)
  ? createClient(supabaseUrl, supabaseAnon)
  : null

export const isSupabaseConfigured = !!supabase

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  if (!supabase) return { error: 'Supabase not configured' }
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) return { error: 'Supabase not configured' }
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) return { error: 'Supabase not configured' }
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  if (!supabase) return
  return supabase.auth.signOut()
}

export async function getCurrentUser() {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ─── Entries CRUD ─────────────────────────────────────────────────────────────
export async function fetchEntries(userId: string): Promise<JournalEntry[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchEntries:', error); return [] }
  return (data ?? []).map(dbRowToEntry)
}

export async function upsertEntry(entry: JournalEntry): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('journal_entries')
    .upsert(entryToDbRow(entry), { onConflict: 'id' })
  if (error) console.error('upsertEntry:', error)
}

export async function deleteEntryRemote(entryId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId)
  if (error) console.error('deleteEntry:', error)
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data ? dbRowToProfile(data) : null
}

export async function upsertProfile(profile: Partial<UserProfile> & { id: string }): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: profile.id,
      email: profile.email,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      earned_stickers: profile.earnedStickers ?? [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  if (error) console.error('upsertProfile:', error)
}

// ─── Row mappers ──────────────────────────────────────────────────────────────
function dbRowToEntry(row: Record<string, unknown>): JournalEntry {
  return {
    id:                   row.id as string,
    userId:               row.user_id as string,
    subject:              (row.subject as string) ?? '',
    content:              row.content as string,
    mood:                 row.mood as JournalEntry['mood'],
    tags:                 (row.tags as string[]) ?? [],
    aiNudge:              row.ai_nudge as string | null,
    timeCapsuleDate:      row.time_capsule_date as string | null,
    timeCapsuleDelivered: (row.time_capsule_delivered as boolean) ?? false,
    isFavorite:           (row.is_favorite as boolean) ?? false,
    collectionId:         row.collection_id as string | null,
    wordCount:            (row.word_count as number) ?? 0,
    createdAt:            row.created_at as string,
    updatedAt:            row.updated_at as string,
  }
}

function entryToDbRow(e: JournalEntry) {
  return {
    id:                    e.id,
    user_id:               e.userId,
    subject:               e.subject ?? '',
    content:               e.content,
    mood:                  e.mood,
    tags:                  e.tags,
    ai_nudge:              e.aiNudge,
    time_capsule_date:     e.timeCapsuleDate,
    time_capsule_delivered:e.timeCapsuleDelivered,
    is_favorite:           e.isFavorite ?? false,
    collection_id:         e.collectionId ?? null,
    word_count:            e.wordCount,
    created_at:            e.createdAt,
    updated_at:            e.updatedAt,
  }
}

function dbRowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    id:            row.id as string,
    email:         row.email as string,
    displayName:   (row.display_name as string) ?? '',
    avatarUrl:     row.avatar_url as string | null,
    streakCount:   0,
    longestStreak: 0,
    totalEntries:  0,
    earnedStickers:(row.earned_stickers as import("@/types").StickerKey[]) ?? [],
    wordCountGoal: 0, theme: 'vanilla' as import("@/types").ThemeKey, fontSize: 'md' as const,
    createdAt:     row.created_at as string,
    preferences: { lofiMode: 'off', showAiNudges: true, darkMode: false, fontSize: 'md' },
  }
}

// ─── SQL schema (run this once in Supabase SQL editor) ────────────────────────
export const SCHEMA_SQL = `
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Journal entries
create table if not exists journal_entries (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid references auth.users(id) on delete cascade not null,
  content               text not null default '',
  mood                  text,
  tags                  text[] default '{}',
  ai_nudge              text,
  time_capsule_date     timestamptz,
  time_capsule_delivered boolean default false,
  word_count            int default 0,
  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null
);

-- User profiles
create table if not exists user_profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text,
  display_name   text,
  avatar_url     text,
  earned_stickers text[] default '{}',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Row Level Security: users only see their own data
alter table journal_entries  enable row level security;
alter table user_profiles    enable row level security;

create policy "Users see own entries"
  on journal_entries for all
  using (auth.uid() = user_id);

create policy "Users see own profile"
  on user_profiles for all
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into user_profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Indexes for performance
create index if not exists idx_entries_user_id   on journal_entries(user_id);
create index if not exists idx_entries_created_at on journal_entries(created_at desc);
`
