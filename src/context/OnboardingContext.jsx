import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'aiagent-onboarding:answers'

const OnboardingContext = createContext(null)

function readStoredAnswers() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
    if (parsed && typeof parsed === 'object') return { purpose: parsed.purpose ?? null }
  } catch {
    // sessionStorage can be unavailable or hold invalid JSON
  }
  return { purpose: null }
}

export function OnboardingProvider({ children }) {
  const [answers, setAnswers] = useState(readStoredAnswers)

  const setAnswer = useCallback((key, value) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value }
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore: the in-memory state still works
      }
      return next
    })
  }, [])

  const value = useMemo(() => ({ answers, setAnswer }), [answers, setAnswer])

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>')
  return ctx
}
