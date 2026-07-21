import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  className = '',
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className={`flex items-center border border-outline-variant rounded-lg bg-surface-bright ${className}`}>
      <button
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-on-surface-variant"
        aria-label="Giảm số lượng"
      >
        <Minus size={14} />
      </button>
      <input
        type="text"
        value={value}
        readOnly
        className="w-10 h-8 border-none text-center font-label-md p-0 focus:ring-0 bg-transparent text-on-surface"
      />
      <button
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-on-surface-variant"
        aria-label="Tăng số lượng"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
