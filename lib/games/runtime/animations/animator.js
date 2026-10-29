import * as THREE from "three"

// Plays glTF animation clips with cross-fading.
//
//   const gltf = await loadGLTF("models/robot.glb")
//   const animator = createAnimator(engine, gltf.scene, gltf.animations)
//   animator.play("Run")          // fades from whatever was playing
//   animator.play("Jump", { loop: false })
//   animator.names                // available clip names
export function createAnimator(engine, root, clips = []) {
  const mixer = new THREE.AnimationMixer(root)
  const actions = new Map(clips.map((clip) => [clip.name, mixer.clipAction(clip)]))
  let current = null

  const off = engine.onUpdate((dt) => mixer.update(dt), 50)

  return {
    mixer,
    actions,
    get names() {
      return [...actions.keys()]
    },
    get current() {
      return current
    },
    play(name, { fade = 0.25, loop = true, timeScale = 1 } = {}) {
      const next = actions.get(name)
      if (!next || next === current) return next
      next.reset()
      next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity)
      next.clampWhenFinished = !loop
      next.timeScale = timeScale
      next.fadeIn(fade).play()
      current?.fadeOut(fade)
      current = next
      return next
    },
    dispose() {
      off()
      mixer.stopAllAction()
    },
  }
}
