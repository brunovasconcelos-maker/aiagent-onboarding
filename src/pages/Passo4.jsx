import StepLayout from '../components/StepLayout.jsx'
import { icons } from '../data/icons.js'
import { purposes } from '../data/purposes.js'
import { getTask, getTaskSet } from '../data/tasks.js'
import { useOnboarding } from '../context/OnboardingContext.jsx'
import { BASE_VARIANTS } from '../utils/slots.js'

export default function Passo4() {
  const { answers, toggleTask } = useOnboarding()

  const options = getTaskSet(answers.purpose)
  const purpose = purposes.find((p) => p.id === answers.purpose) ?? null

  // One circle per filled option, in selection order: the step 1 answer first, then each
  // selected option. Options with a base position (0-5) sit there; the ones selected
  // when all six were taken are extra circles, which make the ring grow.
  const circles = []
  if (purpose) circles.push({ key: 'purpose', icon: purpose.icon, variant: 0, position: 0 })
  for (const id of answers.tasks) {
    const task = getTask(id)
    if (!task) continue
    const position = answers.taskSlots[id]
    circles.push({
      key: id,
      icon: task.icon,
      variant: answers.taskVariants[id] ?? position ?? BASE_VARIANTS,
      position,
    })
  }

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
