import { purposes } from '../data/purposes.js'
import { getTask } from '../data/tasks.js'
import { getTool } from '../data/tools.js'
import { BASE_VARIANTS } from './slots.js'

// One orbit circle per filled answer, in selection order: the step 1 answer first, then
// every selected option (step 2) and tool (step 3), in the order they were selected.
// Circles with a base position (0-5) sit there; the ones selected when all six were taken
// have no position and are the extra circles that make the ring grow (see OrbitRing).
export function buildCircles(answers) {
  const circles = []

  const purpose = purposes.find((p) => p.id === answers.purpose)
  if (purpose) circles.push({ key: 'purpose', icon: purpose.icon, variant: 0, position: 0 })

  for (const id of answers.order) {
    const task = getTask(id)
    const tool = task ? null : getTool(id)
    if (!task && !tool) continue
    const position = answers.taskSlots[id]
    circles.push({
      key: id,
      ...(task
        ? { icon: task.icon }
        : { logo: { src: tool.logo, name: tool.name, width: tool.orbit[0], height: tool.orbit[1] } }),
      variant: answers.taskVariants[id] ?? position ?? BASE_VARIANTS,
      position,
    })
  }

  return circles
}
