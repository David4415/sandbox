import * as THREE from "three"

// Endless spin and/or vertical bob for pickups, power-ups and decoration.
//   idleMotion(engine, coin, { spin: [0, 2, 0], bob: 0.2 })
// Returns a function that stops it.
export function idleMotion(engine, object, { spin = [0, 1, 0], bob = 0, bobSpeed = 2, phase = Math.random() * 6.28 } = {}) {
  const baseY = object.position.y
  return engine.onUpdate((dt, time) => {
    object.rotation.x += spin[0] * dt
    object.rotation.y += spin[1] * dt
    object.rotation.z += spin[2] * dt
    if (bob) object.position.y = baseY + Math.sin(time * bobSpeed + phase) * bob
  })
}

const shakes = new WeakMap()

// Screen shake for hits and explosions. Works with every camera helper in the kit.
//   cameraShake(engine, { intensity: 0.4, duration: 0.3 })
export function cameraShake(engine, { intensity = 0.3, duration = 0.4 } = {}) {
  let s = shakes.get(engine)
  if (!s) {
    s = { time: 0, duration: 0, intensity: 0, offset: new THREE.Vector3() }
    shakes.set(engine, s)
    // Applied after the camera helpers, removed again once the frame is rendered.
    engine.onUpdate((dt) => {
      if (s.time <= 0) return
      s.time -= dt
      const k = Math.max(s.time, 0) / s.duration
      s.offset.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(s.intensity * k * 2)
      engine.camera.position.add(s.offset)
    }, 900)
    engine.onAfterRender(() => {
      engine.camera.position.sub(s.offset)
      s.offset.set(0, 0, 0)
    })
  }
  s.time = s.duration = duration
  s.intensity = intensity
}

// A burst of glowing points: explosions, pickups, sparks, dust.
//   particleBurst(engine, enemy.position, { color: 0xff8844, count: 40, speed: 8 })
export function particleBurst(
  engine,
  position,
  { count = 24, color = 0xffffff, speed = 6, life = 0.8, size = 0.15, gravity = -9 } = {}
) {
  const positions = new Float32Array(count * 3)
  const velocities = []
  for (let i = 0; i < count; i++) {
    positions.set([position.x, position.y, position.z], i * 3)
    velocities.push(new THREE.Vector3().randomDirection().multiplyScalar(speed * (0.3 + Math.random() * 0.7)))
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  engine.scene.add(points)

  let age = 0
  const off = engine.onUpdate((dt) => {
    age += dt
    for (let i = 0; i < count; i++) {
      const v = velocities[i]
      v.y += gravity * dt
      positions[i * 3] += v.x * dt
      positions[i * 3 + 1] += v.y * dt
      positions[i * 3 + 2] += v.z * dt
    }
    geometry.attributes.position.needsUpdate = true
    material.opacity = Math.max(0, 1 - age / life)
    if (age >= life) {
      off()
      points.removeFromParent()
      geometry.dispose()
      material.dispose()
    }
  })
  return points
}

// Briefly tints a mesh's material (hit flash). Needs a MeshStandardMaterial that is
// not shared with other meshes: clone it first if it came from models/primitives.js.
export function flash(engine, mesh, color = 0xffffff, duration = 0.15) {
  const material = mesh.material
  const original = material.emissive.getHex()
  material.emissive.setHex(color)
  engine.after(duration, () => material.emissive.setHex(original))
}
