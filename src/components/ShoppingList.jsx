import { useEffect, useMemo, useState } from 'react'
import { buildShoppingList, shoppingListToText } from '../lib/shopping'
import {
  ArrowLeftIcon,
  CheckIcon,
  ClipboardIcon,
} from './icons'

const CHECKED_KEY = 'anjas-kochzauberei.shopping.checked.v1'

function loadChecked() {
  try {
    const raw = localStorage.getItem(CHECKED_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// Eine abhakbare Einkaufsliste aus dem Planer. Beim Einkaufen abhaken (der
// Fortschritt wird auf diesem Gerät gemerkt). Kopieren in die Zwischenablage
// ist eingebaut.
export default function ShoppingList({ planner, recipes, onBack }) {
  const items = useMemo(
    () => buildShoppingList(planner, recipes),
    [planner, recipes],
  )
  const [checked, setChecked] = useState(loadChecked)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    localStorage.setItem(CHECKED_KEY, JSON.stringify(checked))
  }, [checked])

  const toggle = (key) =>
    setChecked((c) => ({ ...c, [key]: !c[key] }))

  const doneCount = items.filter((it) => checked[it.key]).length

  const copy = async () => {
    // Nur kopieren, was noch fehlt — schon Abgehaktes überspringen.
    const remaining = items.filter((it) => !checked[it.key])
    try {
      await navigator.clipboard.writeText(shoppingListToText(remaining))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Zwischenablage blockiert — still ignorieren
    }
  }

  return (
    <div className="mt-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <button className="btn-ghost" onClick={onBack}>
          <ArrowLeftIcon width={18} height={18} />
          Planer
        </button>
        {items.length > 0 && (
          <button className="btn-ghost" onClick={copy}>
            {copied ? (
              <CheckIcon width={18} height={18} />
            ) : (
              <ClipboardIcon width={18} height={18} />
            )}
            {copied ? 'Kopiert' : 'Kopieren'}
          </button>
        )}
      </div>

      <div className="card p-5 sm:p-7">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-cocoa-800">
              Einkaufsliste
            </h1>
            {items.length > 0 && (
              <p className="text-cocoa-400 mt-1">
                {doneCount}/{items.length} im Korb
              </p>
            )}
          </div>
          <span className="text-4xl">{'\u{1F6D2}'}</span>
        </div>

        {items.length === 0 ? (
          <p className="text-cocoa-400 py-8 text-center">
            Noch keine Zutaten — plane zuerst ein Rezept mit Zutaten.
          </p>
        ) : (
          <ul className="divide-y divide-cream-200/70">
            {items.map((it) => {
              const on = !!checked[it.key]
              return (
                <li key={it.key}>
                  <button
                    onClick={() => toggle(it.key)}
                    className="w-full flex items-start gap-3 py-3 text-left group"
                  >
                    <span
                      className={`mt-0.5 grid place-items-center w-6 h-6 rounded-lg border-2 flex-shrink-0 transition ${
                        on
                          ? 'bg-sage-500 border-sage-500 text-white'
                          : 'border-cream-200 bg-white group-hover:border-sage-300'
                      }`}
                    >
                      {on && <CheckIcon width={15} height={15} />}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`font-semibold capitalize ${
                          on ? 'text-cocoa-400 line-through' : 'text-cocoa-800'
                        }`}
                      >
                        {it.name}
                      </span>
                      {it.amounts.length > 0 && (
                        <span
                          className={`ml-2 ${on ? 'text-cocoa-400 line-through' : 'text-terracotta-600'}`}
                        >
                          {it.amounts.join(' + ')}
                        </span>
                      )}
                      <span className="block text-xs text-cocoa-400 mt-0.5">
                        {it.sources.join(' · ')}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
