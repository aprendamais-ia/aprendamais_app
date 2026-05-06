import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
};

export function Wordmark({ className }: WordmarkProps) {
  return (
    <span className={cn("font-display text-xl font-bold tracking-tight", className)}>
      Aprende<span className="text-brand-green">z</span>
    </span>
  );
}
