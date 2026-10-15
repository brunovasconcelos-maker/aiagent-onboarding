import Header from './Header.jsx'
import PersistentOrbit from './PersistentOrbit.jsx'
import RouteTransition from './RouteTransition.jsx'

export default function Layout() {
  return (
    <>
      <Header />
      {/* Mounted once, outside the routes: never unmounted while the user goes through the steps. */}
      <PersistentOrbit />
      <RouteTransition />
    </>
  )
}
