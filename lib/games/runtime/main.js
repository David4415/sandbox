// Welcome scene. Replace this file with the game itself.
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"

import {
  THREE,
  addLights,
  addStars,
  createEngine,
  createInput,
  createTweens,
  damp,
  idleMotion,
  particleBurst,
  pickObject,
  setGradientBackground,
  sfx,
} from "./index.js"

const engine = createEngine({
  toneMapping: THREE.NeutralToneMapping,
  cameraPosition: [0, 3.4, 5.6],
})
const { scene, camera } = engine
camera.lookAt(0, 0.1, 0)

// Logo colors: orange #ea580c with a slightly lighter bottom, white cube.
setGradientBackground(scene, "#ea580c", "#f1702f")
const { hemi, sun } = addLights(scene, { position: [4, 9, 5], shadowArea: 10, sunIntensity: 2.4 })
hemi.color.set(0xffffff)
hemi.groundColor.set(0xea580c) // bounce light tints the shaded faces orange
hemi.intensity = 1.1

const specks = addStars(scene, { count: 160, radius: 22, size: 2.5, color: 0xffffff })
engine.onUpdate((dt) => (specks.rotation.y += dt * 0.02))

const cube = new THREE.Mesh(
  new RoundedBoxGeometry(1.7, 1.7, 1.7, 6, 0.16),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32, emissive: 0xffd9c2, emissiveIntensity: 0.12 })
)
cube.castShadow = true
const pivot = new THREE.Group() // spins and leans toward the pointer
const floating = new THREE.Group() // bobs up and down
floating.add(cube)
pivot.add(floating)
scene.add(pivot)

const shadow = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ color: 0x7c2d12, opacity: 0.3 }))
shadow.rotation.x = -Math.PI / 2
shadow.position.y = -1.5
shadow.receiveShadow = true
scene.add(shadow)

idleMotion(engine, floating, { spin: [0, 0.8, 0], bob: 0.14 })

const input = createInput(engine)
const tweens = createTweens(engine)

engine.onUpdate((dt) => {
  pivot.rotation.x = damp(pivot.rotation.x, -input.pointer.y * 0.25, 5, dt)
  pivot.rotation.z = damp(pivot.rotation.z, -input.pointer.x * 0.25, 5, dt)
})

engine.onUpdate(() => {
  if (!input.pointer.pressed || !pickObject(engine, input, [cube])) return
  sfx.coin()
  particleBurst(engine, floating.position, { count: 36, color: 0xffffff, speed: 5, size: 0.14 })
  cube.scale.setScalar(0.85)
  tweens.tween(cube.scale, { x: 1, y: 1, z: 1 }, { duration: 0.6, ease: "outElastic" })
})
