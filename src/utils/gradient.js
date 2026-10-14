// Builds the layered CSS gradient of a filled orbit circle from an agent palette.
//
// The layers are drawn on a box that is larger than the circle (BLEED on each side)
// so the blur applied to it never fades at the circle edge. All positions below are
// fractions of the circle diameter, with (0, 0) at its top-left corner.

const BLEED = 0.15
const BASE_GAMMA = 1.9
const LIGHT_THRESHOLD = 0.66 // mean base luminance above which the icon needs a darker backdrop

const rad = (deg) => (deg * Math.PI) / 180
const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const rgba = (hex, alpha) => `rgba(${hexToRgb(hex).join(',')},${alpha})`
const toBox = (v) => ((v + BLEED) / (1 + 2 * BLEED)) * 100
const sizeToBox = (v) => (v / (1 + 2 * BLEED)) * 100

// Point at distance r from the circle center, angle in degrees clockwise from the top.
const polar = (deg, r) => ({ x: 0.5 + r * Math.sin(rad(deg)), y: 0.5 - r * Math.cos(rad(deg)) })

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function mix(a, b, t) {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const c = (x, y) => Math.round(x + (y - x) * t)
  return '#' + [c(ar, br), c(ag, bg), c(ab, bb)].map((v) => v.toString(16).padStart(2, '0')).join('')
}

// Color of the base gradient at its middle (where the icon sits).
function baseMiddle(base) {
  const pos = (base.length - 1) / 2
  const i = Math.floor(pos)
  return i === pos ? base[i] : mix(base[i], base[i + 1], pos - i)
}

function blob(color, center, size, alpha) {
  const s = sizeToBox(size)
  return (
    `radial-gradient(ellipse ${s}% ${s}% at ${toBox(center.x)}% ${toBox(center.y)}%, ` +
    `${rgba(color, alpha)} 0%, ${rgba(color, alpha * 0.5)} 40%, ${rgba(color, 0)} 100%)`
  )
}

// slotIndex changes the base angle and where the depth and accent areas sit.
export function buildGradient(palette, slotIndex) {
  const { base, depth, accent } = palette
  const layers = []

  // Darker area behind the white icon when the palette is light.
  const lightPalette = luminance(baseMiddle(base)) > LIGHT_THRESHOLD
  if (lightPalette) layers.push(blob(depth[0], { x: 0.5, y: 0.5 }, 0.42, 0.45))

  // One accent per circle, up to ~30% of the diameter.
  const accentColor = accent[slotIndex % accent.length]
  layers.push(blob(accentColor, polar(141 + slotIndex * 57, 0.35), 0.3, 1))

  // Depth areas, up to ~35% of the diameter, kept away from the circle edge.
  // The last color sits at the main depth position, the others follow around it.
  depth.forEach((color, i) => {
    const order = depth.length - 1 - i
    const angle = -50 + slotIndex * 64 + order * 107.5
    layers.push(
      order === 0
        ? blob(color, polar(angle, 0.36), 0.26, 0.7)
        : blob(color, polar(angle, 0.24), 0.35, 0.7),
    )
  })

  // Base colors, spaced unevenly so the lightest ones fill the far side of the circle.
  const stops = base.map((c, i) => `${c} ${Math.round(((i / (base.length - 1)) ** BASE_GAMMA) * 100)}%`)
  layers.push(`linear-gradient(${(180 + slotIndex * 60) % 360}deg, ${stops.join(', ')})`)

  return { backgroundImage: layers.join(', '), bleed: BLEED, lightPalette }
}
