import * as THREE from "three"

// Sun + sky/ground fill light with shadows. Call once per scene.
export function addLights(
  scene,
  { sunColor = 0xfff2e0, sunIntensity = 2.2, hemiIntensity = 1, position = [10, 20, 8], shadowArea = 30, shadowMapSize = 2048 } = {}
) {
  const hemi = new THREE.HemisphereLight(0xdfeeff, 0x445533, hemiIntensity)
  scene.add(hemi)

  const sun = new THREE.DirectionalLight(sunColor, sunIntensity)
  sun.position.set(...position)
  sun.castShadow = true
  sun.shadow.mapSize.set(shadowMapSize, shadowMapSize)
  const half = shadowArea / 2
  Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 120 })
  sun.shadow.bias = -0.0005
  sun.shadow.normalBias = 0.02
  scene.add(sun, sun.target)
  return { hemi, sun }
}

// Flat ground plane at y = 0 that receives shadows.
export function createGround(size = 200, { color = 0x3a7d44, roughness = 1 } = {}) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ color, roughness })
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  return ground
}

export function createGrid(size = 100, divisions = 100, color = 0xffffff, opacity = 0.15) {
  const grid = new THREE.GridHelper(size, divisions, color, color)
  grid.material.transparent = true
  grid.material.opacity = opacity
  return grid
}

// Vertical two-color gradient behind the scene.
export function setGradientBackground(scene, top = "#4facfe", bottom = "#dff1ff") {
  const canvas = document.createElement("canvas")
  canvas.width = 2
  canvas.height = 256
  const ctx = canvas.getContext("2d")
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, top)
  gradient.addColorStop(1, bottom)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 2, 256)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  scene.background = texture
  return texture
}

// A shell of stars for night / space scenes.
export function addStars(scene, { count = 800, radius = 200, size = 1.2, color = 0xffffff } = {}) {
  const positions = new Float32Array(count * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < count; i++) {
    v.randomDirection().multiplyScalar(radius * (0.7 + Math.random() * 0.3))
    positions.set([v.x, v.y, v.z], i * 3)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color, size, sizeAttenuation: false, fog: false })
  )
  scene.add(stars)
  return stars
}

// Frees the GPU memory of an object's geometries (and optionally its materials).
// Materials from models/primitives.js are shared, so they are kept by default.
export function disposeObject(object, { materials = false } = {}) {
  object.traverse((child) => {
    child.geometry?.dispose()
    if (!materials || !child.material) return
    for (const m of Array.isArray(child.material) ? child.material : [child.material]) m.dispose()
  })
}
