import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'

const fieldBase =
  'w-full rounded-xl border border-line bg-ink-soft px-4 py-3 text-sm text-cream placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50'

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream-dim"
    >
      {children}
    </label>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, 'min-h-28 resize-y', className)} {...props} />
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, 'appearance-none', className)} {...props} />
}
