import React from 'react';
import { CheckCircle, Package, Truck, Calendar, X } from 'lucide-react';
import { Order, formatPrice } from '../types';

interface OrderConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!isOpen || !order) return null;

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 10);

  const treeItem = order.cartSnapshot.items.find((item) => item.productType === 'tree');
  const ornamentItems = order.cartSnapshot.items.filter((item) => item.productType === 'ornament');
  const topperItem = order.cartSnapshot.items.find((item) => item.productType === 'topper');

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Order Confirmed!</h2>
              <p className="text-xs text-gray-400">Thank you for your purchase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Order Number */}
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Order Number</p>
            <p className="text-lg font-mono font-semibold text-white">
              {order.id.toUpperCase()}
            </p>
          </div>

          {/* Confirmation Email */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="text-sm text-green-400 text-center">
              Confirmation email sent to{' '}
              <span className="font-medium">{order.shippingAddress.email}</span>
            </p>
          </div>

          {/* Order Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Package size={16} />
              Order Summary
            </h3>

            <div className="space-y-2">
              {/* Tree */}
              {treeItem && (
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎄</span>
                    <span className="text-sm text-white">Christmas Tree</span>
                  </div>
                  <span className="text-sm text-green-400">
                    {formatPrice(treeItem.unitPrice)}
                  </span>
                </div>
              )}

              {/* Ornaments */}
              {ornamentItems.length > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎁</span>
                    <span className="text-sm text-white">
                      Ornaments ({ornamentItems.length})
                    </span>
                  </div>
                  <span className="text-sm text-green-400">
                    {formatPrice(
                      ornamentItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
                    )}
                  </span>
                </div>
              )}

              {/* Topper */}
              {topperItem && (
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <span className="text-sm text-white">Tree Topper</span>
                  </div>
                  <span className="text-sm text-green-400">
                    {formatPrice(topperItem.unitPrice)}
                  </span>
                </div>
              )}

              {/* Totals */}
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Shipping</span>
                  <span>
                    {order.shippingCost === 0 ? (
                      <span className="text-green-400">FREE</span>
                    ) : (
                      formatPrice(order.shippingCost)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Tax</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between text-white font-semibold pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span className="text-green-400">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Truck size={16} />
              Shipping To
            </h3>
            <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-300">
              <p className="font-medium text-white">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p>{order.shippingAddress.addressLine2}</p>
              )}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}
              </p>
            </div>
          </div>

          {/* Estimated Delivery */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Calendar size={16} />
              Estimated Delivery
            </h3>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-white">
                {estimatedDelivery.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Your custom decorated tree will be carefully crafted and shipped
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/30">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors"
          >
            Start Decorating Another Tree
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
