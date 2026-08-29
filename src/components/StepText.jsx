import { resolveStepText } from '../lib/stepText'

// Renders a step's instruction text, resolving `[Ingredient name]`
// references into the (portion-scaled) amount, highlighted inline. Used both
// in the recipe reading view and as a live preview while editing.
export default function StepText({ text, ingredients, portions, className }) {
  const segments = resolveStepText(text, ingredients, portions)
  return (
    <p className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'ref') {
          return (
            <span
              key={i}
              className="font-semibold text-terracotta-700 bg-gradient-to-b from-terracotta-100 to-terracotta-50 ring-1 ring-inset ring-terracotta-300/50 rounded-full px-2 py-0.5 whitespace-nowrap"
            >
              {seg.value}
            </span>
          )
        }
        if (seg.type === 'missing') {
          return (
            <span
              key={i}
              className="font-semibold text-amber-800 bg-gradient-to-b from-amber-100 to-amber-50 ring-1 ring-inset ring-amber-300/50 rounded-full px-2 py-0.5 whitespace-nowrap"
              title="Keine passende Zutat gefunden"
            >
              [{seg.value}]
            </span>
          )
        }
        return <span key={i}>{seg.value}</span>
      })}
    </p>
  )
}
