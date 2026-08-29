// Die Kategorie-Tabs in Anzeigereihenfolge. `id` wird am Rezept gespeichert.
export const CATEGORIES = [
  { id: 'deftig', label: 'Deftig', emoji: '\u{1F372}' }, // 🍲
  { id: 'nachtisch', label: 'Nachtisch', emoji: '\u{1F36E}' }, // 🍮
  { id: 'kuchen', label: 'Kuchen', emoji: '\u{1F370}' }, // 🍰
  { id: 'vorspeisen', label: 'Vorspeisen', emoji: '\u{1F957}' }, // 🥗
  { id: 'partysnacks', label: 'Partysnacks', emoji: '\u{1F37F}' }, // 🍿
  { id: 'aufstriche', label: 'Aufstriche', emoji: '\u{1F9C8}' }, // 🧈
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
)

export function categoryLabel(id) {
  return CATEGORY_MAP[id]?.label ?? id
}
