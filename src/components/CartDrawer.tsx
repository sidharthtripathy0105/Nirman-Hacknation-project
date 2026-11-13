import React from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/currency';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const {
    cart,
    setBuyNowItem,
    removeFromCart,
    updateCartQuantity,
    getCartTotal,
    userLocation,
    setIsLocationModalOpen,
  } = useApp();

  if (!isOpen) return null;

  const { subtotal, tax, shipping, shippingSavings, total, itemCount } = getCartTotal();
  const isWholesale = cart.some((i) => i.tierType === 'wholesale');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-slate-800" />
              <h3 className="font-bold text-slate-900">Your Trade Order ({itemCount})</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Hub Banner */}
          <div className="px-4 py-2.5 bg-emerald-50/70 border-b border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-900">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Hub: <strong>{userLocation.city}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsLocationModalOpen(true);
              }}
              className="text-[11px] font-semibold text-emerald-800 underline cursor-pointer"
            >
              Change Hub
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <ShoppingBag className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-sm">Your order basket is currently empty.</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.tierType}`}
                  className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-2.5"
                >
                  <div className="flex gap-3">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-14 h-14 rounded-md object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-semibold text-slate-900 truncate">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.tierType)}
                          className="text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono-numbers">
                        SKU: {item.product.sku}
                      </div>

                      {item.selectedSellerName && (
                        <div className="text-[11px] text-emerald-700 font-medium mt-0.5 truncate">
                          Seller: {item.selectedSellerName}
                          {item.sellerCity ? ` (${item.sellerCity}` : ''}
                          {typeof item.sellerDistanceKm === 'number'
                            ? ` · ${item.sellerDistanceKm} km)`
                            : item.sellerCity
                            ? ')'
                            : ''}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold font-mono-numbers text-slate-900">
                          {formatINR(item.unitPrice)} / unit
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium capitalize">
                          {item.tierType === 'wholesale' ? 'Bulk Lot' : 'Retail Unit'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">Order Quantity:</span>
                    <div className="flex items-center border border-slate-300 rounded-md bg-slate-50">
                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.product.id,
                            item.tierType === 'wholesale'
                              ? Math.max(item.product.minMoq, item.quantity - 10)
                              : item.quantity - 1,
                            item.tierType
                          )
                        }
                        className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 transition-colors font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 font-mono-numbers font-semibold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.product.id,
                            item.tierType === 'wholesale' ? item.quantity + 10 : item.quantity + 1,
                            item.tierType
                          )
                        }
                        className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-mono-numbers font-bold text-slate-900">
                      {formatINR(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono-numbers font-medium text-slate-900">
                    {formatINR(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    {isWholesale ? 'Wholesale GST Exemption (0%):' : 'Estimated GST (18%):'}
                  </span>
                  <span className="font-mono-numbers font-medium text-slate-900">
                    {formatINR(tax)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{isWholesale ? 'Distance-Based Freight:' : 'Local Delivery Shipping:'}</span>
                  <span
                    className={`font-mono-numbers font-semibold ${
                      shipping === 0 ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {shipping === 0 ? 'FREE' : formatINR(shipping)}
                  </span>
                </div>
                {shippingSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Nearest Seller Logistics Savings:</span>
                    <span className="font-mono-numbers">-{formatINR(shippingSavings)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Order Amount:</span>
                  <span className="font-mono-numbers text-base">{formatINR(total)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Synchronized inventory reserved upon order confirmation.</span>
              </div>

              <button
                onClick={() => {
                  setBuyNowItem(null);
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Secure Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
