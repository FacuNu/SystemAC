import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

type PlaceholderStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  hints: string[];
};

export function PlaceholderState({
  eyebrow,
  title,
  description,
  icon: Icon,
  hints,
}: PlaceholderStateProps) {
  return (
    <Card className="bg-white/72">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="flex size-20 items-center justify-center rounded-[1.75rem] bg-surface-ink text-surface shadow-panel">
          <Icon className="size-8" />
        </div>
        <div>
          <PageHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
          <div className="mt-8 grid gap-3">
            {hints.map((hint) => (
              <div
                key={hint}
                className="rounded-2xl border border-surface-line bg-surface px-4 py-3 text-sm text-surface-ink/76"
              >
                {hint}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
