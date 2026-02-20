"use client"

import { useFormStatus } from "react-dom"
import { Button, ButtonProps } from "./button"
import { LoadingSpinner } from "./loading-spinner"
import { cn } from "@/lib/utils"

interface SubmitButtonProps extends ButtonProps {
  children: React.ReactNode
  loadingText?: string
}

export function SubmitButton({ 
  children, 
  loadingText = "Submitting...", 
  className,
  disabled,
  ...props 
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className={cn("gap-2", className)}
      {...props}
    >
      {pending ? (
        <>
          <LoadingSpinner size="sm" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
