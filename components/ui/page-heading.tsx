import { cn } from "@/lib/utils";

type PageHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  invert?: boolean;
};

export function PageHeading({
  eyebrow,
  title,
  description,
  invert = false,
}: PageHeadingProps) {
  return (
    <div className="max-w-2xl">
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.28em]",
          invert ? "text-white/60" : "text-surface-accent",
        )}
      >
        {eyebrow}
      </p>
      <h1
        className={cn(
          "mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl",
          invert ? "text-white" : "text-surface-ink",
        )}
      >
        {title}
      </h1>
      <p
        className={cn(
          "mt-3 text-sm leading-6 sm:text-base",
          invert ? "text-white/78" : "text-surface-ink/72",
        )}
      >
        {description}
      </p>
    </div>
  );
}
