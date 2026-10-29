import * as THREE from "three"

import { mesh } from "./primitives.js"

// A blocky character (about 1.8 units tall, facing +Z) with swinging limbs.
//
//   const hero = createHumanoid({ shirt: 0xea580c })
//   engine.onUpdate((dt, time) => animateHumanoid(hero, time, player.moving ? 1 : 0, !player.body.grounded))
export function createHumanoid({ skin = 0xf1c27d, shirt = 0xea580c, pants = 0x334155, hat = null } = {}) {
  const g = new THREE.Group()
  const parts = {}

  const limb = (name, w, h, color, x, y) => {
    const pivot = new THREE.Group() // rotates around the shoulder / hip
    pivot.position.set(x, y, 0)
    const m = mesh(new THREE.BoxGeometry(w, h, w), color)
    m.position.y = -h / 2
    pivot.add(m)
    g.add(pivot)
    parts[name] = pivot
  }

  limb("legL", 0.26, 0.7, pants, -0.16, 0.7)
  limb("legR", 0.26, 0.7, pants, 0.16, 0.7)
  limb("armL", 0.2, 0.65, skin, -0.42, 1.38)
  limb("armR", 0.2, 0.65, skin, 0.42, 1.38)

  const torso = mesh(new THREE.BoxGeometry(0.64, 0.7, 0.34), shirt)
  torso.position.y = 1.05
  g.add(torso)

  const head = mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), skin)
  head.position.y = 1.6
  for (const x of [-0.1, 0.1]) {
    const eye = mesh(new THREE.BoxGeometry(0.06, 0.08, 0.02), 0x111827)
    eye.position.set(x, 0.03, 0.215)
    head.add(eye)
  }
  if (hat != null) {
    const brim = mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), hat)
    brim.position.y = 0.23
    const top = mesh(new THREE.BoxGeometry(0.36, 0.18, 0.36), hat)
    top.position.y = 0.33
    head.add(brim, top)
  }
  g.add(head)

  g.userData.parts = { ...parts, head, torso }
  return g
}

// Walk cycle. speed: 0 idle .. 1 full stride. airborne raises the arms (jump pose).
export function animateHumanoid(humanoid, time, speed = 0, airborne = false) {
  const { legL, legR, armL, armR, head } = humanoid.userData.parts
  const swing = Math.sin(time * 11) * 0.9 * speed
  legL.rotation.x = airborne ? -0.5 : swing
  legR.rotation.x = airborne ? 0.4 : -swing
  armL.rotation.x = airborne ? -2.4 : -swing
  armR.rotation.x = airborne ? -2.4 : swing
  const breathe = Math.sin(time * 2) * 0.04 * (1 - speed)
  armL.rotation.z = -0.05 - breathe
  armR.rotation.z = 0.05 + breathe
  head.rotation.x = Math.sin(time * 2) * 0.03
}
