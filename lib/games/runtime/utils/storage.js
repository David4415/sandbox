// localStorage with a safe fallback (the preview may run with storage blocked).
export function save(key, value) {
  try {
    localStorage.setItem(`game:${key}`, JSON.stringify(value))
  } catch {}
}

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(`game:${key}`)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

// Persistent best score. submit() returns true when the score is a new record.
export function highScore(key = "highscore") {
  let best = load(key, 0)
  return {
    get value() {
      return best
    },
    submit(score) {
      if (score <= best) return false
      best = score
      save(key, best)
      return true
    },
  }
}
