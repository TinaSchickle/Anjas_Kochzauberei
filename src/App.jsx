import { useCallback, useEffect, useMemo, useState } from 'react'
import * as storage from './lib/storage'
import Header from './components/Header'
import Overview from './components/Overview'
import Planner from './components/Planner'
import ShoppingList from './components/ShoppingList'
import RecipeView from './components/RecipeView'
import RecipeForm from './components/RecipeForm'
import PhotoInbox from './components/PhotoInbox'

// Zuletzt geöffnete Ansicht merken, damit die App nach kurzem Verlassen
// (Backgrounding, Neuladen der PWA) wieder dort landet statt in der Übersicht.
const VIEW_KEY = 'anjas-kochzauberei.view.v1'

function loadView() {
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY))
    if (v && typeof v.name === 'string') return v
  } catch {
    // kein/kaputter Eintrag → Übersicht
  }
  return { name: 'overview' }
}

export default function App() {
  const [recipes, setRecipes] = useState([])
  const [planner, setPlanner] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // view: overview | planner | shopping | recipe | form
  const [view, setView] = useState(loadView)

  // Ansicht bei jeder Änderung sichern. Das Bearbeiten-Formular wird nicht
  // wiederhergestellt (ungespeicherte Eingaben gingen ohnehin verloren) —
  // stattdessen die zugehörige Rezeptseite bzw. die Übersicht.
  useEffect(() => {
    const toStore =
      view.name === 'form'
        ? view.id
          ? { name: 'recipe', id: view.id }
          : { name: 'overview' }
        : view
    try {
      localStorage.setItem(VIEW_KEY, JSON.stringify(toStore))
    } catch {
      // Speicher nicht verfügbar → einfach nichts merken
    }
  }, [view])

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const [list, plan] = await Promise.all([
        storage.listRecipes(),
        storage.listPlanner(),
      ])
      setRecipes(list)
      setPlanner(plan)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Deine Rezepte konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Geräte-Sync: die neuesten Daten neu laden, sobald der Tab wieder den Fokus
  // bekommt (z. B. nach dem Bearbeiten am Handy). Nur mit dem Supabase-Backend
  // sinnvoll, daher beim reinen Lokal-Fallback übersprungen.
  useEffect(() => {
    if (!storage.isCloud) return
    const onFocus = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  const plannedIds = useMemo(
    () => new Set(planner.map((e) => e.recipeId)),
    [planner],
  )

  const openOverview = () => setView({ name: 'overview' })
  const openPlanner = () => setView({ name: 'planner' })
  const openShopping = () => setView({ name: 'shopping' })
  const openRecipe = (id) => setView({ name: 'recipe', id })
  const openNew = () => setView({ name: 'form', id: null })
  const openEdit = (id) => setView({ name: 'form', id })

  const handleSave = async (recipe) => {
    const saved = await storage.saveRecipe(recipe)
    await refresh()
    openRecipe(saved.id)
  }

  const handleDelete = async (id) => {
    await storage.deleteRecipe(id)
    await storage.removeFromPlanner(id)
    await refresh()
    openOverview()
  }

  const togglePlan = async (id, portions = 1) => {
    if (plannedIds.has(id)) await storage.removeFromPlanner(id)
    else await storage.addToPlanner(id, portions)
    await refresh()
  }

  const setPlanPortions = async (id, portions) => {
    // Optimistisches Update, damit der Stepper sofort reagiert.
    setPlanner((prev) =>
      prev.map((e) => (e.recipeId === id ? { ...e, portions } : e)),
    )
    await storage.setPlannerPortions(id, portions)
  }

  const removeFromPlanner = async (id) => {
    await storage.removeFromPlanner(id)
    await refresh()
  }

  const clearPlanner = async () => {
    await storage.clearPlanner()
    await refresh()
  }

  const current = view.id ? recipes.find((r) => r.id === view.id) : null

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onLogoClick={openOverview}
        onAdd={openNew}
        showAdd={view.name === 'overview'}
        view={view.name}
        plannerCount={planner.length}
        onNavigate={(v) => setView({ name: v })}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        {error && (
          <div className="mt-6 rounded-2xl bg-terracotta-50 text-terracotta-700 border border-terracotta-100 px-4 py-3">
            {error}
          </div>
        )}

        {view.name === 'overview' && (
          <Overview
            recipes={recipes}
            loading={loading}
            plannedIds={plannedIds}
            onOpen={openRecipe}
            onAdd={openNew}
            onTogglePlan={togglePlan}
          />
        )}

        {view.name === 'planner' && (
          <Planner
            planner={planner}
            recipes={recipes}
            onOpen={openRecipe}
            onRemove={removeFromPlanner}
            onSetPortions={setPlanPortions}
            onClear={clearPlanner}
            onCreateShopping={openShopping}
            onBrowse={openOverview}
          />
        )}

        {view.name === 'shopping' && (
          <ShoppingList
            planner={planner}
            recipes={recipes}
            onBack={openPlanner}
          />
        )}

        {view.name === 'inbox' && (
          <PhotoInbox onOpenRecipe={openRecipe} />
        )}

        {view.name === 'recipe' && current && (
          <RecipeView
            recipe={current}
            isPlanned={plannedIds.has(current.id)}
            onTogglePlan={togglePlan}
            onBack={openOverview}
            onEdit={() => openEdit(current.id)}
            onDelete={() => handleDelete(current.id)}
          />
        )}

        {view.name === 'recipe' && !current && !loading && (
          <NotFound onBack={openOverview} />
        )}

        {view.name === 'form' && (
          <RecipeForm
            initial={current}
            onCancel={view.id ? () => openRecipe(view.id) : openOverview}
            onSave={handleSave}
          />
        )}
      </main>

      <footer className="text-center text-sm text-cocoa-400 pb-8">
        mit Liebe gemacht
      </footer>
    </div>
  )
}

function NotFound({ onBack }) {
  return (
    <div className="mt-16 text-center">
      <p className="text-cocoa-600 text-lg">Dieses Rezept wurde nicht gefunden.</p>
      <button className="btn-primary mt-4" onClick={onBack}>
        Zurück zu den Rezepten
      </button>
    </div>
  )
}
