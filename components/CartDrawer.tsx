import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Cart, CartItem, formatPrice } from '../types';
import { PriceTag, CartTotal } from './PriceTag';
import {
  TREE_PRODUCTS,
  ORNAMENT_PRODUCTS,
  TOPPER_PRODUCTS,
  getTreeProduct,
  getOrnamentProduct,
  getTopperProduct,
} from '../data/products';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart | null;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

const getProductName = (item: CartItem): string => {
  switch (item.productType) {
    case 'tree':
      return getTreeProduct(item.productId)?.name || 'Christmas Tree';
    case 'ornament':
      return getOrnamentProduct(item.productId)?.name || 'Ornament';
    case 'topper':
      return getTopperProduct(item.productId)?.name || 'Tree Topper';
    default:
      return 'Item';
  }
};

const getProductDescription = (item: CartItem): string => {
  switch (item.productType) {
    case 'tree': {
      const tree = getTreeProduct(item.productId);
      return tree ? `${tree.heightFt}ft ${tree.size}` : '';
    }
    case 'ornament': {
      const color = item.customization?.color || '';
      return color ? `Color: ${color}` : '';
    }
    case 'topper': {
      const color = item.customization?.color || '';
      return color ? `Color: ${color}` : '';
    }
    default:
      return '';
  }
};

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const name = getProductName(item);
  const description = getProductDescription(item);
  const isTree = item.productType === 'tree';
  const isTopper = item.productType === 'topper';

  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/10">
      {/* Color swatch or icon */}
      <div
        className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${isTree ? 'bg-green-800' : isTopper ? 'bg-yellow-600' : ''}
        `}
        style={
          !isTree && !isTopper && item.customization?.color
            ? { backgroundColor: item.customization.color }
            : undefined
        }
      >
        {isTree && <span className="text-lg">🎄</span>}
        {isTopper && <span className="text-lg">⭐</span>}
        {!isTree && !isTopper && <span className="text-lg">🎁</span>}
      </div>

      {/* Item details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-white font-medium text-sm truncate">{name}</h4>
            {description && (
              <p className="text-gray-400 text-xs mt-0.5">{description}</p>
            )}
          </div>
          <PriceTag amount={item.unitPrice * item.quantity} size="sm" />
        </div>

        {/* Quantity controls - only for ornaments */}
        <div className="flex items-center justify-between mt-2">
          {item.productType === 'ornament' ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateQuantity(item.quantity - 1)}
                className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Minus size={12} />
              </button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.quantity + 1)}
                className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
          )}

          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 transition-colors p-1"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) => {
  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const hasItems = items.length > 0;
  const hasTree = items.some((item) => item.productType === 'tree');

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 pointer-events-auto"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-md
          bg-gray-900/95 backdrop-blur-xl
          border-l border-white/10
          shadow-2xl
          transform transition-transform duration-300 ease-out
          z-50 pointer-events-auto
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-green-400" />
            <h2 className="text-lg font-semibold text-white">Your Cart</h2>
            {hasItems && (
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-64px)]">
          {hasItems ? (
            <>
              {/* Items list */}
              <div className="flex-1 overflow-y-auto px-4">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={(qty) => onUpdateQuantity(item.id, qty)}
                    onRemove={() => onRemoveItem(item.id)}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-black/30">
                {/* Clear cart */}
                <button
                  onClick={onClearCart}
                  className="w-full text-sm text-gray-400 hover:text-red-400 transition-colors mb-3"
                >
                  Clear cart
                </button>

                {/* Totals */}
                <CartTotal subtotal={subtotal} />

                {/* Checkout warning if no tree */}
                {!hasTree && (
                  <p className="text-yellow-400 text-xs mt-3 text-center">
                    Add a tree to complete your order
                  </p>
                )}

                {/* Checkout button */}
                <button
                  onClick={onCheckout}
                  disabled={!hasTree}
                  className={`
                    w-full mt-4 py-3 px-4 rounded-xl
                    flex items-center justify-center gap-2
                    font-semibold transition-all
                    ${
                      hasTree
                        ? 'bg-green-600 hover:bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  Checkout
                  <ArrowRight size={18} />
                </button>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <ShoppingBag size={32} className="text-gray-500" />
              </div>
              <h3 className="text-white font-medium mb-2">Your cart is empty</h3>
              <p className="text-gray-400 text-sm mb-6">
                Start by selecting a tree size, then add ornaments and a topper to decorate it.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              >
                Start Decorating
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
