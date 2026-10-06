"use client";

import { useState } from "react";
import { FoodArt } from "@/components/food-art";
import { productImageUrl } from "@/lib/data/api";
import type { Product } from "@/lib/types";

/**
 * Product picture: uploaded photo when one exists, FoodArt drawing as the
 * fallback (also shown if the photo URL ever fails to load).
 */
export function ProductArt({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url =
    product.imagePath && !failed ? productImageUrl(product.imagePath) : null;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Supabase storage URL; next/image would need remote config + a loader
      <img
        src={url}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${className ?? ""} object-cover`}
      />
    );
  }
  return <FoodArt art={product.art} className={className} />;
}
