import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './themes/base.css'
import './themes/social.css'
import './themes/japanese.css'
import './themes/english.css'
import './themes/math.css'
import './themes/science.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
