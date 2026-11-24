import {
  Apple,
  Cookie,
  Croissant,
  CupSoda,
  Drumstick,
  Milk,
  Package,
  Popcorn,
  Soup,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/nutrition/types";

const ICONS: Record<Category, LucideIcon> = {
  drinks: CupSoda,
  dairy: Milk,
  bakery: Croissant,
  snacks: Popcorn,
  sweets: Cookie,
  cereals: Wheat,
  meals: UtensilsCrossed,
  fruits_vegetables: Apple,
  meat_fish: Drumstick,
  sauces_spreads: Soup,
  other: Package,
};

/** 48px tile with the product's category icon (used when there's no photo). */
export function ProductIcon({ category, size = 48 }: { category: Category; size?: number }) {
  const Icon = ICONS[category] ?? Package;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-control bg-fg/10" style={{ width: size, height: size }}>
      <Icon size={size / 2} strokeWidth={2} aria-hidden />
    </span>
  );
}
