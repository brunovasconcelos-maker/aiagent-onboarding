import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useAgent } from './AgentContext.jsx'
import { orbitStore } from '../utils/orbitStore.js'
import { firstFreePosition, nextExtraVariant } from '../utils/slots.js'

const EMPTY_ANSWERS = {
  purpose: null,
  tasks: [],
  tools: [],
  order: [],
  taskSlots: {},
  taskVariants: {},
}

const OnboardingContext = createContext(null)

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
  // Everything lives in memory only (nothing is saved in the browser): a reload starts over
  // from the first page. `started` is true once the user clicks "Começar" on the first page;
  // every other route sends the user back to "/" until then.
  const [answers, setAnswers] = useState(EMPTY_ANSWERS)
  const [started, setStarted] = useState(false)
  // Phase of the creation sequence (null | creating | merging | done), set by the creation page
  // and read by the persistent orbit.
  const [creationPhase, setCreationPhase] = useState(null)
  const { resetAgent } = useAgent()

  const update = useCallback((compute) => setAnswers(compute), [])

  const start = useCallback(() => setStarted(true), [])

  // Back to the very beginning: default agent, no answers, not started.
  const reset = useCallback(() => {
    setAnswers(EMPTY_ANSWERS)
    setStarted(false)
    setCreationPhase(null)
    orbitStore.reset()
    resetAgent()
  }, [resetAgent])

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
    () => ({ answers, setAnswer, toggleTask, toggleTool, started, start, reset, creationPhase, setCreationPhase }),
    [answers, setAnswer, toggleTask, toggleTool, started, start, reset, creationPhase],
  )

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>')
  return ctx
}
