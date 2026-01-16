import {
  Utensils, Coffee, Pizza, Beef, Salad, IceCream, Soup,
  Percent, Gift, Award, Cake, Beer, Wine, Sandwich,
  Fish, Drumstick, Cookie, Croissant
} from 'lucide-react';

interface FoodIconProps {
  itemName: string;
  className?: string;
}

export const FoodIcon = ({ itemName, className = "w-8 h-8 text-foreground" }: FoodIconProps) => {
  const name = itemName.toLowerCase();

  // Special Tiles
  if (name.includes('discount') || name.includes('offer') || name.includes('%')) return <Percent className={className} />;
  if (name.includes('reward') || name.includes('point') || name.includes('loyalty')) return <Award className={className} />;
  if (name.includes('gift') || name.includes('voucher') || name.includes('card')) return <Gift className={className} />;

  // Food Types
  if (name.includes('burger') || name.includes('beef') || name.includes('steak')) return <Beef className={className} />;
  if (name.includes('sandwich') || name.includes('wrap')) return <Sandwich className={className} />;
  if (name.includes('pizza')) return <Pizza className={className} />;
  if (name.includes('salad') || name.includes('caesar') || name.includes('green')) return <Salad className={className} />;
  if (name.includes('soup') || name.includes('broth') || name.includes('chowder')) return <Soup className={className} />;
  if (name.includes('chicken') || name.includes('wings') || name.includes('poultry')) return <Drumstick className={className} />;
  if (name.includes('fish') || name.includes('seafood') || name.includes('shrimp') || name.includes('sushi')) return <Fish className={className} />;

  // Desserts & Sides
  if (name.includes('ice cream') || name.includes('dessert') || name.includes('gelato')) return <IceCream className={className} />;
  if (name.includes('cake') || name.includes('pastry') || name.includes('donut')) return <Cake className={className} />;
  if (name.includes('cookie') || name.includes('biscuit')) return <Cookie className={className} />;
  if (name.includes('croissant') || name.includes('bakery')) return <Croissant className={className} />;

  // Drinks
  if (name.includes('coffee') || name.includes('latte') || name.includes('espresso') || name.includes('cappuccino')) return <Coffee className={className} />;
  if (name.includes('beer') || name.includes('ale') || name.includes('lager')) return <Beer className={className} />;
  if (name.includes('wine')) return <Wine className={className} />;

  return <Utensils className={className} />;
};
