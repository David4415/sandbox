import * as THREE from "three"

// Lightweight physics: gravity, a flat floor and axis-aligned box collisions.
// Enough for platformers, runners and arenas; no external engine needed.

const _box = new THREE.Box3()
const _solid = new THREE.Box3()
const _raycaster = new THREE.Raycaster()
const _ndc = new THREE.Vector2()

// A box-shaped body standing on `object.position` (feet at the bottom center).
export class Body {
  constructor(object, { size = [0.8, 1.8, 0.8], gravity = -25, floorY = 0 } = {}) {
    this.object = object
    this.size = new THREE.Vector3(...size)
    this.gravity = gravity
    this.floorY = floorY // set to -Infinity for no floor (pits)
    this.velocity = new THREE.Vector3()
    this.grounded = false
  }
}

function bodyBox(body) {
  const p = body.object.position
  const s = body.size
  return _box.set(
    new THREE.Vector3(p.x - s.x / 2, p.y, p.z - s.z / 2),
    new THREE.Vector3(p.x + s.x / 2, p.y + s.y, p.z + s.z / 2)
  )
}

// Advances a body by dt: applies gravity, moves it along each axis and pushes it
// out of `solids` (Object3Ds or Box3s). Sets body.grounded when standing on something.
export function stepBody(body, dt, solids = []) {
  const p = body.object.position
  const v = body.velocity
  v.y += body.gravity * dt
  body.grounded = false

  for (const axis of ["x", "y", "z"]) {
    p[axis] += v[axis] * dt
    for (const solid of solids) {
      const box = solid.isBox3 ? solid : _solid.setFromObject(solid)
      const b = bodyBox(body)
      if (!b.intersectsBox(box)) continue
      if (v[axis] > 0) p[axis] -= b.max[axis] - box.min[axis]
      else if (v[axis] < 0) p[axis] += box.max[axis] - b.min[axis]
      else continue
      if (axis === "y" && v.y < 0) body.grounded = true
      v[axis] = 0
    }
  }

  if (p.y <= body.floorY) {
    p.y = body.floorY
    if (v.y < 0) v.y = 0
    body.grounded = true
  }
}

// True when the bounding boxes of two objects overlap.
export function hits(a, b) {
  return new THREE.Box3().setFromObject(a).intersectsBox(_solid.setFromObject(b))
}

export function distanceXZ(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

// Circle test on the ground plane: cheap and forgiving for pickups and bullets.
export function circlesHit(a, b, radiusA = 0.5, radiusB = 0.5) {
  return distanceXZ(a.position, b.position) < radiusA + radiusB
}

// First object under the pointer, or null. `objects` are Object3Ds (children included).
export function pickObject(engine, input, objects) {
  _ndc.set(input.pointer.x, input.pointer.y)
  _raycaster.setFromCamera(_ndc, engine.camera)
  return _raycaster.intersectObjects(objects, true)[0] ?? null
}

// First hit along a ray, e.g. to find the ground height or line of sight.
export function raycast(origin, direction, objects, far = Infinity) {
  _raycaster.set(origin, direction.clone().normalize())
  _raycaster.far = far
  const hit = _raycaster.intersectObjects(objects, true)[0] ?? null
  _raycaster.far = Infinity
  return hit
}
