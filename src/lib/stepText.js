import { scaleAmount } from './scale'

// Parses `[Ingredient name]` references out of a step's instruction text.
// Matching is case-insensitive against the recipe's ingredient list, so the
// amount stays in sync with the ingredient list (and the portion scaler)
// instead of being retyped as a static number in the prose.
//
// Returns an array of segments:
//   { type: 'text', value }    — plain prose, rendered as-is
//   { type: 'ref', value }     — resolved "amount name", highlight it
//   { type: 'missing', value } — bracket text with no matching ingredient,
//                                 render as a warning so typos are obvious
const REF = /\[([^[\]]+)\]/g

export function resolveStepText(text, ingredients, portions) {
  const byName = new Map(
    (ingredients || [])
      .filter((ing) => ing.name && ing.name.trim())
      .map((ing) => [ing.name.trim().toLowerCase(), ing]),
  )

  const segments = []
  let last = 0
  let match

  REF.lastIndex = 0
  while ((match = REF.exec(text || ''))) {
    if (match.index > last) {
      segments.push({ type: 'text', value: text.slice(last, match.index) })
    }
    const name = match[1].trim()
    const ing = byName.get(name.toLowerCase())
    if (ing) {
      const amount = scaleAmount(ing.amount, portions).trim()
      const resolved = amount ? `${amount} ${ing.name}` : ing.name
      segments.push({
        type: 'ref',
        value: ing.optional ? `${resolved} (opt.)` : resolved,
      })
    } else {
      segments.push({ type: 'missing', value: name })
    }
    last = REF.lastIndex
  }
  if (last < (text || '').length) {
    segments.push({ type: 'text', value: text.slice(last) })
  }
  return segments
}

// Collects every `[Ingredient]` reference across all step texts, lowercased and
// trimmed. The editor uses this so each ingredient can only be inserted once in
// the whole description — regardless of which step it already sits in.
export function referencedIngredientNames(steps) {
  const names = new Set()
  for (const step of steps || []) {
    const re = new RegExp(REF.source, 'g')
    let match
    while ((match = re.exec(step.text || ''))) {
      names.add(match[1].trim().toLowerCase())
    }
  }
  return names
}
