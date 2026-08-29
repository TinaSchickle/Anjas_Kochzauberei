// Supabase-Verbindung. Das sind ÖFFENTLICHE Werte (der anon-Key ist dafür
// gedacht, in Client-Apps zu stehen) — sie dürfen im gebauten Bundle landen.
//
// Die Geräte-Synchronisierung schaltet sich automatisch ein, sobald beide
// Werte vorhanden sind. Am einfachsten: Projektwerte unten eintragen.
// (Umgebungsvariablen VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY überschreiben
// sie weiterhin, falls gesetzt.) Solange beide leer sind, läuft die App komplett
// lokal über den Browser-Speicher.
const PROJECT_URL = 'https://wscuovmzdbhwugxsgfjw.supabase.co'
const ANON_KEY = 'sb_publishable_eAz7id9uPfkRq0wTll_UFA_HaR9JMj1'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || PROJECT_URL
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || ANON_KEY

// Eigene Tabellen im gemeinsam genutzten Supabase-Projekt, damit Anjas
// Kochzauberei ihre eigene Rezeptsammlung getrennt von kitchenMagic hat.
export const RECIPES_TABLE = 'anja_recipes'
export const PLANNER_TABLE = 'anja_planner'
export const IMAGE_BUCKET = 'anja-recipe-images'
// Rezeptfotos, die noch abgetippt werden müssen (Foto-Inbox, 3. Tab).
export const INBOX_TABLE = 'anja_recipe_inbox'
export const INBOX_BUCKET = 'anja-recipe-inbox'

export const isCloudConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
