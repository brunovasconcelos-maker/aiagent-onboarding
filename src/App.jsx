import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { AgentProvider } from './context/AgentContext.jsx'
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext.jsx'
import Home from './pages/Home.jsx'
import Passo2 from './pages/Passo2.jsx'
import Passo3 from './pages/Passo3.jsx'
import Passo4 from './pages/Passo4.jsx'
import Passo5 from './pages/Passo5.jsx'
import Passo6 from './pages/Passo6.jsx'
import Passo7 from './pages/Passo7.jsx'

// Every route but "/" needs the user to have started on the first page: the state is only in
// memory, so after a reload (or a typed address) the app goes back to "/".
function RequireStarted() {
  const { started } = useOnboarding()
  return started ? <Outlet /> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AgentProvider>
      <OnboardingProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route element={<RequireStarted />}>
              <Route path="/passo-2" element={<Passo2 />} />
              <Route path="/passo-3" element={<Passo3 />} />
              <Route path="/passo-4" element={<Passo4 />} />
              <Route path="/passo-5" element={<Passo5 />} />
              <Route path="/passo-6" element={<Passo6 />} />
              <Route path="/passo-7" element={<Passo7 />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </OnboardingProvider>
    </AgentProvider>
  )
}
