import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  primary:
    "bg-surface-ink text-surface hover:bg-surface-ink/92 disabled:bg-surface-ink/35",
  secondary:
    "border border-surface-line bg-surface text-surface-ink hover:bg-surface-muted disabled:text-surface-ink/35",
  ghost:
    "bg-transparent text-surface-ink hover:bg-surface-muted disabled:text-surface-ink/35",
} as const;

type ButtonVariant = keyof typeof buttonVariants;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = "button", variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed",
          buttonVariants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
