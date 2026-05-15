/** Pick up to `count` items from `pool` uniformly at random, without replacement. */
export function pickRandomFromPool(pool, count) {
  const arr = [...pool]
  const n = Math.min(count, arr.length)
  if (n <= 0) return []
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, n)
}
