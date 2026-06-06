/** True when this character can be picked as a letter cue. */
export function isSelectableLetter(char) {
  return /[a-zA-Z]/.test(char)
}

/** Selected cue letters in verse order, separated by spaces. */
export function buildLetterCueLine(text, selectedIndices) {
  const sorted = [...selectedIndices].sort((a, b) => a - b)
  return sorted
    .map((i) => text[i])
    .filter((ch) => ch != null && isSelectableLetter(ch))
    .join(' ')
}

export function toggleLetterIndex(selectedIndices, index) {
  const next = new Set(selectedIndices)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  return next
}

/** Index of the first letter cue character in `text[start..end)`, or null if none. */
export function getFirstSelectableLetterIndex(text, start, end) {
  for (let i = start; i < end; i++) {
    if (isSelectableLetter(text[i])) return i
  }
  return null
}

export function isWordCueSelected(selectedIndices, text, wordRange) {
  const index = getFirstSelectableLetterIndex(text, wordRange.start, wordRange.end)
  return index != null && selectedIndices.has(index)
}

export function toggleWordCueIndex(selectedIndices, text, wordRange) {
  const index = getFirstSelectableLetterIndex(text, wordRange.start, wordRange.end)
  if (index == null) return selectedIndices
  return toggleLetterIndex(selectedIndices, index)
}

/** Character start/end (exclusive) for each whitespace-delimited word in `text`. */
export function getWordCharRanges(text, words) {
  const ranges = []
  let pos = 0
  for (const word of words) {
    const idx = text.indexOf(word, pos)
    const start = idx === -1 ? pos : idx
    ranges.push({ start, end: start + word.length })
    pos = start + word.length
  }
  return ranges
}
