import poliCharacter from '../assets/characters/Poli.png'
import roccoCharacter from '../assets/characters/Rocco.png'
import rubiCharacter from '../assets/characters/Rubi.png'
import trisCharacter from '../assets/characters/Tris.png'
import poliScene from '../assets/characters/Poli-Cenario.png'
import roccoScene from '../assets/characters/Rocco-Cenario.png'
import rubiScene from '../assets/characters/Rubi-Cenario.png'
import trisScene from '../assets/characters/Tris-Cenario.png'

// All rects are in % of the big circle (480px in Figma), x/y from the circle's top-left.
//   sceneImage: the scene image positioned inside the circle (the circle clips it)
//   characterFrame: the Figma frame that holds (and clips) the character image
//   characterImage: the character image itself, positioned relative to the circle
// thumbnail.crop: [size, left, top] in % of the 80px thumbnail circle.
// thumbnail.y: top of the thumbnail in the 1440x928 Figma frame (x depends on the arc).
export const agents = [
  {
    id: 'poli',
    name: 'Poli',
    color: '#68ADD2',
    scene: poliScene,
    sceneImage: { x: -27.586, y: 0, w: 155.172, h: 100 },
    character: poliCharacter,
    characterFrame: { x: 12.5, y: 3.958, w: 75, h: 75 },
    characterImage: { x: 16.295, y: 14.143, w: 67.403, h: 67.403 },
    thumbnail: { src: poliCharacter, x: 400, y: 251, crop: [133.75, -16.88, -1.88] },
  },
  {
    id: 'rocco',
    name: 'Rocco',
    color: '#C2D09F',
    scene: roccoScene,
    sceneImage: { x: -27.586, y: 0, w: 155.172, h: 100 },
    character: roccoCharacter,
    characterFrame: { x: 18.125, y: 13.125, w: 65.417, h: 65.417 },
    characterImage: { x: 12.839, y: 6.78, w: 75.988, h: 75.988 },
    thumbnail: { src: roccoCharacter, x: 351, y: 347, crop: [137.5, -18.75, 3.75] },
  },
  {
    id: 'rubi',
    name: 'Rubi',
    color: '#EB684A',
    scene: rubiScene,
    sceneImage: { x: -63.54, y: -33.75, w: 227.33, h: 146.5 },
    character: rubiCharacter,
    characterFrame: { x: 6.042, y: -5, w: 90, h: 85 },
    characterImage: { x: 6.042, y: -9.998, w: 90, h: 89.998 },
    thumbnail: { src: rubiCharacter, x: 334, y: 454, crop: [139.37, -20, 3.12] },
  },
  {
    id: 'tris',
    name: 'Tris',
    color: '#B6A4F1',
    scene: trisScene,
    sceneImage: { x: -27.586, y: 0, w: 155.172, h: 100 },
    character: trisCharacter,
    characterFrame: { x: 6.25, y: -9.583, w: 87.5, h: 87.5 },
    characterImage: { x: 22.752, y: 23.422, w: 54.495, h: 54.495 },
    thumbnail: { src: trisCharacter, x: 352, y: 559, crop: [110, -5, 17.5] },
  },
]

export const DEFAULT_AGENT_ID = 'poli'
