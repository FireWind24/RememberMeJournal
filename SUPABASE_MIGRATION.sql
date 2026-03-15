-- Run this in Supabase SQL Editor to add new columns
alter table journal_entries add column if not exists subject text default '';
alter table journal_entries add column if not exists is_favorite boolean default false;
alter table journal_entries add column if not exists collection_id uuid;
