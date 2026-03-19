import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const buttonVariants = ({
  variant = "default",
  size = "default",
  className = "",
}: {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) => {
  const baseStyles =
    "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50 select-none active:scale-[0.98] transition-all duration-200";

  const variants = {
    default:
      "bg-[#7B0F2B] text-white shadow-sm hover:bg-[#8B1A3B] border border-[#7B0F2B]/10 dark:border-white/10 dark:bg-[#7B0F2B] dark:text-white dark:hover:bg-[#8B1A3B]",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
    outline:
      "border-2 border-[#7B0F2B]/20 bg-white text-[#7B0F2B] hover:bg-rose-50/50 hover:border-[#7B0F2B]/40 dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/5",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
    ghost: 
      "hover:bg-rose-50 text-[#7B0F2B] dark:text-white/90 dark:hover:bg-white/5",
    link: "text-[#7B0F2B] underline-offset-4 hover:underline dark:text-rose-400",
  };

  const sizes = {
    default: "h-10 px-4 py-2 rounded-lg",
    sm: "h-9 rounded-md px-3 text-xs",
    lg: "h-12 rounded-xl px-8 text-base",
    icon: "h-10 w-10 rounded-full",
  };

  return cn(baseStyles, variants[variant], sizes[size], className);
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        suppressHydrationWarning
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
