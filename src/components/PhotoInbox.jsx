import { useEffect, useMemo, useRef, useState } from 'react'
import * as storage from '../lib/storage'
import { CameraIcon, CheckIcon, PlusIcon, TrashIcon } from './icons'

// Foto-Inbox (3. Tab): Rezeptfotos sammeln, die noch nicht abgetippt sind.
// Beim nächsten Mal in Claude Code werden die offenen Fotos ausgelesen und
// als Rezepte in die Liste eingetragen; der Eintrag wird dann auf „erledigt"
// gesetzt (das Foto bleibt zum Gegenprüfen erhalten).
export default function PhotoInbox({ onOpenRecipe }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  const refresh = async () => {
    try {
      setPhotos(await storage.listInbox())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const onPick = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        const url = await storage.uploadInboxImage(file)
        await storage.addInboxPhoto(url, '')
      }
      await refresh()
    } catch (err) {
      console.error(err)
      alert('Foto konnte nicht hochgeladen werden: ' + (err.message || err))
    } finally {
      setUploading(false)
    }
  }

  const setNote = async (id, note) => {
    setPhotos((list) => list.map((p) => (p.id === id ? { ...p, note } : p)))
    try {
      await storage.updateInboxPhoto(id, { note })
    } catch (err) {
      console.error(err)
    }
  }

  const toggleStatus = async (photo) => {
    const status = photo.status === 'erledigt' ? 'offen' : 'erledigt'
    setPhotos((list) =>
      list.map((p) => (p.id === photo.id ? { ...p, status } : p)),
    )
    try {
      await storage.updateInboxPhoto(photo.id, { status })
    } catch (err) {
      console.error(err)
    }
  }

  const remove = async (id) => {
    if (!confirm('Dieses Foto aus der Inbox löschen?')) return
    setPhotos((list) => list.filter((p) => p.id !== id))
    try {
      await storage.deleteInboxPhoto(id)
    } catch (err) {
      console.error(err)
      await refresh()
    }
  }

  const sorted = useMemo(() => {
    const rank = (s) => (s === 'erledigt' ? 1 : 0)
    return [...photos].sort(
      (a, b) =>
        rank(a.status) - rank(b.status) ||
        (b.createdAt || '').localeCompare(a.createdAt || ''),
    )
  }, [photos])

  const openCount = photos.filter((p) => p.status !== 'erledigt').length

  return (
    <div className="mt-5">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cocoa-800">
            {'\u{1F4F7}'} Fotos
          </h1>
          <p className="text-cocoa-400 mt-1">
            Rezeptfotos hier ablegen — sie werden später abgetippt und in die
            Rezeptliste eingetragen.
            {openCount > 0 && ` · ${openCount} offen`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-primary"
            onClick={() => cameraRef.current?.click()}
            disabled={uploading}
          >
            <CameraIcon width={18} height={18} />
            {uploading ? 'Wird hochgeladen…' : 'Foto aufnehmen'}
          </button>
          <button
            className="btn-soft"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <PlusIcon width={18} height={18} />
            Aus Galerie
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onPick}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onPick}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card aspect-[3/4] animate-pulse bg-white/50" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">{'\u{1F4F8}'}</p>
          <p className="text-cocoa-600 text-lg font-semibold">
            Noch keine Fotos
          </p>
          <p className="text-cocoa-400 mt-1 mb-5">
            Lade Fotos von Rezeptkarten, Kochbuchseiten oder Notizzetteln hoch.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              className="btn-primary"
              onClick={() => cameraRef.current?.click()}
            >
              <CameraIcon width={18} height={18} />
              Foto aufnehmen
            </button>
            <button
              className="btn-soft"
              onClick={() => fileRef.current?.click()}
            >
              <PlusIcon width={18} height={18} />
              Aus Galerie
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onNote={(note) => setNote(photo.id, note)}
              onToggleStatus={() => toggleStatus(photo)}
              onRemove={() => remove(photo.id)}
              onOpenRecipe={onOpenRecipe}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PhotoCard({ photo, onNote, onToggleStatus, onRemove, onOpenRecipe }) {
  const [note, setNoteLocal] = useState(photo.note)
  const done = photo.status === 'erledigt'

  useEffect(() => {
    setNoteLocal(photo.note)
  }, [photo.note])

  return (
    <div className="card overflow-hidden flex flex-col">
      <a
        href={photo.imageUrl}
        target="_blank"
        rel="noreferrer"
        className="block relative aspect-[3/4] bg-cream-100"
      >
        <img
          src={photo.imageUrl}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <span
          className={`absolute top-2 left-2 chip text-xs shadow-soft ${
            done
              ? 'bg-sage-500 text-white'
              : 'bg-white/90 text-cocoa-600 backdrop-blur'
          }`}
        >
          {done ? (
            <>
              <CheckIcon width={13} height={13} /> erledigt
            </>
          ) : (
            'offen'
          )}
        </span>
      </a>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <textarea
          value={note}
          onChange={(e) => setNoteLocal(e.target.value)}
          onBlur={() => note !== photo.note && onNote(note)}
          rows={2}
          placeholder="Notiz (z. B. von Oma, Kategorie Kuchen)"
          className="field resize-y text-sm py-2 leading-snug"
        />

        {done && photo.recipeId && onOpenRecipe && (
          <button
            onClick={() => onOpenRecipe(photo.recipeId)}
            className="text-sm font-semibold text-sage-600 hover:text-sage-600/80 text-left"
          >
            → Rezept ansehen
          </button>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <button
            onClick={onToggleStatus}
            className="text-xs font-semibold text-cocoa-500 hover:text-cocoa-800"
          >
            {done ? 'als offen markieren' : 'als erledigt markieren'}
          </button>
          <button
            onClick={onRemove}
            className="text-cocoa-400 hover:text-terracotta-500 p-1"
            aria-label="Foto löschen"
          >
            <TrashIcon width={16} height={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
