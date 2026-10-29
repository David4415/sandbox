// Synthesized sound effects and music with the Web Audio API: no audio files needed.
//
//   sfx.coin()   sfx.jump()   sfx.explosion()
//   const stop = startMusic({ bpm: 120 })
//
// Browsers only allow audio after a click or key press; the first one unlocks it,
// so sounds triggered earlier are simply silent.
let ctx = null
let master = null
let volume = 0.5
let muted = false

function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : volume
    master.connect(ctx.destination)
  }
  if (ctx.state === "suspended") ctx.resume()
  return ctx
}

for (const type of ["pointerdown", "keydown"]) window.addEventListener(type, audio, { once: true })

export function setVolume(v) {
  volume = v
  if (master) master.gain.value = muted ? 0 : v
}

export function setMuted(value) {
  muted = value
  if (master) master.gain.value = muted ? 0 : volume
}

export const isMuted = () => muted

// One oscillator note. slide changes the pitch over the note (Hz, negative = falling).
export function tone(freq, duration = 0.15, { type = "square", gain = 0.25, slide = 0, delay = 0 } = {}) {
  const c = audio()
  const t = c.currentTime + delay
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slide) osc.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), t + duration)
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(gain, t + 0.01)
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(env).connect(master)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

// Filtered noise burst: explosions, impacts, footsteps.
export function noise(duration = 0.3, { gain = 0.3, cutoff = 1200, delay = 0 } = {}) {
  const c = audio()
  const t = c.currentTime + delay
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * duration), c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const source = c.createBufferSource()
  source.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = "lowpass"
  filter.frequency.setValueAtTime(cutoff, t)
  filter.frequency.exponentialRampToValueAtTime(100, t + duration)
  const env = c.createGain()
  env.gain.setValueAtTime(gain, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  source.connect(filter).connect(env).connect(master)
  source.start(t)
}

export const sfx = {
  click: () => tone(660, 0.05, { type: "triangle" }),
  jump: () => tone(300, 0.18, { slide: 350, type: "square", gain: 0.18 }),
  coin: () => (tone(988, 0.07, { type: "square", gain: 0.18 }), tone(1319, 0.2, { type: "square", gain: 0.18, delay: 0.07 })),
  powerup: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1, { type: "triangle", delay: i * 0.07 })),
  laser: () => tone(1200, 0.2, { slide: -1000, type: "sawtooth", gain: 0.15 }),
  hit: () => (noise(0.15, { gain: 0.3, cutoff: 2500 }), tone(150, 0.15, { slide: -80, type: "sawtooth", gain: 0.25 })),
  explosion: () => (noise(0.7, { gain: 0.5, cutoff: 1800 }), tone(90, 0.5, { slide: -60, type: "sawtooth", gain: 0.3 })),
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, { type: "triangle", delay: i * 0.12 })),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, { type: "sawtooth", gain: 0.2, delay: i * 0.18 })),
}

const SCALES = {
  minor: [0, 3, 5, 7, 10],
  major: [0, 2, 4, 7, 9],
}

// Simple generative loop: a bass note on every beat and a wandering melody.
// Returns a stop function.
export function startMusic({ bpm = 110, root = 110, scale = "minor", wave = "triangle", gain = 0.08 } = {}) {
  audio()
  const notes = SCALES[scale] ?? scale
  const step = 60 / bpm / 2
  let n = 0
  let degree = 0
  const freq = (d, octave = 0) => root * Math.pow(2, (notes[((d % notes.length) + notes.length) % notes.length] + 12 * (octave + Math.floor(d / notes.length))) / 12)

  const id = setInterval(() => {
    if (muted) return
    if (n % 2 === 0) tone(freq(0, 0), step * 1.8, { type: "sine", gain: gain * 1.5 })
    if (Math.random() < 0.75) {
      degree += Math.floor(Math.random() * 5) - 2
      tone(freq(Math.abs(degree) % 10, 2), step * 0.9, { type: wave, gain })
    }
    n++
  }, step * 1000)
  return () => clearInterval(id)
}
