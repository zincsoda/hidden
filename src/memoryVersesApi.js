/** Production sheet URL; dev uses Vite proxy path (see vite.config.js). */
export const MEMORY_VERSES_URL =
  import.meta.env.DEV
    ? '/api/memory-verses'
    : 'https://5ecvq3d6ri.execute-api.eu-west-2.amazonaws.com/api/sheet/memory_verses/ksr/'

/**
 * @param {unknown} row API row with Date, Ref, Verse
 * @returns {{ reference: string, text: string, date?: string } | null }
 */
export function mapSheetRow(row) {
  if (!row || typeof row !== 'object') return null
  const reference = String(row.Ref ?? '').trim()
  const text = String(row.Verse ?? '').trim()
  const rawDate = row.Date
  const date = rawDate != null && String(rawDate).trim() !== '' ? String(rawDate).trim() : ''
  if (!reference || !text) return null
  const verse = { reference, text }
  if (date) verse.date = date
  return verse
}

/** Parse sheet dates like 16/05/26 or 16/05/2026 (UK-style D/M/Y). Returns UTC ms or NaN. */
export function parseSheetDate(dateStr) {
  const s = String(dateStr ?? '').trim()
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(s)
  if (!m) return NaN
  const day = Number.parseInt(m[1], 10)
  const month = Number.parseInt(m[2], 10) - 1
  let year = Number.parseInt(m[3], 10)
  if (year < 100) year += 2000
  const t = Date.UTC(year, month, day)
  return Number.isNaN(t) ? NaN : t
}

/**
 * Newest memory verse for the home screen: prefers latest `date`, else last row (typical sheet append order).
 * @param {Array<{ reference: string, text: string, date?: string }>} list
 */
export function getMostRecentMemoryVerse(list) {
  if (!list?.length) return null
  const indexed = list.map((v, i) => ({
    v,
    i,
    t: v.date ? parseSheetDate(v.date) : NaN,
  }))
  const anyParsed = indexed.some((x) => !Number.isNaN(x.t))
  if (anyParsed) {
    indexed.sort((a, b) => {
      const ta = Number.isNaN(a.t) ? Number.NEGATIVE_INFINITY : a.t
      const tb = Number.isNaN(b.t) ? Number.NEGATIVE_INFINITY : b.t
      if (tb !== ta) return tb - ta
      return b.i - a.i
    })
    return indexed[0]?.v ? { ...indexed[0].v } : null
  }
  const last = list[list.length - 1]
  return last ? { ...last } : null
}

/**
 * After a background fetch, whether the home screen should switch to `latestFromApi`.
 * Only when both the displayed verse and API verse have parseable sheet dates and the API verse is strictly newer
 * (so undated / built-in verses are not overwritten).
 * @param {{ reference: string, text: string, date?: string }} displayed
 * @param {{ reference: string, text: string, date?: string }} latestFromApi
 */
export function shouldUpdateToLatestMemoryVerse(displayed, latestFromApi) {
  if (!latestFromApi || !displayed) return false
  const apiMs = latestFromApi.date ? parseSheetDate(latestFromApi.date) : NaN
  const shownMs = displayed.date ? parseSheetDate(displayed.date) : NaN
  if (Number.isNaN(apiMs) || Number.isNaN(shownMs)) return false
  return apiMs > shownMs
}

/**
 * @returns {Promise<Array<{ reference: string, text: string, date?: string }>>}
 */
export async function fetchMemoryVerses() {
  const res = await fetch(MEMORY_VERSES_URL)
  if (!res.ok) {
    throw new Error(`Could not load verses (${res.status}).`)
  }
  const data = await res.json()
  if (!Array.isArray(data)) {
    throw new Error('Unexpected response when loading verses.')
  }
  return data.map(mapSheetRow).filter(Boolean)
}
