import React from 'react';
import { formatPrice } from '../types';

interface PriceTagProps {
  amount: number; // Price in cents
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showCurrency?: boolean;
  strikethrough?: boolean;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  amount,
  size = 'md',
  className = '',
  showCurrency = true,
  strikethrough = false,
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg font-semibold',
  };

  const formatted = formatPrice(amount);

  return (
    <span
      className={`
        ${sizeClasses[size]}
        ${strikethrough ? 'line-through text-gray-500' : 'text-green-400'}
        ${className}
      `}
    >
      {formatted}
    </span>
  );
};

interface PriceDisplayProps {
  amount: number;
  originalAmount?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  originalAmount,
  label,
  size = 'md',
}) => {
  const hasDiscount = originalAmount && originalAmount > amount;

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-gray-400 text-xs">{label}</span>}
      <PriceTag amount={amount} size={size} />
      {hasDiscount && (
        <PriceTag amount={originalAmount} size="sm" strikethrough />
      )}
    </div>
  );
};

interface CartTotalProps {
  subtotal: number;
  shipping?: number;
  tax?: number;
  total?: number;
}

export const CartTotal: React.FC<CartTotalProps> = ({
  subtotal,
  shipping = 0,
  tax = 0,
  total,
}) => {
  const calculatedTotal = total ?? subtotal + shipping + tax;

  return (
    <div className="space-y-2 pt-3 border-t border-white/10">
      <div className="flex justify-between text-sm text-gray-400">
        <span>Subtotal</span>
        <PriceTag amount={subtotal} size="sm" />
      </div>
      {shipping > 0 && (
        <div className="flex justify-between text-sm text-gray-400">
          <span>Shipping</span>
          <PriceTag amount={shipping} size="sm" />
        </div>
      )}
      {tax > 0 && (
        <div className="flex justify-between text-sm text-gray-400">
          <span>Tax</span>
          <PriceTag amount={tax} size="sm" />
        </div>
      )}
      <div className="flex justify-between text-white font-semibold pt-2 border-t border-white/10">
        <span>Total</span>
        <PriceTag amount={calculatedTotal} size="lg" />
      </div>
    </div>
  );
};

export default PriceTag;
