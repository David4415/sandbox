// DOM overlay for scores, bars, messages, menus and floating text. Styled to sit
// on top of the 3D canvas; everything except buttons ignores pointer events.
//
//   const hud = createHUD(engine)
//   hud.stat("score", "Score", 0);  hud.set("score", 120)
//   hud.bar("health", "HP", { color: "#ef4444" });  hud.setBar("health", 0.6)
//   hud.message("Wave 2!")
//   await hud.screen({ title: "Space Run", subtitle: "Dodge the asteroids", button: "Play" })
const CSS = `
.kit-hud{position:absolute;inset:0;pointer-events:none;font:600 15px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.45);user-select:none;-webkit-user-select:none;overflow:hidden}
.kit-stats{position:absolute;top:16px;left:16px;right:16px;display:flex;gap:10px;flex-wrap:wrap}
.kit-stat{background:rgba(15,15,20,.45);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:8px 14px;display:flex;flex-direction:column;gap:2px;min-width:70px}
.kit-label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.7}
.kit-value{font-size:22px;font-variant-numeric:tabular-nums}
.kit-bars{position:absolute;left:16px;bottom:16px;display:flex;flex-direction:column;gap:8px;width:min(260px,50vw)}
.kit-bar{display:flex;flex-direction:column;gap:3px}
.kit-bar-track{height:12px;border-radius:99px;background:rgba(15,15,20,.5);border:1px solid rgba(255,255,255,.18);overflow:hidden}
.kit-bar-fill{height:100%;width:100%;border-radius:99px;transform-origin:left;transition:transform .2s ease}
.kit-message{position:absolute;top:22%;left:50%;transform:translate(-50%,0);font-size:34px;font-weight:800;text-align:center;opacity:0;transition:opacity .25s,transform .25s;white-space:pre-line}
.kit-message.show{opacity:1;transform:translate(-50%,-8px)}
.kit-hint{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);font-size:13px;opacity:.75;text-align:center;padding:0 12px}
.kit-cross{position:absolute;top:50%;left:50%;width:18px;height:18px;transform:translate(-50%,-50%)}
.kit-cross::before,.kit-cross::after{content:"";position:absolute;background:#fff;box-shadow:0 0 3px rgba(0,0,0,.6)}
.kit-cross::before{left:8px;top:0;width:2px;height:18px}.kit-cross::after{top:8px;left:0;height:2px;width:18px}
.kit-screen{position:absolute;inset:0;display:grid;place-items:center;background:rgba(10,10,14,.55);backdrop-filter:blur(6px);pointer-events:auto}
.kit-card{text-align:center;padding:28px 36px;border-radius:20px;background:rgba(20,20,26,.7);border:1px solid rgba(255,255,255,.16);max-width:min(440px,88vw)}
.kit-card h1{margin:0 0 8px;font-size:38px;font-weight:800}
.kit-card p{margin:0 0 20px;opacity:.8;font-weight:500;white-space:pre-line}
.kit-btn{pointer-events:auto;cursor:pointer;border:0;border-radius:12px;padding:12px 28px;font:700 17px system-ui,sans-serif;color:#fff;background:#ea580c;box-shadow:0 6px 18px rgba(234,88,12,.45);transition:transform .12s}
.kit-btn:hover{transform:translateY(-1px)}.kit-btn:active{transform:translateY(1px)}
.kit-float{position:absolute;font-size:20px;font-weight:800;transform:translate(-50%,-50%);animation:kit-float 1s ease-out forwards}
@keyframes kit-float{to{transform:translate(-50%,-90px);opacity:0}}
`

let styled = false

export function createHUD(engine) {
  if (!styled) {
    const style = document.createElement("style")
    style.textContent = CSS
    document.head.appendChild(style)
    styled = true
  }

  const root = document.createElement("div")
  root.className = "kit-hud"
  const stats = el("div", "kit-stats", root)
  const bars = el("div", "kit-bars", root)
  const message = el("div", "kit-message", root)
  const hint = el("div", "kit-hint", root)
  engine.root.appendChild(root)

  const statValues = new Map()
  const barFills = new Map()
  let messageTimer = 0
  let screenEl = null
  let crosshair = null

  const hud = {
    root,
    // Top-left value tile. Call again with the same id to relabel.
    stat(id, label, value = "") {
      let value$ = statValues.get(id)
      if (!value$) {
        const tile = el("div", "kit-stat", stats)
        el("span", "kit-label", tile).textContent = label
        value$ = el("span", "kit-value", tile)
        value$.tile = tile
        statValues.set(id, value$)
      }
      value$.textContent = value
      return hud
    },
    set(id, value) {
      const v = statValues.get(id)
      if (v) v.textContent = value
    },
    removeStat(id) {
      statValues.get(id)?.tile.remove()
      statValues.delete(id)
    },

    // Bottom-left progress bar (health, stamina, ammo). setBar takes 0..1.
    bar(id, label, { color = "#22c55e", value = 1 } = {}) {
      const wrap = el("div", "kit-bar", bars)
      el("span", "kit-label", wrap).textContent = label
      const track = el("div", "kit-bar-track", wrap)
      const fill = el("div", "kit-bar-fill", track)
      fill.style.background = color
      barFills.set(id, fill)
      hud.setBar(id, value)
      return hud
    },
    setBar(id, value) {
      const fill = barFills.get(id)
      if (fill) fill.style.transform = `scaleX(${Math.min(1, Math.max(0, value))})`
    },

    // Big centered text that fades out: hud.message("Level 2"), hud.message("Go!", 800).
    message(text, duration = 1600) {
      message.textContent = text
      message.classList.add("show")
      clearTimeout(messageTimer)
      messageTimer = setTimeout(() => message.classList.remove("show"), duration)
    },

    // Persistent small line at the bottom, e.g. "WASD to move, Space to jump".
    hint(text) {
      hint.textContent = text ?? ""
    },

    crosshair(visible = true) {
      if (visible && !crosshair) crosshair = el("div", "kit-cross", root)
      if (!visible && crosshair) (crosshair.remove(), (crosshair = null))
    },

    // Full-screen menu. Resolves when the button is pressed.
    screen({ title = "", subtitle = "", button = "Play" } = {}) {
      hud.hideScreen()
      screenEl = el("div", "kit-screen", root)
      const card = el("div", "kit-card", screenEl)
      el("h1", "", card).textContent = title
      el("p", "", card).textContent = subtitle
      return new Promise((resolve) => {
        if (!button) return resolve()
        const b = el("button", "kit-btn", card)
        b.textContent = button
        b.onclick = () => (hud.hideScreen(), resolve())
        b.focus()
      })
    },
    hideScreen() {
      screenEl?.remove()
      screenEl = null
    },

    // 3, 2, 1, Go! Resolves at the end.
    async countdown(from = 3) {
      for (let n = from; n > 0; n--) {
        hud.message(String(n), 900)
        await new Promise((r) => setTimeout(r, 1000))
      }
      hud.message("Go!", 700)
    },

    // Text that floats up from a world position (a Vector3): damage numbers, +10.
    floatText(text, worldPosition, { color = "#fde047" } = {}) {
      const p = worldPosition.clone().project(engine.camera)
      if (p.z > 1) return
      const f = el("div", "kit-float", root)
      f.textContent = text
      f.style.color = color
      f.style.left = `${((p.x + 1) / 2) * 100}%`
      f.style.top = `${((1 - p.y) / 2) * 100}%`
      setTimeout(() => f.remove(), 1000)
    },

    dispose() {
      root.remove()
    },
  }
  return hud
}

function el(tag, className, parent) {
  const node = document.createElement(tag)
  if (className) node.className = className
  parent.appendChild(node)
  return node
}
