export const ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => t * (2 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  outElastic: (t) =>
    t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  outBounce: (t) => {
    const n = 7.5625
    const d = 2.75
    if (t < 1 / d) return n * t * t
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375
    return n * (t -= 2.625 / d) * t + 0.984375
  },
}

// Property tweening for any object, nested properties included.
//
//   const tweens = createTweens(engine)
//   tweens.tween(mesh, { position: { y: 3 }, scale: { x: 2, y: 2, z: 2 } }, { duration: 0.6, ease: "outBack" })
//   await tweens.tween(mesh.material, { opacity: 0 }, { duration: 0.3 }).finished
//   tweens.tween(coin.position, { y: 1.5 }, { duration: 1, loop: true, yoyo: true, ease: "inOutSine" })
export function createTweens(engine) {
  const active = new Set()

  function collect(target, to, out) {
    for (const key of Object.keys(to)) {
      if (typeof to[key] === "number") out.push({ target, key, from: target[key], to: to[key] })
      else collect(target[key], to[key], out)
    }
  }

  function tween(
    target,
    to,
    { duration = 0.5, delay = 0, ease: easing = "outCubic", loop = false, yoyo = false, onUpdate, onComplete } = {}
  ) {
    const curve = typeof easing === "function" ? easing : (ease[easing] ?? ease.linear)
    let props = null
    let resolve
    const t = {
      time: -delay,
      finished: new Promise((r) => (resolve = r)),
      stop() {
        active.delete(t)
        resolve()
      },
      update(dt) {
        t.time += dt
        if (t.time < 0) return
        if (!props) {
          props = [] // start values are read when the delay ends
          collect(target, to, props)
        }
        let k
        if (loop) {
          k = (t.time / duration) % (yoyo ? 2 : 1)
          if (yoyo && k > 1) k = 2 - k
        } else {
          k = Math.min(t.time / duration, 1)
        }
        const e = curve(k)
        for (const p of props) p.target[p.key] = p.from + (p.to - p.from) * e
        onUpdate?.(e)
        if (!loop && k >= 1) {
          t.stop()
          onComplete?.()
        }
      },
    }
    active.add(t)
    return t
  }

  // Animate a plain number: tweens.value(0, 100, 1, (v) => (label.textContent = Math.round(v)))
  function value(from, to, duration, onUpdate, options = {}) {
    const state = { v: from }
    return tween(state, { v: to }, { duration, ...options, onUpdate: () => onUpdate(state.v) })
  }

  engine.onUpdate((dt) => {
    for (const t of [...active]) t.update(dt)
  }, -50)

  return {
    tween,
    value,
    clear() {
      for (const t of [...active]) t.stop()
    },
  }
}
