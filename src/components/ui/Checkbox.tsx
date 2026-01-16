import * as React from "react"
import { cn } from "@/lib/utils/cn"
import { Check } from "lucide-react"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  price?: number
  className?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, price, ...props }, ref) => {
    return (
      <label className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              ref={ref}
              {...props}
            />
            <div className={cn(
              "w-5 h-5 border-2 rounded flex items-center justify-center transition-colors",
              props.checked 
                ? "border-primary bg-primary" 
                : "border-border bg-transparent"
            )}>
              {props.checked && (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>
          </div>
          <span className="text-text-primary font-medium font-inter">{label}</span>
        </div>
        <span className="text-text-primary font-medium font-inter">
          {price && price > 0 ? `+${price}` : 'Free'}
        </span>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
