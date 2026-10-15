import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AgentCircle from './AgentCircle.jsx'
import OrbitRing from './OrbitRing.jsx'
import { agents } from '../data/agents.js'
import { palettes } from '../data/palettes.js'
import { useAgent } from '../context/AgentContext.jsx'
import { useOnboarding } from '../context/OnboardingContext.jsx'
import { buildCircles } from '../utils/circles.js'
import { orbitStore } from '../utils/orbitStore.js'

// Where the orbit is shown, by route: on the right side in the steps, in the center of the
// page in the creation sequence, hidden everywhere else.
export const orbitModeFor = (pathname) => {
  if (pathname === '/passo-3' || pathname === '/passo-4' || pathname === '/passo-5') return 'side'
  if (pathname === '/passo-6') return 'center'
  return 'hidden'
}

const HIDDEN_SETTLE_MS = 400 // after the fade out, the (invisible) orbit catches up with the answers

// ONE orbit for the whole onboarding, mounted once in Layout outside the routes: it is never
// unmounted while navigating, so its rotation and its filled circles carry over from page to
// page. It renders the agent and the circles from the shared context.
export default function PersistentOrbit() {
  const { pathname } = useLocation()
  const mode = orbitModeFor(pathname)
  const { agentId } = useAgent()
  const { answers, creationPhase } = useOnboarding()
  const agent = agents.find((a) => a.id === agentId) ?? agents[0]

  // `pos` is where the orbit is (or was last seen) and `instant` tells the position to jump
  // instead of gliding: it only glides between two visible modes.
  const [view, setView] = useState({ mode, pos: mode === 'center' ? 'center' : 'side', instant: true })
  if (view.mode !== mode) {
    const visible = mode !== 'hidden'
    setView({ mode, pos: visible ? mode : view.pos, instant: visible && view.mode === 'hidden' })
  }

  const circles = useMemo(
    () => (view.pos === 'center' && creationPhase === 'done' ? [] : buildCircles(answers)),
    [answers, creationPhase, view.pos],
  )
  // While hidden the orbit keeps what it showed, so it fades out as it was; once invisible it
  // catches up with the current answers.
  const [shown, setShown] = useState(circles)
  if (mode !== 'hidden' && shown !== circles) setShown(circles)
  useEffect(() => {
    if (mode !== 'hidden') return undefined
    const timer = setTimeout(() => setShown(circles), HIDDEN_SETTLE_MS)
    return () => clearTimeout(timer)
  }, [mode, circles])

  const rootRef = useRef(null)
  useEffect(() => orbitStore.attach(rootRef.current), [])
  useEffect(() => orbitStore.setVisible(mode !== 'hidden'), [mode])

  return (
    <div
      ref={rootRef}
      className="porbit"
      data-mode={mode}
      data-pos={view.pos}
      data-instant={view.instant}
      aria-hidden="true"
    >
      <div className="porbit__anchor">
        <OrbitRing circles={shown} palette={palettes[agent.id]} mode={view.pos} />
        <div className="porbit__agent">
          <AgentCircle agent={agent} />
        </div>
      </div>
    </div>
  )
}
