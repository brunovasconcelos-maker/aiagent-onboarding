import { Link } from 'react-router-dom'
import AgentCircle from '../components/AgentCircle.jsx'
import OrbitRing from '../components/OrbitRing.jsx'
import { agents } from '../data/agents.js'
import { icons } from '../data/icons.js'
import { palettes } from '../data/palettes.js'
import { purposes } from '../data/purposes.js'
import { useAgent } from '../context/AgentContext.jsx'
import { useOnboarding } from '../context/OnboardingContext.jsx'

export default function Passo3() {
  const { agentId } = useAgent()
  const { answers, setAnswer } = useOnboarding()

  const agent = agents.find((a) => a.id === agentId) ?? agents[0]
  const selected = purposes.find((p) => p.id === answers.purpose) ?? null

  // Slot 0 holds the answer of this step; later steps fill the other slots.
  const slots = [selected ? selected.icon : null, null, null, null, null, null]

  const toggle = (id) => {
    if (selected && selected.id !== id) return
    setAnswer('purpose', selected ? null : id)
  }

  return (
    <div className="step">
      <div className="step__stage">
        <div className="purpose">
          <h1 className="purpose__title">
            <span>{'Para que você quer usar '}</span>
            <span>o seu Inner Agente:</span>
          </h1>

          <div className="purpose__grid">
            {purposes.map((option) => {
              const Icon = icons[option.icon]
              const isSelected = selected?.id === option.id
              const isDisabled = Boolean(selected) && !isSelected
              return (
                <button
                  key={option.id}
                  type="button"
                  className="option"
                  aria-pressed={isSelected}
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : 0}
                  onClick={() => toggle(option.id)}
                >
                  <span className="option__tile" aria-hidden="true">
                    <Icon weight="regular" color="#0A374E" />
                  </span>
                  <span className="option__label">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="orbit-area">
          <div className="orbit-area__agent">
            <AgentCircle agent={agent} />
          </div>
          <OrbitRing slots={slots} palette={palettes[agent.id]} />
        </div>

        <div className="step__bar">
          <Link to="/passo-2" className="btn btn--text">
            Voltar
          </Link>
          <Link to="/passo-4" className="btn">
            Continuar
          </Link>
        </div>
      </div>
    </div>
  )
}
