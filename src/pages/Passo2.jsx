import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { agents } from '../data/agents.js'
import { useAgent } from '../context/AgentContext.jsx'

const pct = (n) => `${n}%`

// How far a character sticks out above the big circle, as a fraction of the circle diameter:
// the visible part of the character is its image clipped by its frame, so the top edge is the
// lower of the two tops. The stage reserves the largest value so no character (Rubi's horns)
// ever reaches the title or the logo.
const HEADROOM = Math.max(0, ...agents.map((a) => -Math.max(a.characterFrame.y, a.characterImage.y))) / 100

function CharacterLayer({ agent }) {
  const { characterFrame: f, characterImage: i } = agent
  return (
    <div
      className="agent__character"
      style={{ left: pct(f.x), top: pct(f.y), width: pct(f.w), height: pct(f.h) }}
    >
      <img
        src={agent.character}
        alt={agent.name}
        width={480}
        height={480}
        decoding="async"
        style={{
          left: pct(((i.x - f.x) / f.w) * 100),
          top: pct(((i.y - f.y) / f.h) * 100),
          width: pct((i.w / f.w) * 100),
          height: pct((i.h / f.h) * 100),
        }}
      />
    </div>
  )
}

export default function Passo2() {
  const { agentId, setAgentId } = useAgent()
  const radios = useRef([])

  const select = (index) => {
    const next = (index + agents.length) % agents.length
    setAgentId(agents[next].id)
    radios.current[next]?.focus()
  }

  const onKeyDown = (event, index) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      select(index + 1)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      select(index - 1)
    }
  }

  return (
    <div className="agents" style={{ '--headroom': HEADROOM }}>
      <div className="agents__intro">
        <h1 className="agents__title">Selecione seu agente</h1>
        <p className="agents__subtitle">Pense bem, você não poderá mudar depois.</p>
      </div>

      <div className="agents__stage">
        <div className="agents__list" role="radiogroup" aria-label="Agente">
          {agents.map((agent, index) => {
            const checked = agent.id === agentId
            const [size, left, top] = agent.thumbnail.crop
            return (
              <button
                key={agent.id}
                ref={(el) => (radios.current[index] = el)}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={agent.name}
                tabIndex={checked ? 0 : -1}
                className="thumb"
                style={{
                  '--x': agent.thumbnail.x,
                  '--y': agent.thumbnail.y,
                  backgroundColor: agent.color,
                }}
                onClick={() => select(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <span className="thumb__clip">
                  <img
                    src={agent.thumbnail.src}
                    alt=""
                    width={80}
                    height={80}
                    decoding="async"
                    style={{
                      left: pct(left),
                      top: pct(top),
                      width: pct(size),
                      height: pct(size),
                    }}
                  />
                </span>
                <span className="thumb__ring" aria-hidden="true" />
              </button>
            )
          })}
        </div>

        <div className="agents__circle">
          <div className="agents__scene">
            {agents.map((agent) => (
              <img
                key={agent.id}
                className="agent__layer"
                data-active={agent.id === agentId}
                src={agent.scene}
                alt=""
                width={1440}
                height={928}
                decoding="async"
                style={{
                  left: pct(agent.sceneImage.x),
                  top: pct(agent.sceneImage.y),
                  width: pct(agent.sceneImage.w),
                  height: pct(agent.sceneImage.h),
                }}
              />
            ))}
          </div>
          {agents.map((agent) => (
            <div key={agent.id} className="agent__layer" data-active={agent.id === agentId}>
              <CharacterLayer agent={agent} />
            </div>
          ))}
        </div>

        <div className="agents__names" aria-live="polite">
          {agents.map((agent) => (
            <p
              key={agent.id}
              className="agents__name agent__layer"
              data-active={agent.id === agentId}
              aria-hidden={agent.id !== agentId}
            >
              {agent.name}
            </p>
          ))}
        </div>

      </div>

      <Link to="/passo-3" className="btn agents__cta">
        Selecionar
      </Link>
    </div>
  )
}
