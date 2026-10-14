import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { agents, DEFAULT_AGENT_ID } from '../data/agents.js'

const STORAGE_KEY = 'aiagent-onboarding:agent'

const AgentContext = createContext(null)

function readStoredId() {
  try {
    const id = sessionStorage.getItem(STORAGE_KEY)
    if (agents.some((agent) => agent.id === id)) return id
  } catch {
    // sessionStorage can be unavailable (private mode, blocked storage)
  }
  return DEFAULT_AGENT_ID
}

export function AgentProvider({ children }) {
  const [agentId, setAgentIdState] = useState(readStoredId)

  const setAgentId = useCallback((id) => {
    setAgentIdState(id)
    try {
      sessionStorage.setItem(STORAGE_KEY, id)
    } catch {
      // ignore: the in-memory state still works
    }
  }, [])

  const value = useMemo(() => ({ agentId, setAgentId }), [agentId, setAgentId])

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
}

export function useAgent() {
  const ctx = useContext(AgentContext)
  if (!ctx) throw new Error('useAgent must be used inside <AgentProvider>')
  return ctx
}
