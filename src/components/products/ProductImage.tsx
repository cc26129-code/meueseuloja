import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { ProductWithUrl } from "@/types/product";

/** Foto do produto com fallback quando não há imagem cadastrada. */
export function ProductImage({
  product,
  className,
  fallback,
}: {
  product: ProductWithUrl;
  className?: string;
  fallback?: ReactNode;
}) {
  if (!product.signedUrl) {
    return (
      <div className="grid size-full place-items-center text-muted-foreground">
        {fallback ?? <Sparkles className="size-8" />}
      </div>
    );
  }

  return (
    <img
      src={product.signedUrl}
      alt={product.name}
      loading="lazy"
      className={cn("size-full object-cover", className)}
    />
  );
}
