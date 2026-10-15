import StepLayout from '../components/StepLayout.jsx'
import { icons } from '../data/icons.js'
import { purposes } from '../data/purposes.js'
import { useOnboarding } from '../context/OnboardingContext.jsx'

export default function Passo3() {
  const { answers, setAnswer } = useOnboarding()

  const selected = purposes.find((p) => p.id === answers.purpose) ?? null

  const toggle = (id) => {
    if (selected && selected.id !== id) return
    setAnswer('purpose', selected ? null : id)
  }

  return (
    <StepLayout
      titleLines={['Para que você quer usar ', 'o seu Inner Agente:']}
      titleTop={144}
      backTo="/passo-2"
      nextTo="/passo-4"
    >
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
    </StepLayout>
  )
}
