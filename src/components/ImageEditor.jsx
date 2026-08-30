import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckIcon, RotateIcon, XIcon } from './icons'

// Bild-Editor: 90°-Drehen + freies Zuschneiden, komplett im Browser (Canvas),
// ohne externe Bibliothek. Gibt das Ergebnis als JPEG-File an `onApply` zurück;
// das Hochladen/Speichern übernimmt die aufrufende Komponente. Das Layout passt
// sich an jede Bildschirmgröße an (Handy hoch/quer, Tablet, Desktop).

// Lädt das Bild über einen Blob-URL, damit die Canvas nicht durch
// Cross-Origin-Regeln „getaintet" wird (Supabase-URLs liegen auf anderer Domain).
async function loadImage(src) {
  let url = src
  let revoke = null
  if (/^https?:/i.test(src)) {
    const blob = await fetch(src, { mode: 'cors' }).then((r) => r.blob())
    url = URL.createObjectURL(blob)
    revoke = url
  }
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
      i.src = url
    })
    return { img, revoke }
  } catch (err) {
    if (revoke) URL.revokeObjectURL(revoke)
    throw err
  }
}

const MIN = 24 // kleinste zulässige Zuschnitt-Kante in Anzeige-Pixeln

export default function ImageEditor({ src, busy, onCancel, onApply }) {
  const canvasRef = useRef(null)
  const frameRef = useRef(null) // Bereich, in den das Bild passen muss
  const baseRef = useRef(null) // { img, revoke }
  const dispRef = useRef({ w: 0, h: 0 })
  const [rotation, setRotation] = useState(0) // 0 | 90 | 180 | 270
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState(null)
  const [box, setBox] = useState(null) // { x, y, w, h } in Anzeige-Pixeln
  const [bump, setBump] = useState(0) // erzwingt Neuberechnung bei Größenänderung

  // Basisbild einmal laden.
  useEffect(() => {
    let cancelled = false
    loadImage(src)
      .then((res) => {
        if (cancelled) {
          if (res.revoke) URL.revokeObjectURL(res.revoke)
          return
        }
        baseRef.current = res
        setReady(true)
      })
      .catch((e) => setErr(e.message || String(e)))
    return () => {
      cancelled = true
      if (baseRef.current?.revoke) URL.revokeObjectURL(baseRef.current.revoke)
    }
  }, [src])

  // Auf jede Größenänderung des verfügbaren Bereichs reagieren.
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setBump((b) => b + 1))
    ro.observe(el)
    const onResize = () => setBump((b) => b + 1)
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [ready])

  // Gedrehtes Bild zeichnen und so skalieren, dass es exakt in den Bereich passt.
  useLayoutEffect(() => {
    if (!ready || err) return
    const frame = frameRef.current
    const canvas = canvasRef.current
    if (!frame || !canvas) return
    const { img } = baseRef.current
    const swap = rotation % 180 !== 0
    const natW = swap ? img.naturalHeight : img.naturalWidth
    const natH = swap ? img.naturalWidth : img.naturalHeight
    canvas.width = natW
    canvas.height = natH
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.translate(natW / 2, natH / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    ctx.restore()

    const r = frame.getBoundingClientRect()
    const availW = Math.max(60, r.width - 8) // minus Innenabstand p-2
    const availH = Math.max(60, r.height - 8)
    // Kleine Bilder nicht hochskalieren (scale ≤ 1) → Größe bleibt „ehrlich".
    const scale = Math.min(availW / natW, availH / natH, 1)
    const dispW = Math.max(1, Math.round(natW * scale))
    const dispH = Math.max(1, Math.round(natH * scale))
    canvas.style.width = dispW + 'px'
    canvas.style.height = dispH + 'px'
    dispRef.current = { w: dispW, h: dispH }
    setBox({ x: 0, y: 0, w: dispW, h: dispH })
  }, [ready, err, rotation, bump])

  const rotate = () => setRotation((r) => (r + 90) % 360)

  const startDrag = (mode) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    const start = { ...box }
    const px = e.clientX
    const py = e.clientY
    const disp = dispRef.current

    const onMove = (ev) => {
      const dx = ev.clientX - px
      const dy = ev.clientY - py
      let { x, y, w, h } = start
      if (mode === 'move') {
        x = Math.min(Math.max(0, start.x + dx), disp.w - start.w)
        y = Math.min(Math.max(0, start.y + dy), disp.h - start.h)
      } else {
        if (mode.includes('e'))
          w = Math.min(Math.max(MIN, start.w + dx), disp.w - start.x)
        if (mode.includes('s'))
          h = Math.min(Math.max(MIN, start.h + dy), disp.h - start.y)
        if (mode.includes('w')) {
          const nx = Math.min(Math.max(0, start.x + dx), start.x + start.w - MIN)
          w = start.x + start.w - nx
          x = nx
        }
        if (mode.includes('n')) {
          const ny = Math.min(Math.max(0, start.y + dy), start.y + start.h - MIN)
          h = start.y + start.h - ny
          y = ny
        }
      }
      setBox({ x, y, w, h })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const apply = async () => {
    if (!box) return
    try {
      const canvas = canvasRef.current
      const disp = dispRef.current
      const scale = canvas.width / disp.w
      const sx = Math.round(box.x * scale)
      const sy = Math.round(box.y * scale)
      const sw = Math.max(1, Math.round(box.w * scale))
      const sh = Math.max(1, Math.round(box.h * scale))
      const out = document.createElement('canvas')
      out.width = sw
      out.height = sh
      out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
      const blob = await new Promise((res) => out.toBlob(res, 'image/jpeg', 0.9))
      if (!blob) throw new Error('Bild konnte nicht erzeugt werden')
      await onApply(new File([blob], 'bearbeitet.jpg', { type: 'image/jpeg' }))
    } catch (e) {
      setErr(e.message || String(e))
    }
  }

  const d = dispRef.current
  const cropChanged =
    box &&
    (rotation !== 0 ||
      box.x > 0.5 ||
      box.y > 0.5 ||
      box.w < d.w - 0.5 ||
      box.h < d.h - 0.5)

  // Als Portal an <body>, damit das Overlay nicht von einem Vorfahren mit
  // `backdrop-filter` (jede `.card`) als Bezugsrahmen eingefangen wird —
  // sonst sitzt es verschoben/abgeschnitten statt bildschirmfüllend.
  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-cocoa-800/60 backdrop-blur-sm p-3 sm:p-4"
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-md flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-1 shrink-0">
          <h3 className="font-display text-lg font-semibold text-cocoa-800">
            Bild bearbeiten
          </h3>
          <button
            onClick={onCancel}
            className="text-cocoa-400 hover:text-cocoa-600"
            aria-label="Schließen"
          >
            <XIcon />
          </button>
        </div>

        {err ? (
          <p className="text-sm text-terracotta-600 px-4 py-10 text-center">
            {err}
          </p>
        ) : !ready ? (
          <p className="text-sm text-cocoa-400 px-4 py-10 text-center">
            Bild wird geladen…
          </p>
        ) : (
          <>
            <p className="px-4 text-xs text-cocoa-400 shrink-0">
              Ecken ziehen zum Zuschneiden, Rahmen ziehen zum Verschieben.
            </p>
            <div
              ref={frameRef}
              className="flex-1 min-h-[200px] mx-3 my-2 p-1 bg-cream-100 rounded-2xl overflow-hidden flex items-center justify-center"
            >
              <div
                className="relative leading-none select-none"
                style={{ touchAction: 'none' }}
              >
                <canvas ref={canvasRef} className="block rounded-lg" />
                {box && (
                  <div
                    className="absolute border-2 border-white cursor-move"
                    style={{
                      left: box.x,
                      top: box.y,
                      width: box.w,
                      height: box.h,
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                      touchAction: 'none',
                    }}
                    onPointerDown={startDrag('move')}
                  >
                    {['nw', 'ne', 'sw', 'se'].map((corner) => (
                      <span
                        key={corner}
                        onPointerDown={startDrag(corner)}
                        className="absolute w-6 h-6 bg-white rounded-full shadow border border-cocoa-300"
                        style={{
                          left: corner.includes('w') ? -12 : undefined,
                          right: corner.includes('e') ? -12 : undefined,
                          top: corner.includes('n') ? -12 : undefined,
                          bottom: corner.includes('s') ? -12 : undefined,
                          cursor: `${corner}-resize`,
                          touchAction: 'none',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pt-1 shrink-0">
              <button
                onClick={rotate}
                disabled={busy}
                className="btn-ghost w-full sm:w-auto sm:mr-auto"
              >
                <RotateIcon width={18} height={18} />
                90° drehen
              </button>
              <button
                onClick={onCancel}
                disabled={busy}
                className="btn-ghost flex-1 sm:flex-none"
              >
                Abbrechen
              </button>
              <button
                onClick={apply}
                disabled={busy || !box}
                className="btn-primary flex-1 sm:flex-none"
              >
                <CheckIcon width={18} height={18} />
                {busy ? 'Speichern…' : cropChanged ? 'Übernehmen' : 'Fertig'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
