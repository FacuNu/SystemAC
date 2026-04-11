import { cn } from "@/lib/utils";

type CardProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-surface-line/70 bg-surface/80 p-6 shadow-panel sm:p-8",
        className,
      )}
    >
      {children}
    </section>
  );
}
