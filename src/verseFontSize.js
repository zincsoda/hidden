const STORAGE_KEY = 'verseFontScale'

export const VERSE_FONT_SCALE_STEPS = [
  { label: 'Smaller', scale: 0.85 },
  { label: 'Small', scale: 0.925 },
  { label: 'Default', scale: 1 },
  { label: 'Large', scale: 1.15 },
  { label: 'Larger', scale: 1.3 },
]

export const DEFAULT_VERSE_FONT_SCALE_INDEX = 2

export function readVerseFontScaleIndex() {
  if (typeof localStorage === 'undefined') return DEFAULT_VERSE_FONT_SCALE_INDEX

  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return DEFAULT_VERSE_FONT_SCALE_INDEX

  const idx = Number.parseInt(raw, 10)
  if (!Number.isFinite(idx) || idx < 0 || idx >= VERSE_FONT_SCALE_STEPS.length) {
    return DEFAULT_VERSE_FONT_SCALE_INDEX
  }
  return idx
}

export function applyVerseFontScale(index = readVerseFontScaleIndex()) {
  const clamped = Math.max(0, Math.min(VERSE_FONT_SCALE_STEPS.length - 1, index))
  if (typeof document !== 'undefined') {
    const { scale } = VERSE_FONT_SCALE_STEPS[clamped]
    document.documentElement.style.setProperty('--verse-font-scale', String(scale))
  }
  return clamped
}

export function setVerseFontScaleIndex(index) {
  const clamped = Math.max(0, Math.min(VERSE_FONT_SCALE_STEPS.length - 1, index))
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, String(clamped))
  }
  return applyVerseFontScale(clamped)
}

export function bumpVerseFontScale(delta) {
  return setVerseFontScaleIndex(readVerseFontScaleIndex() + delta)
}
