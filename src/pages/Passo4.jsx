import StepLayout from '../components/StepLayout.jsx'
import { icons } from '../data/icons.js'
import { getTaskSet } from '../data/tasks.js'
import { useOnboarding } from '../context/OnboardingContext.jsx'
import { buildCircles } from '../utils/circles.js'

export default function Passo4() {
  const { answers, toggleTask } = useOnboarding()

  const options = getTaskSet(answers.purpose)

  const circles = buildCircles(answers)

  return (
    <StepLayout
      titleLines={['Onde você mais quer', 'minha ajuda?']}
      titleTop={184}
      circles={circles}
      backTo="/passo-3"
      nextTo="/passo-5"
    >
      <div className="task-list">
        {options.map((option) => {
          const Icon = icons[option.icon]
          const isSelected = answers.tasks.includes(option.id)
          return (
            <button
              key={option.id}
              type="button"
              className="option option--row"
              aria-pressed={isSelected}
              onClick={() => toggleTask(option.id)}
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
