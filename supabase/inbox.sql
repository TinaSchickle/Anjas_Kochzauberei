-- Anjas Kochzauberei — Foto-Inbox (3. Tab „Fotos")
-- =============================================================================
-- Einmalig im gemeinsamen Supabase-Projekt ausführen:
--   SQL Editor → New query → einfügen → Run.
--
-- Zweck: hochgeladene Rezeptfotos zwischenlagern, die noch nicht abgetippt
-- sind. Claude liest die offenen Einträge später aus, legt daraus Rezepte in
-- `anja_recipes` an und setzt den Eintrag auf 'erledigt' (das Foto bleibt zum
-- Gegenprüfen da). Eigene Tabelle/Bucket mit anja_-Präfix, getrennt von
-- kitchenMagic. Gleiche No-Login-Logik wie der Rest der App.
-- =============================================================================

-- 1) Inbox-Tabelle ------------------------------------------------------------
create table if not exists public.anja_recipe_inbox (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  note        text not null default '',
  status      text not null default 'offen',   -- 'offen' | 'erledigt'
  recipe_id   uuid,                             -- gesetzt, sobald abgetippt
  created_at  timestamptz not null default now()
);

create index if not exists anja_recipe_inbox_created_at_idx
  on public.anja_recipe_inbox (created_at desc);

alter table public.anja_recipe_inbox enable row level security;

drop policy if exists "public read anja_recipe_inbox"   on public.anja_recipe_inbox;
drop policy if exists "public write anja_recipe_inbox"  on public.anja_recipe_inbox;
drop policy if exists "public update anja_recipe_inbox" on public.anja_recipe_inbox;
drop policy if exists "public delete anja_recipe_inbox" on public.anja_recipe_inbox;

create policy "public read anja_recipe_inbox"   on public.anja_recipe_inbox for select using (true);
create policy "public write anja_recipe_inbox"  on public.anja_recipe_inbox for insert with check (true);
create policy "public update anja_recipe_inbox" on public.anja_recipe_inbox for update using (true) with check (true);
create policy "public delete anja_recipe_inbox" on public.anja_recipe_inbox for delete using (true);

-- 2) Öffentlicher Bucket für die Inbox-Fotos --------------------------------
insert into storage.buckets (id, name, public)
values ('anja-recipe-inbox', 'anja-recipe-inbox', true)
on conflict (id) do nothing;

drop policy if exists "public read anja inbox images"   on storage.objects;
drop policy if exists "public upload anja inbox images" on storage.objects;
drop policy if exists "public delete anja inbox images" on storage.objects;

create policy "public read anja inbox images" on storage.objects
  for select using (bucket_id = 'anja-recipe-inbox');
create policy "public upload anja inbox images" on storage.objects
  for insert with check (bucket_id = 'anja-recipe-inbox');
create policy "public delete anja inbox images" on storage.objects
  for delete using (bucket_id = 'anja-recipe-inbox');
