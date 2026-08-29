import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { CATEGORY_MAP } from '../lib/categories'
import { scaleAmount } from '../lib/scale'
import PortionStepper, { formatPortions } from './PortionStepper'
import StepText from './StepText'
import {
  ArrowLeftIcon,
  BookmarkCheckIcon,
  BookmarkIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
  XIcon,
} from './icons'

// Rendert die Rezeptkarte als PNG und übergibt sie dem Teilen-Dialog des
// Systems (Fallback: einfacher Download, wo Web Share keine Dateien kann,
// z. B. in den meisten Desktop-Browsern).
async function shareRecipeImage(node, title) {
  const canvas = await html2canvas(node, {
    backgroundColor: '#F2F8F8',
    useCORS: true,
    scale: 1.5,
    windowWidth: document.documentElement.offsetWidth,
    windowHeight: document.documentElement.offsetHeight,
  })
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Bild konnte nicht erstellt werden')

  const filename = `${(title || 'Rezept').replace(/[\\/:*?"<>|]+/g, ' ').trim()}.png`
  const file = new File([blob], filename, { type: 'image/png' })

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: title || 'Rezept' })
    return
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function RecipeView({
  recipe,
  isPlanned,
  onTogglePlan,
  onBack,
  onEdit,
  onDelete,
}) {
  const [portions, setPortions] = useState(1)
  const [confirming, setConfirming] = useState(false)
  const [sharing, setSharing] = useState(false)
  const cat = CATEGORY_MAP[recipe.category]
  const shareRef = useRef(null)

  const handleShare = async () => {
    if (!shareRef.current || sharing) return
    setSharing(true)
    // Warten, bis der DOM-Wechsel für den Teilen-Modus (interaktiver Stepper ->
    // statischer Text) tatsächlich gezeichnet ist, bevor html2canvas liest.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    try {
      await shareRecipeImage(shareRef.current, recipe.title)
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error(err)
        alert('Teilen hat nicht geklappt: ' + (err.message || err))
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="pt-4 sm:pt-6">
      {/* Kopfzeile */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button className="btn-ghost" onClick={onBack}>
          <ArrowLeftIcon width={18} height={18} />
          <span className="hidden sm:inline">Alle Rezepte</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            className={
              isPlanned
                ? 'btn bg-sage-500 text-white px-4 py-2 hover:bg-sage-600 shadow-soft'
                : 'btn-ghost'
            }
            onClick={() => onTogglePlan(recipe.id, portions)}
          >
            {isPlanned ? (
              <BookmarkCheckIcon width={18} height={18} />
            ) : (
              <BookmarkIcon width={18} height={18} />
            )}
            <span className="hidden sm:inline">
              {isPlanned ? 'Im Planer' : 'Zum Planer'}
            </span>
          </button>
          <button className="btn-ghost" onClick={handleShare} disabled={sharing}>
            <ShareIcon width={18} height={18} />
            <span className="hidden sm:inline">
              {sharing ? 'Erstelle Bild…' : 'Teilen'}
            </span>
          </button>
          <button className="btn-ghost" onClick={onEdit}>
            <PencilIcon width={18} height={18} />
            <span className="hidden sm:inline">Bearbeiten</span>
          </button>
          <button
            className="btn bg-white/70 text-terracotta-600 px-4 py-2 hover:bg-terracotta-50 shadow-soft"
            onClick={() => setConfirming(true)}
            aria-label="Rezept löschen"
          >
            <TrashIcon width={18} height={18} />
          </button>
        </div>
      </div>

      <div ref={shareRef}>
        {/* Titelbereich */}
        <div className="card overflow-hidden mb-6">
          {recipe.image && (
            <div className="aspect-[16/9] sm:aspect-[21/9] overflow-hidden">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {cat && (
                  <span className="chip bg-sage-100 text-sage-600">
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </span>
                )}
                {recipe.versucherle && (
                  <span className="chip bg-cream-100 text-cocoa-500">
                    {'\u{1F9EA}'} A Versucherle
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cocoa-800 leading-tight">
                {recipe.title || 'Rezept ohne Titel'}
              </h1>
            </div>
            <div className="flex-shrink-0">
              <p className="text-sm text-cocoa-400 mb-1 sm:text-right">Portionen</p>
              {sharing ? (
                <p className="text-lg font-semibold text-cocoa-800 sm:text-right">
                  {formatPortions(portions)}×
                </p>
              ) : (
                <PortionStepper value={portions} onChange={setPortions} />
              )}
              {recipe.serves ? (
                <p className="text-sm text-cocoa-600 mt-2 sm:text-right">
                  <span aria-hidden>{'\u{1F37D}️'} </span>
                  Für {formatPortions(recipe.serves * portions)}{' '}
                  {recipe.serves * portions === 1 ? 'Person' : 'Personen'}
                </p>
              ) : null}
              {recipe.makes ? (
                <p className="text-sm text-cocoa-600 mt-1 sm:text-right">
                  <span aria-hidden>{'\u{1F9C1}'} </span>
                  Ergibt {formatPortions(recipe.makes * portions)} Stück
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Kommentar — nur, wenn wirklich einer geschrieben wurde */}
        {recipe.comment && recipe.comment.trim() && (
          <section className="card p-5 sm:p-7 mb-2 border-l-4 border-terracotta-300">
            <p className="text-xs uppercase tracking-wider font-bold text-cocoa-400 mb-2">
              Kommentar
            </p>
            <p className="text-cocoa-700 leading-relaxed whitespace-pre-wrap">
              {recipe.comment}
            </p>
          </section>
        )}

        {/* Zutaten */}
        <IngredientList ingredients={recipe.ingredients} portions={portions} />

        {/* Schritte */}
        <div className="flex flex-col">
          {recipe.steps.map((step, i) => (
            <Step
              key={step.id}
              step={step}
              number={i + 1}
              ingredients={recipe.ingredients}
              portions={portions}
            />
          ))}
        </div>
      </div>

      {confirming && (
        <ConfirmDelete
          title={recipe.title}
          onCancel={() => setConfirming(false)}
          onConfirm={onDelete}
        />
      )}
    </div>
  )
}

function IngredientList({ ingredients, portions }) {
  const items = (ingredients || []).filter(
    (ing) => (ing.name && ing.name.trim()) || (ing.amount && ing.amount.trim()),
  )

  return (
    <section className="card p-5 sm:p-7 mb-2">
      <p className="text-xs uppercase tracking-wider font-bold text-cocoa-400 mb-4">
        Zutaten
      </p>
      {items.length ? (
        <ul className="sm:columns-2 sm:gap-x-8">
          {items.map((ing) => (
            <li
              key={ing.id}
              className="flex items-baseline gap-3 py-1.5 border-b border-cream-200/60 last:border-0 break-inside-avoid"
            >
              <span className="font-semibold text-terracotta-600 tabular-nums whitespace-nowrap">
                {scaleAmount(ing.amount, portions)}
              </span>
              <span className="text-cocoa-800">{ing.name}</span>
              {ing.optional && (
                <span className="ml-auto flex-shrink-0 text-[0.65rem] uppercase tracking-wider font-bold text-cocoa-400 bg-cream-100 rounded-full px-2 py-0.5">
                  optional
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-cocoa-400 text-sm italic">Keine Zutaten</p>
      )}
    </section>
  )
}

// Eine schmale Linie — Nummer — Linie als Trenner, wie das Umblättern zum
// nächsten Schritt. Die Nummerierung läuft durchgehend durch das Rezept.
function StepDivider({ number }) {
  return (
    <div className="flex items-center gap-4 pt-8 pb-5" aria-hidden>
      <div className="flex-1 h-px bg-cream-200" />
      <span className="grid place-items-center w-8 h-8 rounded-full bg-cocoa-800/[0.05] text-cocoa-500 text-sm font-bold tabular-nums">
        {number}
      </span>
      <div className="flex-1 h-px bg-cream-200" />
    </div>
  )
}

function Step({ step, number, ingredients, portions }) {
  return (
    <section>
      <StepDivider number={number} />
      {step.text && step.text.trim() ? (
        <StepText
          text={step.text}
          ingredients={ingredients}
          portions={portions}
          className="text-cocoa-800 leading-relaxed text-lg whitespace-pre-wrap"
        />
      ) : (
        <p className="text-cocoa-400 text-sm italic">Keine Schritte angegeben</p>
      )}
    </section>
  )
}

function ConfirmDelete({ title, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-cocoa-800/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="card p-6 max-w-sm w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="ml-auto block text-cocoa-400 hover:text-cocoa-600"
          aria-label="Schließen"
        >
          <XIcon />
        </button>
        <p className="text-4xl mb-2">{'\u{1F5D1}️'}</p>
        <h3 className="font-display text-xl font-semibold text-cocoa-800">
          Dieses Rezept löschen?
        </h3>
        <p className="text-cocoa-400 mt-1 mb-5">
          „{title || 'Rezept ohne Titel'}“ ist dann für immer weg.
        </p>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onCancel}>
            Behalten
          </button>
          <button
            className="btn bg-terracotta-500 text-white px-5 py-2.5 shadow-soft hover:bg-terracotta-600 flex-1"
            onClick={onConfirm}
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  )
}
