import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { App } from './App'
import { useSupabaseSync } from './hooks/useSupabaseSync'
import './styles/globals.css'

function Root() {
  useSupabaseSync()
  return (
    <>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: 'Quicksand, sans-serif',
            fontWeight: 600,
            fontSize: 13,
            background: 'var(--white)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 12,
          }
        }}
      />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><Root /></StrictMode>
)
