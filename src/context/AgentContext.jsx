import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { DEFAULT_AGENT_ID } from '../data/agents.js'

const AgentContext = createContext(null)

// The selected agent lives in memory only: a reload starts over from the first page.
export function AgentProvider({ children }) {
  const [agentId, setAgentId] = useState(DEFAULT_AGENT_ID)

  const resetAgent = useCallback(() => setAgentId(DEFAULT_AGENT_ID), [])

  const value = useMemo(() => ({ agentId, setAgentId, resetAgent }), [agentId, resetAgent])

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
}

export function useAgent() {
  const ctx = useContext(AgentContext)
  if (!ctx) throw new Error('useAgent must be used inside <AgentProvider>')
  return ctx
}
