import * as React from "react"
import { cn } from "@/lib/utils/cn"

export interface RadioButtonProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  price?: number
  className?: string
}

const RadioButton = React.forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ className, label, price, ...props }, ref) => {
    return (
      <label className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="radio"
              className="sr-only"
              ref={ref}
              {...props}
            />
            <div className={cn(
              "w-5 h-5 border-2 rounded-full flex items-center justify-center transition-colors",
              props.checked 
                ? "border-primary bg-primary" 
                : "border-border bg-transparent"
            )}>
              {props.checked && (
                <div className="w-2.5 h-2.5 bg-primary rounded-full" />
              )}
            </div>
          </div>
          <span className="text-text-primary font-medium">{label}</span>
        </div>
        <span className="text-text-primary font-medium">
          {price && price > 0 ? `+${price}` : 'Free'}
        </span>
      </label>
    )
  }
)
RadioButton.displayName = "RadioButton"

export { RadioButton }
