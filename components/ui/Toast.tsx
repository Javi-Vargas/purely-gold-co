'use client'

import { createContext, useCallback, useContext, useState } from 'react'

type Toast = { id: number; message: string; tone: 'info' | 'success' | 'error' }

const ToastContext = createContext<{
  notify: (message: string, tone?: Toast['tone']) => void
} | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${
              t.tone === 'error'
                ? 'border-red-500/40 bg-red-500/10 text-red-200'
                : t.tone === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-line bg-ink-card text-cream'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
