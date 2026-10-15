import { useEffect, useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { agents } from '../data/agents.js'
import { useAgent } from '../context/AgentContext.jsx'
import { createWheel, WHEEL } from '../utils/agentWheel.js'
import { CIRCLE, computeLayout, measureStage } from '../utils/agentsLayout.js'

const pct = (n) => `${n}%`

// Geometry of the stage at scale 1, the same for every agent (see measureStage). HEADROOM is how
// far the tallest character (Rubi's horns) or ring sticks out above the circle, as a fraction of
// the circle diameter.
const STAGE = measureStage(agents)
const HEADROOM = -STAGE.top / CIRCLE

function CharacterLayer({ agent }) {
  const { characterFrame: f, characterImage: i } = agent
  return (
    <div
      className="agent__character"
      style={{ left: pct(f.x), top: pct(f.y), width: pct(f.w), height: pct(f.h) }}
    >
      <img
        src={agent.character}
        alt={agent.name}
        width={480}
        height={480}
        decoding="async"
        style={{
          left: pct(((i.x - f.x) / f.w) * 100),
          top: pct(((i.y - f.y) / f.h) * 100),
          width: pct((i.w / f.w) * 100),
          height: pct((i.h / f.h) * 100),
        }}
      />
    </div>
  )
}

export default function Passo2() {
  const { agentId, setAgentId } = useAgent()
  const radios = useRef([])
  const rootRef = useRef(null)
  const titleRef = useRef(null)
  const buttonRef = useRef(null)
  const circleRef = useRef(null)
  const namesRef = useRef(null)
  const wheel = useRef(null)
  const selectedIndex = Math.max(0, agents.findIndex((a) => a.id === agentId))

  // The hidden wheel (see utils/agentWheel.js): created once, before the first paint, and
  // retargeted when the agent changes. Its loop is cancelled on unmount (StrictMode runs this
  // twice, each run cleans up after itself).
  useLayoutEffect(() => {
    const instance = createWheel({
      root: circleRef.current,
      groups: [...circleRef.current.querySelectorAll('.wheel__group')],
      names: [...namesRef.current.children],
      overflows: [...circleRef.current.querySelectorAll('.agents__overflow')],
      index: selectedIndex,
    })
    wheel.current = instance
    return () => {
      instance.destroy()
      wheel.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    wheel.current?.setTarget(selectedIndex)
  }, [selectedIndex])

  // Spacing: measure the logo, the title block and the button, compute the layout and write it
  // to CSS variables on the page root. Recomputed (once per frame at most) when the window
  // resizes, the visual viewport changes (browser zoom), the fonts load, or the title block or
  // the button change size.
  useLayoutEffect(() => {
    const root = rootRef.current
    let frame = 0
    const apply = () => {
      frame = 0
      const logo = document.querySelector('.header img')
      const layout = computeLayout({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        logoBottom: logo ? logo.getBoundingClientRect().bottom : 64,
        titleHeight: titleRef.current.getBoundingClientRect().height,
        buttonHeight: buttonRef.current.getBoundingClientRect().height,
        stageHeight: STAGE.height,
        stageHalfWidth: STAGE.halfWidth,
      })
      root.style.setProperty('--u', `${layout.u}px`)
      root.style.setProperty('--title-top', `${layout.titleTop}px`)
      root.style.setProperty('--stage-top', `${layout.stageTop}px`)
      root.dataset.floor = String(layout.floor)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }
    apply()
    window.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('resize', schedule)
    document.fonts?.ready.then(schedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(titleRef.current)
    observer.observe(buttonRef.current)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('resize', schedule)
      observer.disconnect()
    }
  }, [])

  const select = (index) => {
    const next = (index + agents.length) % agents.length
    setAgentId(agents[next].id)
    radios.current[next]?.focus()
  }

  const onKeyDown = (event, index) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      select(index + 1)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      select(index - 1)
    }
  }

  return (
    <div
      ref={rootRef}
      className="agents"
      style={{ '--headroom': HEADROOM, '--stage-h': STAGE.height }}
    >
      <div ref={titleRef} className="agents__intro">
        <h1 className="agents__title">Selecione seu agente</h1>
        <p className="agents__subtitle">Pense bem, você não poderá mudar depois.</p>
      </div>

      <div className="agents__stage">
        <div className="agents__list" role="radiogroup" aria-label="Agente">
          {agents.map((agent, index) => {
            const checked = agent.id === agentId
            const [size, left, top] = agent.thumbnail.crop
            return (
              <button
                key={agent.id}
                ref={(el) => (radios.current[index] = el)}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={agent.name}
                tabIndex={checked ? 0 : -1}
                className="thumb"
                style={{
                  '--x': agent.thumbnail.x,
                  '--y': agent.thumbnail.y,
                  backgroundColor: agent.color,
                }}
                onClick={() => select(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <span className="thumb__clip">
                  <img
                    src={agent.thumbnail.src}
                    alt=""
                    width={80}
                    height={80}
                    decoding="async"
                    style={{
                      left: pct(left),
                      top: pct(top),
                      width: pct(size),
                      height: pct(size),
                    }}
                  />
                </span>
                <span className="thumb__ring" aria-hidden="true" />
              </button>
            )
          })}
        </div>

        <div
          ref={circleRef}
          className="agents__circle"
          style={{ '--wheel-radius': WHEEL.radius, '--wheel-step': WHEEL.stepDeg }}
        >
          {/* the round window: everything on the wheel is clipped by the main circle, on black */}
          <div className="agents__window">
            {agents.map((agent, index) => (
              <div
                key={agent.id}
                className="wheel__group"
                data-active={agent.id === agentId}
                style={{ '--i': index }}
              >
                {/* the scene circle is 2px larger than the window; the image keeps its exact place
                    relative to the 480 box */}
                <div className="agents__scene">
                  <div className="agents__scene-box">
                    <img
                      src={agent.scene}
                      alt=""
                      width={1440}
                      height={928}
                      decoding="async"
                      style={{
                        left: pct(agent.sceneImage.x),
                        top: pct(agent.sceneImage.y),
                        width: pct(agent.sceneImage.w),
                        height: pct(agent.sceneImage.h),
                      }}
                    />
                  </div>
                </div>
                <CharacterLayer agent={agent} />
              </div>
            ))}
          </div>
          {/* copies of the characters outside the window, masked to the area outside the circle:
              they keep what sticks out above it (Rubi's horns); only the selected one is visible */}
          {agents.map((agent) => (
            <div key={agent.id} className="agents__overflow" aria-hidden="true">
              <div className="agents__overflow-box">
                <CharacterLayer agent={agent} />
              </div>
            </div>
          ))}
        </div>

        <div ref={namesRef} className="agents__names" aria-live="polite">
          {agents.map((agent) => (
            <p
              key={agent.id}
              className="agents__name"
              data-active={agent.id === agentId}
              aria-hidden={agent.id !== agentId}
            >
              {agent.name}
            </p>
          ))}
        </div>

      </div>

      <Link ref={buttonRef} to="/passo-3" className="btn agents__cta">
        Selecionar
      </Link>
    </div>
  )
}
