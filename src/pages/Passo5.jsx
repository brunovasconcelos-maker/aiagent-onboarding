import StepLayout from '../components/StepLayout.jsx'
import { tools } from '../data/tools.js'
import { useOnboarding } from '../context/OnboardingContext.jsx'
import { buildCircles } from '../utils/circles.js'

export default function Passo5() {
  const { answers, toggleTool } = useOnboarding()

  return (
    <StepLayout
      titleLines={['Quais ferramentas você ', 'usa no seu dia a dia:']}
      titleTop={184}
      circles={buildCircles(answers)}
      backTo="/passo-4"
      nextTo="/passo-6"
      nextLabel="Confirmar"
    >
      <div className="purpose__grid">
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className="option"
            aria-pressed={answers.tools.includes(tool.id)}
            onClick={() => toggleTool(tool.id)}
          >
            <span className="option__tile option__tile--logo" aria-hidden="true">
              <img
                src={tool.logo}
                alt={tool.name}
                width={tool.size[0]}
                height={tool.size[1]}
                style={{ '--w': tool.size[0], '--h': tool.size[1] }}
              />
            </span>
            <span className="option__label">{tool.label ?? tool.name}</span>
          </button>
        ))}
      </div>
    </StepLayout>
  )
}
