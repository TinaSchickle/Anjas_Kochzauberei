import { scaleAmount } from './scale'

// Builds a shopping list from planner entries + the recipes they point to.
// Ingredients with the same name are merged into one line; their amounts are
// scaled by each planned recipe's portions and listed together (amounts are
// free text, so we can't reliably sum "200g" + "1 cup" — we show them side by
// side instead). Returns items sorted alphabetically:
//   { key, name, amounts: string[], sources: string[] }
export function buildShoppingList(planner, recipes) {
  const byId = new Map(recipes.map((r) => [r.id, r]))
  const map = new Map()

  for (const entry of planner) {
    const recipe = byId.get(entry.recipeId)
    if (!recipe) continue
    for (const ing of recipe.ingredients || []) {
      const name = (ing.name || '').trim()
      if (!name) continue
      const key = name.toLowerCase()
      if (!map.has(key)) {
        map.set(key, { key, name, amounts: [], sources: new Set() })
      }
      const item = map.get(key)
      const amount = scaleAmount(ing.amount, entry.portions)
      if (amount && amount.trim()) item.amounts.push(amount.trim())
      item.sources.add(recipe.title || 'Rezept ohne Titel')
    }
  }

  return Array.from(map.values())
    .map((it) => ({ ...it, sources: Array.from(it.sources) }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// Plain-text version for copy-to-clipboard.
export function shoppingListToText(items) {
  return items
    .map((it) => {
      const amt = it.amounts.length ? ` — ${it.amounts.join(' + ')}` : ''
      return `- ${it.name}${amt}`
    })
    .join('\n')
}
