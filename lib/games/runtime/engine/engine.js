import * as THREE from "three"

// Creates the renderer, scene, camera and the frame loop. Everything else in the
// kit hangs off the returned engine through onUpdate / after / every.
//
//   const engine = createEngine({ background: 0x87ceeb })
//   engine.onUpdate((dt, time) => { cube.rotation.y += dt })
export function createEngine({
  container,
  background = 0x111318,
  fog = null, // { color, near, far }
  fov = 60,
  near = 0.1,
  far = 500,
  shadows = true,
  antialias = true,
  maxPixelRatio = 2,
  toneMapping = THREE.ACESFilmicToneMapping,
  cameraPosition = [0, 4, 10],
  autoStart = true,
} = {}) {
  let root = container
  if (!root) {
    root = document.createElement("div")
    root.style.cssText = "position:fixed;inset:0;overflow:hidden"
    document.body.appendChild(root)
  }

  const renderer = new THREE.WebGLRenderer({ antialias })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio))
  renderer.toneMapping = toneMapping
  renderer.shadowMap.enabled = shadows
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none;outline:none"
  renderer.domElement.tabIndex = 0
  root.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  if (background != null) scene.background = new THREE.Color(background)
  if (fog) scene.fog = new THREE.Fog(fog.color ?? background ?? 0x000000, fog.near ?? 20, fog.far ?? 100)

  const camera = new THREE.PerspectiveCamera(fov, 1, near, far)
  camera.position.set(...cameraPosition)

  const updaters = []
  const afterHooks = []
  const resizeHooks = []
  const timers = []
  const timer = new THREE.Timer()
  timer.connect(document) // freezes the delta while the tab is hidden

  const engine = {
    THREE,
    root,
    renderer,
    scene,
    camera,
    canvas: renderer.domElement,
    size: { width: 1, height: 1 },
    time: 0, // seconds of game time (scaled, stops while paused)
    timeScale: 1, // 0.3 = slow motion
    paused: false,

    // fn(dt, time) runs every frame before rendering, lowest priority first.
    onUpdate(fn, priority = 0) {
      const entry = { fn, priority }
      updaters.push(entry)
      updaters.sort((a, b) => a.priority - b.priority)
      return () => {
        const i = updaters.indexOf(entry)
        if (i >= 0) updaters.splice(i, 1)
      }
    },
    // fn() runs after every render, even while paused.
    onAfterRender(fn) {
      afterHooks.push(fn)
      return () => {
        const i = afterHooks.indexOf(fn)
        if (i >= 0) afterHooks.splice(i, 1)
      }
    },
    onResize(fn) {
      resizeHooks.push(fn)
      fn(engine.size)
      return () => {
        const i = resizeHooks.indexOf(fn)
        if (i >= 0) resizeHooks.splice(i, 1)
      }
    },
    // Run fn once after `seconds` of game time. Returns a cancel function.
    after(seconds, fn) {
      const t = { left: seconds, fn, every: null }
      timers.push(t)
      return () => (t.cancelled = true)
    },
    // Run fn every `seconds` of game time. Returns a cancel function.
    every(seconds, fn) {
      const t = { left: seconds, fn, every: seconds }
      timers.push(t)
      return () => (t.cancelled = true)
    },

    // Replace to render differently (e.g. through a post-processing composer).
    render() {
      renderer.render(scene, camera)
    },
    start() {
      renderer.setAnimationLoop(frame)
    },
    stop() {
      renderer.setAnimationLoop(null)
    },
    pause() {
      engine.paused = true
    },
    resume() {
      engine.paused = false
    },
    resize,
    dispose() {
      renderer.setAnimationLoop(null)
      observer.disconnect()
      timer.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }

  function resize() {
    const width = root.clientWidth || window.innerWidth
    const height = root.clientHeight || window.innerHeight
    engine.size.width = width
    engine.size.height = height
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    for (const fn of resizeHooks) fn(engine.size)
  }

  function frame() {
    timer.update()
    const dt = Math.min(timer.getDelta(), 0.05) * engine.timeScale // clamp so a lag spike doesn't tunnel through walls
    if (!engine.paused) {
      engine.time += dt
      for (let i = timers.length - 1; i >= 0; i--) {
        const t = timers[i]
        if (t.cancelled) {
          timers.splice(i, 1)
          continue
        }
        t.left -= dt
        if (t.left > 0) continue
        if (t.every != null) t.left += t.every
        else timers.splice(i, 1)
        t.fn()
      }
      for (const { fn } of [...updaters]) fn(dt, engine.time)
    }
    engine.render()
    for (const fn of afterHooks) fn()
  }

  const observer = new ResizeObserver(resize)
  observer.observe(root)
  resize()
  if (autoStart) engine.start()
  return engine
}
