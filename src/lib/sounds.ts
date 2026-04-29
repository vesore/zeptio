let audioCtx: AudioContext | null = null
let soundEnabled = false

if (typeof window !== 'undefined') {
  try {
    soundEnabled = localStorage.getItem('zeptio-sound') === 'true'
  } catch {}
}

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    try { audioCtx = new AudioContext() } catch { return null }
  }
  // Resume context if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

export function getSoundEnabled(): boolean {
  return soundEnabled
}

export function setSoundEnabled(on: boolean): void {
  soundEnabled = on
  try { localStorage.setItem('zeptio-sound', on ? 'true' : 'false') } catch {}
}

/** Short mechanical click for button presses */
export function clickSound(): void {
  if (!soundEnabled) return
  const ac = ctx()
  if (!ac) return

  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)

  osc.type = 'square'
  osc.frequency.setValueAtTime(180, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.07)

  gain.gain.setValueAtTime(0.12, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.09)

  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.09)
}

/** Satisfying clunk when a part gets assembled onto the robot */
export function assembleSound(): void {
  if (!soundEnabled) return
  const ac = ctx()
  if (!ac) return

  const freqs = [130, 260, 195]
  freqs.forEach((f, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)

    const t = ac.currentTime + i * 0.04
    osc.type = i === 0 ? 'sawtooth' : 'sine'
    osc.frequency.setValueAtTime(f, t)
    osc.frequency.exponentialRampToValueAtTime(f * 0.4, t + 0.18)

    gain.gain.setValueAtTime(i === 0 ? 0.28 : 0.14, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)

    osc.start(t)
    osc.stop(t + 0.22)
  })
}

/** Upbeat factory ding when level completed */
export function levelCompleteSound(): void {
  if (!soundEnabled) return
  const ac = ctx()
  if (!ac) return

  const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)

    const t = ac.currentTime + i * 0.13
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.22, t + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38)

    osc.start(t)
    osc.stop(t + 0.4)
  })
}

/** Pitch scales with score (higher score = higher, brighter tone) */
export function scoreRevealSound(score: number): void {
  if (!soundEnabled) return
  const ac = ctx()
  if (!ac) return

  const baseFreq = 150 + (score / 100) * 650
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(baseFreq * 0.75, ac.currentTime)
  osc.frequency.linearRampToValueAtTime(baseFreq, ac.currentTime + 0.28)

  gain.gain.setValueAtTime(0.18, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.55)

  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.55)
}

/* Conveyor hum — looping low oscillator */
let conveyorOsc: OscillatorNode | null = null
let conveyorGain: GainNode | null = null

export function startConveyorSound(): void {
  if (!soundEnabled || conveyorOsc) return
  const ac = ctx()
  if (!ac) return

  conveyorOsc = ac.createOscillator()
  conveyorGain = ac.createGain()
  conveyorOsc.connect(conveyorGain)
  conveyorGain.connect(ac.destination)

  conveyorOsc.type = 'sine'
  conveyorOsc.frequency.setValueAtTime(48, ac.currentTime)
  conveyorGain.gain.setValueAtTime(0.04, ac.currentTime)

  conveyorOsc.start()
}

export function stopConveyorSound(): void {
  if (!conveyorOsc) return
  try {
    conveyorGain?.gain.setValueAtTime(0.04, audioCtx!.currentTime)
    conveyorGain?.gain.linearRampToValueAtTime(0, audioCtx!.currentTime + 0.3)
    conveyorOsc.stop(audioCtx!.currentTime + 0.3)
  } catch {}
  conveyorOsc = null
  conveyorGain = null
}
