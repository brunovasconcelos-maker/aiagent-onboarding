import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { firstFreePosition } from '../utils/slots.js'

const STORAGE_KEY = 'aiagent-onboarding:answers'

const EMPTY_ANSWERS = { purpose: null, tasks: [], taskSlots: {} }

const OnboardingContext = createContext(null)

function readStoredAnswers() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
    if (parsed && typeof parsed === 'object') {
      return {
        purpose: parsed.purpose ?? null,
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        taskSlots: parsed.taskSlots && typeof parsed.taskSlots === 'object' ? parsed.taskSlots : {},
      }
    }
  } catch {
    // sessionStorage can be unavailable or hold invalid JSON
  }
  return EMPTY_ANSWERS
}

function persist(answers) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
  } catch {
    // ignore: the in-memory state still works
  }
}

// First free orbit position for a newly selected task, or undefined when all six are
// taken. Position 0 belongs to the step 1 answer when there is one.
function freePositionFor(answers) {
  const occupied = new Set(answers.purpose ? [0] : [])
  for (const position of Object.values(answers.taskSlots)) occupied.add(position)
  const position = firstFreePosition(occupied)
  return position === -1 ? undefined : position
}

export function OnboardingProvider({ children }) {
  const [answers, setAnswers] = useState(readStoredAnswers)

  const update = useCallback((compute) => {
    setAnswers((prev) => {
      const next = compute(prev)
      if (next !== prev) persist(next)
      return next
    })
  }, [])

  // Changing the purpose changes the step 2 options, so the chosen tasks are cleared.
  const setAnswer = useCallback(
    (key, value) =>
      update((prev) => {
        if (prev[key] === value) return prev
        const next = { ...prev, [key]: value }
        return key === 'purpose' ? { ...next, tasks: [], taskSlots: {} } : next
      }),
    [update],
  )

  // Selects or deselects a step 2 option. `tasks` keeps the selection order.
  const toggleTask = useCallback(
    (id) =>
      update((prev) => {
        // Deselecting frees the option's position; the others keep theirs.
        if (prev.tasks.includes(id)) {
          const { [id]: _removed, ...taskSlots } = prev.taskSlots
          return { ...prev, tasks: prev.tasks.filter((t) => t !== id), taskSlots }
        }
        const position = freePositionFor(prev)
        const taskSlots = position === undefined ? prev.taskSlots : { ...prev.taskSlots, [id]: position }
        return { ...prev, tasks: [...prev.tasks, id], taskSlots }
      }),
    [update],
  )

  const value = useMemo(() => ({ answers, setAnswer, toggleTask }), [answers, setAnswer, toggleTask])

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>')
  return ctx
}
