import { Check, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

/** Selo de disponibilidade exibido sobre a foto do produto. */
export function StockBadge({ available, className }: { available: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 uppercase backdrop-blur",
        available ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive",
        className,
      )}
    >
      {available ? <Check className="size-3" /> : <Circle className="size-3" />}
      {available ? "Disponível" : "Esgotado"}
    </span>
  );
}
