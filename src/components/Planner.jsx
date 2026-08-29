import { CATEGORY_MAP } from '../lib/categories'
import PortionStepper from './PortionStepper'
import { CartIcon, XIcon } from './icons'

// Zeigt die Rezepte, die gekocht werden sollen, jeweils mit einstellbarer
// Portionszahl, plus einem Button, um daraus eine Einkaufsliste zu machen.
export default function Planner({
  planner,
  recipes,
  onOpen,
  onRemove,
  onSetPortions,
  onClear,
  onCreateShopping,
  onBrowse,
}) {
  const byId = new Map(recipes.map((r) => [r.id, r]))
  const items = planner
    .map((e) => ({ entry: e, recipe: byId.get(e.recipeId) }))
    .filter((it) => it.recipe)

  return (
    <div className="mt-5">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cocoa-800">
            Essensplaner
          </h1>
          <p className="text-cocoa-400 mt-1">
            {items.length
              ? `${items.length} ${items.length === 1 ? 'Rezept' : 'Rezepte'} geplant · Portionen einstellen, dann Liste erstellen`
              : 'Plane, was du bald kochen möchtest'}
          </p>
        </div>
        {items.length > 0 && (
          <button className="btn-primary" onClick={onCreateShopping}>
            <CartIcon width={18} height={18} />
            Einkaufsliste erstellen
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">{'\u{1F4C5}'}</p>
          <p className="text-cocoa-600 text-lg font-semibold">
            Noch nichts geplant
          </p>
          <p className="text-cocoa-400 mt-1 mb-5">
            Öffne ein Rezept und tippe auf das Lesezeichen, um es hier
            hinzuzufügen.
          </p>
          <button className="btn-primary" onClick={onBrowse}>
            Rezepte durchstöbern
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {items.map(({ entry, recipe }) => (
              <PlannedRow
                key={recipe.id}
                recipe={recipe}
                portions={entry.portions}
                onOpen={() => onOpen(recipe.id)}
                onRemove={() => onRemove(recipe.id)}
                onSetPortions={(p) => onSetPortions(recipe.id, p)}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              className="text-sm text-cocoa-400 hover:text-terracotta-500"
              onClick={onClear}
            >
              Planer leeren
            </button>
            <button className="btn-primary" onClick={onCreateShopping}>
              <CartIcon width={18} height={18} />
              Einkaufsliste erstellen
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function PlannedRow({ recipe, portions, onOpen, onRemove, onSetPortions }) {
  const cat = CATEGORY_MAP[recipe.category]
  return (
    <div className="card px-3 py-3 flex items-center gap-3 sm:gap-4">
      <button
        onClick={onOpen}
        className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 text-left group"
      >
        <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 shadow-soft">
          {recipe.image ? (
            <img src={recipe.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center bg-gradient-to-br from-cream-100 to-terracotta-100 text-2xl">
              {cat?.emoji ?? '\u{1F37D}'}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-cocoa-800 truncate group-hover:text-terracotta-600 transition">
            {recipe.title || 'Rezept ohne Titel'}
          </h3>
          <p className="text-sm text-cocoa-400">
            {cat ? `${cat.emoji} ${cat.label}` : ''}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-2 flex-shrink-0">
        <PortionStepper value={portions} onChange={onSetPortions} />
        <button
          onClick={onRemove}
          className="grid place-items-center w-9 h-9 rounded-full text-cocoa-400 hover:text-terracotta-500 hover:bg-terracotta-50 transition"
          aria-label="Aus dem Planer entfernen"
        >
          <XIcon width={18} height={18} />
        </button>
      </div>
    </div>
  )
}
