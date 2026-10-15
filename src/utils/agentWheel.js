// The hidden wheel of the agent selector (/passo-2). The four scene circles sit on a big wheel
// whose center is below the main circle; the selected one is at the top (the main position).
// Changing agent turns the wheel. Everything on the wheel is rendered inside a round window (the
// main circle, clipped with clip-path), so nothing of it is seen outside the circle. ONE wheel
// position drives everything (written to the CSS variable --wheel-angle); the transforms are
// derived from it in CSS. The character copies that stick out above the circle (Rubi's horns)
// live outside the window and are faded by this file.

export const WHEEL = {
  radius: 890, // Figma px at the 1440px reference, scaled by the stage scale u in CSS
  stepDeg: 32, // angular distance between two agents: neighbors are fully outside the window
  forward: { baseMs: 750, perExtraStepMs: 220, settleDeg: 0.75 }, // settle: tiny overshoot
  backward: { baseMs: 450, perStepMs: 80 }, // 450ms plus 80ms per step passed
  ease: [0.65, 0, 0.35, 1], // cubic-bezier of the turn
  nameOutMs: 150, // the old name fades out when the change starts
  nameInMs: 250, // the new name fades in during the last nameInMs of the turn
  overflowOutMs: 120, // the overflow copy of the character fades out when a change starts
  overflowInMs: 200, // and fades in right after the new agent settles
  reducedFadeMs: 200, // prefers-reduced-motion: plain crossfade
}

// cubic-bezier easing (same math as CSS)
function makeBezier([x1, y1, x2, y2]) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t) => ((ay * t + by) * t + cy) * t
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x
      if (Math.abs(err) < 1e-6) return sampleY(t)
      const d = (3 * ax * t + 2 * bx) * t + cx
      if (Math.abs(d) < 1e-6) break
      t -= err / d
    }
    let lo = 0
    let hi = 1
    t = x
    for (let i = 0; i < 24; i++) {
      const v = sampleX(t)
      if (Math.abs(v - x) < 1e-6) break
      if (v < x) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return sampleY(t)
  }
}
const ease = makeBezier(WHEEL.ease)

// Duration of a turn over `steps` steps, forward or backward.
export function durationMs(steps, forward) {
  if (!forward) return Math.max(250, WHEEL.backward.baseMs + WHEEL.backward.perStepMs * steps)
  const { baseMs, perExtraStepMs } = WHEEL.forward // forward: 750ms for one step plus 220ms per extra step
  return Math.max(250, steps >= 1 ? baseMs + perExtraStepMs * (steps - 1) : baseMs * steps)
}

// Wheel position (in steps, fractional) `t` (0-1) of the way from `from` to `to`.
export function positionAt(from, to, t) {
  const forward = to > from
  let p = from + (to - from) * ease(t)
  if (forward) {
    // a very subtle settle: a small hump of settleDeg right before the end
    const s = Math.min(1, Math.max(0, (t - 0.82) / 0.18))
    p += (WHEEL.forward.settleDeg / WHEEL.stepDeg) * Math.sin(Math.PI * s)
  }
  return p
}

// Drives the DOM: `root` gets --wheel-angle, `groups[i]` and `names[i]` get their opacity.
// One requestAnimationFrame loop, only while something moves.
export function createWheel({ root, groups, names, overflows, index }) {
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  let pos = index
  let target = index
  let anim = null
  let frame = 0
  let last = 0
  const nameOpacity = names.map((_, i) => (i === index ? 1 : 0))
  // Circles are fully opaque (the window hides what is outside it); only the reduced-motion
  // crossfade uses their opacity.
  const groupOpacity = groups.map((_, i) => (reducedQuery.matches ? (i === index ? 1 : 0) : 1))
  const overflowOpacity = overflows.map((_, i) => (i === index ? 1 : 0))

  const write = () => {
    root.style.setProperty('--wheel-angle', String(pos * WHEEL.stepDeg))
    groups.forEach((el, i) => {
      el.style.opacity = String(groupOpacity[i])
    })
    names.forEach((el, i) => {
      el.style.opacity = String(nameOpacity[i])
    })
    overflows.forEach((el, i) => {
      el.style.opacity = String(overflowOpacity[i])
    })
  }

  const approach = (value, goal, perMs, dt) =>
    goal > value ? Math.min(goal, value + perMs * dt) : Math.max(goal, value - perMs * dt)

  const tick = (now) => {
    frame = 0
    const dt = Math.min(now - last, 100)
    last = now
    const reduced = reducedQuery.matches
    let remaining = 0
    if (anim) {
      const t = Math.min(1, (now - anim.start) / anim.dur)
      pos = positionAt(anim.from, anim.to, t)
      remaining = anim.dur * (1 - t)
      if (t >= 1) {
        pos = anim.to
        anim = null
      }
    }
    let settled = anim === null
    names.forEach((_, i) => {
      const goal = i === target && (!anim || remaining <= WHEEL.nameInMs) ? 1 : 0
      const perMs = reduced ? 1 / WHEEL.reducedFadeMs : goal === 1 ? 1 / WHEEL.nameInMs : 1 / WHEEL.nameOutMs
      nameOpacity[i] = approach(nameOpacity[i], goal, perMs, dt)
      if (nameOpacity[i] !== goal) settled = false
    })
    groups.forEach((_, i) => {
      if (reduced) {
        groupOpacity[i] = approach(groupOpacity[i], i === target ? 1 : 0, 1 / WHEEL.reducedFadeMs, dt)
        if (groupOpacity[i] !== (i === target ? 1 : 0)) settled = false
      } else {
        groupOpacity[i] = 1
      }
    })
    // overflow copies: only the selected one at rest; all fade out while the wheel turns
    overflows.forEach((_, i) => {
      const goal = i === target && !anim ? 1 : 0
      const perMs = reduced ? 1 / WHEEL.reducedFadeMs : goal === 1 ? 1 / WHEEL.overflowInMs : 1 / WHEEL.overflowOutMs
      overflowOpacity[i] = approach(overflowOpacity[i], goal, perMs, dt)
      if (overflowOpacity[i] !== goal) settled = false
    })
    write()
    if (settled) markRest()
    else frame = requestAnimationFrame(tick)
  }

  // data-top marks the group at the top while the wheel is at rest (it gets no transform)
  const markRest = () => {
    root.dataset.moving = 'false'
    groups.forEach((el, i) => {
      el.dataset.top = String(i === target)
    })
  }

  const run = () => {
    root.dataset.moving = 'true'
    groups.forEach((el) => {
      el.dataset.top = 'false'
    })
    if (!frame) {
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }
  }

  write()
  markRest()
  return {
    // Retargets from wherever the wheel is now: no jump, nothing queued.
    setTarget(next) {
      if (next === target) return
      target = next
      if (reducedQuery.matches) {
        anim = null
        pos = next
      } else {
        const forward = next > pos
        anim = { from: pos, to: next, start: performance.now(), dur: durationMs(Math.abs(next - pos), forward) }
      }
      run()
    },
    destroy() {
      cancelAnimationFrame(frame)
      frame = 0
    },
  }
}
