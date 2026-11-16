import type { ProductBadge } from '@/types/product';

interface BadgeProps {
  variant: ProductBadge;
  label: string;
}

const badgeStyles: Record<ProductBadge, string> = {
  discount: 'bg-error text-white',
  new: 'bg-primary text-white',
  bestseller: 'bg-error text-white',
  gift: 'bg-primary text-white',
  hot: 'bg-secondary text-white',
};

export default function Badge({ variant, label }: BadgeProps) {
  return (
    <span
      className={`inline-block text-[10px] font-bold px-2 py-1 rounded ${badgeStyles[variant]}`}
    >
      {label}
    </span>
  );
}
