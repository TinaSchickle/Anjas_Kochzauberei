import { useMemo, useState } from 'react'
import { CATEGORIES } from '../lib/categories'
import { recipeIngredientNames } from '../lib/model'
import { GalleryCard, ListRow } from './RecipeCard'
import IngredientFilter from './IngredientFilter'
import { CheckIcon, GridIcon, ListIcon, PlusIcon, SearchIcon, XIcon } from './icons'

export default function Overview({
  recipes,
  loading,
  plannedIds,
  onOpen,
  onAdd,
  onTogglePlan,
}) {
  const [category, setCategory] = useState('all')
  const [mode, setMode] = useState('gallery') // 'gallery' | 'list'
  const [selected, setSelected] = useState([]) // Zutaten-Schlüssel (klein)
  const [query, setQuery] = useState('') // Titelsuche
  // "A Versucherle"-Filter: nur Versucherle zeigen bzw. Versucherle ausblenden.
  const [onlyVersucherle, setOnlyVersucherle] = useState(false)
  const [onlyIschGut, setOnlyIschGut] = useState(false)

  const counts = useMemo(() => {
    const c = { all: 0 }
    for (const cat of CATEGORIES) c[cat.id] = 0
    for (const r of recipes) {
      if (c[r.category] != null) c[r.category] += 1
      c.all += 1
    }
    return c
  }, [recipes])

  const versucherleCount = useMemo(
    () => recipes.filter((r) => r.versucherle).length,
    [recipes],
  )
  const ischGutCount = recipes.length - versucherleCount

  // Jede einzelne Zutat aus allen Rezepten → Checkbox-Optionen.
  const allIngredients = useMemo(() => {
    const map = new Map() // key -> Anzeigename (erste Fundstelle)
    for (const r of recipes) {
      for (const name of recipeIngredientNames(r)) {
        if (!map.has(name)) map.set(name, name)
      }
    }
    return Array.from(map.keys())
      .sort((a, b) => a.localeCompare(b))
      .map((key) => ({ key, label: key }))
  }, [recipes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    // Beide oder keiner angehakt → keine Einschränkung.
    const bothOrNone = onlyVersucherle === onlyIschGut
    return recipes
      .filter((r) => {
        if (category !== 'all' && r.category !== category) return false
        if (!bothOrNone) {
          if (onlyVersucherle && !r.versucherle) return false
          if (onlyIschGut && r.versucherle) return false
        }
        if (q && !(r.title || '').toLowerCase().includes(q)) return false
        if (selected.length) {
          const names = new Set(recipeIngredientNames(r))
          // UND-Verknüpfung: das Rezept muss jede angehakte Zutat enthalten.
          return selected.every((key) => names.has(key))
        }
        return true
      })
      // Rezepte immer alphabetisch nach Titel (deutsche Sortierung).
      .sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', 'de', {
          sensitivity: 'base',
        }),
      )
  }, [recipes, category, selected, query, onlyVersucherle, onlyIschGut])

  const toggleIngredient = (key) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )

  return (
    <div className="mt-4">
      {/* Kategorie-Tabs — alle sichtbar (umbrechend), auch auf dem Handy */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Tab
          label="Alle"
          active={category === 'all'}
          count={counts.all}
          onClick={() => setCategory('all')}
          allTab
        />
        {CATEGORIES.map((cat) => (
          <Tab
            key={cat.id}
            label={cat.label}
            emoji={cat.emoji}
            active={category === cat.id}
            count={counts[cat.id]}
            onClick={() => setCategory(cat.id)}
          />
        ))}
      </div>

      {/* Titelsuche + Ansicht-Umschalter */}
      <div className="flex items-center gap-2 mb-3">
        <div className="card flex-1 flex items-center gap-2 px-4 py-2.5">
          <SearchIcon width={18} height={18} className="text-cocoa-400 flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rezept suchen…"
            className="flex-1 min-w-0 bg-transparent text-cocoa-800 placeholder-cocoa-400/70 focus:outline-none"
            aria-label="Rezept nach Titel suchen"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-cocoa-400 hover:text-terracotta-500 flex-shrink-0"
              aria-label="Suche löschen"
            >
              <XIcon width={18} height={18} />
            </button>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-1 bg-white/70 rounded-full p-1 shadow-soft">
          <ToggleBtn
            active={mode === 'gallery'}
            onClick={() => setMode('gallery')}
            label="Galerieansicht"
          >
            <GridIcon width={18} height={18} />
          </ToggleBtn>
          <ToggleBtn
            active={mode === 'list'}
            onClick={() => setMode('list')}
            label="Listenansicht"
          >
            <ListIcon width={18} height={18} />
          </ToggleBtn>
        </div>
      </div>

      {/* Versucherle-Umschalter */}
      <div className="mb-3 flex flex-wrap gap-2">
        <FilterToggle
          active={onlyVersucherle}
          onClick={() => setOnlyVersucherle((v) => !v)}
          label={`${'\u{1F9EA}'} Versucherle`}
          count={versucherleCount}
        />
        <FilterToggle
          active={onlyIschGut}
          onClick={() => setOnlyIschGut((v) => !v)}
          label={`${'\u{1F44D}'} Isch gut`}
          count={ischGutCount}
        />
      </div>

      {/* Zutatenfilter */}
      <div className="mb-6">
        <IngredientFilter
          allIngredients={allIngredients}
          selected={selected}
          onToggle={toggleIngredient}
          onClear={() => setSelected([])}
        />
      </div>

      {/* Inhalt */}
      {loading ? (
        <Loading mode={mode} />
      ) : filtered.length === 0 ? (
        <EmptyState
          hasRecipes={recipes.length > 0}
          selected={selected}
          query={query}
          onAdd={onAdd}
        />
      ) : mode === 'gallery' ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((r) => (
            <GalleryCard
              key={r.id}
              recipe={r}
              onOpen={onOpen}
              planned={plannedIds.has(r.id)}
              onTogglePlan={onTogglePlan}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((r) => (
            <ListRow
              key={r.id}
              recipe={r}
              onOpen={onOpen}
              planned={plannedIds.has(r.id)}
              onTogglePlan={onTogglePlan}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Tab({ label, emoji, active, count, onClick, allTab }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
        active
          ? 'bg-terracotta-500 text-white shadow-soft'
          : 'bg-white/70 text-cocoa-600 hover:bg-white'
      }`}
    >
      {!allTab && <span>{emoji}</span>}
      {label}
      <span
        className={`text-xs rounded-full px-1.5 ${
          active ? 'bg-white/25' : 'bg-cream-200 text-cocoa-400'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function FilterToggle({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition-all ${
        active
          ? 'bg-terracotta-500 text-white shadow-soft'
          : 'bg-white/70 text-cocoa-600 hover:bg-white'
      }`}
    >
      <span
        className={`grid place-items-center w-5 h-5 rounded-md border-2 flex-shrink-0 ${
          active
            ? 'bg-white/25 border-white/60 text-white'
            : 'border-cream-200 bg-white'
        }`}
      >
        {active && <CheckIcon width={13} height={13} />}
      </span>
      {label}
      <span
        className={`text-xs rounded-full px-1.5 py-0.5 ${
          active ? 'bg-white/25' : 'bg-cream-200 text-cocoa-400'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function ToggleBtn({ active, onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`grid place-items-center w-9 h-9 rounded-full transition-all ${
        active
          ? 'bg-terracotta-500 text-white shadow-soft'
          : 'text-cocoa-400 hover:text-cocoa-600'
      }`}
    >
      {children}
    </button>
  )
}

function Loading({ mode }) {
  const items = Array.from({ length: 6 })
  if (mode === 'list') {
    return (
      <div className="flex flex-col gap-2.5">
        {items.map((_, i) => (
          <div key={i} className="card h-20 animate-pulse bg-white/50" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {items.map((_, i) => (
        <div key={i} className="card aspect-[4/3] animate-pulse bg-white/50" />
      ))}
    </div>
  )
}

function EmptyState({ hasRecipes, selected, query, onAdd }) {
  if (hasRecipes) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-3">{'\u{1F50D}'}</p>
        <p className="text-cocoa-600 text-lg font-semibold">Keine Treffer</p>
        <p className="text-cocoa-400 mt-1">
          {query
            ? `Kein Rezept mit dem Titel „${query}“.`
            : selected.length
              ? `Kein Rezept enthält ${selected.join(' + ')}.`
              : 'In dieser Kategorie ist noch nichts.'}
        </p>
      </div>
    )
  }
  return (
    <div className="text-center py-20">
      <p className="text-5xl mb-3">{'\u{1F373}'}</p>
      <p className="text-cocoa-600 text-lg font-semibold">
        Noch keine Rezepte
      </p>
      <p className="text-cocoa-400 mt-1 mb-5">
        Füge dein erstes Rezept hinzu, dann erscheint es hier.
      </p>
      <button className="btn-primary" onClick={onAdd}>
        <PlusIcon width={18} height={18} />
        Rezept hinzufügen
      </button>
    </div>
  )
}
