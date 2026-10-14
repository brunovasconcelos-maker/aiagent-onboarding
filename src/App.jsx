import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { AgentProvider } from './context/AgentContext.jsx'
import Home from './pages/Home.jsx'
import Passo2 from './pages/Passo2.jsx'
import Passo3 from './pages/Passo3.jsx'

export default function App() {
  return (
    <AgentProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/passo-2" element={<Passo2 />} />
          <Route path="/passo-3" element={<Passo3 />} />
        </Route>
      </Routes>
    </AgentProvider>
  )
}
