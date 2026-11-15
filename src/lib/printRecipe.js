import { CATEGORY_MAP } from './categories'
import { scaleAmount } from './scale'
import { resolveStepText } from './stepText'

// Baut einen schlichten Schwarz-Weiß-DOM-Knoten (weißer Hintergrund,
// schwarzer Text, keine farbliche Hervorhebung der Zutaten) fürs Drucken
// und Teilen. Wird per html2canvas in ein Bild/PDF gerendert — deshalb
// bewusst nur einfache Blocklayouts und Inline-Styles, damit im Ergebnis
// nichts verrutscht und keine App-Schriften/Farben mitgezogen werden.

function fmtPortions(n) {
  return (Math.round(n * 2) / 2).toFixed(1).replace(/\.0$/, '')
}

function esc(s) {
  const d = document.createElement('div')
  d.textContent = s == null ? '' : String(s)
  return d.innerHTML
}

export function buildPrintNode(recipe, portions) {
  const node = document.createElement('div')
  node.style.cssText = [
    'position:fixed',
    'left:-99999px',
    'top:0',
    'width:720px',
    'box-sizing:border-box',
    'padding:32px',
    'background:#ffffff',
    'color:#000000',
    "font-family:Georgia,'Times New Roman',serif",
    'font-size:16px',
    'line-height:1.55',
  ].join(';')

  const h2 = 'font-size:18px;font-weight:700;margin:22px 0 8px;color:#000;'
  const html = []

  html.push(
    `<h1 style="font-size:26px;font-weight:700;margin:0 0 6px;color:#000;">${esc(
      recipe.title || 'Rezept ohne Titel',
    )}</h1>`,
  )

  const meta = []
  const cat = CATEGORY_MAP[recipe.category]
  if (cat) meta.push(esc(cat.label))
  meta.push(`Menge: ${fmtPortions(portions)}×`)
  if (recipe.serves) {
    const n = recipe.serves * portions
    meta.push(`Für ${fmtPortions(n)} ${n === 1 ? 'Person' : 'Personen'}`)
  }
  if (recipe.makes) {
    meta.push(`Ergibt ${fmtPortions(recipe.makes * portions)} Stück`)
  }
  if (recipe.workMinutes) meta.push(`Arbeitszeit ${recipe.workMinutes} Min.`)
  html.push(
    `<p style="margin:0 0 16px;font-size:14px;color:#000;">${meta.join(
      ' · ',
    )}</p>`,
  )

  if (recipe.image) {
    html.push(
      `<img src="${esc(recipe.image)}" crossorigin="anonymous" ` +
        `style="display:block;width:100%;height:auto;margin:0 0 8px;">`,
    )
  }

  if (recipe.comment && recipe.comment.trim()) {
    html.push(`<h2 style="${h2}">Kommentar</h2>`)
    html.push(
      `<p style="margin:0;white-space:pre-wrap;color:#000;">${esc(
        recipe.comment,
      )}</p>`,
    )
  }

  const items = (recipe.ingredients || []).filter(
    (ing) => (ing.name && ing.name.trim()) || (ing.amount && ing.amount.trim()),
  )
  html.push(`<h2 style="${h2}">Zutaten</h2>`)
  if (items.length) {
    html.push('<ul style="margin:0;padding-left:22px;color:#000;">')
    for (const ing of items) {
      const amt = scaleAmount(ing.amount, portions).trim()
      html.push(
        `<li style="margin:3px 0;">${amt ? esc(amt) + ' ' : ''}${esc(ing.name)}${
          ing.optional ? ' (optional)' : ''
        }</li>`,
      )
    }
    html.push('</ul>')
  } else {
    html.push('<p style="margin:0;color:#000;">Keine Zutaten</p>')
  }

  html.push(`<h2 style="${h2}">Zubereitung</h2>`)
  const steps = (recipe.steps || []).filter((s) => s.text && s.text.trim())
  if (steps.length) {
    html.push('<ol style="margin:0;padding-left:22px;color:#000;">')
    for (const step of steps) {
      // Zutaten-Referenzen zu reinem Text auflösen (Menge + Name), ohne
      // jede Markierung — im Druck ist alles normaler Fließtext.
      const plain = resolveStepText(step.text, recipe.ingredients, portions)
        .map((seg) => seg.value)
        .join('')
      html.push(
        `<li style="margin:0 0 12px;white-space:pre-wrap;">${esc(plain)}</li>`,
      )
    }
    html.push('</ol>')
  } else {
    html.push('<p style="margin:0;color:#000;">Keine Schritte angegeben</p>')
  }

  node.innerHTML = html.join('')
  return node
}

// Wartet, bis alle <img> im Knoten geladen sind (oder fehlgeschlagen), damit
// html2canvas nicht ein halb geladenes Bild abgreift.
export function waitForImages(node) {
  const imgs = [...node.querySelectorAll('img')]
  return Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth
        ? Promise.resolve()
        : new Promise((res) => {
            img.onload = res
            img.onerror = res
          }),
    ),
  )
}
