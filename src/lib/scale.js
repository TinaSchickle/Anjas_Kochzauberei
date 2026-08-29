// Scales a free-text amount by an integer factor.
// The amount is any string ("200g", "1 cup", "0,5 L", "1/2", "salt", "").
// We find the FIRST number-like token and multiply it, keeping everything
// else (units, words, spacing) untouched. If there is no number, the amount
// is returned unchanged — so "salt" stays "salt".
//
// Handles: integers, decimals with "." or "," and simple fractions "a/b".

const FRACTION = /(\d+)\s*\/\s*(\d+)/
const DECIMAL = /\d+(?:[.,]\d+)?/

function formatNumber(value, usedComma) {
  // Round to 3 decimals to avoid floating point noise, then trim zeros.
  let s = (Math.round(value * 1000) / 1000).toString()
  if (usedComma) s = s.replace('.', ',')
  return s
}

export function scaleAmount(amount, factor) {
  if (!amount || factor === 1) return amount ?? ''
  const n = Number(factor)
  if (!Number.isFinite(n) || n <= 0) return amount

  // Try a fraction first (e.g. "1/2 tsp").
  const frac = amount.match(FRACTION)
  if (frac) {
    const value = (Number(frac[1]) / Number(frac[2])) * n
    return amount.replace(FRACTION, formatNumber(value, false))
  }

  const dec = amount.match(DECIMAL)
  if (dec) {
    const raw = dec[0]
    const usedComma = raw.includes(',')
    const value = Number(raw.replace(',', '.')) * n
    return amount.replace(DECIMAL, formatNumber(value, usedComma))
  }

  return amount
}
