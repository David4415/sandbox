// Unified keyboard / mouse / touch input.
//
//   const input = createInput(engine)
//   input.move            // { x, y } from WASD, arrows or the touch joystick; y > 0 is forward
//   input.action("jump")  // held;  input.actionPressed("jump") is true only on the first frame
//   input.isDown("KeyQ")  // raw key codes; mouse buttons are "Mouse0", "Mouse1", "Mouse2"
//   input.pointer         // { x, y (-1..1, y up), dx, dy, down, pressed, released }
const DEFAULT_BINDINGS = {
  jump: ["Space"],
  fire: ["KeyF", "Mouse0"],
  sprint: ["ShiftLeft", "ShiftRight"],
  interact: ["KeyE"],
  pause: ["Escape", "KeyP"],
}

const GAME_KEYS = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"])

export function createInput(engine, { bindings = {} } = {}) {
  const canvas = engine.canvas
  const down = new Set()
  const pressed = new Set()
  const released = new Set()
  const actions = new Map(Object.entries({ ...DEFAULT_BINDINGS, ...bindings }))
  const pointer = { x: 0, y: 0, dx: 0, dy: 0, down: false, pressed: false, released: false }
  const virtual = { move: { x: 0, y: 0 }, held: new Set(), pressed: new Set() }
  const move = { x: 0, y: 0 }

  function press(code) {
    if (!down.has(code)) pressed.add(code)
    down.add(code)
  }
  function release(code) {
    down.delete(code)
    released.add(code)
  }

  const onKeyDown = (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault() // don't scroll the page
    if (!e.repeat) press(e.code)
  }
  const onKeyUp = (e) => release(e.code)
  const onPointerMove = (e) => {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    pointer.dx += e.movementX || 0
    pointer.dy += e.movementY || 0
  }
  const onPointerDown = (e) => {
    onPointerMove(e)
    canvas.focus() // the preview is an iframe: keys only arrive once it has focus
    pointer.down = true
    pointer.pressed = true
    press(`Mouse${e.button}`)
  }
  const onPointerUp = (e) => {
    pointer.down = false
    pointer.released = true
    release(`Mouse${e.button}`)
  }
  const onBlur = () => {
    for (const code of down) release(code)
    pointer.down = false
  }

  window.addEventListener("keydown", onKeyDown)
  window.addEventListener("keyup", onKeyUp)
  window.addEventListener("pointermove", onPointerMove)
  canvas.addEventListener("pointerdown", onPointerDown)
  window.addEventListener("pointerup", onPointerUp)
  window.addEventListener("blur", onBlur)
  canvas.addEventListener("contextmenu", (e) => e.preventDefault())

  const anyDown = (codes) => codes.some((c) => down.has(c))
  const input = {
    pointer,
    virtual,
    isDown: (code) => down.has(code),
    pressed: (code) => pressed.has(code),
    released: (code) => released.has(code),

    // Rebind or add an action: input.bind("shoot", ["Space", "Mouse0"])
    bind(name, codes) {
      actions.set(name, codes)
    },
    action: (name) => anyDown(actions.get(name) ?? []) || virtual.held.has(name),
    actionPressed: (name) =>
      (actions.get(name) ?? []).some((c) => pressed.has(c)) || virtual.pressed.has(name),
    actionReleased: (name) => (actions.get(name) ?? []).some((c) => released.has(c)),

    // -1, 0 or 1 from two key codes.
    axis: (negative, positive) => (down.has(positive) ? 1 : 0) - (down.has(negative) ? 1 : 0),

    // Movement vector, length <= 1. Updated on each read.
    get move() {
      let x = input.axis("KeyA", "KeyD") + input.axis("ArrowLeft", "ArrowRight")
      let y = input.axis("KeyS", "KeyW") + input.axis("ArrowDown", "ArrowUp")
      x += virtual.move.x
      y += virtual.move.y
      const length = Math.hypot(x, y)
      move.x = length > 1 ? x / length : x
      move.y = length > 1 ? y / length : y
      return move
    },

    // Used by the touch buttons in controls/touch.js.
    setVirtualAction(name, isDown) {
      if (isDown && !virtual.held.has(name)) virtual.pressed.add(name)
      if (isDown) virtual.held.add(name)
      else virtual.held.delete(name)
    },

    // Mouse look: lock the pointer to the canvas (call from a click handler).
    lockPointer: () => canvas.requestPointerLock?.(),
    unlockPointer: () => document.exitPointerLock?.(),
    get locked() {
      return document.pointerLockElement === canvas
    },

    dispose() {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("pointermove", onPointerMove)
      canvas.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("blur", onBlur)
      off()
    },
  }

  // Edge flags ("pressed this frame") are cleared after each frame has rendered.
  const off = engine.onAfterRender(() => {
    pressed.clear()
    released.clear()
    virtual.pressed.clear()
    pointer.pressed = pointer.released = false
    pointer.dx = pointer.dy = 0
  })

  return input
}
