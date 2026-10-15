import {
  ENABLE_GOO,
  TIMING,
  clamp01,
  easeInCubic,
  easeInQuad,
  fallAt,
  pulseScaleAt,
  speedAt,
} from './creationSequence.js'

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

const CIRCLE_RADIUS = 60.7845 // Figma px
const RAD = Math.PI / 180

// Prepares the merge: the order in which the circles fall in is the order of their angle, and the
// goo blur is scaled with the orbit scale u.
function initMerge(seq) {
  const agent = root.querySelector('.porbit__agent')
  const u = agent ? agent.getBoundingClientRect().width / (2 * CIRCLE_RADIUS) : 1
  seq.u = u
  const info = new Map()
  root.querySelectorAll('.ring:not(.ring--goo) .ring__arm--circle').forEach((arm) => {
    const key = arm.dataset.key
    if (!seq.keys.includes(key)) return
    info.set(key, {
      phi: parseFloat(arm.style.getPropertyValue('--phi')),
      radius: parseFloat(arm.style.getPropertyValue('--radius')),
    })
  })
  ;[...info.entries()]
    .sort((a, b) => a[1].phi - b[1].phi)
    .forEach(([, item], rank) => {
      item.rank = rank
    })
  seq.info = info
  if (ENABLE_GOO && info.size > 0) {
    root
      .querySelector('#porbit-goo feGaussianBlur')
      ?.setAttribute('stdDeviation', String(TIMING.gooBlur * u))
    root.dataset.goo = 'true'
  }
}

// Everything the sequence drives, as CSS variables and data attributes on the orbit root and the
// arms of the circles (transform and opacity only).
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

  const ringSpeed = speedAt(t, plan)
  const reduced = reducedQuery?.matches
  if (reduced) {
    if (phase === 'done' && !seq.burstEnded) {
      seq.burstEnded = true
      seq.onBurstEnd?.()
    }
    return ringSpeed
  }

  const agent = root.querySelector('.porbit__agent')
  let gulp = 0
  if (t >= plan.creatingMs) {
    if (!seq.info) initMerge(seq)
    root.dataset.merging = 'true'
    const ts = t - plan.creatingMs
    const iconP = clamp01(ts / (TIMING.iconFadeFrac * TIMING.mergeMs))
    root.style.setProperty('--content', String(1 - iconP)) // icons and logos fade out
    if (ENABLE_GOO) {
      root.style.setProperty('--normal', String(1 - iconP)) // normal circles melt into their blobs
      root.style.setProperty('--goo-in', String(clamp01(ts / TIMING.gooFadeInMs)))
    }
    const wDot = ringSpeed / 1000 // ring speed, degrees per ms
    root.querySelectorAll('.ring__arm--circle').forEach((arm) => {
      const item = seq.info.get(arm.dataset.key)
      if (!item) return
      const x = fallAt(ts, item.rank, plan)
      const fall = easeInCubic(x) // radius: accelerating, like gravity
      const shrink = easeInQuad(x)
      const swirl = TIMING.swirlDeg * fall // angular speed keeps increasing as the radius drops
      // velocity of the circle on screen (Figma px per second) gives the stretch
      let sa = 0
      let amount = 0
      if (x > 0 && x < 1) {
        const xDot = 1 / plan.circleMs
        const rDot = -item.radius * 3 * x * x * xDot // px per ms (inward)
        const r = item.radius * (1 - fall)
        const phiDot = (TIMING.swirlDeg * 3 * x * x * xDot + wDot) * RAD
        const big = (item.phi + swirl + angle) * RAD
        const vx = -rDot * Math.cos(big) + r * Math.sin(big) * phiDot
        const vy = -rDot * Math.sin(big) - r * Math.cos(big) * phiDot
        amount = Math.min(1, (Math.hypot(vx, vy) * 1000) / TIMING.stretchFullSpeed)
        sa = Math.atan2(vy, vx) / RAD
      }
      arm.style.setProperty('--merge', String(fall))
      arm.style.setProperty('--shrink', String(shrink))
      arm.style.setProperty('--swirl', String(swirl))
      arm.style.setProperty('--sa', String(sa))
      arm.style.setProperty('--sx', String(1 + (TIMING.stretchMax - 1) * amount))
      arm.style.setProperty('--sy', String(1 - (1 - TIMING.squashMin) * amount))
    })
    // each absorption makes the center circle swell a little
    seq.info.forEach((item) => {
      const since = ts - (item.rank * TIMING.mergeStaggerMs + plan.circleMs)
      if (since >= 0 && since < TIMING.gulpMs) gulp += TIMING.gulpScale * Math.sin((Math.PI * since) / TIMING.gulpMs)
    })
    gulp = Math.min(gulp, TIMING.gulpMax)
    if (t >= plan.burstAt && root.dataset.goo) delete root.dataset.goo // the filter only lives during the merge
  }

  // burst of light and pulse, from the moment the last circle is absorbed
  if (t >= plan.burstAt) {
    if (!seq.burst) {
      seq.burst = true
      root.dataset.burst = 'true'
    }
    if (!seq.burstEnded && t >= plan.burstAt + plan.burstEndMs) {
      seq.burstEnded = true
      seq.onBurstEnd?.()
    }
  }
  const pulse = t >= plan.burstAt ? pulseScaleAt((t - plan.burstAt) / TIMING.pulseMs) : 1
  // the swell of the last absorptions flows into the pulse (never on top of it: the pulse peaks at pulseScale)
  if (t >= plan.creatingMs) agent?.style.setProperty('--pulse', String(Math.max(1 + gulp, pulse)))
  return ringSpeed
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
  delete root.dataset.goo
  delete root.dataset.burst
  ;['--content', '--normal', '--goo-in', '--glow-ms', '--glow-scale', '--glow-alpha', '--burst-ring-ms', '--burst-ring-scale', '--burst-ring-px'].forEach((name) => root.style.removeProperty(name))
  root.querySelectorAll('.ring__arm--circle').forEach((arm) => {
    ;['--merge', '--shrink', '--swirl', '--sa', '--sx', '--sy'].forEach((name) => arm.style.removeProperty(name))
  })
  root.querySelector('.porbit__agent')?.style.removeProperty('--pulse')
  root.querySelector('#porbit-goo feGaussianBlur')?.setAttribute('stdDeviation', '0')
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
  startSequence({ plan, keys, messageCount, messageEveryMs, onPhase, onMessage, onBurstEnd }) {
    const seq = {
      start: performance.now(),
      plan,
      keys,
      messageCount,
      messageEveryMs,
      onPhase,
      onMessage,
      onBurstEnd,
      phase: null,
      message: null,
      info: null,
      burst: false,
      burstEnded: false,
    }
    sequence = seq
    if (root) {
      // the burst of light reads its timings from the config
      const vars = {
        '--glow-ms': `${TIMING.burstGlowMs}ms`,
        '--glow-scale': String(TIMING.burstGlowScale),
        '--glow-alpha': String(TIMING.burstGlowAlpha),
        '--burst-ring-ms': `${TIMING.burstRingMs}ms`,
        '--burst-ring-scale': String(TIMING.burstRingScale),
        '--burst-ring-px': String(TIMING.burstRingPx),
      }
      Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value))
    }
    ensure()
    return () => {
      if (sequence === seq) {
        sequence = null
        clearSequenceStyles()
      }
    }
  },
}
