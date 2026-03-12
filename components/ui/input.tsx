import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, ...props }, ref) => (
    <input
      suppressHydrationWarning
      type={type}
      className={`flex h-10 w-full rounded-md border px-3 py-2 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`.trim()}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = "Input"

export { Input }
