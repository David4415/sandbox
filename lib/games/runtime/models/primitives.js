import * as THREE from "three"

// Procedural, asset-free models. Each factory returns an Object3D whose origin is at
// its base center (y up), facing +Z, with shadows enabled. Materials are cached and
// shared by color, so clone a mesh's material before changing it per instance.
//
//   scene.add(tree())  ;  const c = coin(); c.position.set(2, 1, 0)

const materials = new Map()

export function mat(color, { roughness = 0.7, metalness = 0, emissive = 0x000000, flatShading = false, opacity = 1 } = {}) {
  const key = [color, roughness, metalness, emissive, flatShading, opacity].join("|")
  if (!materials.has(key)) {
    materials.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        emissive,
        flatShading,
        opacity,
        transparent: opacity < 1,
      })
    )
  }
  return materials.get(key)
}

export function mesh(geometry, color, options) {
  const m = new THREE.Mesh(geometry, color?.isMaterial ? color : mat(color, options))
  m.castShadow = m.receiveShadow = true
  return m
}

// Shape helpers: positioned by the bottom of the shape on y = 0.
export const box = (w, h, d, color, options) => at(mesh(new THREE.BoxGeometry(w, h, d), color, options), h / 2)
export const sphere = (r, color, options) => at(mesh(new THREE.SphereGeometry(r, 24, 16), color, options), r)
export const cylinder = (r, h, color, options) => at(mesh(new THREE.CylinderGeometry(r, r, h, 24), color, options), h / 2)
export const cone = (r, h, color, options) => at(mesh(new THREE.ConeGeometry(r, h, 24), color, options), h / 2)
export const capsule = (r, length, color, options) =>
  at(mesh(new THREE.CapsuleGeometry(r, length, 8, 16), color, options), length / 2 + r)

function at(object, y) {
  object.position.y = y
  const group = new THREE.Group()
  group.add(object)
  return group
}

function place(object, x, y, z) {
  object.position.set(x, y, z)
  return object
}

export function crate(size = 1, color = 0xb7791f) {
  const g = new THREE.Group()
  const body = mesh(new THREE.BoxGeometry(size, size, size), color, { roughness: 0.9 })
  body.position.y = size / 2
  g.add(body)
  const trim = size * 0.1
  for (const y of [trim / 2, size - trim / 2]) {
    g.add(place(mesh(new THREE.BoxGeometry(size * 1.02, trim, size * 1.02), 0x7c4a12), 0, y, 0))
  }
  return g
}

export function tree(height = 3, leaves = 0x2f9e44) {
  const g = new THREE.Group()
  g.add(place(mesh(new THREE.CylinderGeometry(0.15, 0.22, height * 0.4, 8), 0x7c4a12), 0, height * 0.2, 0))
  for (let i = 0; i < 3; i++) {
    const r = (1 - i * 0.25) * height * 0.28
    g.add(place(mesh(new THREE.ConeGeometry(r, height * 0.4, 8), leaves, { flatShading: true }), 0, height * (0.4 + i * 0.22), 0))
  }
  return g
}

export function rock(size = 1, color = 0x8b8f98) {
  const geometry = new THREE.IcosahedronGeometry(size, 0)
  geometry.scale(1, 0.7, 0.85)
  const m = mesh(geometry, color, { flatShading: true, roughness: 1 })
  m.position.y = size * 0.5
  m.rotation.y = Math.random() * Math.PI * 2
  const g = new THREE.Group()
  g.add(m)
  return g
}

export function coin(radius = 0.4, color = 0xffc933) {
  const m = mesh(new THREE.CylinderGeometry(radius, radius, radius * 0.18, 32), color, {
    metalness: 0.8,
    roughness: 0.25,
    emissive: 0x553300,
  })
  m.rotation.x = Math.PI / 2
  const g = new THREE.Group()
  g.add(m)
  return g
}

export function gem(size = 0.4, color = 0x38bdf8) {
  const m = mesh(new THREE.OctahedronGeometry(size), color, { flatShading: true, metalness: 0.2, roughness: 0.15, emissive: color })
  m.material = m.material.clone()
  m.material.emissiveIntensity = 0.25
  const g = new THREE.Group()
  g.add(m)
  return g
}

export function ball(radius = 0.5, color = 0xef4444) {
  return sphere(radius, color, { roughness: 0.35 })
}

export function platform(width = 4, depth = 4, height = 0.5, color = 0x64748b) {
  return box(width, height, depth, color)
}

export function house(width = 4, height = 3, color = 0xf5e6c8, roof = 0xb91c1c) {
  const g = new THREE.Group()
  g.add(box(width, height, width, color))
  const r = mesh(new THREE.ConeGeometry(width * 0.8, height * 0.6, 4), roof)
  r.rotation.y = Math.PI / 4
  g.add(place(r, 0, height + height * 0.3, 0))
  g.add(place(mesh(new THREE.BoxGeometry(0.8, 1.4, 0.1), 0x5b3a1a), 0, 0.7, width / 2 + 0.01))
  return g
}

export function car(color = 0xdc2626) {
  const g = new THREE.Group()
  g.add(place(mesh(new THREE.BoxGeometry(1.8, 0.5, 3.6), color, { metalness: 0.4, roughness: 0.35 }), 0, 0.6, 0))
  g.add(place(mesh(new THREE.BoxGeometry(1.5, 0.45, 1.8), 0x9fd3ff, { metalness: 0.6, roughness: 0.1 }), 0, 1.05, -0.2))
  for (const [x, z] of [[-0.95, 1.1], [0.95, 1.1], [-0.95, -1.1], [0.95, -1.1]]) {
    const wheel = mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16), 0x111827)
    wheel.rotation.z = Math.PI / 2
    g.add(place(wheel, x, 0.4, z))
  }
  return g
}

export function rocket(color = 0xe5e7eb, accent = 0xea580c) {
  const g = new THREE.Group()
  g.add(place(mesh(new THREE.CylinderGeometry(0.4, 0.4, 2, 16), color, { metalness: 0.3, roughness: 0.4 }), 0, 1.4, 0))
  g.add(place(mesh(new THREE.ConeGeometry(0.4, 0.9, 16), accent), 0, 2.85, 0))
  for (let i = 0; i < 3; i++) {
    const fin = mesh(new THREE.BoxGeometry(0.06, 0.8, 0.5), accent)
    const holder = new THREE.Group()
    holder.rotation.y = (i / 3) * Math.PI * 2
    holder.add(place(fin, 0, 0.7, 0.55))
    g.add(holder)
  }
  return g
}

export function star(outer = 0.5, inner = 0.22, depth = 0.15, color = 0xfde047) {
  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    shape[i === 0 ? "moveTo" : "lineTo"](Math.cos(a) * r, Math.sin(a) * r)
  }
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
  geometry.translate(0, 0, -depth / 2)
  const g = new THREE.Group()
  g.add(mesh(geometry, color, { emissive: 0x664400, roughness: 0.4 }))
  return g
}
