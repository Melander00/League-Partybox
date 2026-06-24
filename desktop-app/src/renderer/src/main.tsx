import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackRender={error => (<>
        <span>Error occured in logger</span>
        <pre>{JSON.stringify(error.error, null, 2)}</pre>
    </>)}>
        <App />
    </ErrorBoundary>
  </StrictMode>
)
