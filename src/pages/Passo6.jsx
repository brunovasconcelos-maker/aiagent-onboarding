import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { creatingMessages, doneButton, doneText, doneTitle, noToolsMessage } from '../data/finale.js'
import { useOnboarding } from '../context/OnboardingContext.jsx'
import { buildCircles } from '../utils/circles.js'
import { TIMING, makePlan } from '../utils/creationSequence.js'
import { orbitStore } from '../utils/orbitStore.js'

// The orbit itself (agent circle and circles, in the center of the page) is the persistent
// orbit of the Layout. This page owns the texts and the button, and starts the sequence: the
// orbit's own loop runs the speed ramp, the spiral and the pulse, and reports the phase and the
// message back through these callbacks.
export default function Passo6() {
  const { answers, setCreationPhase, reset } = useOnboarding()
  const navigate = useNavigate()

  const circles = useMemo(() => buildCircles(answers), [answers])
  const keys = useMemo(() => circles.map((c) => c.key), [circles])
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
  // the button cannot be used until the burst of light is completely gone
  const [burstOver, setBurstOver] = useState(false)

  useEffect(() => {
    setPhase('creating')
    setMessageIndex(0)
    setBurstOver(false)
    const stop = orbitStore.startSequence({
      plan,
      keys,
      messageCount: messages.length,
      messageEveryMs: TIMING.messageEveryMs,
      onPhase: (next) => {
        setPhase(next)
        setCreationPhase(next)
      },
      onMessage: setMessageIndex,
      onBurstEnd: () => setBurstOver(true),
    })
    return () => {
      stop()
      setCreationPhase(null)
    }
  }, [plan, keys, messages.length, setCreationPhase])

  const done = phase === 'done'

  // "Começar" starts the onboarding over: after a soft fade (the page and the orbit) it does exactly
  // what the logo does: the same reset, then back to the first page.
  const [leaving, setLeaving] = useState(false)
  const leaveTimer = useRef(0)
  useEffect(() => () => clearTimeout(leaveTimer.current), [])
  const restart = (event) => {
    event.preventDefault()
    if (!burstOver || leaving) return
    setLeaving(true)
    setCreationPhase('leaving') // the orbit fades out with the page
    leaveTimer.current = setTimeout(
      () => {
        reset()
        navigate('/')
      },
      reduced ? 0 : TIMING.leaveFadeMs,
    )
  }

  return (
    <div className="finale">
      <div
        className="finale__stage"
        data-phase={phase}
        data-reduced={reduced}
        data-leaving={leaving}
        style={{
          '--fade-in': `${TIMING.fadeInMs}ms`,
          '--message-fade': `${TIMING.messageFadeMs}ms`,
          '--message-slide': `${TIMING.messageSlidePx}px`,
          '--done-fade': `${TIMING.doneFadeMs}ms`,
          '--done-rise': `${TIMING.doneRisePx}px`,
          '--done-button-delay': `${TIMING.doneButtonDelayMs}ms`,
          '--leave-fade': `${TIMING.leaveFadeMs}ms`,
        }}
      >
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
            <Link
              to="/"
              className="btn finale__cta"
              data-locked={!burstOver || leaving}
              tabIndex={burstOver ? undefined : -1}
              aria-disabled={!burstOver}
              onClick={restart}
            >
              {doneButton}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
