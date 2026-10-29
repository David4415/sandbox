export const TAU = Math.PI * 2

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const wrap = (v, min, max) => min + ((((v - min) % (max - min)) + (max - min)) % (max - min))

// Frame-rate independent smoothing: current = damp(current, target, 8, dt).
export const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt))

// Same as damp, but turns the short way around the circle.
export function dampAngle(current, target, lambda, dt) {
  const diff = wrap(target - current, -Math.PI, Math.PI)
  return current + diff * (1 - Math.exp(-lambda * dt))
}

export const rand = (min = 0, max = 1) => min + Math.random() * (max - min)
export const randInt = (min, max) => Math.floor(rand(min, max + 1))
export const chance = (p = 0.5) => Math.random() < p
export const pick = (array) => array[Math.floor(Math.random() * array.length)]

export function shuffle(array) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Random point on the ground plane inside a circle (x, z).
export function randomInCircle(radius = 1) {
  const angle = rand(0, TAU)
  const r = Math.sqrt(Math.random()) * radius
  return { x: Math.cos(angle) * r, z: Math.sin(angle) * r }
}

// Deterministic random numbers: const random = createRng(42); random() -> [0, 1)
export function createRng(seed = 1) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
