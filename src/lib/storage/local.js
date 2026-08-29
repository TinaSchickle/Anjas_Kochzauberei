// Lokales Backend (Browser-Speicher). Rezepte (inkl. Bilder als Data-URLs)
// liegen im Browser. Wird automatisch genutzt, wenn Supabase nicht
// konfiguriert ist — so ist die App auf diesem Gerät ohne Einrichtung nutzbar.

const KEY = 'anjas-kochzauberei.recipes.v1'
const PLANNER_KEY = 'anjas-kochzauberei.planner.v1'

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(recipes) {
  localStorage.setItem(KEY, JSON.stringify(recipes))
}

export async function listRecipes() {
  return readAll().sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || ''),
  )
}

export async function getRecipe(id) {
  return readAll().find((r) => r.id === id) || null
}

export async function saveRecipe(recipe) {
  const all = readAll()
  const idx = all.findIndex((r) => r.id === recipe.id)
  const record = { ...recipe, updatedAt: new Date().toISOString() }
  if (idx >= 0) all[idx] = record
  else all.push(record)
  writeAll(all)
  return record
}

export async function deleteRecipe(id) {
  writeAll(readAll().filter((r) => r.id !== id))
}

// --- Planer: Rezepte, die bald gekocht werden sollen ------------------------
// Jeder Eintrag: { recipeId, portions, addedAt }

function readPlanner() {
  try {
    const raw = localStorage.getItem(PLANNER_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writePlanner(list) {
  localStorage.setItem(PLANNER_KEY, JSON.stringify(list))
}

function clampPortions(p) {
  // 0,5er-Schritte erlauben, Minimum 1.
  return Math.max(1, Math.round((Number(p) || 1) * 2) / 2)
}

export async function listPlanner() {
  return readPlanner().sort((a, b) =>
    (a.addedAt || '').localeCompare(b.addedAt || ''),
  )
}

export async function addToPlanner(recipeId, portions = 1) {
  const list = readPlanner()
  const idx = list.findIndex((e) => e.recipeId === recipeId)
  const entry = {
    recipeId,
    portions: clampPortions(portions),
    addedAt: idx >= 0 ? list[idx].addedAt : new Date().toISOString(),
  }
  if (idx >= 0) list[idx] = entry
  else list.push(entry)
  writePlanner(list)
  return entry
}

export async function setPlannerPortions(recipeId, portions) {
  const list = readPlanner()
  const idx = list.findIndex((e) => e.recipeId === recipeId)
  if (idx >= 0) {
    list[idx] = { ...list[idx], portions: clampPortions(portions) }
    writePlanner(list)
  }
}

export async function removeFromPlanner(recipeId) {
  writePlanner(readPlanner().filter((e) => e.recipeId !== recipeId))
}

export async function clearPlanner() {
  writePlanner([])
}

// Bild inline als Data-URL-String speichern.
export async function uploadImage(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
