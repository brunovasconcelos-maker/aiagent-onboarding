import { Link } from 'react-router-dom'
import logo from '../assets/logos/Logo.svg'
import { useOnboarding } from '../context/OnboardingContext.jsx'

export default function Header() {
  const { reset } = useOnboarding()

  // Back to the first page with everything reset (the page that was open, and any animation
  // on it, goes away with the navigation).
  return (
    <header className="header">
      <Link to="/" className="header__logo" aria-label="Inner AI, voltar ao início" onClick={reset}>
        <img src={logo} alt="Inner AI" width={103.656} height={24} />
      </Link>
    </header>
  )
}
