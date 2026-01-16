import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const statusBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-[30px] px-3 py-1 text-sm font-medium font-inter",
  {
    variants: {
      variant: {
        completed: "bg-[rgba(107,226,190,0.24)] text-[#50D1AA]",
        required: "bg-[rgba(255,56,60,0.24)] text-[#FF383C]",
        preparing: "bg-[rgba(146,144,254,0.2)] text-[#9290FE]",
        pending: "bg-[rgba(255,181,114,0.2)] text-[#FFB572]",
        optional: "bg-[rgba(162,162,162,0.24)] text-[#A2A2A2]",
      },
    },
    defaultVariants: {
      variant: "optional",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        className={cn(statusBadgeVariants({ variant, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge, statusBadgeVariants }
