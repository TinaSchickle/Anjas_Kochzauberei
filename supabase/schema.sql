-- Anjas Kochzauberei — Supabase-Einrichtung
-- =============================================================================
-- Einmal im Supabase-Projekt ausführen: SQL Editor → New query → einfügen → Run.
--
-- Dieses Skript nutzt das GEMEINSAME Supabase-Projekt (wscuovmzdbhwugxsgfjw),
-- legt aber EIGENE Tabellen mit dem Präfix "anja_" an, damit Anjas Rezepte
-- vollständig von kitchenMagic getrennt bleiben.
--
-- HINWEIS (bewusst so): Anjas Kochzauberei hat KEIN Login. Es ist eine einzige
-- gemeinsame Rezeptsammlung, damit auf jedem Gerät dieselben Daten erscheinen.
-- Die Policies unten geben der öffentlichen (anon-)Rolle daher vollen Zugriff.
-- Das ist für eine persönliche, nicht geheime Rezept-App gewollt.
-- =============================================================================

-- 1) Rezept-Tabelle -----------------------------------------------------------
create table if not exists public.anja_recipes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  category    text not null default 'deftig',
  image_url   text,
  serves      integer,
  makes       integer,
  versucherle boolean not null default false,
  comment     text not null default '',
  ingredients jsonb not null default '[]'::jsonb,
  steps       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Ergänzt die Spalte für Projekte, die vor ihr angelegt wurden (mehrfach ausführbar).
alter table public.anja_recipes add column if not exists versucherle boolean not null default false;

create index if not exists anja_recipes_created_at_idx
  on public.anja_recipes (created_at desc);

alter table public.anja_recipes enable row level security;

-- Öffentlicher Zugriff (ohne Login). Erst droppen, damit ein erneuter Lauf sauber bleibt.
drop policy if exists "anja public read recipes"   on public.anja_recipes;
drop policy if exists "anja public write recipes"  on public.anja_recipes;
drop policy if exists "anja public update recipes" on public.anja_recipes;
drop policy if exists "anja public delete recipes" on public.anja_recipes;

create policy "anja public read recipes"   on public.anja_recipes for select using (true);
create policy "anja public write recipes"  on public.anja_recipes for insert with check (true);
create policy "anja public update recipes" on public.anja_recipes for update using (true) with check (true);
create policy "anja public delete recipes" on public.anja_recipes for delete using (true);

-- 2) Planer-Tabelle (Rezepte, die bald gekocht werden sollen) ----------------
create table if not exists public.anja_planner (
  recipe_id  uuid primary key references public.anja_recipes (id) on delete cascade,
  portions   numeric not null default 1, -- erlaubt 0,5er-Schritte (1, 1.5, 2, ...)
  added_at   timestamptz not null default now()
);

alter table public.anja_planner enable row level security;

drop policy if exists "anja public read planner"   on public.anja_planner;
drop policy if exists "anja public write planner"  on public.anja_planner;
drop policy if exists "anja public update planner" on public.anja_planner;
drop policy if exists "anja public delete planner" on public.anja_planner;

create policy "anja public read planner"   on public.anja_planner for select using (true);
create policy "anja public write planner"  on public.anja_planner for insert with check (true);
create policy "anja public update planner" on public.anja_planner for update using (true) with check (true);
create policy "anja public delete planner" on public.anja_planner for delete using (true);

-- 3) Öffentlicher Bild-Bucket ------------------------------------------------
insert into storage.buckets (id, name, public)
values ('anja-recipe-images', 'anja-recipe-images', true)
on conflict (id) do nothing;

drop policy if exists "anja public read images"   on storage.objects;
drop policy if exists "anja public upload images" on storage.objects;
drop policy if exists "anja public delete images" on storage.objects;

create policy "anja public read images" on storage.objects
  for select using (bucket_id = 'anja-recipe-images');
create policy "anja public upload images" on storage.objects
  for insert with check (bucket_id = 'anja-recipe-images');
create policy "anja public delete images" on storage.objects
  for delete using (bucket_id = 'anja-recipe-images');

-- 4) Start-Rezept: Tiramisu (Mama) in "Nachtisch" ---------------------------
-- Aus kitchenMagic übernommen. Das Bild liegt im (öffentlichen) kitchenMagic-
-- Bucket desselben Projekts — die URL funktioniert unverändert.
insert into public.anja_recipes (id, title, category, image_url, comment, ingredients, steps)
values (
  'da6dc8d3-4624-42a2-9424-0f03fa759f9c',
  'Tiramisu (Mama)',
  'nachtisch',
  'https://wscuovmzdbhwugxsgfjw.supabase.co/storage/v1/object/public/recipe-images/34a36d43-6438-404d-9eca-78981c9712f7.jpg',
  'Doppelte Menge = Auflaufform (glaub ich)',
  $json$[
    {"id":"aafd346b-0165-4162-a8ab-b4288c145c8e","name":"Mascarpone","amount":"500 g"},
    {"id":"2234b6eb-5ccb-4f4d-8eba-8e795632a622","name":"Eier","amount":"4"},
    {"id":"52f5bd15-a29e-4ad1-b525-df3b0772e075","name":"Puderzucker","amount":"100 g"},
    {"id":"f2a7585e-a217-4ef8-8381-9d490d3f200b","name":"Amaretto","amount":"2 cl"},
    {"id":"95c1015e-51b7-4bc5-8abd-5c42f6010e53","name":"Löffelbiskuits","amount":"200 g"},
    {"id":"08b25a2a-0c4a-4aa8-b526-9895d80f7e57","name":"Kaffee (kalt)","amount":"1/8 L"},
    {"id":"a629ae20-5008-4685-aa15-f5f1652d13f4","name":"Eier (Größe M)","amount":"4"},
    {"id":"abfde6f1-4e61-43b8-b7e7-f4b30e2ad78f","name":"Zucker","amount":"70 g"},
    {"id":"d3b5b87c-9723-47ee-9db4-3c5ccd532355","name":"Vanillezucker (optional)","amount":"1 Pk"},
    {"id":"749ef87b-e518-4e88-a2d6-10f845a275a8","name":"Salz","amount":"1 Prise"},
    {"id":"9b18e167-4307-4b35-8d89-6697662a287f","name":"Weizenmehl","amount":"110 g"}
  ]$json$::jsonb,
  $json$[
    {"id":"3ed9ada9-834d-44e0-a905-377549cf6014","text":"Am besten am Vortag machen. Eiweiß der [Eier] steif schlagen. [Puderzucker], Eigelb und [Amaretto] vermischen, dann [Mascarpone] dazugeben. Eischnee unterheben. [Löffelbiskuits] mit [Kaffee (kalt)] beträufeln und in eine Form legen. Dann Creme und Biskuits im Wechsel schichten. Kalt stellen."},
    {"id":"f8320683-a48e-4dfc-a3d0-27acccd81607","text":"Löffelbiskuits selbstgemacht (ergibt ca. 25 Stück): Ofen auf 190 °C Umluft vorheizen. [Eier (Größe M)] mind. 5 Min. hell und schaumig aufschlagen, gegen Ende [Zucker], [Vanillezucker (optional)] und [Salz] einrieseln lassen. [Weizenmehl] darübersieben und vorsichtig in Etappen unterheben (Luft behalten, keine Klümpchen). Die Hälfte des Teigs in einen Spritzbeutel mit 10–12 mm Rundtülle füllen und ca. 10–15 Streifen auf ein mit Backpapier belegtes Blech spritzen (Enden etwas dicker). 10–14 Min. goldgelb backen, mit dem restlichen Teig wiederholen. Auf dem Blech auskühlen lassen, dann vorsichtig lösen. (Quelle: backenmachtgluecklich.de)"}
  ]$json$::jsonb
)
on conflict (id) do nothing;
