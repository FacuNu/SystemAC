import Link from "next/link";
import { cn } from "@/lib/utils";

const buttonLinkVariants = {
  primary: "bg-surface-ink text-surface hover:bg-surface-ink/92",
  secondary: "border border-surface-line bg-surface text-surface-ink hover:bg-surface-muted",
  ghost: "bg-surface-muted text-surface-ink hover:bg-surface-line/60",
} as const;

type ButtonLinkProps = {
  children: React.ReactNode;
  href: string;
  variant?: keyof typeof buttonLinkVariants;
  disabled?: boolean;
};

export function ButtonLink({
  children,
  href,
  variant = "primary",
  disabled = false,
}: ButtonLinkProps) {
  const className = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
    buttonLinkVariants[variant],
    disabled && "pointer-events-none opacity-40",
  );

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={className}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      className={className}
      href={href}
    >
      {children}
    </Link>
  );
}
