import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type Size = "sm" | "md";

const sizes: Record<Size, { button: string; value: string }> = {
  sm: { button: "size-7", value: "w-6" },
  md: { button: "size-8", value: "w-7" },
};

/** Controle de quantidade reutilizado no card de produto e no carrinho. */
export function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  size = "md",
  decreaseLabel = "Diminuir quantidade",
  increaseLabel = "Aumentar quantidade",
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  size?: Size;
  decreaseLabel?: string;
  increaseLabel?: string;
}) {
  const s = sizes[size];

  return (
    <div className="flex items-center gap-1 rounded-full border border-border p-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`${s.button} rounded-full`}
        aria-label={decreaseLabel}
        onClick={onDecrease}
      >
        <Minus className="size-3.5" />
      </Button>
      <span className={`${s.value} text-center text-sm`}>{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`${s.button} rounded-full`}
        aria-label={increaseLabel}
        onClick={onIncrease}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
