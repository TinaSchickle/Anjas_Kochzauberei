// Die Kategorie-Tabs in Anzeigereihenfolge. `id` wird am Rezept gespeichert.
export const CATEGORIES = [
  { id: 'deftig', label: 'Mahlzeit', emoji: '\u{1F372}' }, // 🍲
  { id: 'suesse-mahlzeit', label: 'Süße Mahlzeit', emoji: '\u{1F95E}' }, // 🥞
  { id: 'nachtisch', label: 'Nachtisch', emoji: '\u{1F36E}' }, // 🍮
  { id: 'kuchen', label: 'Kuchen', emoji: '\u{1F370}' }, // 🍰
  { id: 'vorspeisen', label: 'Vorspeisen', emoji: '\u{1F957}' }, // 🥗
  { id: 'snacks', label: 'Snacks', emoji: '\u{1F37F}' }, // 🍿
  { id: 'party', label: 'Party', emoji: '\u{1F389}' }, // 🎉
  { id: 'aufstriche', label: 'Aufstriche', emoji: '\u{1F9C8}' }, // 🧈
  { id: 'drinks', label: 'Drinks', emoji: '\u{1F379}' }, // 🍹
  { id: 'todo', label: 'TODO', emoji: '\u{1F4DD}' }, // 📝
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
)

export function categoryLabel(id) {
  return CATEGORY_MAP[id]?.label ?? id
}
