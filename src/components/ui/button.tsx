import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[42px] font-semibold font-inter transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        fill: "bg-card text-text-primary border border-border hover:bg-secondary active:bg-card",
        line: "bg-card text-text-primary border border-border hover:bg-accent/50",
        icon: "bg-card text-text-primary border border-border hover:bg-secondary active:bg-card",
        "icon-line": "bg-card text-text-primary border border-border hover:bg-accent/50",
      },
      size: {
        default: "h-12 px-4 py-3.5 text-sm",
        sm: "h-9 px-3 text-sm",
        xs: "h-8 px-2 text-sm",
        notification: "!h-1 !w-1 !p-0 !min-w-0 !min-h-0", // tiny size for notification button
        lg: "h-14 px-8 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "fill",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, icon, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {icon && icon}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
