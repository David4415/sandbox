// On-screen joystick and buttons for touch devices. Feeds the same input.move and
// input.action(...) the keyboard does, so the game code needs no touch branch.
//
//   createTouchControls(input, { buttons: [{ action: "jump", label: "A" }] })
export function createTouchControls(
  input,
  { joystick = true, buttons = [{ action: "jump", label: "A" }], force = false } = {}
) {
  if (!force && !window.matchMedia("(pointer: coarse)").matches) return null

  const layer = document.createElement("div")
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:20;user-select:none;-webkit-user-select:none"
  document.body.appendChild(layer)

  if (joystick) {
    const RADIUS = 56
    const base = document.createElement("div")
    base.style.cssText = `position:absolute;left:24px;bottom:24px;width:${RADIUS * 2}px;height:${RADIUS * 2}px;border-radius:50%;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.3);pointer-events:auto;touch-action:none`
    const knob = document.createElement("div")
    knob.style.cssText = `position:absolute;left:${RADIUS - 24}px;top:${RADIUS - 24}px;width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.55)`
    base.appendChild(knob)
    layer.appendChild(base)

    let id = null
    const setStick = (e) => {
      const rect = base.getBoundingClientRect()
      let dx = e.clientX - (rect.left + RADIUS)
      let dy = e.clientY - (rect.top + RADIUS)
      const length = Math.hypot(dx, dy)
      if (length > RADIUS) {
        dx = (dx / length) * RADIUS
        dy = (dy / length) * RADIUS
      }
      knob.style.transform = `translate(${dx}px,${dy}px)`
      input.virtual.move.x = dx / RADIUS
      input.virtual.move.y = -dy / RADIUS
    }
    base.addEventListener("pointerdown", (e) => {
      id = e.pointerId
      base.setPointerCapture(id)
      setStick(e)
    })
    base.addEventListener("pointermove", (e) => e.pointerId === id && setStick(e))
    const end = (e) => {
      if (e.pointerId !== id) return
      id = null
      knob.style.transform = ""
      input.virtual.move.x = input.virtual.move.y = 0
    }
    base.addEventListener("pointerup", end)
    base.addEventListener("pointercancel", end)
  }

  buttons.forEach(({ action, label }, i) => {
    const button = document.createElement("div")
    button.textContent = label
    button.style.cssText = `position:absolute;right:${24 + i * 84}px;bottom:32px;width:68px;height:68px;border-radius:50%;background:rgba(234,88,12,.7);border:2px solid rgba(255,255,255,.5);color:#fff;font:700 20px system-ui,sans-serif;display:grid;place-items:center;pointer-events:auto;touch-action:none`
    button.addEventListener("pointerdown", () => input.setVirtualAction(action, true))
    for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
      button.addEventListener(type, () => input.setVirtualAction(action, false))
    }
    layer.appendChild(button)
  })

  return { dispose: () => layer.remove() }
}
