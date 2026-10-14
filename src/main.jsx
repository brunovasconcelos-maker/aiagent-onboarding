import '@fontsource/inter/500.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { clearLegacyStorage } from './utils/clearLegacyStorage.js'

// Nothing is saved between visits: drop what earlier versions stored, and never restore the
// scroll position of a previous visit.
clearLegacyStorage()
try {
  window.history.scrollRestoration = 'manual'
} catch {
  // not supported: ignore
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
