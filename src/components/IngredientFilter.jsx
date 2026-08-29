import { useState } from 'react'
import { CheckIcon, ChevronDownIcon, FilterIcon } from './icons'

// Checkbox-Filter. Jede Zutat, die in irgendeinem Rezept vorkommt, wird zur
// Checkbox; mehrere anhaken grenzt auf Rezepte ein, die ALLE davon enthalten.
export default function IngredientFilter({
  allIngredients,
  selected,
  onToggle,
  onClear,
}) {
  const [open, setOpen] = useState(false)
  const selectedSet = new Set(selected)

  return (
    <div className="card p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 font-semibold text-cocoa-700"
        >
          <FilterIcon width={18} height={18} className="text-cocoa-400" />
          Nach Zutat filtern
          {selected.length > 0 && (
            <span className="text-xs rounded-full px-1.5 py-0.5 bg-terracotta-100 text-terracotta-600">
              {selected.length}
            </span>
          )}
          <ChevronDownIcon
            width={18}
            height={18}
            className={`text-cocoa-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="text-sm text-cocoa-400 hover:text-terracotta-500"
          >
            zurücksetzen
          </button>
        )}
      </div>

      {/* Ausgewählte Chips (auch sichtbar, wenn eingeklappt) */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {selected.map((key) => (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className="chip bg-sage-100 text-sage-600 capitalize hover:bg-sage-300/50"
            >
              {key}
              <CheckIcon width={14} height={14} />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-3 pt-3 border-t border-cream-200/70">
          {allIngredients.length === 0 ? (
            <p className="text-sm text-cocoa-400 py-2">
              Noch keine Zutaten — sie erscheinen hier, sobald du Rezepte
              hinzufügst.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1 pr-1">
              {allIngredients.map(({ key, label }) => {
                const on = selectedSet.has(key)
                return (
                  <label
                    key={key}
                    className="inline-flex items-center gap-2 cursor-pointer select-none rounded-xl px-2.5 py-2 hover:bg-cream-100"
                  >
                    <span
                      className={`grid place-items-center w-5 h-5 rounded-md border-2 flex-shrink-0 transition ${
                        on
                          ? 'bg-sage-500 border-sage-500 text-white'
                          : 'border-cream-200 bg-white'
                      }`}
                    >
                      {on && <CheckIcon width={13} height={13} />}
                    </span>
                    <span className="text-cocoa-800 capitalize truncate">
                      {label}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() => onToggle(key)}
                    />
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
