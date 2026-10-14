import { Link } from 'react-router-dom'
import AgentCircle from './AgentCircle.jsx'
import OrbitRing from './OrbitRing.jsx'
import { agents } from '../data/agents.js'
import { palettes } from '../data/palettes.js'
import { useAgent } from '../context/AgentContext.jsx'

// Shared layout of the onboarding steps: fixed title and orbit, a scrollable options
// area on the left and a fixed footer. `titleTop` is the title position in the
// 1440x928 Figma frame; the options start 114px below it (58px title + 56px gap).
//
// Orbit content, one of:
//  - circles: the filled circles, see OrbitRing (grows past 6 circles);
//  - slots: array of 6 entries (icon id or null), one per base position.
export default function StepLayout({ titleLines, titleTop, slots, circles, backTo, nextTo, children }) {
  const { agentId } = useAgent()
  const agent = agents.find((a) => a.id === agentId) ?? agents[0]

  const filledCircles =
    circles ??
    slots.flatMap((icon, position) =>
      icon ? [{ key: `position-${position}`, icon, variant: position, position }] : [],
    )

  return (
    <div className="step">
      <div className="step__stage" style={{ '--title-top': titleTop }}>
        <h1 className="step__title">
          {titleLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>

        <div className="step__scroll">
          <div className="step__list">{children}</div>
        </div>

        <div className="orbit-area">
          <div className="orbit-area__agent">
            <AgentCircle agent={agent} />
          </div>
          <OrbitRing circles={filledCircles} palette={palettes[agent.id]} />
        </div>

        <div className="step__footer">
          <div className="step__bar">
            <Link to={backTo} className="btn btn--text">
              Voltar
            </Link>
            <Link to={nextTo} className="btn">
              Continuar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
