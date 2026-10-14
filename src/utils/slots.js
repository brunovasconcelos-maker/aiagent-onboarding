// Orbit positions are numbered clockwise from the left:
// 0 left, 1 top-left, 2 top-right, 3 right, 4 bottom-right, 5 bottom-left.
// Circles are filled in this order (matches Figma).
export const FILL_ORDER = [0, 4, 2, 3, 1, 5]

// First position of FILL_ORDER that is not in `occupied` (a Set), or -1 if all are taken.
export function firstFreePosition(occupied) {
  const free = FILL_ORDER.find((position) => !occupied.has(position))
  return free === undefined ? -1 : free
}

// Gradient variants 0-5 belong to the base positions; extra circles use 6 and up.
export const BASE_VARIANTS = 6

// Smallest variant >= BASE_VARIANTS not used by `variants` (an array of numbers).
export function nextExtraVariant(variants) {
  let variant = BASE_VARIANTS
  while (variants.includes(variant)) variant += 1
  return variant
}
