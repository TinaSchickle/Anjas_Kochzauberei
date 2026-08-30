# Anjas Kochzauberei 👩‍🍳

Eine warme, freundliche Rezept-App. Rezepte sammeln, Portionen mit einem Tipp
skalieren und übersichtlich lesen — Zutaten oben, Zubereitung Schritt für
Schritt darunter.

## Funktionen

- **Portionen-Faktor** — beliebige Zahl in 0,5er-Schritten (Standard & Minimum 1);
  jede Mengenangabe skaliert live mit. `200 g` ×3 → `600 g`. Mengen sind Freitext,
  daher bleibt „Salz“ ohne Zahl einfach „Salz“.
- **Kategorien** — Mahlzeit · Süße Mahlzeit · Nachtisch · Kuchen · Vorspeisen ·
  Snacks · Party · Aufstriche · Drinks (pro Rezept gewählt).
- **Arbeitszeit** — optionale Angabe in Minuten (reine Arbeitszeit ohne
  Warten/Backen); wird auf der Rezeptseite gezeigt, wenn gesetzt.
- **Übersicht** aller Rezepte als **Foto-Galerie** oder **Titelliste**.
- **Zutatenfilter** — Checkbox-Liste aus allen Zutaten deiner Rezepte; mehrere
  anhaken findet Rezepte, die *alle* davon enthalten.
- **„A Versucherle“** — Rezepte, die noch nicht erprobt sind, markieren. Sie
  erscheinen in der Übersicht mit leicht grau hinterlegtem Titel. Die Umschalter
  **Versucherle** (nur Versucherle zeigen) und **Isch gut** (Versucherle
  ausblenden) filtern danach; keiner oder beide aktiv → alles wird gezeigt.
- **Planer** — Rezepte für bald vormerken, Portionen je Rezept einstellen und
  daraus eine **Einkaufsliste** erzeugen (Mengen pro Plan skaliert). Beim
  Einkaufen abhaken oder die Liste in die Zwischenablage kopieren.
- **Installierbar** — als PWA aufs Handy oder den Desktop installierbar
  (Manifest + Service Worker).

## Technik

Vite + React + Tailwind CSS. Kein Login. Daten liegen standardmäßig lokal im
Browser und synchronisieren über alle Geräte, sobald Supabase verbunden ist.

## Lokal starten

```bash
npm install
npm run dev
```

## Geräte-Sync (Supabase)

Ohne Einrichtung speichert die App Rezepte im Browser des aktuellen Geräts.
Für eine gemeinsame Rezeptsammlung auf Handy und Laptop:

1. Im **SQL Editor** des Supabase-Projekts [`supabase/schema.sql`](supabase/schema.sql)
   ausführen. Das legt die Tabellen `anja_recipes` + `anja_planner`, einen
   öffentlichen Bild-Bucket `anja-recipe-images` sowie das Start-Rezept
   *Tiramisu (Mama)* in „Nachtisch“ an.
2. Projekt-URL + anon-Key stehen bereits in [`src/lib/config.js`](src/lib/config.js).
   Alternativ per Umgebungsvariablen `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
   (lokal `.env`, auf GitHub Pages als Repo-Secrets) überschreiben.

Die Tabellen liegen im selben Supabase-Projekt wie kitchenMagic, sind durch das
Präfix `anja_` aber vollständig getrennt. Das Wachhalten des Projekts erledigt
der bestehende Keepalive-Job im kitchenMagic-Repo mit — hier ist keiner nötig.

## Veröffentlichen

Ein Push auf `main` baut die App und veröffentlicht sie automatisch über
`.github/workflows/deploy.yml` auf GitHub Pages. Die Seite läuft unter
`/Anjas_Kochzauberei/`.
