import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { formatPrice } from '../types';

interface CartIconProps {
  itemCount: number;
  subtotal: number;
  onClick: () => void;
  className?: string;
}

export const CartIcon: React.FC<CartIconProps> = ({
  itemCount,
  subtotal,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        pointer-events-auto
        relative flex items-center gap-2
        bg-black/60 backdrop-blur-xl
        px-4 py-2.5 rounded-xl
        border border-white/10
        hover:bg-black/70 hover:border-green-500/30
        transition-all duration-200
        text-white
        ${className}
      `}
    >
      <div className="relative">
        <ShoppingCart size={20} />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>

      {subtotal > 0 && (
        <span className="text-green-400 font-medium text-sm">
          {formatPrice(subtotal)}
        </span>
      )}

      {itemCount === 0 && (
        <span className="text-gray-400 text-sm">Cart</span>
      )}
    </button>
  );
};

interface FloatingCartButtonProps {
  itemCount: number;
  onClick: () => void;
}

export const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({
  itemCount,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="
        pointer-events-auto
        fixed bottom-24 right-6
        w-14 h-14 rounded-full
        bg-green-600 hover:bg-green-500
        shadow-lg shadow-green-500/30
        flex items-center justify-center
        transition-all duration-200
        hover:scale-110
        z-50
      "
    >
      <div className="relative">
        <ShoppingCart size={24} className="text-white" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>
    </button>
  );
};

export default CartIcon;
