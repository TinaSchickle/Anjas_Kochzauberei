// Supabase-Backend. Eine gemeinsame Rezeptsammlung (ohne Login), damit auf
// jedem Gerät dieselben Daten erscheinen. Zeilenaufbau der Rezept-Tabelle:
//   id (uuid, pk) | title (text) | category (text) | image_url (text)
//   | comment (text) | ingredients (jsonb) | steps (jsonb) | created_at | updated_at
// Bilder liegen im öffentlichen Storage-Bucket (IMAGE_BUCKET).

import { createClient } from '@supabase/supabase-js'
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  RECIPES_TABLE,
  PLANNER_TABLE,
  IMAGE_BUCKET,
  INBOX_TABLE,
  INBOX_BUCKET,
  isCloudConfigured,
} from '../config'
import { uid } from '../uid'

// Client nur bauen, wenn konfiguriert — createClient wirft bei leerer URL,
// und dieses Modul wird vom Backend-Selektor sofort importiert.
const supabase = isCloudConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

function rowToRecipe(row) {
  return {
    id: row.id,
    title: row.title || '',
    category: row.category || 'deftig',
    image: row.image_url || null,
    serves: row.serves ?? null,
    makes: row.makes ?? null,
    workMinutes: row.work_minutes ?? null,
    versucherle: row.versucherle ?? false,
    comment: row.comment || '',
    ingredients: row.ingredients || [],
    steps: row.steps || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function recipeToRow(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    category: recipe.category,
    image_url: recipe.image || null,
    serves: recipe.serves ?? null,
    makes: recipe.makes ?? null,
    work_minutes: recipe.workMinutes ?? null,
    versucherle: recipe.versucherle ?? false,
    comment: recipe.comment || '',
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    updated_at: new Date().toISOString(),
  }
}

export async function listRecipes() {
  const { data, error } = await supabase
    .from(RECIPES_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(rowToRecipe)
}

export async function getRecipe(id) {
  const { data, error } = await supabase
    .from(RECIPES_TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? rowToRecipe(data) : null
}

// Optionale Spalten, die es in einer älteren Datenbank evtl. noch nicht gibt.
const OPTIONAL_COLUMNS = [
  'serves',
  'makes',
  'work_minutes',
  'versucherle',
  'comment',
]

export async function saveRecipe(recipe) {
  let attempt = recipeToRow(recipe)
  // Ein paar Versuche: nur die konkret als fehlend gemeldete optionale Spalte
  // weglassen — so kostet ein fehlendes `makes` nie das `serves`.
  for (let i = 0; i < OPTIONAL_COLUMNS.length + 1; i++) {
    const res = await supabase
      .from(RECIPES_TABLE)
      .upsert(attempt, { onConflict: 'id' })
      .select()
      .single()
    if (!res.error) return rowToRecipe(res.data)

    const missing = (res.error.message || '').match(/'([a-z_]+)' column/i)?.[1]
    if (missing && OPTIONAL_COLUMNS.includes(missing) && missing in attempt) {
      const { [missing]: _drop, ...rest } = attempt
      attempt = rest
      continue
    }
    throw res.error
  }
  throw new Error('Rezept konnte nicht gespeichert werden')
}

export async function deleteRecipe(id) {
  const { error } = await supabase.from(RECIPES_TABLE).delete().eq('id', id)
  if (error) throw error
}

// --- Planer -----------------------------------------------------------------
// Tabelle: recipe_id (uuid, pk) | portions (numeric) | added_at (timestamptz)

function clampPortions(p) {
  // 0,5er-Schritte erlauben, Minimum 1.
  return Math.max(1, Math.round((Number(p) || 1) * 2) / 2)
}

export async function listPlanner() {
  const { data, error } = await supabase
    .from(PLANNER_TABLE)
    .select('*')
    .order('added_at', { ascending: true })
  if (error) throw error
  return (data || []).map((r) => ({
    recipeId: r.recipe_id,
    portions: r.portions || 1,
    addedAt: r.added_at,
  }))
}

export async function addToPlanner(recipeId, portions = 1) {
  const { data, error } = await supabase
    .from(PLANNER_TABLE)
    .upsert(
      { recipe_id: recipeId, portions: clampPortions(portions) },
      { onConflict: 'recipe_id' },
    )
    .select()
    .single()
  if (error) throw error
  return {
    recipeId: data.recipe_id,
    portions: data.portions,
    addedAt: data.added_at,
  }
}

export async function setPlannerPortions(recipeId, portions) {
  const { error } = await supabase
    .from(PLANNER_TABLE)
    .update({ portions: clampPortions(portions) })
    .eq('recipe_id', recipeId)
  if (error) throw error
}

export async function removeFromPlanner(recipeId) {
  const { error } = await supabase
    .from(PLANNER_TABLE)
    .delete()
    .eq('recipe_id', recipeId)
  if (error) throw error
}

export async function clearPlanner() {
  // Alle Zeilen löschen (Supabase verlangt beim Bulk-Delete eine Bedingung).
  const { error } = await supabase
    .from(PLANNER_TABLE)
    .delete()
    .not('recipe_id', 'is', null)
  if (error) throw error
}

export async function uploadImage(file) {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
  const path = `${uid()}.${ext}`
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// --- Foto-Inbox -----------------------------------------------------------
// Tabelle INBOX_TABLE: id (uuid, pk) | image_url (text) | note (text)
//   | status (text: 'offen' | 'erledigt') | recipe_id (uuid, nullable)
//   | created_at (timestamptz)
// Bilder liegen im öffentlichen Bucket INBOX_BUCKET. Claude tippt die offenen
// Fotos später in die Rezeptliste ab und setzt sie auf 'erledigt'.

function rowToInboxPhoto(row) {
  return {
    id: row.id,
    imageUrl: row.image_url,
    note: row.note || '',
    status: row.status || 'offen',
    recipeId: row.recipe_id || null,
    createdAt: row.created_at,
  }
}

export async function uploadInboxImage(file) {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
  const path = `${uid()}.${ext}`
  const { error } = await supabase.storage
    .from(INBOX_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(INBOX_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function listInbox() {
  const { data, error } = await supabase
    .from(INBOX_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(rowToInboxPhoto)
}

export async function addInboxPhoto(imageUrl, note = '') {
  const { data, error } = await supabase
    .from(INBOX_TABLE)
    .insert({ image_url: imageUrl, note })
    .select()
    .single()
  if (error) throw error
  return rowToInboxPhoto(data)
}

export async function updateInboxPhoto(id, fields) {
  const row = {}
  if ('note' in fields) row.note = fields.note
  if ('status' in fields) row.status = fields.status
  if ('recipeId' in fields) row.recipe_id = fields.recipeId
  const { error } = await supabase
    .from(INBOX_TABLE)
    .update(row)
    .eq('id', id)
  if (error) throw error
}

export async function deleteInboxPhoto(id) {
  // Erst das zugehörige Bild aus dem Bucket holen, dann Zeile + Datei löschen,
  // damit keine verwaisten Uploads im Storage zurückbleiben.
  const { data: row } = await supabase
    .from(INBOX_TABLE)
    .select('image_url')
    .eq('id', id)
    .maybeSingle()
  const { error } = await supabase.from(INBOX_TABLE).delete().eq('id', id)
  if (error) throw error
  const marker = `/${INBOX_BUCKET}/`
  const path = row?.image_url?.split(marker)[1]
  if (path) {
    await supabase.storage.from(INBOX_BUCKET).remove([path]).catch(() => {})
  }
}
