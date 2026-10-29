// Minimal game state machine: "menu" -> "playing" -> "gameover" and so on.
//
//   const state = createState("menu")
//   state.on("playing", () => resetGame())
//   if (state.is("playing")) { ... }   // inside your update loop
export function createState(initial = "menu") {
  let current = initial
  const listeners = new Map()
  const anyListeners = []

  return {
    get value() {
      return current
    },
    is: (name) => current === name,
    set(next) {
      if (next === current) return
      const previous = current
      current = next
      for (const fn of listeners.get(next) ?? []) fn(previous)
      for (const fn of anyListeners) fn(next, previous)
    },
    // Runs when entering state `name`. Returns an unsubscribe function.
    on(name, fn) {
      if (!listeners.has(name)) listeners.set(name, [])
      listeners.get(name).push(fn)
      return () => listeners.get(name).splice(listeners.get(name).indexOf(fn), 1)
    },
    // Runs on every transition with (next, previous).
    onChange(fn) {
      anyListeners.push(fn)
      return () => anyListeners.splice(anyListeners.indexOf(fn), 1)
    },
  }
}
