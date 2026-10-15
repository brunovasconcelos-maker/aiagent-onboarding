import { useEffect, useRef } from 'react'
import orbImage from '../assets/characters/inner-orb.png'
import laranja from '../assets/characters/Rubi.png'
import azul from '../assets/characters/Poli.png'
import verde from '../assets/characters/Rocco.png'
import roxo from '../assets/characters/Tris.png'

// Every timing and measure of the first-page animation lives here (ms, degrees, Figma px of the
// 210px group at 1440px unless the name says otherwise; the group scales with the page).
// One rotation of the orbit, in seconds: constant, during the emissions and after them.
export const ORBIT_SECONDS_PER_ROTATION = 8
const SPACING_DEG = 46 // angle between consecutive agents
const ORBIT_SPEED = 360 / ORBIT_SECONDS_PER_ROTATION // degrees per second

export const INTRO = {
  // orb (sphere of 80px; the PNG, 624px, has its glow: the sphere is 314px of it)
  orbSize: 80,
  orbImageSize: 151, // the visible sphere of the PNG matches the 76px sphere seen in the Figma render
  orbCenter: 104.54, // center of the sphere in the 210px group
  breatheMs: 2400, // one cycle of the breathing: scale 1 -> breatheScale -> 1
  breatheScale: 1.05,
  glowSize: 200, // soft gradient layer behind the orb, pulses with the breathing

  // sequence
  firstEmitMs: 1000, // the orb is alone for this long
  emitEveryMs: (SPACING_DEG / ORBIT_SPEED) * 1000, // 1022ms: at the orbit speed this keeps the agents 46 degrees apart
  order: ['laranja', 'azul', 'verde', 'roxo'], // Rubi, Poli, Rocco, Tris
  contractMs: 120, // right before an emission the orb contracts...
  contractScale: 0.95,
  popMs: 120, // ...pops...
  popScale: 1.08,
  settleMs: 380, // ...and returns to its breathing
  rippleMs: 700,
  rippleScale: 1.9,
  rippleAlpha: 0.45,

  // agents (circles of 48px)
  agentSize: 48,
  startScale: 0.2, // an agent is born small, at the center, behind the orb
  springMs: 800, // outward move to the orbit radius, with a gentle overshoot
  orbitRadius: 83.4, // mean radius of the three evenly placed agents in Figma
  spacingDeg: SPACING_DEG,
  emitAngle: 61.2, // screen angle where agents are born (lower right); with 46 degrees between
  //                  agents, after the 4th emission the arrangement is the one of node 637-1381
  maxDt: 0.1, // seconds
}

// Crop of each agent image in its 48px circle (size, left, top in % of the circle), fitted to the
// framing of node 637-1381. The circle colors are the agent colors.
const AGENTS = {
  laranja: { src: laranja, color: '#EB684A', crop: [123.75, -11.88, 7.88] },
  azul: { src: azul, color: '#68ADD2', crop: [127.5, -13.75, -0.25] },
  verde: { src: verde, color: '#C2D09F', crop: [128.75, -14.38, 6] },
  roxo: { src: roxo, color: '#B6A4F1', crop: [100, 0, 16.25] },
}

// Where node 637-1381 puts the agents (centers, relative to the center of the orb): used for the
// static end state (reduced motion). [x, y] in Figma px.
const FIGMA_END = {
  laranja: [18.46, -80.54],
  azul: [76.46, -49.54],
  verde: [81.46, 19.46],
  roxo: [40.46, 73.46],
}

const ease = {
  out: (x) => 1 - (1 - x) ** 3,
  inOut: (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2),
}
const clamp01 = (x) => Math.min(1, Math.max(0, x))
// gentle spring: rises to ~1.09 and settles
const spring = (x) => (x >= 1 ? 1 : 1 - Math.exp(-5.5 * x) * Math.cos(2 * Math.PI * 1.15 * x))

// Scale of the orb because of the emissions (on top of its breathing).
function popAt(t) {
  const { firstEmitMs, emitEveryMs, order, contractMs, contractScale, popMs, popScale, settleMs } = INTRO
  for (let i = 0; i < order.length; i++) {
    const d = t - (firstEmitMs + i * emitEveryMs)
    if (d >= -contractMs && d < 0) return 1 + (contractScale - 1) * ease.inOut((d + contractMs) / contractMs)
    if (d >= 0 && d < popMs) return contractScale + (popScale - contractScale) * ease.out(d / popMs)
    if (d >= popMs && d < popMs + settleMs) return popScale + (1 - popScale) * ease.inOut((d - popMs) / settleMs)
  }
  return 1
}

const polar = ([x, y]) => [Math.hypot(x, y), (Math.atan2(y, x) * 180) / Math.PI]

// The orb that expels the 4 agents, which then orbit around it (counterclockwise). One angle
// (--intro-phase, degrees, integrated as angle += speed x dt in one requestAnimationFrame loop)
// drives every agent: each one has its own start phase (--p0) and the shared emission angle (--e),
// so the spacing between them never changes.
export default function OrbIntro() {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const orb = root.querySelector('.intro__orb')
    const agents = [...root.querySelectorAll('.intro__agent')]
    const ripples = [...root.querySelectorAll('.intro__ripple')]
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // The agent photos are large: decode them now, so each one is ready when its turn comes (an
    // agent must never appear as a plain colored circle that fills in later).
    root.querySelectorAll('.intro__agent-body img').forEach((img) => img.decode?.().catch(() => {}))

    const showAgent = (el, r, theta0, scale) => {
      el.style.setProperty('--e', String(theta0))
      el.style.setProperty('--p0', '0')
      el.style.setProperty('--r', String(r))
      el.style.setProperty('--sc', String(scale))
      el.dataset.on = 'true'
      el.dataset.front = 'true'
    }

    if (reduced) {
      // no animation: the static end state of node 637-1381
      root.style.setProperty('--intro-phase', '0')
      agents.forEach((el, i) => {
        const [r, deg] = polar(FIGMA_END[INTRO.order[i]])
        showAgent(el, r, deg, 1)
      })
      return undefined
    }

    const t0 = performance.now()
    let last = t0
    let phase = 0
    let frame = 0

    const tick = (now) => {
      const t = now - t0
      const dt = Math.min((now - last) / 1000, INTRO.maxDt)
      last = now

      const speed = ORBIT_SPEED // constant: the same during and after the emissions
      phase += speed * dt
      root.style.setProperty('--intro-phase', String(phase))

      agents.forEach((el, i) => {
        const emitAt = INTRO.firstEmitMs + i * INTRO.emitEveryMs
        if (t < emitAt) return
        const x = clamp01((t - emitAt) / INTRO.springMs)
        if (el.dataset.on !== 'true') {
          // born now: its phase starts where the orbit was at its emission time
          el.style.setProperty('--e', String(INTRO.emitAngle))
          el.style.setProperty('--p0', String(phase - (speed * (t - emitAt)) / 1000))
          el.dataset.on = 'true'
        }
        const s = spring(x)
        el.style.setProperty('--r', String(INTRO.orbitRadius * s))
        el.style.setProperty('--sc', String(INTRO.startScale + (1 - INTRO.startScale) * s))
        // once outside the sphere the agent is drawn in front of the orb's glow, as in Figma
        if (INTRO.orbitRadius * s > INTRO.orbSize / 2 + 6) el.dataset.front = 'true'
      })

      orb.style.setProperty('--pop', String(popAt(t)))

      ripples.forEach((el, i) => {
        const p = (t - (INTRO.firstEmitMs + i * INTRO.emitEveryMs)) / INTRO.rippleMs
        if (p < 0 || p > 1) {
          el.style.setProperty('--ro', '0')
          return
        }
        el.style.setProperty('--rs', String(1 + (INTRO.rippleScale - 1) * ease.out(p)))
        el.style.setProperty('--ro', String(INTRO.rippleAlpha * (1 - p) ** 2))
      })

      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    // cleanup (StrictMode runs this effect twice): stop the loop and put everything back
    return () => {
      cancelAnimationFrame(frame)
      root.style.removeProperty('--intro-phase')
      orb.style.removeProperty('--pop')
      agents.forEach((el) => {
        delete el.dataset.on
        delete el.dataset.front
        ;['--e', '--p0', '--r', '--sc'].forEach((name) => el.style.removeProperty(name))
      })
      ripples.forEach((el) => ['--rs', '--ro'].forEach((name) => el.style.removeProperty(name)))
    }
  }, [])

  return (
    <div ref={rootRef} className="intro" aria-hidden="true">
      <div className="intro__center">
        <div className="intro__glow" />
        {INTRO.order.map((name) => (
          <div key={`ripple-${name}`} className="intro__ripple" />
        ))}
        {INTRO.order.map((name) => {
          const agent = AGENTS[name]
          return (
            <div key={name} className="intro__agent">
              <div className="intro__agent-body" style={{ backgroundColor: agent.color }}>
                <img
                  src={agent.src}
                  alt=""
                  decoding="async"
                  style={{ '--size': `${agent.crop[0]}%`, '--left': `${agent.crop[1]}%`, '--top': `${agent.crop[2]}%` }}
                />
              </div>
            </div>
          )
        })}
        <div className="intro__orb">
          <img className="intro__orb-img" src={orbImage} alt="" width={624} height={624} decoding="async" />
        </div>
      </div>
    </div>
  )
}
