// Spacing rules of the agent selector (/passo-2). Pure functions, no DOM: the page measures the
// logo, the title block and the button and passes the numbers in. All lengths are CSS pixels.

const MIN_GAP = 40 // minimum distance between consecutive blocks (not scaled)
const MAX_GAP_LOGO_TITLE = 80 // the logo-to-title gap never grows beyond this
const BUTTON_BOTTOM = 32 // the button is fixed this far from the bottom edge
const SIDE_MARGIN = 24 // minimum margin between the stage and the viewport sides
const MIN_SCALE = 0.4 // below this the stage stops shrinking and the gaps shrink instead
const FLOOR_GAP = 16 // minimum gap once the stage is at MIN_SCALE

// Vertical extent of the stage at scale 1 (circle diameter = CIRCLE px), measured from the
// highest visible point (circle top, top of the tallest character including its horns, top of
// the highest thumbnail ring) to the lowest (circle bottom, bottom of the lowest ring).
// Computed once as the maximum over the agents, so the layout never moves when the selected
// agent changes. Agent rects are in % of the circle; thumbnails are in the 1440x928 Figma frame.
export const CIRCLE = 480
const FRAME_CIRCLE_TOP = 254 // y of the circle in the Figma frame
const THUMB = 80
const RING_BLEED = 5 // the black ring sticks out of the thumbnail by this much
const NAMES_RIGHT = 1360 - 720 // the name column ends here, from the circle center (Figma px)
const THUMBS_LEFT = (agents) => Math.max(...agents.map((a) => 720 - (a.thumbnail.x - RING_BLEED)))

export function measureStage(agents) {
  let top = 0
  let bottom = CIRCLE
  for (const agent of agents) {
    // visible part of the character: its image clipped by its frame
    const { characterFrame: f, characterImage: i } = agent
    top = Math.min(top, (Math.max(f.y, i.y) / 100) * CIRCLE)
    bottom = Math.max(bottom, (Math.min(f.y + f.h, i.y + i.h) / 100) * CIRCLE)
    const ringTop = agent.thumbnail.y - RING_BLEED - FRAME_CIRCLE_TOP
    top = Math.min(top, ringTop)
    bottom = Math.max(bottom, ringTop + THUMB + 2 * RING_BLEED)
  }
  return {
    top, // <= 0: how far the stage reaches above the circle (Figma px)
    height: bottom - top, // S0
    halfWidth: Math.max(THUMBS_LEFT(agents), NAMES_RIGHT), // from the circle center
  }
}

// Inputs: viewportWidth/Height, logoBottom (Lb), titleHeight (T), buttonHeight (Bh),
// stageHeight (S0), stageHalfWidth.
// Returns the scale u of the stage, the three gaps, and the tops of the title block and stage.
export function computeLayout({
  viewportWidth,
  viewportHeight,
  logoBottom,
  titleHeight,
  buttonHeight,
  stageHeight,
  stageHalfWidth,
}) {
  const free = viewportHeight - logoBottom - titleHeight - (buttonHeight + BUTTON_BOTTOM)
  const uHeight = (free - 3 * MIN_GAP) / stageHeight
  const uWidth = (viewportWidth / 2 - SIDE_MARGIN) / stageHalfWidth
  let u = Math.min(uHeight, uWidth, 1)

  let gapLogoTitle
  let gapTitleStage
  let gapStageButton
  let floor = false
  if (u >= MIN_SCALE) {
    const extra = Math.max(0, free - u * stageHeight - 3 * MIN_GAP)
    gapLogoTitle = MIN_GAP + Math.min(extra, MAX_GAP_LOGO_TITLE - MIN_GAP)
    const remaining = extra - (gapLogoTitle - MIN_GAP)
    gapTitleStage = gapStageButton = MIN_GAP + remaining / 2
  } else {
    // the stage stays at MIN_SCALE; the three gaps share what is left, down to FLOOR_GAP
    floor = true
    u = MIN_SCALE
    const gap = Math.max(FLOOR_GAP, (free - u * stageHeight) / 3)
    gapLogoTitle = gapTitleStage = gapStageButton = gap
  }

  const titleTop = logoBottom + gapLogoTitle
  const stageTop = titleTop + titleHeight + gapTitleStage
  return { u, gapLogoTitle, gapTitleStage, gapStageButton, titleTop, stageTop, floor }
}
