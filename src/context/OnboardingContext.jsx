import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { firstFreePosition, nextExtraVariant } from '../utils/slots.js'

const STORAGE_KEY = 'aiagent-onboarding:answers'

const EMPTY_ANSWERS = {
  purpose: null,
  tasks: [],
  tools: [],
  order: [],
  taskSlots: {},
  taskVariants: {},
}

const OnboardingContext = createContext(null)

const asArray = (value) => (Array.isArray(value) ? value : [])
const asObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {})

function readStoredAnswers() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
    if (parsed && typeof parsed === 'object') {
      const tasks = asArray(parsed.tasks)
      const tools = asArray(parsed.tools)
      return {
        purpose: parsed.purpose ?? null,
        tasks,
        tools,
        order: Array.isArray(parsed.order) ? parsed.order : [...tasks, ...tools],
        taskSlots: asObject(parsed.taskSlots),
        taskVariants: asObject(parsed.taskVariants),
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

// Orbit circles are the step 1 answer plus every selected option and tool (`order` keeps
// their selection order across steps; `taskSlots` has the base position 0-5 of those that
// have one, `taskVariants` their gradient variant).
const filledCount = (answers) => (answers.purpose ? 1 : 0) + answers.order.length

// Base positions in use. Position 0 belongs to the step 1 answer when there is one.
function occupiedPositions(answers) {
  const occupied = new Set(answers.purpose ? [0] : [])
  for (const position of Object.values(answers.taskSlots)) occupied.add(position)
  return occupied
}

const without = (object, ids) => Object.fromEntries(Object.entries(object).filter(([id]) => !ids.includes(id)))

// When a change leaves exactly six circles, the ring goes back to its six base positions:
// the remaining circles close the gap and take positions 0-5 in clockwise order (base
// positions first, then the extra circles in selection order), so each one moves at most
// about one slot. Position 0 stays with the step 1 answer when there is one.
function closeGaps(answers) {
  if (filledCount(answers) !== BASE_POSITIONS) return answers
  const placed = answers.order
    .filter((id) => answers.taskSlots[id] !== undefined)
    .sort((a, b) => answers.taskSlots[a] - answers.taskSlots[b])
  const extras = answers.order.filter((id) => answers.taskSlots[id] === undefined)
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
  // The tools (step 3) stay. A new step 1 answer takes position 0, so whichever circle sat
  // there moves to the first free position (or becomes an extra circle).
  const setAnswer = useCallback(
    (key, value) =>
      update((prev) => {
        if (prev[key] === value) return prev
        let next = { ...prev, [key]: value }
        if (key !== 'purpose') return next

        next = {
          ...next,
          tasks: [],
          order: prev.order.filter((id) => !prev.tasks.includes(id)),
          taskSlots: without(prev.taskSlots, prev.tasks),
          taskVariants: without(prev.taskVariants, prev.tasks),
        }
        if (value && !prev.purpose) {
          const occupant = next.order.find((id) => next.taskSlots[id] === 0)
          if (occupant) {
            const others = without(next.taskSlots, [occupant])
            const taken = new Set([0, ...Object.values(others)])
            const position = firstFreePosition(taken)
            next = { ...next, taskSlots: position === -1 ? others : { ...others, [occupant]: position } }
          }
        }
        return closeGaps(next)
      }),
    [update],
  )

  // Selects or deselects an option (step 2, list `tasks`) or a tool (step 3, list `tools`).
  // Each list keeps its own selection order; `order` keeps the order across both.
  // With fewer than six filled circles a new item takes the first free position (fill
  // order); otherwise it becomes an extra circle and the ring grows.
  const toggleItem = useCallback(
    (list, id) =>
      update((prev) => {
        if (prev[list].includes(id)) {
          return closeGaps({
            ...prev,
            [list]: prev[list].filter((item) => item !== id),
            order: prev.order.filter((item) => item !== id),
            taskSlots: without(prev.taskSlots, [id]),
            taskVariants: without(prev.taskVariants, [id]),
          })
        }
        const position =
          filledCount(prev) < BASE_POSITIONS ? firstFreePosition(occupiedPositions(prev)) : undefined
        const variant = position ?? nextExtraVariant(Object.values(prev.taskVariants))
        return {
          ...prev,
          [list]: [...prev[list], id],
          order: [...prev.order, id],
          taskSlots: position === undefined ? prev.taskSlots : { ...prev.taskSlots, [id]: position },
          taskVariants: { ...prev.taskVariants, [id]: variant },
        }
      }),
    [update],
  )

  const toggleTask = useCallback((id) => toggleItem('tasks', id), [toggleItem])
  const toggleTool = useCallback((id) => toggleItem('tools', id), [toggleItem])

  const value = useMemo(
    () => ({ answers, setAnswer, toggleTask, toggleTool }),
    [answers, setAnswer, toggleTask, toggleTool],
  )

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>')
  return ctx
}
