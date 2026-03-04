import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-blue-500/60 bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:scale-[1.01] hover:from-blue-400 hover:to-indigo-400 hover:shadow-xl hover:shadow-blue-500/30",
        destructive:
          "border border-rose-400/50 bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/20 hover:scale-[1.01] hover:shadow-xl hover:shadow-rose-500/30",
        outline:
          "border border-white/45 bg-white/65 text-gray-700 backdrop-blur-md hover:scale-[1.01] hover:bg-white/85 hover:text-gray-900",
        secondary:
          "border border-white/45 bg-white/70 text-gray-700 shadow-sm backdrop-blur-md hover:scale-[1.01] hover:bg-white/90 hover:text-gray-900",
        ghost: "text-gray-700 hover:bg-white/70 hover:text-gray-900",
        link: "text-indigo-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
