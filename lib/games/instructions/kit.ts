export const kitInstructions = `# Game kit

The game directory ships with a small three.js game kit. Build on it instead of rewriting engine code. Everything is exported from ./index.js:

\`\`\`js
import { THREE, createEngine, createInput, createHUD, sfx } from "./index.js"
\`\`\`

The kit files are plain readable JavaScript in the game directory. When unsure about an option, read_file the module (the first comment of each file shows usage). Fix a kit bug in place if you find one, but do not restructure it.

## Structure

Start from main.js (the welcome scene; rewrite it) and keep index.html minimal: title, CSS, import map and \`<script type="module" src="./main.js">\`. Split bigger games into modules such as ./game/player.js, ./game/enemies.js, ./game/level.js, each exporting functions that take the engine.

## Skeleton

\`\`\`js
import { THREE, createEngine, addLights, createGround, createInput, createHUD, createCharacterController,
  followCamera, createHumanoid, animateHumanoid, createState, sfx } from "./index.js"

const engine = createEngine({ background: 0x87ceeb, fog: { near: 40, far: 120 } })
addLights(engine.scene)
engine.scene.add(createGround(200))

const input = createInput(engine)
const hud = createHUD(engine)
const state = createState("menu")

const hero = createHumanoid()
engine.scene.add(hero)
const player = createCharacterController(engine, input, hero, { speed: 6 })
followCamera(engine, hero)

engine.onUpdate((dt, time) => {
  if (!state.is("playing")) return
  animateHumanoid(hero, time, player.moving ? 1 : 0, !player.body.grounded)
})

await hud.screen({ title: "My Game", subtitle: "WASD to move, Space to jump", button: "Play" })
state.set("playing")
\`\`\`

## Modules

Engine
- createEngine({ background, fog, fov, shadows, toneMapping, cameraPosition }) -> { scene, camera, renderer, canvas, root, time, timeScale, paused, onUpdate(fn(dt, time), priority), onAfterRender(fn), onResize(fn), after(seconds, fn), every(seconds, fn), pause(), resume(), render, dispose() }. The loop runs itself. dt is in seconds and clamped; after/every return a cancel function and use game time (they stop while paused).
- addLights(scene) -> { hemi, sun }: sun with shadows plus sky fill light. createGround(size, { color }), createGrid(), setGradientBackground(scene, top, bottom), addStars(scene), disposeObject(obj).
- createEntities(engine) -> add(object, { update(dt, e), tags, ttl, data, onRemove }), remove(e), withTag(tag), all, count, clear(). Use it for anything spawned and removed: bullets, enemies, pickups.
- Physics: Body and stepBody(body, dt, solids) (gravity, floor, box collisions), hits(a, b), circlesHit(a, b, ra, rb), distanceXZ(a, b), pickObject(engine, input, objects) (what is under the pointer), raycast(origin, dir, objects). This is simple AABB physics; do not add a physics engine unless the game truly needs one.
- createState("menu") -> is(name), set(name), on(name, fn), onChange(fn). Use states like menu / playing / paused / gameover.

Controls
- createInput(engine) -> move {x, y} (WASD/arrows/touch, y forward), action("jump"|"fire"|"sprint"|"interact"|"pause"), actionPressed(name) (first frame only), isDown(code), pressed(code), pointer {x, y, dx, dy, down, pressed, released}, bind(name, codes), lockPointer(). Mouse buttons are codes "Mouse0..2".
- createTouchControls(input, { buttons: [{ action: "jump", label: "A" }] }) adds an on-screen joystick and buttons on touch devices only. Always add it for games with movement.
- createCharacterController(engine, input, object, { speed, jumpSpeed, gravity, cameraRelative, rotateToMove, size, floorY, solids, onJump, onLand }) -> { body, moving, velocity, solids }. Handles walking, sprinting, jumping, gravity and collisions. For side-scrollers or fixed cameras use cameraRelative: false.
- Cameras: followCamera(engine, target, { offset, lookAt, smooth }) for third person, top-down (offset [0, 20, 0.01]) and side views; orbitCamera(engine, { target }) for viewers and board games; firstPersonCamera(engine, input, target, { eyeHeight }) with createCharacterController({ rotateToMove: false }).

HUD (DOM overlay)
- createHUD(engine) -> stat(id, label, value) / set(id, value), bar(id, label, { color }) / setBar(id, 0..1), message(text, ms), hint(text), crosshair(), screen({ title, subtitle, button }) (returns a promise resolved by the button), hideScreen(), countdown(), floatText(text, worldPosition).
- Use a title screen before play and a game over screen with score and a restart button. Use highScore("key") from the storage utils for records.

Animation
- createTweens(engine) -> tween(target, { position: { y: 3 } }, { duration, ease, delay, loop, yoyo }).finished, value(from, to, seconds, cb). Eases: linear, inQuad, outQuad, inOutQuad, inCubic, outCubic, inOutCubic, inOutSine, outBack, outElastic, outBounce.
- idleMotion(engine, obj, { spin, bob }), cameraShake(engine, { intensity, duration }), particleBurst(engine, position, { count, color, speed, life }), flash(engine, mesh, color).
- createAnimator(engine, root, clips) -> play(name, { fade, loop }) for glTF clips.

Models (all stand on y = 0, face +Z, cast shadows)
- Procedural: crate, tree, rock, coin, gem, ball, platform, house, car, rocket, star, plus box/sphere/cylinder/cone/capsule(…, color) and createHumanoid({ skin, shirt, pants, hat }) with animateHumanoid(h, time, speed, airborne). Materials are cached by color: clone a mesh's material before changing it for one instance.
- loadGLTF(url) -> { scene, animations }, loadTexture(url), fitModel(object, height) for external assets. There are no model files in the sandbox; unless the user provides a URL, build visuals from primitives and geometry.

Sound (synthesized, no files)
- sfx.click/jump/coin/powerup/laser/hit/explosion/win/lose(), tone(freq, dur, opts), noise(dur, opts), startMusic({ bpm, scale: "minor"|"major" }) -> stop, setMuted(bool), setVolume(0..1). Browsers keep audio silent until the first click or key press, which is fine.

Utils
- clamp, lerp, damp(current, target, lambda, dt), dampAngle, wrap, rand, randInt, chance, pick(array), shuffle, randomInCircle, createRng(seed), TAU; save/load/highScore for localStorage.

## three.js rules (r186)

- Use THREE.Timer-based engine time, never THREE.Clock; never requestAnimationFrame (the engine owns the loop).
- Import addons only from "three/addons/..." (e.g. \`import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"\`).
- Use THREE.PCFShadowMap (the default); PCFSoftShadowMap is deprecated.
- Light the scene (addLights) or MeshStandardMaterial renders black. Colors passed as hex numbers are sRGB; leave renderer color settings alone.
- Reuse geometries and materials; use THREE.InstancedMesh for hundreds of identical objects. Remove spawned objects (entities.remove or ttl) so the scene does not grow forever.
- Scale to the world: 1 unit is about 1 meter, a person is 1.8 tall, the default camera sees roughly 100 units.

## Quality bar

A game is not done until it has: a title screen, clear controls shown with hud.hint, a goal, a score or progress readout, feedback for key events (sfx, particleBurst, cameraShake), a lose or win state and a way to restart without reloading. Make it look intentional: a sky color or gradient, lighting, fog, shadows, a ground, and a consistent palette instead of default grey.`
