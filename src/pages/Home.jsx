import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext.jsx'
import OrbIntro from '../components/OrbIntro.jsx'

export default function Home() {
  const { reset, start } = useOnboarding()

  // Visiting the first page always starts over (also when arriving with the back button).
  useEffect(() => {
    reset()
  }, [reset])

  return (
    <main className="home">
      <div className="home__content">
        <div className="stage">
          <OrbIntro />
        </div>

        <div className="copy">
          <p className="copy__label">Chegou Inner Agents</p>
          <h1 className="copy__title">
            <span>Quatro agentes.</span>
            <span>Um deles vai ser o seu.</span>
          </h1>
        </div>

        <Link to="/passo-2" className="btn" onClick={start}>
          Começar
        </Link>
      </div>
    </main>
  )
}
