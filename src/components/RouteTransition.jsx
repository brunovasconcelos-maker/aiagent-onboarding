import { useEffect, useState } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'

const LEAVE_MS = 200

// Only the left column of the steps (title, options, footer) changes from step to step, with a
// short fade. The orbit is not part of any page, so it never remounts or flashes.
const FADE_OUT_ROUTES = ['/passo-3', '/passo-4', '/passo-5']
const FADE_IN_ROUTES = ['/passo-3', '/passo-4', '/passo-5']
const STEP_ROUTES = ['/passo-3', '/passo-4', '/passo-5', '/passo-6']

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Renders the current page and, for a moment, a copy of the page being left that fades out.
export default function RouteTransition() {
  const outlet = useOutlet()
  const { pathname } = useLocation()

  const [state, setState] = useState({ pathname, outlet, leaving: null, enter: false })
  if (state.pathname !== pathname) {
    const motion = !reduced()
    const fromStep = STEP_ROUTES.includes(state.pathname)
    setState({
      pathname,
      outlet,
      leaving:
        motion && FADE_OUT_ROUTES.includes(state.pathname) && STEP_ROUTES.includes(pathname)
          ? { pathname: state.pathname, element: state.outlet }
          : null,
      enter: motion && fromStep && FADE_IN_ROUTES.includes(pathname),
    })
  }

  const { leaving } = state
  useEffect(() => {
    if (!leaving) return undefined
    const timer = setTimeout(() => setState((s) => ({ ...s, leaving: null })), LEAVE_MS + 50)
    return () => clearTimeout(timer)
  }, [leaving])

  return (
    <>
      {leaving && (
        <div key={`leaving-${leaving.pathname}`} className="route route--leaving" aria-hidden="true" inert="">
          {leaving.element}
        </div>
      )}
      <div key={pathname} className="route" data-enter={state.enter}>
        {outlet}
      </div>
    </>
  )
}
