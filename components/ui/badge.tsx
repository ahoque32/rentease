import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-emerald-200/70 bg-emerald-100/80 text-emerald-700",
        secondary:
          "border-amber-200/70 bg-amber-100/80 text-amber-700",
        destructive:
          "border-red-200/70 bg-red-100/80 text-red-700",
        outline: "border-gray-200/70 bg-white/70 text-gray-700",
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
