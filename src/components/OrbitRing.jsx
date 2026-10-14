import { useEffect, useRef, useState } from 'react'
import { icons } from '../data/icons.js'
import { buildGradient } from '../utils/gradient.js'

// One full turn of the ring, in seconds (same as the hardware rest screen).
export const ORBIT_SECONDS = 120

// The ring has 6 circles (some of them grey and empty) until more than 6 are filled;
// then it has one circle per filled option.
const BASE_COUNT = 6

// Resting position of each of the 6 base positions, as the offset of its center from the
// ring center, in Figma px (1440 frame). Position 0 is the circle on the left; positions
// go clockwise.
const BASE_OFFSETS = [
  { x: -137.78, y: 0 },
  { x: -67.54, y: -121.57 },
  { x: 70.24, y: -121.57 },
  { x: 137.78, y: 0 },
  { x: 70.24, y: 121.57 },
  { x: -67.54, y: 121.57 },
]

// Circles are placed by angle (degrees clockwise from the left of the ring) and radius, so
// when the ring changes they travel along it instead of cutting across it.
const toPolar = ({ x, y }) => ({
  phi: (((Math.atan2(-y, -x) * 180) / Math.PI) + 360) % 360,
  radius: Math.hypot(x, y),
})
const BASE_POLAR = BASE_OFFSETS.map(toPolar)

// Ring radius used when it has more than 6 circles: the mean radius of the Figma ring.
const RING_RADIUS = 139.08

// How long a removed circle takes to fade out before it is unmounted (matches the
// .slot__fill transition).
const EXIT_MS = 350

// Layout of the filled circles: Map(key -> { phi, radius, scale }).
//  - up to 6 circles: each one sits on its base position, full size;
//  - more than 6: evenly spaced around the ring, in clockwise order (base positions in
//    order, then the others in the order given), each circle scaled by 2 sin(pi / N) so
//    the gap-to-diameter proportion of the 6-circle ring is kept.
export function computeLayout(circles) {
  const layout = new Map()
  if (circles.length <= BASE_COUNT) {
    for (const circle of circles) {
      layout.set(circle.key, { ...BASE_POLAR[circle.position ?? 0], scale: 1 })
    }
    return layout
  }

  const n = circles.length
  const placed = circles
    .filter((c) => c.position !== undefined && c.position < BASE_COUNT)
    .sort((a, b) => a.position - b.position)
  const rest = circles.filter((c) => !placed.includes(c))
  const scale = 2 * Math.sin(Math.PI / n)
  ;[...placed, ...rest].forEach((circle, i) => {
    layout.set(circle.key, { phi: (360 * i) / n, radius: RING_RADIUS, scale })
  })
  return layout
}

function OrbitSlot({ variant, iconId, palette, late }) {
  // Keep showing the last icon while the circle fades out.
  const [shownIcon, setShownIcon] = useState(iconId)
  useEffect(() => {
    if (iconId) setShownIcon(iconId)
  }, [iconId])

  const Icon = shownIcon ? icons[shownIcon] : null
  const { backgroundImage, bleed } = buildGradient(palette, variant)

  return (
    <div className="slot">
      <div className="slot__fill" data-filled={Boolean(iconId)} data-late={late} aria-hidden="true">
        <div
          className="slot__gradient"
          style={{ backgroundImage, inset: `${-bleed * 100}%` }}
        />
        {Icon && (
          <span className="slot__icon">
            <Icon weight="regular" color="#fff" />
          </span>
        )}
      </div>
    </div>
  )
}

// A filled circle. It moves with its arm (translate), is resized by `scale`, and
// counter-rotates to stay upright.
function RingCircle({ circle, layout, leaving, animateIn, ringRef, palette }) {
  // A circle that mounts while the ring is already turning must start its counter-rotation
  // at the ring's current angle, otherwise its icon would be tilted.
  const [syncDelay] = useState(() => {
    const time = ringRef.current?.getAnimations()[0]?.currentTime
    return typeof time === 'number' ? -time : 0
  })

  // New circles start hidden and fade/scale in on the next frames.
  const [shown, setShown] = useState(!animateIn)
  useEffect(() => {
    if (shown) return undefined
    let inner
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [shown])

  return (
    <div
      className="ring__arm ring__arm--circle"
      data-key={circle.key}
      style={{ '--phi': layout.phi, '--radius': layout.radius }}
    >
      {/* undoes the rotation of the arm, so the circle itself is not turned by it */}
      <div className="ring__level">
        <div className="ring__counter" style={{ animationDelay: `${syncDelay}ms` }}>
          <div className="ring__scale" style={{ '--scale': layout.scale }}>
            <OrbitSlot
              variant={circle.variant}
              iconId={shown && !leaving ? circle.icon : null}
              palette={palette}
              late={circle.position === undefined}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// circles: the filled circles, [{ key, icon, variant, position }]:
//   key       stable identity (keeps the circle mounted while the ring changes)
//   icon      icon id shown in the circle
//   variant   index passed to the gradient function, so circles look different
//   position  base position 0-5 (clockwise from the left), undefined for the extra
//             circles that exist only when more than 6 are filled
// The ring shows 6 positions (empty ones grey) until more than 6 circles are filled.
export default function OrbitRing({ circles, palette }) {
  const ringRef = useRef(null)

  // Circles that mount during the first render are not animated in.
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
  }, [])

  // Keep removed circles mounted for a moment, frozen where they were, so they can fade out.
  // `order` is the render order of every mounted circle (current and leaving). It never
  // changes for a circle that stays mounted: moving a DOM node would cancel its transitions
  // and restart its animations.
  const signature = circles.map((c) => `${c.key}:${c.position}:${c.icon}`).join('|')
  const [previous, setPrevious] = useState({
    signature,
    circles,
    leaving: [],
    order: circles.map((c) => c.key),
  })
  if (previous.signature !== signature) {
    const keys = new Set(circles.map((c) => c.key))
    const lastLayout = computeLayout(previous.circles)
    const leaving = [
      ...previous.leaving.filter((l) => !keys.has(l.circle.key)),
      ...previous.circles
        .filter((c) => !keys.has(c.key))
        .map((circle) => ({ circle, layout: lastLayout.get(circle.key) })),
    ]
    const stillMounted = new Set([...keys, ...leaving.map((l) => l.circle.key)])
    const order = [
      ...previous.order.filter((key) => stillMounted.has(key)),
      ...circles.map((c) => c.key).filter((key) => !previous.order.includes(key)),
    ]
    setPrevious({ signature, circles, leaving, order })
  }
  const { leaving, order } = previous
  useEffect(() => {
    if (leaving.length === 0) return undefined
    const timer = setTimeout(
      () =>
        setPrevious((p) => ({
          ...p,
          leaving: [],
          order: p.order.filter((key) => p.circles.some((c) => c.key === key)),
        })),
      EXIT_MS + 50,
    )
    return () => clearTimeout(timer)
  }, [leaving])

  const layout = computeLayout(circles)
  const extended = circles.length > BASE_COUNT

  // (On the render that updates `previous` above, React discards this pass and renders again.)
  const items = order.flatMap((key) => {
    const circle = circles.find((c) => c.key === key)
    if (circle) return [{ circle, layout: layout.get(key), leaving: false }]
    const frozen = leaving.find((l) => l.circle.key === key)
    return frozen ? [{ circle: frozen.circle, layout: frozen.layout, leaving: true }] : []
  })

  return (
    <div ref={ringRef} className="ring" style={{ '--orbit-duration': `${ORBIT_SECONDS}s` }}>
      {BASE_OFFSETS.map((offset, i) => (
        <div key={`grey-${i}`} className="ring__arm ring__arm--grey" style={{ '--dx': offset.x, '--dy': offset.y }}>
          <div className="ring__grey" data-hidden={extended} />
        </div>
      ))}
      {items.map(({ circle, layout: itemLayout, leaving: isLeaving }) => (
        <RingCircle
          key={circle.key}
          circle={circle}
          layout={itemLayout}
          leaving={isLeaving}
          animateIn={mounted.current}
          ringRef={ringRef}
          palette={palette}
        />
      ))}
    </div>
  )
}
