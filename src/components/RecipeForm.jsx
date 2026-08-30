import { useRef, useState } from 'react'
import { CATEGORIES } from '../lib/categories'
import { newIngredient, newRecipe, newStep } from '../lib/model'
import { uploadImage } from '../lib/storage'
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckIcon,
  CropIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from './icons'
import ImageEditor from './ImageEditor'
import StepText from './StepText'

// Tiefe Kopie, damit Änderungen das gespeicherte Rezept erst beim Speichern
// verändern.
function cloneOrNew(initial) {
  if (!initial) return newRecipe()
  return JSON.parse(JSON.stringify(initial))
}

export default function RecipeForm({ initial, onCancel, onSave }) {
  const [recipe, setRecipe] = useState(() => cloneOrNew(initial))
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(initial)

  const canSave = recipe.title.trim().length > 0 && !uploading && !saving

  const patch = (fields) => setRecipe((r) => ({ ...r, ...fields }))

  const updateIngredient = (ingId, fields) =>
    setRecipe((r) => ({
      ...r,
      ingredients: r.ingredients.map((ing) =>
        ing.id === ingId ? { ...ing, ...fields } : ing,
      ),
    }))

  const addIngredient = () =>
    setRecipe((r) => ({ ...r, ingredients: [...r.ingredients, newIngredient()] }))

  const removeIngredient = (ingId) =>
    setRecipe((r) => ({
      ...r,
      ingredients:
        r.ingredients.length > 1
          ? r.ingredients.filter((ing) => ing.id !== ingId)
          : r.ingredients,
    }))

  const updateStep = (stepId, text) =>
    setRecipe((r) => ({
      ...r,
      steps: r.steps.map((s) => (s.id === stepId ? { ...s, text } : s)),
    }))

  const addStep = () =>
    setRecipe((r) => ({ ...r, steps: [...r.steps, newStep()] }))

  const removeStep = (stepId) =>
    setRecipe((r) => ({
      ...r,
      steps: r.steps.length > 1 ? r.steps.filter((s) => s.id !== stepId) : r.steps,
    }))

  const onPickImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // erneutes Auswählen derselben Datei erlauben
    if (!file) return
    try {
      setUploading(true)
      const url = await uploadImage(file)
      patch({ image: url })
    } catch (err) {
      console.error(err)
      alert('Das Bild konnte nicht hinzugefügt werden: ' + (err.message || err))
    } finally {
      setUploading(false)
    }
  }

  // Vom Bild-Editor (Drehen/Zuschneiden) zurückgegebene Datei hochladen.
  const applyEditedImage = async (file) => {
    try {
      setUploading(true)
      const url = await uploadImage(file)
      patch({ image: url })
    } catch (err) {
      console.error(err)
      alert('Das Bild konnte nicht bearbeitet werden: ' + (err.message || err))
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    if (!canSave) return
    // Komplett leere Zutatenzeilen vor dem Speichern entfernen.
    const cleaned = {
      ...recipe,
      title: recipe.title.trim(),
      ingredients: recipe.ingredients.filter(
        (ing) => ing.name.trim() || ing.amount.trim(),
      ),
    }
    try {
      setSaving(true)
      await onSave(cleaned)
    } catch (err) {
      console.error(err)
      alert('Konnte nicht gespeichert werden: ' + (err.message || err))
      setSaving(false)
    }
  }

  return (
    <div className="pt-4 sm:pt-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <button className="btn-ghost" onClick={onCancel}>
          <ArrowLeftIcon width={18} height={18} />
          Abbrechen
        </button>
        {!isEdit && (
          <h1 className="font-display text-2xl font-semibold text-cocoa-800">
            Neues Rezept
          </h1>
        )}
        <button className="btn-primary" onClick={submit} disabled={!canSave}>
          <CheckIcon width={18} height={18} />
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>

      {/* Grunddaten */}
      <div className="card p-5 sm:p-6 mb-4">
        <label className="block text-sm font-bold text-cocoa-600 mb-1.5">
          Titel
        </label>
        <input
          value={recipe.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Omas Zucchinipuffer"
          className="field font-display text-lg"
          autoFocus
        />

        <label className="block text-sm font-bold text-cocoa-600 mt-5 mb-2">
          Kategorie
        </label>
        <select
          value={recipe.category}
          onChange={(e) => patch({ category: e.target.value })}
          className="field"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.emoji} {cat.label}
            </option>
          ))}
        </select>

        <label className="block text-sm font-bold text-cocoa-600 mt-5 mb-2">
          Menge
        </label>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={recipe.serves ?? ''}
            onChange={(e) =>
              patch({
                serves:
                  e.target.value === ''
                    ? null
                    : Math.max(1, Math.floor(Number(e.target.value) || 1)),
              })
            }
            placeholder="4"
            className="field w-20 text-center"
            aria-label="Für wie viele Personen das Rezept reicht"
          />
          <span className="text-cocoa-600">für Personen</span>
          <span className="text-cocoa-400 px-1">/</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={recipe.makes ?? ''}
            onChange={(e) =>
              patch({
                makes:
                  e.target.value === ''
                    ? null
                    : Math.max(1, Math.floor(Number(e.target.value) || 1)),
              })
            }
            placeholder="12"
            className="field w-20 text-center"
            aria-label="Wie viele Stück das Rezept ergibt"
          />
          <span className="text-cocoa-600">ergibt Stück</span>
        </div>
        <p className="text-xs text-cocoa-400 mt-1">
          Bei 1 Portion. Beide Angaben skalieren mit dem Portionen-Faktor — ein
          Feld leer lassen, um es auszublenden.
        </p>

        <label className="flex items-center gap-3 mt-5 cursor-pointer select-none w-fit">
          <span
            className={`grid place-items-center w-6 h-6 rounded-lg border-2 flex-shrink-0 transition ${
              recipe.versucherle
                ? 'bg-sage-500 border-sage-500 text-white'
                : 'border-cream-200 bg-white'
            }`}
          >
            {recipe.versucherle && <CheckIcon width={15} height={15} />}
          </span>
          <span className="text-sm font-bold text-cocoa-600">
            {'\u{1F9EA}'} A Versucherle
          </span>
          <input
            type="checkbox"
            className="sr-only"
            checked={recipe.versucherle}
            onChange={(e) => patch({ versucherle: e.target.checked })}
          />
        </label>
        <p className="text-xs text-cocoa-400 mt-1">
          Noch nicht erprobt — zum Ausprobieren vorgemerkt.
        </p>

        <label className="block text-sm font-bold text-cocoa-600 mt-5 mb-2">
          Foto
        </label>
        <ImagePicker
          image={recipe.image}
          uploading={uploading}
          onPick={onPickImage}
          onRemove={() => patch({ image: null })}
          onApplyEdit={applyEditedImage}
        />
      </div>

      {/* Kommentar */}
      <section className="card p-5 sm:p-6 mb-4">
        <p className="text-xs uppercase tracking-wider font-bold text-cocoa-400 mb-3">
          Kommentar
        </p>
        <textarea
          value={recipe.comment}
          onChange={(e) => patch({ comment: e.target.value })}
          rows={3}
          placeholder="z. B. eine Anmerkung zu diesem Rezept…"
          className="field resize-y leading-relaxed"
        />
        <p className="text-xs text-cocoa-400 mt-2">
          Wird nur angezeigt, wenn hier etwas steht — sonst bleibt der Block
          auf der Rezeptseite komplett ausgeblendet.
        </p>
      </section>

      {/* Zutaten */}
      <section className="card p-5 sm:p-6 mb-4">
        <p className="text-xs uppercase tracking-wider font-bold text-cocoa-400 mb-3">
          Zutaten
        </p>
        <div className="space-y-2">
          {recipe.ingredients.map((ing) => (
            <div key={ing.id} className="flex items-center gap-2">
              <input
                value={ing.amount}
                onChange={(e) =>
                  updateIngredient(ing.id, { amount: e.target.value })
                }
                placeholder="200 g"
                className="field w-24 flex-shrink-0 px-2.5 py-2 text-center"
                aria-label="Menge (optional)"
              />
              <input
                value={ing.name}
                onChange={(e) => updateIngredient(ing.id, { name: e.target.value })}
                placeholder="Mehl"
                className="field px-3 py-2"
                aria-label="Zutat"
              />
              <button
                onClick={() =>
                  updateIngredient(ing.id, { optional: !ing.optional })
                }
                aria-pressed={Boolean(ing.optional)}
                aria-label="Als optional markieren"
                title="Optional"
                className={`flex-shrink-0 text-xs font-bold px-2.5 py-2 rounded-xl transition ${
                  ing.optional
                    ? 'bg-cocoa-600 text-white'
                    : 'bg-cream-100 text-cocoa-400 hover:bg-cream-200'
                }`}
              >
                opt.
              </button>
              <button
                onClick={() => removeIngredient(ing.id)}
                className="text-cocoa-400 hover:text-terracotta-500 p-1 flex-shrink-0"
                aria-label="Zutat entfernen"
              >
                <XIcon width={16} height={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addIngredient}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-sage-600 hover:text-sage-600/80"
        >
          <PlusIcon width={16} height={16} />
          Zutat hinzufügen
        </button>
        <p className="text-xs text-cocoa-400 mt-2">
          Die Menge ist optional — für Dinge wie „Salz“ einfach leer lassen.
        </p>
      </section>

      {/* Schritte */}
      <div className="flex flex-col gap-4">
        {recipe.steps.map((step, i) => (
          <StepEditor
            key={step.id}
            step={step}
            number={i + 1}
            canRemove={recipe.steps.length > 1}
            ingredients={recipe.ingredients}
            onChangeText={(v) => updateStep(step.id, v)}
            onRemoveStep={() => removeStep(step.id)}
          />
        ))}
      </div>

      <button
        onClick={addStep}
        className="btn-soft w-full mt-4 py-3 border-2 border-dashed border-sage-300 bg-sage-50 hover:bg-sage-100"
      >
        <PlusIcon width={18} height={18} />
        Schritt hinzufügen
      </button>

      {/* Speichern unten für lange Formulare */}
      <div className="mt-6 flex justify-end">
        <button className="btn-primary" onClick={submit} disabled={!canSave}>
          <CheckIcon width={18} height={18} />
          {saving ? 'Speichern…' : isEdit ? 'Änderungen speichern' : 'Rezept speichern'}
        </button>
      </div>
      {!recipe.title.trim() && (
        <p className="text-sm text-cocoa-400 text-right mt-2">
          Titel eingeben, um zu speichern.
        </p>
      )}
    </div>
  )
}

function ImagePicker({ image, uploading, onPick, onRemove, onApplyEdit }) {
  const [editing, setEditing] = useState(false)
  return (
    <div>
      {image ? (
        <div className="relative rounded-2xl overflow-hidden shadow-soft">
          <img src={image} alt="" className="w-full max-h-64 object-cover" />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="grid place-items-center w-9 h-9 rounded-full bg-cocoa-800/60 text-white hover:bg-cocoa-800 backdrop-blur"
              aria-label="Bild drehen oder zuschneiden"
            >
              <CropIcon width={17} height={17} />
            </button>
            <button
              onClick={onRemove}
              className="grid place-items-center w-9 h-9 rounded-full bg-cocoa-800/60 text-white hover:bg-cocoa-800 backdrop-blur"
              aria-label="Foto entfernen"
            >
              <XIcon width={18} height={18} />
            </button>
          </div>
          {editing && (
            <ImageEditor
              src={image}
              busy={uploading}
              onCancel={() => setEditing(false)}
              onApply={async (file) => {
                await onApplyEdit(file)
                setEditing(false)
              }}
            />
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cream-200 bg-cream-50 py-8 cursor-pointer hover:border-terracotta-300 hover:bg-terracotta-50/40 transition">
          <span className="grid place-items-center w-12 h-12 rounded-full bg-white text-terracotta-500 shadow-soft">
            <CameraIcon />
          </span>
          <span className="text-cocoa-600 font-semibold">
            {uploading ? 'Wird hochgeladen…' : 'Foto hinzufügen'}
          </span>
          <span className="text-xs text-cocoa-400">zum Auswählen tippen</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  )
}

// Steht der Cursor direkt hinter einer offenen „[“, liefert diese Funktion,
// wo die Referenz beginnt und was bisher getippt wurde — damit wir wissen,
// wogegen wir vervollständigen. Gibt null zurück, wenn keine „[…“ offen ist.
function openBracketQuery(text, cursor) {
  if (cursor == null) return null
  const uptoCursor = text.slice(0, cursor)
  const lastOpen = uptoCursor.lastIndexOf('[')
  if (lastOpen === -1) return null
  const lastClose = uptoCursor.lastIndexOf(']')
  if (lastClose > lastOpen) return null // seitdem schon wieder geschlossen
  const query = uptoCursor.slice(lastOpen + 1)
  if (query.includes('\n')) return null
  return { start: lastOpen + 1, query }
}

function StepEditor({
  step,
  number,
  canRemove,
  ingredients,
  onChangeText,
  onRemoveStep,
}) {
  const textareaRef = useRef(null)
  const [cursor, setCursor] = useState(null)

  const trackCursor = (e) => setCursor(e.target.selectionStart)

  const suggestion = openBracketQuery(step.text, cursor)
  const matches = suggestion
    ? (ingredients || []).filter(
        (ing) =>
          ing.name && ing.name.toLowerCase().includes(suggestion.query.toLowerCase()),
      )
    : []

  const pickSuggestion = (name) => {
    const before = step.text.slice(0, suggestion.start)
    const after = step.text.slice(cursor)
    const newText = `${before}${name}]${after}`
    onChangeText(newText)
    const newCursor = before.length + name.length + 1
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(newCursor, newCursor)
      setCursor(newCursor)
    })
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-8 h-8 rounded-full bg-terracotta-500 text-white font-bold shadow-soft tabular-nums">
            {number}
          </span>
          <span className="text-sm font-bold text-cocoa-600">
            Schritt {number}
          </span>
        </div>
        {canRemove && (
          <button
            onClick={onRemoveStep}
            className="text-cocoa-400 hover:text-terracotta-500 p-1"
            aria-label={`Schritt ${number} entfernen`}
          >
            <TrashIcon width={18} height={18} />
          </button>
        )}
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={step.text}
          onChange={(e) => {
            onChangeText(e.target.value)
            trackCursor(e)
          }}
          onKeyUp={trackCursor}
          onClick={trackCursor}
          onBlur={() => setTimeout(() => setCursor(null), 150)}
          rows={4}
          placeholder="Mehl mit [Milch] verrühren, dann [Salz] unterheben…"
          className="field resize-y leading-relaxed"
        />
        {suggestion && (
          <div className="absolute z-10 left-0 right-0 mt-1 card p-1.5 max-h-52 overflow-y-auto shadow-lift">
            {matches.length ? (
              matches.map((ing) => (
                <button
                  key={ing.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickSuggestion(ing.name)}
                  className="w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg hover:bg-terracotta-50 text-left"
                >
                  <span className="text-sm text-cocoa-800">{ing.name}</span>
                  {ing.amount && (
                    <span className="text-xs text-cocoa-400 tabular-nums whitespace-nowrap">
                      {ing.amount}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <p className="text-xs text-cocoa-400 px-2.5 py-1.5">
                Keine passende Zutat
              </p>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-cocoa-400 mt-2">
        Menge einfügen: Zutatname in eckigen Klammern schreiben, genau wie
        oben in der Zutatenliste, z. B. [Milch] — oder einfach [ tippen für
        Vorschläge.
      </p>

      {step.text.trim() && (
        <div className="mt-3 pt-3 border-t border-cream-200/70">
          <p className="text-xs uppercase tracking-wider font-bold text-cocoa-400 mb-1.5">
            Vorschau
          </p>
          <StepText
            text={step.text}
            ingredients={ingredients}
            portions={1}
            className="text-cocoa-700 leading-relaxed whitespace-pre-wrap"
          />
        </div>
      )}
    </section>
  )
}
