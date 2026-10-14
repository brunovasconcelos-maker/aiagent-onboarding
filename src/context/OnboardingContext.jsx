import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { firstFreePosition, nextExtraVariant } from '../utils/slots.js'

const STORAGE_KEY = 'aiagent-onboarding:answers'

const EMPTY_ANSWERS = { purpose: null, tasks: [], taskSlots: {}, taskVariants: {} }

const OnboardingContext = createContext(null)

function readStoredAnswers() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
    if (parsed && typeof parsed === 'object') {
      return {
        purpose: parsed.purpose ?? null,
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        taskSlots: parsed.taskSlots && typeof parsed.taskSlots === 'object' ? parsed.taskSlots : {},
        taskVariants:
          parsed.taskVariants && typeof parsed.taskVariants === 'object' ? parsed.taskVariants : {},
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

const BASE_POSITIONS = 6

const filledCount = (answers) => (answers.purpose ? 1 : 0) + answers.tasks.length

// Base positions (0-5) in use. Position 0 belongs to the step 1 answer when there is one.
function occupiedPositions(answers) {
  const occupied = new Set(answers.purpose ? [0] : [])
  for (const position of Object.values(answers.taskSlots)) occupied.add(position)
  return occupied
}

// When a deselect leaves exactly six circles, the ring goes back to its six base positions:
// the remaining options close the gap and take positions 0-5 in clockwise order (base
// positions first, then the extra circles in selection order), so each one moves at most
// about one slot. Position 0 stays with the step 1 answer when there is one.
function closeGaps(answers) {
  if (filledCount(answers) !== BASE_POSITIONS) return answers
  const placed = answers.tasks
    .filter((id) => answers.taskSlots[id] !== undefined)
    .sort((a, b) => answers.taskSlots[a] - answers.taskSlots[b])
  const extras = answers.tasks.filter((id) => answers.taskSlots[id] === undefined)
  const taskSlots = {}
  ;[...placed, ...extras].forEach((id, i) => {
    taskSlots[id] = (answers.purpose ? 1 : 0) + i
  })
  return { ...answers, taskSlots }
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
        return key === 'purpose' ? { ...next, tasks: [], taskSlots: {}, taskVariants: {} } : next
      }),
    [update],
  )

  // Selects or deselects a step 2 option. `tasks` keeps the selection order.
  //  - taskSlots: the base position (0-5) of each option that has one;
  //  - taskVariants: gradient variant of each option, kept while it stays selected.
  // With fewer than six filled circles a new option takes the first free position
  // (fill order); otherwise it becomes an extra circle and the ring grows.
  const toggleTask = useCallback(
    (id) =>
      update((prev) => {
        if (prev.tasks.includes(id)) {
          const { [id]: _slot, ...taskSlots } = prev.taskSlots
          const { [id]: _variant, ...taskVariants } = prev.taskVariants
          return closeGaps({ ...prev, tasks: prev.tasks.filter((t) => t !== id), taskSlots, taskVariants })
        }
        const position =
          filledCount(prev) < BASE_POSITIONS ? firstFreePosition(occupiedPositions(prev)) : undefined
        const variant = position ?? nextExtraVariant(Object.values(prev.taskVariants))
        return {
          ...prev,
          tasks: [...prev.tasks, id],
          taskSlots: position === undefined ? prev.taskSlots : { ...prev.taskSlots, [id]: position },
          taskVariants: { ...prev.taskVariants, [id]: variant },
        }
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
