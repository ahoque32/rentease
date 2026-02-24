'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface CopyButtonProps {
  value: string
  label?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  className?: string
  onCopied?: () => void
}

export default function CopyButton({
  value,
  label = 'Copy Link',
  size = 'sm',
  variant = 'outline',
  className,
  onCopied,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()

    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Link copied to clipboard')
      onCopied?.()
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Could not copy link. Please copy it manually.')
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleCopy}
      aria-live="polite"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  )
}
