import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFavorites } from "@/providers/favorites-provider";

export function FavoriteButton({
  id,
  name,
  className,
}: {
  id: string;
  name: string;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(id);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remover ${name} dos favoritos` : `Adicionar ${name} aos favoritos`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className={cn(
        "grid size-10 place-items-center rounded-full border border-white/60 bg-background/80 shadow-sm backdrop-blur transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-background",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-colors duration-300",
          active ? "fill-primary text-primary" : "text-muted-foreground",
        )}
      />
    </button>
  );
}
