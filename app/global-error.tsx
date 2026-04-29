'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '24rem' }}>
            A critical error occurred. Please refresh the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
