import { isCloud } from '../lib/storage'
import { BookIcon, CalendarIcon, CameraIcon, PlusIcon } from './icons'

export default function Header({
  onLogoClick,
  onAdd,
  showAdd,
  view,
  plannerCount,
  onNavigate,
}) {
  const showNav = ['overview', 'planner', 'shopping', 'inbox'].includes(view)

  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-cream-50/80 border-b border-cream-200/70">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 group flex-shrink-0"
          aria-label="Zu allen Rezepten"
        >
          <img
            src="icons/icon-192.png"
            alt=""
            className="w-9 h-9 rounded-2xl shadow-soft group-active:scale-95 transition"
          />
          <span className="hidden sm:inline font-display text-2xl font-semibold text-cocoa-800 tracking-tight">
            Anjas <span className="text-terracotta-500">Kochzauberei</span>
          </span>
        </button>

        {showNav && (
          <nav className="inline-flex items-center gap-1 bg-white/70 rounded-full p-1 shadow-soft">
            <NavItem
              active={view === 'overview'}
              onClick={() => onNavigate('overview')}
              icon={<BookIcon width={18} height={18} />}
              label="Rezepte"
            />
            <NavItem
              active={view === 'planner' || view === 'shopping'}
              onClick={() => onNavigate('planner')}
              icon={<CalendarIcon width={18} height={18} />}
              label="Planer"
              badge={plannerCount}
            />
            <NavItem
              active={view === 'inbox'}
              onClick={() => onNavigate('inbox')}
              icon={<CameraIcon width={18} height={18} />}
              label="Fotos"
            />
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span
            className="hidden md:inline-flex chip bg-white/70 text-cocoa-400 text-xs"
            title={
              isCloud
                ? 'Über Supabase auf allen Geräten synchronisiert'
                : 'Auf diesem Gerät gespeichert — Supabase verbinden für Geräte-Sync'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${isCloud ? 'bg-sage-400' : 'bg-terracotta-300'}`}
            />
            {isCloud ? 'Synchronisiert' : 'Auf diesem Gerät'}
          </span>

          {showAdd && (
            <button className="btn-primary px-3 sm:px-5" onClick={onAdd}>
              <PlusIcon width={18} height={18} />
              <span className="hidden sm:inline">Neues Rezept</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function NavItem({ active, onClick, icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
        active
          ? 'bg-terracotta-500 text-white shadow-soft'
          : 'text-cocoa-600 hover:text-cocoa-800'
      }`}
    >
      {icon}
      {label}
      {badge > 0 && (
        <span
          className={`text-xs rounded-full px-1.5 py-0.5 ${
            active ? 'bg-white/25' : 'bg-terracotta-100 text-terracotta-600'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  )
}
