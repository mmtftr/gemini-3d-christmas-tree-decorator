import React, { useState } from 'react';
import { X, CreditCard, Truck, ArrowLeft, Loader2 } from 'lucide-react';
import { ShippingAddress, Cart, formatPrice } from '../types';
import { CartTotal } from './PriceTag';

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart;
  onSubmit: (address: ShippingAddress) => Promise<void>;
}

// Swiss Cantons
const SWISS_CANTONS = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR',
  'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG',
  'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH',
];

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  isOpen,
  onClose,
  cart,
  onSubmit,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: 'Max Muster',
    email: 'max.muster@example.ch',
    phone: '+41 79 123 45 67',
    addressLine1: 'Bahnhofstrasse 1',
    addressLine2: '',
    city: 'Zürich',
    state: 'ZH',
    postalCode: '8001',
    country: 'CH',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const isValid =
    formData.fullName.trim() &&
    formData.email.trim() &&
    formData.addressLine1.trim() &&
    formData.city.trim() &&
    formData.state &&
    formData.postalCode.trim();

  // Calculate shipping based on cart subtotal
  const shippingCost = cart.subtotal >= 50000 ? 0 : 1999; // Free shipping over CHF 500
  const taxRate = 0.08; // 8% tax
  const tax = Math.round(cart.subtotal * taxRate);
  const total = cart.subtotal + shippingCost + tax;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-white">Checkout</h2>
              <p className="text-xs text-gray-400">Enter shipping details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <CreditCard size={16} />
                Contact Information
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Max Muster"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs text-gray-400 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="max@example.ch"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs text-gray-400 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    placeholder="+41 79 123 45 67"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Truck size={16} />
                Shipping Address
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    placeholder="Bahnhofstrasse 1"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2 || ''}
                    onChange={handleChange}
                    placeholder="Wohnung 4B"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Zürich"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Canton *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                    >
                      <option value="">Select...</option>
                      {SWISS_CANTONS.map((canton) => (
                        <option key={canton} value={canton}>
                          {canton}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Postal Code *</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="8001"
                      required
                      pattern="[0-9]{4}"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Country</label>
                    <input
                      type="text"
                      value="United States"
                      disabled
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-medium text-gray-300">Order Summary</h3>
              <div className="bg-white/5 rounded-lg p-3">
                <CartTotal
                  subtotal={cart.subtotal}
                  shipping={shippingCost}
                  tax={tax}
                  total={total}
                />
                {shippingCost === 0 && (
                  <p className="text-xs text-green-400 mt-2 text-center">
                    Free shipping on orders over CHF 500
                  </p>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-black/30">
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                isValid && !isLoading
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Pay {formatPrice(total)}
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-500 text-center mt-2">
              You will be redirected to Stripe for secure payment
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutForm;
