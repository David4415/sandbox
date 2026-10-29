import * as THREE from "three"

import { Body, stepBody } from "../engine/physics.js"
import { damp, dampAngle } from "../utils/math.js"

// Walk / run / jump controller for any Object3D. Models are expected to face +Z
// (all models in this kit do). Movement is relative to the camera by default.
//
//   const player = createCharacterController(engine, input, humanoid, { solids: [wall, crate] })
//   player.body.grounded, player.velocity, player.moving
export function createCharacterController(
  engine,
  input,
  object,
  {
    speed = 6,
    sprintMultiplier = 1.6,
    jumpSpeed = 9,
    gravity = -25,
    acceleration = 12, // how fast it reaches full speed; higher is snappier
    cameraRelative = true, // false: W is always world -Z (side-scrollers, fixed cameras)
    rotateToMove = true, // turn the model toward the movement direction
    size = [0.8, 1.8, 0.8],
    floorY = 0,
    solids = [], // Object3Ds or Box3s the character can stand on / bump into
    onJump,
    onLand,
  } = {}
) {
  const body = new Body(object, { size, gravity, floorY })
  const forward = new THREE.Vector3()
  const right = new THREE.Vector3()
  const wish = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)
  let wasGrounded = true

  const controller = {
    body,
    solids,
    speed,
    moving: false,
    get velocity() {
      return body.velocity
    },
    update(dt) {
      const { x, y } = input.move
      if (cameraRelative) {
        engine.camera.getWorldDirection(forward)
        forward.y = 0
        forward.normalize()
      } else {
        forward.set(0, 0, -1)
      }
      right.crossVectors(forward, up)
      wish.set(0, 0, 0).addScaledVector(forward, y).addScaledVector(right, x)

      const top = speed * (input.action("sprint") ? sprintMultiplier : 1)
      body.velocity.x = damp(body.velocity.x, wish.x * top, acceleration, dt)
      body.velocity.z = damp(body.velocity.z, wish.z * top, acceleration, dt)
      controller.moving = wish.lengthSq() > 0.01

      if (input.actionPressed("jump") && body.grounded) {
        body.velocity.y = jumpSpeed
        onJump?.()
      }

      if (rotateToMove && controller.moving) {
        object.rotation.y = dampAngle(object.rotation.y, Math.atan2(wish.x, wish.z), 14, dt)
      }

      stepBody(body, dt, controller.solids)
      if (body.grounded && !wasGrounded) onLand?.()
      wasGrounded = body.grounded
    },
  }

  controller.dispose = engine.onUpdate((dt) => controller.update(dt), 0)
  return controller
}
