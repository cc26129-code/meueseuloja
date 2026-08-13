import { Heart } from "lucide-react";

import { useFavorites } from "@/lib/favorites";

export function FavoriteButton({
  id,
  name,
  className = "",
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
      className={`grid size-9 place-items-center rounded-full border border-border/70 bg-background/70 backdrop-blur transition-all duration-300 hover:border-primary/60 hover:bg-background/90 ${className}`}
    >
      <Heart
        className={`size-4 transition-colors duration-300 ${
          active ? "fill-primary text-primary" : "text-muted-foreground"
        }`}
      />
    </button>
  );
}
