import StepLayout from '../components/StepLayout.jsx'
import { icons } from '../data/icons.js'
import { purposes } from '../data/purposes.js'
import { getTask, getTaskSet } from '../data/tasks.js'
import { useOnboarding } from '../context/OnboardingContext.jsx'

export default function Passo4() {
  const { answers, toggleTask } = useOnboarding()

  const options = getTaskSet(answers.purpose)
  const purpose = purposes.find((p) => p.id === answers.purpose) ?? null

  // One orbit position per circle: the step 1 answer at 0, each selected option at the
  // position it was given (see OnboardingContext). Selected options with no free
  // position (more than 6 circles) have no circle yet.
  const slots = [purpose ? purpose.icon : null, null, null, null, null, null]
  for (const id of answers.tasks) {
    const position = answers.taskSlots[id]
    const task = getTask(id)
    if (position !== undefined && task) slots[position] = task.icon
  }

  return (
    <StepLayout
      titleLines={['Onde você mais quer', 'minha ajuda?']}
      titleTop={184}
      slots={slots}
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
