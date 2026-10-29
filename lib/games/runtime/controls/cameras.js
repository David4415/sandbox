import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"

// Drag to rotate, wheel to zoom. Good for viewers, board games and sandboxes.
export function orbitCamera(
  engine,
  { target = [0, 0, 0], damping = true, minDistance = 2, maxDistance = 60, maxPolarAngle = Math.PI * 0.49, autoRotate = false } = {}
) {
  const controls = new OrbitControls(engine.camera, engine.canvas)
  controls.target.set(...target)
  Object.assign(controls, { enableDamping: damping, minDistance, maxDistance, maxPolarAngle, autoRotate })
  controls.update()
  const off = engine.onUpdate(() => controls.update(), 100)
  return { controls, dispose: () => (off(), controls.dispose()) }
}

// Smoothly trails an object from a fixed offset (third person, top-down, side-scroller).
//   followCamera(engine, player, { offset: [0, 6, 9] })    third person
//   followCamera(engine, player, { offset: [0, 20, 0.01] })  top-down
//   followCamera(engine, player, { offset: [0, 3, 12] })   side view
export function followCamera(
  engine,
  target,
  { offset = [0, 5, 9], lookAt = [0, 1.2, 0], smooth = 6, rotateWithTarget = false } = {}
) {
  const offsetVec = new THREE.Vector3(...offset)
  const lookVec = new THREE.Vector3(...lookAt)
  const wanted = new THREE.Vector3()
  const focus = new THREE.Vector3()

  function place() {
    wanted.copy(offsetVec)
    if (rotateWithTarget) wanted.applyQuaternion(target.quaternion)
    return wanted.add(target.position)
  }
  engine.camera.position.copy(place())

  const off = engine.onUpdate((dt) => {
    engine.camera.position.lerp(place(), 1 - Math.exp(-smooth * dt))
    engine.camera.lookAt(focus.copy(target.position).add(lookVec))
  }, 100)
  return { dispose: off }
}

// First person: mouse look (pointer lock on click, or drag on touch). Pair it with
// createCharacterController({ cameraRelative: true, rotateToMove: false }).
export function firstPersonCamera(engine, input, target, { eyeHeight = 1.6, sensitivity = 0.0022 } = {}) {
  const camera = engine.camera
  camera.rotation.order = "YXZ"
  const look = { yaw: 0, pitch: 0 }

  const onClick = () => !input.locked && input.lockPointer()
  engine.canvas.addEventListener("click", onClick)

  const off = engine.onUpdate(() => {
    if (input.locked || input.pointer.down) {
      look.yaw -= input.pointer.dx * sensitivity
      look.pitch = THREE.MathUtils.clamp(look.pitch - input.pointer.dy * sensitivity, -1.5, 1.5)
    }
    camera.rotation.set(look.pitch, look.yaw, 0)
    camera.position.set(target.position.x, target.position.y + eyeHeight, target.position.z)
  }, 100)

  return {
    look,
    dispose() {
      off()
      engine.canvas.removeEventListener("click", onClick)
    },
  }
}
