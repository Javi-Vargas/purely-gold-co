'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative w-full max-w-lg rounded-2xl border border-line bg-ink-card p-6',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted hover:text-cream"
        >
          <X size={18} />
        </button>
        {title && (
          <h2 className="font-display text-2xl font-medium text-cream">{title}</h2>
        )}
        <div className={cn(title && 'mt-4')}>{children}</div>
      </div>
    </div>
  )
}
