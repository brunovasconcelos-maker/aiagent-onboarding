import { creatingMessages } from '../data/finale.js'

// Set to false to run the merge without the gooey (metaballs) filter: the spiral, the stretch and
// the fades stay, only the SVG filter layer is not used.
export const ENABLE_GOO = true

// Every timing of the sequence lives here (ms unless the name says otherwise).
//   creating -> merging (spiral, goo) -> burst of light + pulse -> done (texts and button)
export const TIMING = {
  fadeInMs: 400, // the page content fades in
  messageEveryMs: 1100, // one message per 1.1s; creating lasts messages x this
  messageFadeMs: 250, // crossfade of a message (with a slide of messageSlidePx)
  messageSlidePx: 6,
  // seconds per turn: one ramp through creating (ease-in), then the merge keeps accelerating
  // from the same speed and the same acceleration (no jump), up to mergingEnd
  orbitSeconds: { start: 120, creatingEnd: 12, mergingEnd: 6 },

  // merge (starts when creating ends, while the last message fades out)
  mergeMs: 1600, // spiral of all the circles, including the stagger
  mergeStaggerMs: 60, // delay between one circle and the next, in order of their angle
  minCircleMergeMs: 500, // a circle never takes less than this to be absorbed
  swirlDeg: 270, // extra angle a circle travels around the center while it falls in
  stretchMax: 1.15, // squash and stretch along the direction of motion, at full speed
  squashMin: 0.9,
  stretchFullSpeed: 700, // speed (Figma px per second) at which the stretch is complete
  iconFadeFrac: 0.4, // icons/logos (and the normal circles over the blobs) fade in this fraction
  gulpScale: 0.02, // the center circle swells this much when a circle is absorbed...
  gulpMs: 160, // ...and settles in this time
  gulpMax: 0.035, // upper limit when several are absorbed together

  // goo layer (only if ENABLE_GOO)
  gooFadeInMs: 120, // the blob layer appears under the circles at the start of the merge
  gooBlur: 9, // blur in Figma px (scaled by the orbit scale u)
  gooAlphaGain: 20, // alpha threshold of the filter: alpha * gain + offset
  gooAlphaOffset: -9,

  // burst of light when the last circle is absorbed (same moment as the pulse)
  burstGlowMs: 900,
  burstGlowScale: 3.5,
  burstGlowAlpha: 0.5,
  burstRingMs: 600,
  burstRingScale: 2.5,
  burstRingPx: 2, // Figma px (scaled by u)
  pulseMs: 500, // pulse of the agent circle (scale 1 to pulseScale and back)
  pulseScale: 1.08,
  burstSafetyMs: 50, // the button unlocks this long after the burst animations end

  // final state
  doneAfterBurstMs: 250, // the final text starts this long after the burst starts
  doneFadeMs: 400, // text of the final state
  doneRisePx: 8,
  doneButtonDelayMs: 200,
  leaveFadeMs: 300, // "Começar": the page and the orbit fade out before the onboarding restarts
}

export const ease = {
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
}
export const clamp01 = (x) => Math.min(1, Math.max(0, x))
export const easeInCubic = (x) => x * x * x // radius: accelerates like a fall
export const easeInQuad = (x) => x * x // scale

// Timeline of the sequence for `count` circles. burstAt is the moment the last circle is absorbed:
// the burst of light and the pulse start there, and the final text 250ms later. With no circles
// there is no merge and the burst starts when creating ends. Reduced motion: no merge, no burst.
export function makePlan(count, reduced) {
  const creatingMs = creatingMessages.length * TIMING.messageEveryMs
  if (reduced) return { creatingMs, circleMs: 0, spiralMs: 0, burstAt: creatingMs, burstEndMs: 0, doneAt: creatingMs }
  const circleMs = Math.max(TIMING.minCircleMergeMs, TIMING.mergeMs - (count - 1) * TIMING.mergeStaggerMs)
  const spiralMs = count > 0 ? circleMs + (count - 1) * TIMING.mergeStaggerMs : 0
  const burstAt = creatingMs + spiralMs
  return {
    creatingMs,
    circleMs,
    spiralMs,
    burstAt,
    burstEndMs: Math.max(TIMING.burstGlowMs, TIMING.burstRingMs, TIMING.pulseMs) + TIMING.burstSafetyMs, // after burstAt
    doneAt: burstAt + TIMING.doneAfterBurstMs,
  }
}

// Speed of the orbit (degrees per second) `t` ms into the sequence. Creating: one turn per 120s
// going to one per 12s, ease-in (speed grows with x^2). The merge continues from the same speed
// with the same acceleration (so there is no jump and no kink) up to one turn per 6s over the
// spiral, and holds it. The angle is the integral of this speed, computed by the orbit loop.
export function speedAt(t, plan) {
  const { start, creatingEnd, mergingEnd } = TIMING.orbitSeconds
  const [w0, w1, w2] = [start, creatingEnd, mergingEnd].map((seconds) => 360 / seconds)
  const T = plan.creatingMs / 1000
  if (t <= plan.creatingMs) return w0 + (w1 - w0) * (t / plan.creatingMs) ** 2
  if (plan.spiralMs === 0) return w1
  const slope = (2 * (w1 - w0)) / T // deg/s^2 at the end of creating
  const S = plan.spiralMs / 1000
  const b = (w2 - w1 - slope * S) / (S * S)
  const tau = Math.min((t - plan.creatingMs) / 1000, S)
  return w1 + slope * tau + b * tau * tau
}

// Where circle number `rank` (its place in the order of angle) is in its fall at `ts` ms after the
// merge started: x from 0 to 1 (its own time, after its stagger).
export function fallAt(ts, rank, plan) {
  if (plan.circleMs === 0) return 0
  return clamp01((ts - rank * TIMING.mergeStaggerMs) / plan.circleMs)
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
