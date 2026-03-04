import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-blue-200/70 bg-blue-100/70 text-blue-800 shadow-sm",
        secondary:
          "border-gray-200/70 bg-white/70 text-gray-700",
        destructive:
          "border-red-200/70 bg-red-100/70 text-red-700 shadow-sm",
        outline: "border-gray-200/70 bg-white/60 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
