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
  serves       integer,
  makes        integer,
  work_minutes integer,
  versucherle  boolean not null default false,
  comment     text not null default '',
  ingredients jsonb not null default '[]'::jsonb,
  steps       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Ergänzt Spalten für Projekte, die vor ihnen angelegt wurden (mehrfach ausführbar).
alter table public.anja_recipes add column if not exists versucherle boolean not null default false;
alter table public.anja_recipes add column if not exists work_minutes integer;

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

-- 5) Start-Rezept: Apfel-Zimt-Muffins in "Kuchen" -------------------------
-- Aus kitchenMagic übernommen (dort Kategorie "sweet").
insert into public.anja_recipes (id, title, category, image_url, makes, comment, ingredients, steps)
values (
  '28dc652f-3a24-438a-ac0a-2cf8ff6a90c2',
  'Apfel-Zimt-Muffins',
  'kuchen',
  'https://wscuovmzdbhwugxsgfjw.supabase.co/storage/v1/object/public/recipe-images/780d8373-cee3-4d2f-b993-c52b7306551a.jpg',
  14,
  '',
  $json$[
    {"id":"35032e93-b610-494c-a51e-838c5108ddb4","name":"Mehl","amount":"300 g"},
    {"id":"b739c3ea-b718-4dca-951b-d44f4aa815ae","name":"Backpulver","amount":"1 EL"},
    {"id":"d42c89ae-61d4-4e00-8512-a1ed83048868","name":"Zucker","amount":"150 g"},
    {"id":"535940ba-4851-426e-93bc-8f39a03a73dc","name":"Vanillezucker","amount":"1 Pk"},
    {"id":"f0b790f2-2047-43fc-8b2c-97a5cb0caf6b","name":"Ei","amount":"1"},
    {"id":"0e69f80a-3dc3-471e-ab58-f72b95f26851","name":"Rapsöl oder Olivenöl","amount":"200 ml"},
    {"id":"a44da95a-e508-417a-b338-6cf8c683b93b","name":"Zimt","amount":"1 TL"},
    {"id":"c3f0f147-82b2-44df-a89e-417a1902ae95","name":"Orangen (Saft)","amount":"1–2"},
    {"id":"fd47dc84-c721-4d7d-b7eb-3ed215a6623b","name":"Äpfel (geraspelt)","amount":"2"},
    {"id":"1bd9573a-b314-472d-b7ea-edadf4b917cb","name":"Rotwein","amount":"1 Schuss"},
    {"id":"8a58e1b4-f22f-4983-b686-eb9dba573335","name":"Bananen","amount":"optional 1–3"},
    {"id":"f5a25008-f20e-446b-8efa-a9859f946dc9","name":"Schoko-Chips, Kakao","amount":"optional"},
    {"id":"b032fea6-d999-4e83-bd1a-a17fb75f53e4","name":"Apfel in feine Scheiben gehobelt","amount":""},
    {"id":"549f94b5-d898-472f-b0b1-7e9d631764a7","name":"Puderzucker zum bestreuen","amount":""},
    {"id":"e172b628-2e27-4a53-b5a3-cf693b87a97b","name":"Zimt_2","amount":""}
  ]$json$::jsonb,
  $json$[
    {"id":"2b4b05dc-e16c-4b8b-a982-1d2cb50e9538","text":"Ofen auf 200 °C vorheizen. [Zucker], [Vanillezucker], [Rapsöl oder Olivenöl], [Ei] und [Zimt] in einer Schüssel vermixen. [Mehl] mit [Backpulver] vermengen und nach und nach unter den Teig rühren. [Orangen (Saft)] und einen Schuss [Rotwein] zugeben. [Äpfel (geraspelt)] schälen, entkernen und raspeln, unter den Teig heben (optional [Bananen], [Schoko-Chips, Kakao]). Teig mit einem Löffel (Tipp: Eisportionierer) in Muffinförmchen füllen. Bei 200 °C ca. 20 Min backen, bis sie goldbraun sind."},
    {"id":"d23000bd-f148-4ccf-a617-ea5dc667c4d4","text":"Topping:\n4 EL [Puderzucker zum bestreuen] und 1/2 TL [Zimt_2] mixen und über die Muffins sieben.\n\nFür die Apfelchips [Apfel in feine Scheiben gehobelt] auf ein mit Backpapier belegtes Blech legen. Mit wenig [Puderzucker zum bestreuen] bestreuen. Im auf 100 °C zurückgestellten Ofen ca. 1 Stunde trocknen lassen. Nach der Hälfte der Trocknungszeit wenden.\n\nDann Apfelchips auf die Muffins legen."}
  ]$json$::jsonb
)
on conflict (id) do nothing;
