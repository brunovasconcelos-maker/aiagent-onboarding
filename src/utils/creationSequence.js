import { creatingMessages } from '../data/finale.js'

// Every timing of the creation sequence lives here (ms unless the name says otherwise).
//   creating -> merging (spiral, then a pulse of the agent circle) -> done
export const TIMING = {
  fadeInMs: 400, // the page content fades in
  messageEveryMs: 1100, // one message per 1.1s; creating lasts messages x this
  messageFadeMs: 250, // crossfade of a message (with a slide of messageSlidePx)
  messageSlidePx: 6,
  orbitSeconds: { start: 120, creatingEnd: 12, mergingEnd: 6 }, // seconds per turn, ease-in
  mergeMs: 1400, // spiral of all the circles, including the stagger
  mergeStaggerMs: 60, // delay between one circle and the next
  minCircleMergeMs: 500, // a circle never takes less than this to be absorbed
  pulseMs: 500, // pulse of the agent circle after the last circle is absorbed
  pulseScale: 1.08,
  doneFadeMs: 400, // text of the final state
  doneRisePx: 8,
  doneButtonDelayMs: 200,
}

export const ease = {
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
}
export const clamp01 = (x) => Math.min(1, Math.max(0, x))

// Timeline of the sequence for `count` circles.
export function makePlan(count, reduced) {
  const creatingMs = creatingMessages.length * TIMING.messageEveryMs
  if (reduced) return { creatingMs, circleMs: 0, spiralMs: 0, pulseMs: 0, doneAt: creatingMs }
  const circleMs = Math.max(TIMING.minCircleMergeMs, TIMING.mergeMs - (count - 1) * TIMING.mergeStaggerMs)
  const spiralMs = count > 0 ? circleMs + (count - 1) * TIMING.mergeStaggerMs : 0
  return { creatingMs, circleMs, spiralMs, pulseMs: TIMING.pulseMs, doneAt: creatingMs + spiralMs + TIMING.pulseMs }
}

// Speed of the orbit (degrees per second) `t` ms into the sequence: one turn per 120s going to
// one per 12s during creating, then to one per 6s during the spiral, both ease-in (the speed
// grows with x^2). The angle is the integral of this speed, computed by the orbit loop.
export function speedAt(t, plan) {
  const { start, creatingEnd, mergingEnd } = TIMING.orbitSeconds
  const [w0, w1, w2] = [start, creatingEnd, mergingEnd].map((seconds) => 360 / seconds)
  const ramp = (from, to, ms, elapsed) => from + (to - from) * Math.min(elapsed / ms, 1) ** 2
  if (t <= plan.creatingMs) return ramp(w0, w1, plan.creatingMs, t)
  if (plan.spiralMs === 0) return w1
  return ramp(w1, w2, plan.spiralMs, t - plan.creatingMs)
}

// How far circle number `index` is on its way into the agent circle (0 to 1, eased).
export function mergeAt(t, index, plan) {
  if (plan.circleMs === 0) return 0
  const p = clamp01((t - plan.creatingMs - index * TIMING.mergeStaggerMs) / plan.circleMs)
  return ease.inOutCubic(p)
}

// Scale of the agent circle during the pulse (x from 0 to 1): up to pulseScale, then a gentle
// settle with a tiny undershoot.
export function pulseScaleAt(x) {
  const peak = TIMING.pulseScale - 1
  if (x <= 0) return 1
  if (x < 0.35) return 1 + peak * (1 - (1 - x / 0.35) ** 3)
  if (x < 1) {
    const v = (x - 0.35) / 0.65
    return 1 + peak * (1 - ease.inOutCubic(v)) - 0.012 * Math.sin(Math.PI * v)
  }
  return 1
}
