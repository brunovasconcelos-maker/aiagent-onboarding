import { useEffect, useState } from 'react'
import { icons } from '../data/icons.js'
import { buildGradient } from '../utils/gradient.js'

// One full turn of the ring, in seconds (same as the hardware rest screen).
export const ORBIT_SECONDS = 120

// Resting position of each slot, as the offset of its center from the ring center,
// in Figma px (1440 frame). Slot 0 is the circle on the left; slots go clockwise.
const SLOT_OFFSETS = [
  { x: -137.78, y: 0 },
  { x: -67.54, y: -121.57 },
  { x: 70.24, y: -121.57 },
  { x: 137.78, y: 0 },
  { x: 70.24, y: 121.57 },
  { x: -67.54, y: 121.57 },
]

function OrbitSlot({ index, iconId, palette }) {
  // Keep showing the last icon while the circle fades out.
  const [shownIcon, setShownIcon] = useState(iconId)
  useEffect(() => {
    if (iconId) setShownIcon(iconId)
  }, [iconId])

  const Icon = shownIcon ? icons[shownIcon] : null
  const { backgroundImage, bleed } = buildGradient(palette, index)

  return (
    <div className="slot">
      <div className="slot__fill" data-filled={Boolean(iconId)} aria-hidden="true">
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

// slots: array of 6 entries, each an icon id or null (empty = grey circle).
export default function OrbitRing({ slots, palette }) {
  return (
    <div className="ring" style={{ '--orbit-duration': `${ORBIT_SECONDS}s` }}>
      {SLOT_OFFSETS.map((offset, index) => (
        <div key={index} className="ring__arm" style={{ '--dx': offset.x, '--dy': offset.y }}>
          <div className="ring__counter">
            <OrbitSlot index={index} iconId={slots[index] ?? null} palette={palette} />
          </div>
        </div>
      ))}
    </div>
  )
}
