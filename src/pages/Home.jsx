import { Link } from 'react-router-dom'
import laranja from '../assets/characters/Rubi.png'
import roxo from '../assets/characters/Tris.png'
import azul from '../assets/characters/Poli.png'
import verde from '../assets/characters/Rocco.png'

// x/y: sphere center relative to the diamond center (Figma px at the 210px group).
// crop: image size / left / top as a % of the sphere, fitted to the Figma render.
const spheres = [
  { name: 'laranja', src: laranja, color: '#EB684A', x: 0, y: -65, pulse: '5s', delay: '0s', crop: [123.75, -11.88, 7.88] },
  { name: 'roxo', src: roxo, color: '#B6A4F1', x: -65, y: 0, pulse: '6.2s', delay: '1.4s', crop: [100, 0, 16.25] },
  { name: 'azul', src: azul, color: '#68ADD2', x: 65, y: 0, pulse: '7s', delay: '2.8s', crop: [127.5, -13.75, -0.25] },
  { name: 'verde', src: verde, color: '#C2D09F', x: 0, y: 65, pulse: '8s', delay: '0.7s', crop: [128.75, -14.38, 6] },
]

export default function Home() {
  return (
    <main className="home">
      <div className="home__content">
        <div className="stage" aria-hidden="true">
          <div className="orbit">
            {spheres.map((s) => (
              <div
                key={s.name}
                className="mover"
                style={{ '--x': s.x, '--y': s.y }}
              >
                <div className="counter">
                  <div
                    className="pulse"
                    style={{ '--pulse': s.pulse, '--delay': s.delay }}
                  >
                    <div
                      className="sphere"
                      style={{
                        backgroundColor: s.color,
                        '--size': `${s.crop[0]}%`,
                        '--left': `${s.crop[1]}%`,
                        '--top': `${s.crop[2]}%`,
                      }}
                    >
                      <img src={s.src} alt="" decoding="async" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="copy">
          <p className="copy__label">Chegou Inner Agents</p>
          <h1 className="copy__title">
            <span>Quatro agentes.</span>
            <span>Um deles vai ser o seu.</span>
          </h1>
        </div>

        <Link to="/passo-2" className="btn">
          Começar
        </Link>
      </div>
    </main>
  )
}
