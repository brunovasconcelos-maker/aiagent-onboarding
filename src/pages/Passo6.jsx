import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AgentCircle from '../components/AgentCircle.jsx'
import { OrbitSlot, RING_RADIUS, computeLayout } from '../components/OrbitRing.jsx'
import { agents } from '../data/agents.js'
import { creatingMessages, doneButton, doneText, doneTitle, noToolsMessage } from '../data/finale.js'
import { palettes } from '../data/palettes.js'
import { useAgent } from '../context/AgentContext.jsx'
import { useOnboarding } from '../context/OnboardingContext.jsx'
import { buildCircles } from '../utils/circles.js'

// Every timing of the sequence lives here (ms unless the name says otherwise).
//   creating -> merging (spiral, then a pulse of the agent circle) -> done
const TIMING = {
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

const ease = {
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
}
const clamp01 = (x) => Math.min(1, Math.max(0, x))

// Evenly spaced circles in clockwise order of their position; same layout rules as the
// orbit of the steps (6 circles on the base positions, more than 6 scaled down).
function finaleLayout(circles) {
  if (circles.length === 0 || circles.length >= 6) return computeLayout(circles)
  const layout = new Map()
  ;[...circles]
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .forEach((circle, i) => {
      layout.set(circle.key, { phi: (360 * i) / circles.length, radius: RING_RADIUS, scale: 1 })
    })
  return layout
}

// Timeline of the sequence for `count` circles.
function makePlan(count, reduced) {
  const creatingMs = creatingMessages.length * TIMING.messageEveryMs
  if (reduced) return { creatingMs, circleMs: 0, spiralMs: 0, pulseMs: 0, doneAt: creatingMs }
  const circleMs = Math.max(TIMING.minCircleMergeMs, TIMING.mergeMs - (count - 1) * TIMING.mergeStaggerMs)
  const spiralMs = count > 0 ? circleMs + (count - 1) * TIMING.mergeStaggerMs : 0
  return { creatingMs, circleMs, spiralMs, pulseMs: TIMING.pulseMs, doneAt: creatingMs + spiralMs + TIMING.pulseMs }
}

// Angle of the ring (degrees) after `t` ms: the speed goes from one turn per 120s to one per
// 12s during creating, then to one per 6s during the spiral, both ease-in (speed grows with
// x^2, so the angle is the integral: from * t + (to - from) * ms * x^3 / 3).
function turned(from, to, ms, elapsed) {
  const x = Math.min(elapsed / ms, 1)
  const ramped = (from * x * ms) / 1000 + ((to - from) * (ms / 1000) * x ** 3) / 3
  return ramped + (elapsed > ms ? to * ((elapsed - ms) / 1000) : 0)
}

function spinAt(t, plan) {
  const { start, creatingEnd, mergingEnd } = TIMING.orbitSeconds
  const [w0, w1, w2] = [start, creatingEnd, mergingEnd].map((seconds) => 360 / seconds)
  if (t <= plan.creatingMs) return turned(w0, w1, plan.creatingMs, t)
  const afterCreating = turned(w0, w1, plan.creatingMs, plan.creatingMs)
  if (plan.spiralMs === 0) return afterCreating + w1 * ((t - plan.creatingMs) / 1000)
  return afterCreating + turned(w1, w2, plan.spiralMs, t - plan.creatingMs)
}

// Scale of the agent circle during the pulse (x from 0 to 1): up to pulseScale, then a gentle
// settle with a tiny undershoot.
function pulseScaleAt(x) {
  const peak = TIMING.pulseScale - 1
  if (x <= 0) return 1
  if (x < 0.35) return 1 + peak * (1 - (1 - x / 0.35) ** 3)
  if (x < 1) {
    const v = (x - 0.35) / 0.65
    return 1 + peak * (1 - ease.inOutCubic(v)) - 0.012 * Math.sin(Math.PI * v)
  }
  return 1
}

export default function Passo6() {
  const { agentId } = useAgent()
  const { answers } = useOnboarding()
  const agent = agents.find((a) => a.id === agentId) ?? agents[0]
  const palette = palettes[agent.id]

  const circles = useMemo(() => buildCircles(answers), [answers])
  const layout = useMemo(() => finaleLayout(circles), [circles])
  const messages = useMemo(
    () => creatingMessages.map((m, i, all) => (i === all.length - 1 && answers.tools.length === 0 ? noToolsMessage : m)),
    [answers.tools.length],
  )

  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const plan = useMemo(() => makePlan(circles.length, reduced), [circles.length, reduced])

  const [phase, setPhase] = useState('creating') // creating | merging | done
  const [messageIndex, setMessageIndex] = useState(0)

  const stageRef = useRef(null)
  const ringRef = useRef(null)
  const centerRef = useRef(null)
  const nodes = useRef([]) // per circle: { arm, counter, scale }

  // One requestAnimationFrame loop drives the whole sequence from the elapsed time: it moves
  // the DOM through transform only and updates React state only when the phase or the
  // message changes. Cleanup cancels the frame, so StrictMode's second run starts clean.
  useEffect(() => {
    const stage = stageRef.current
    const start = performance.now()
    let frame
    let shownPhase = 'creating'
    let shownMessage = 0
    setPhase('creating')
    setMessageIndex(0)
    stage.classList.add('finale--animating')

    const render = (t) => {
      const spin = reduced ? 0 : spinAt(t, plan)
      ringRef.current.style.transform = `rotate(${spin}deg)`
      const merging = t - plan.creatingMs
      circles.forEach((circle, i) => {
        const node = nodes.current[i]
        if (!node) return
        const { phi, radius, scale } = layout.get(circle.key)
        const p = reduced ? 0 : clamp01((merging - i * TIMING.mergeStaggerMs) / plan.circleMs)
        const e = ease.inOutCubic(p)
        node.arm.style.transform = `rotate(${phi}deg) translateX(calc(${-radius * (1 - e)} * var(--u)))`
        node.counter.style.transform = `rotate(${-spin}deg)`
        node.scale.style.transform = `scale(${scale * (1 - e)})`
      })
      const pulseX = (t - plan.creatingMs - plan.spiralMs) / plan.pulseMs
      centerRef.current.style.transform = reduced || pulseX < 0 ? '' : `scale(${pulseScaleAt(pulseX)})`
    }

    const tick = (now) => {
      const t = Math.max(0, now - start)
      const nextPhase = t < plan.creatingMs ? 'creating' : t < plan.doneAt ? 'merging' : 'done'
      const nextMessage = Math.min(Math.floor(t / TIMING.messageEveryMs), messages.length - 1)
      if (nextPhase !== shownPhase) {
        shownPhase = nextPhase
        setPhase(nextPhase)
      }
      if (nextMessage !== shownMessage) {
        shownMessage = nextMessage
        setMessageIndex(nextMessage)
      }
      render(Math.min(t, plan.doneAt))
      if (nextPhase === 'done') {
        stage.classList.remove('finale--animating')
        return
      }
      frame = requestAnimationFrame(tick)
    }
    render(0)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      stage.classList.remove('finale--animating')
    }
  }, [circles, layout, messages, plan, reduced])

  const done = phase === 'done'

  return (
    <div className="finale">
      <div
        ref={stageRef}
        className="finale__stage"
        data-phase={phase}
        data-reduced={reduced}
        style={{
          '--fade-in': `${TIMING.fadeInMs}ms`,
          '--message-fade': `${TIMING.messageFadeMs}ms`,
          '--message-slide': `${TIMING.messageSlidePx}px`,
          '--done-fade': `${TIMING.doneFadeMs}ms`,
          '--done-rise': `${TIMING.doneRisePx}px`,
          '--done-button-delay': `${TIMING.doneButtonDelayMs}ms`,
        }}
      >
        <div ref={ringRef} className="finale__ring" data-gone={done} aria-hidden="true">
          {circles.map((circle, i) => {
            const { phi, radius, scale } = layout.get(circle.key)
            return (
              <div
                key={circle.key}
                className="finale__arm"
                ref={(el) => {
                  nodes.current[i] = {
                    arm: el,
                    counter: el?.querySelector('.finale__counter'),
                    scale: el?.querySelector('.finale__scale'),
                  }
                }}
                style={{ transform: `rotate(${phi}deg) translateX(calc(${-radius} * var(--u)))` }}
              >
                <div className="finale__level" style={{ transform: `rotate(${-phi}deg)` }}>
                  <div className="finale__counter">
                    <div className="finale__scale" style={{ transform: `scale(${scale})` }}>
                      <OrbitSlot
                        variant={circle.variant}
                        content={{ icon: circle.icon, logo: circle.logo }}
                        palette={palette}
                        late={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div ref={centerRef} className="finale__center">
          <AgentCircle agent={agent} />
        </div>

        <div className="finale__messages" data-hidden={phase !== 'creating'} aria-live="polite">
          {messages.map((message, i) => (
            <p
              key={message}
              className="finale__message"
              data-state={i === messageIndex ? 'active' : i < messageIndex ? 'past' : 'next'}
              aria-hidden={i !== messageIndex}
            >
              {message}
            </p>
          ))}
        </div>

        {done && (
          <>
            <p className="finale__done">
              <span>{doneTitle}</span>
              <span>{doneText}</span>
            </p>
            <Link to="/passo-7" className="btn finale__cta">
              {doneButton}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
