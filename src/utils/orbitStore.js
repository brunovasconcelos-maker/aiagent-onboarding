import { mergeAt, pulseScaleAt, speedAt } from './creationSequence.js'

// The orbit's rotation lives here, outside React: ONE angle, integrated by ONE requestAnimationFrame
// loop (angle += speed x dt) and written to ONE CSS variable (--orbit-angle) on the orbit root.
// The ring and the counter-rotation of every circle read that variable, so they always agree.
// Route changes never touch the angle; only reset() (back to the first page) sets it to 0.

export const BASE_SECONDS_PER_TURN = 120
const BASE_SPEED = 360 / BASE_SECONDS_PER_TURN // degrees per second
const MAX_DT = 0.1 // seconds: a long gap (hidden tab) must not make the orbit jump
const SETTLE_SECONDS = 0.6 // time constant of the return to the base speed after a sequence
const HIDE_GRACE_MS = 350 // the loop keeps running this long after the orbit is hidden (fade out)

const reducedQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null

let root = null
let frame = 0
let last = null
let angle = 0
let speed = BASE_SPEED
let visible = false
let stopAt = 0
let held = false // after reset(), the angle stays at 0 until the orbit is shown again
let sequence = null

const write = () => root?.style.setProperty('--orbit-angle', String(angle))

const shouldRun = (now) => Boolean(root) && (visible || sequence !== null || now < stopAt)

function applySequence(now) {
  const seq = sequence
  const t = Math.max(0, now - seq.start)
  const { plan } = seq
  const phase = t < plan.creatingMs ? 'creating' : t < plan.doneAt ? 'merging' : 'done'
  const message = Math.min(Math.floor(t / seq.messageEveryMs), seq.messageCount - 1)
  if (phase !== seq.phase) {
    seq.phase = phase
    seq.onPhase(phase)
  }
  if (message !== seq.message) {
    seq.message = message
    seq.onMessage(message)
  }

  const shown = Math.min(t, plan.doneAt)
  const reduced = reducedQuery?.matches
  if (!reduced) {
    if (shown >= plan.creatingMs) root.dataset.merging = 'true'
    const arms = root.querySelectorAll('.ring__arm--circle')
    arms.forEach((arm) => {
      const index = seq.keys.indexOf(arm.dataset.key)
      if (index >= 0) arm.style.setProperty('--merge', String(mergeAt(shown, index, plan)))
    })
    const pulseX = (shown - plan.creatingMs - plan.spiralMs) / plan.pulseMs
    const agent = root.querySelector('.porbit__agent')
    if (pulseX >= 0) agent?.style.setProperty('--pulse', String(pulseScaleAt(pulseX)))
  }
  return speedAt(shown, plan)
}

function tick(now) {
  frame = 0
  const dt = last === null ? 0 : Math.min((now - last) / 1000, MAX_DT)
  last = now

  if (sequence) {
    speed = applySequence(now)
  } else {
    speed += (BASE_SPEED - speed) * (1 - Math.exp(-dt / SETTLE_SECONDS))
  }
  // Reduced motion: the angle stays where it is.
  if (!reducedQuery?.matches && !held) angle += speed * dt
  write()

  if (shouldRun(now)) frame = requestAnimationFrame(tick)
  else last = null
}

function ensure() {
  if (!frame && shouldRun(performance.now())) frame = requestAnimationFrame(tick)
}

function clearSequenceStyles() {
  if (!root) return
  delete root.dataset.merging
  root.querySelectorAll('.ring__arm--circle').forEach((arm) => arm.style.removeProperty('--merge'))
  root.querySelector('.porbit__agent')?.style.removeProperty('--pulse')
}

export const orbitStore = {
  // Called once by the persistent orbit; the returned function stops the loop (StrictMode runs
  // effects twice, the cleanup guarantees there is never more than one loop).
  attach(node) {
    root = node
    write()
    ensure()
    return () => {
      cancelAnimationFrame(frame)
      frame = 0
      last = null
      if (root === node) root = null
    }
  },

  // The orbit is shown (any mode but hidden) or hidden. The angle is kept while hidden.
  setVisible(value) {
    visible = value
    if (value) {
      held = false
      last = null
    } else {
      stopAt = performance.now() + HIDE_GRACE_MS
    }
    ensure()
  },

  // Back to the very beginning of the onboarding.
  reset() {
    angle = 0
    speed = BASE_SPEED
    held = true
    write()
  },

  // The creation sequence drives the speed, the spiral and the pulse of the same loop.
  startSequence({ plan, keys, messageCount, messageEveryMs, onPhase, onMessage }) {
    const seq = { start: performance.now(), plan, keys, messageCount, messageEveryMs, onPhase, onMessage, phase: null, message: null }
    sequence = seq
    ensure()
    return () => {
      if (sequence === seq) {
        sequence = null
        clearSequenceStyles()
      }
    }
  },
}
