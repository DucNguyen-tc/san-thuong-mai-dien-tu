import { Star } from 'lucide-react';
import { formatRating } from '@/utils/formatters';

interface StarRatingProps {
  rating: number;
  count: number;
  size?: 'sm' | 'md';
}

export default function StarRating({ rating, count, size = 'sm' }: StarRatingProps) {
  const iconSize = size === 'sm' ? 12 : 16;

  return (
    <div className="flex items-center gap-1">
      <Star
        size={iconSize}
        className="fill-[#fe9800] text-[#fe9800]"
      />
      <span className={`font-semibold ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {rating.toFixed(1)}
      </span>
      <span className={`text-on-surface-variant ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        ({formatRating(count)})
      </span>
    </div>
  );
}
