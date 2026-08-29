import { MinusIcon, PlusIcon } from './icons'

// Portion multiplier in 0.5 steps. Default & minimum = 1, no upper limit.
function roundToHalf(n) {
  return Math.round(n * 2) / 2
}

// Displays "1", "1.5", "2" — never "1.0" or floating-point noise.
export function formatPortions(n) {
  return roundToHalf(n)
    .toFixed(1)
    .replace(/\.0$/, '')
}

export default function PortionStepper({ value, onChange }) {
  const set = (n) => {
    const num = Math.max(1, roundToHalf(Number(n) || 1))
    onChange(num)
  }

  return (
    <div className="inline-flex items-center gap-1 bg-white rounded-full p-1 shadow-soft border border-cream-200">
      <button
        onClick={() => set(value - 0.5)}
        disabled={value <= 1}
        className="grid place-items-center w-9 h-9 rounded-full text-cocoa-600 hover:bg-cream-100 disabled:opacity-40 disabled:hover:bg-transparent transition"
        aria-label="Weniger Portionen"
      >
        <MinusIcon width={18} height={18} />
      </button>
      <input
        type="number"
        min={1}
        step={0.5}
        inputMode="decimal"
        value={formatPortions(value)}
        onChange={(e) => set(e.target.value)}
        className="w-14 text-center bg-transparent font-display text-xl font-semibold text-cocoa-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Portionen-Faktor"
      />
      <button
        onClick={() => set(value + 0.5)}
        className="grid place-items-center w-9 h-9 rounded-full text-cocoa-600 hover:bg-cream-100 transition"
        aria-label="Mehr Portionen"
      >
        <PlusIcon width={18} height={18} />
      </button>
    </div>
  )
}
