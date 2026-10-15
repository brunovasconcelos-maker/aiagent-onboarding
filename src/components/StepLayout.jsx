import { Link } from 'react-router-dom'

// Shared layout of the onboarding steps: fixed title, a scrollable options area on the left
// and a fixed footer. The orbit on the right is not part of the page (see PersistentOrbit).
// `titleTop` is the title position in the 1440x928 Figma frame; the options start 114px
// below it (58px title + 56px gap).
export default function StepLayout({
  titleLines,
  titleTop,
  backTo,
  nextTo,
  backLabel = 'Voltar',
  nextLabel = 'Continuar',
  children,
}) {
  return (
    <>
      <div className="step">
        <div className="step__stage" style={{ '--title-top': titleTop }}>
          <h1 className="step__title">
            {titleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>

          <div className="step__scroll">
            <div className="step__list">{children}</div>
          </div>
        </div>
      </div>

      {/* Outside .step on purpose: that box is a size container used to scale the composition,
          and the footer has to be fixed to the window, not to a container. */}
      <div className="step__footer">
        <div className="step__bar">
          <Link to={backTo} className="btn btn--text">
            {backLabel}
          </Link>
          <Link to={nextTo} className="btn">
            {nextLabel}
          </Link>
        </div>
      </div>
    </>
  )
}
