import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentMethod } from '../types';
import { formatINR } from '../utils/currency';
import { X, CreditCard, QrCode, Building, ShieldCheck, Lock, ArrowRight, Banknote, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    userLocation,
    cart,
    buyNowItem,
    setBuyNowItem,
    getCheckoutTotal,
    processCheckout,
    setIsAuthModalOpen,
  } = useApp();

  const checkoutItems = buyNowItem ? [buyNowItem] : cart;
  const isCustomerAccount = currentUser?.role === 'customer';
  const isWholesaleCart = !isCustomerAccount && checkoutItems.some((i) => i.tierType === 'wholesale');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    isWholesaleCart ? 'net30_escrow' : 'card'
  );

  // Card fields
  const [cardNumber, setCardNumber] = useState('4532 8920 1938 4920');
  const [cardHolder, setCardHolder] = useState(currentUser?.name || 'Customer');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('782');

  // Address synced from active userLocation
  const [shippingAddress, setShippingAddress] = useState(
    userLocation?.address || currentUser?.address || 'Andheri East Commercial Hub, Mumbai'
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(isWholesaleCart ? 'net30_escrow' : 'card');
      setCardHolder(currentUser?.name || 'Customer');
      setShippingAddress(
        userLocation?.address || currentUser?.address || 'Andheri East Commercial Hub, Mumbai'
      );
    }
  }, [isOpen, isWholesaleCart, currentUser, userLocation]);

  // UPI fields
  const [upiId, setUpiId] = useState('omnitrade.buyer@okhdfc');

  // B2B PO
  const [poNumber, setPoNumber] = useState(
    `PO-${Math.floor(10000 + Math.random() * 90000)}`
  );

  // 3D Secure Verification Step
  const [is3DSecureActive, setIs3DSecureActive] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setBuyNowItem(null);
    setIs3DSecureActive(false);
    onClose();
  };

  const { subtotal, tax, shipping, shippingSavings, total, itemCount } = getCheckoutTotal();
  const grandTotal = total;
  const hasHighValueProduct = checkoutItems.some((item) => item.unitPrice >= 5000);
  const isCodEligible = !hasHighValueProduct && subtotal < 5000;

  const handleInitialPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (selectedMethod === 'card') {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIs3DSecureActive(true);
      }, 600);
    } else {
      void executeFinalPayment();
    }
  };

  const executeFinalPayment = async () => {
    setIsProcessing(true);
    try {
      const order = await processCheckout({
        method: selectedMethod,
        shippingAddress,
        cardNumber: selectedMethod === 'card' ? cardNumber : undefined,
        cardHolder: selectedMethod === 'card' ? cardHolder : undefined,
        upiId: selectedMethod === 'upi' ? upiId : undefined,
        poNumber: selectedMethod === 'net30_escrow' ? poNumber : undefined,
      });

      setIs3DSecureActive(false);
      if (order) {
        handleClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {buyNowItem
                  ? 'Express Buy Now Checkout'
                  : isWholesaleCart
                  ? 'B2B Wholesale Procurement Checkout'
                  : 'Secure Order Checkout'}
              </h3>
              <p className="text-xs text-slate-500">
                {buyNowItem
                  ? 'Direct 1-click checkout (your saved cart remains untouched)'
                  : '256-Bit Encrypted Multi-Tier Payment Processing'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Secure Modal Overlay */}
        {is3DSecureActive ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Verified by Visa / 3D Secure 2.0</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                A one-time transaction verification passcode has been sent to your registered mobile ending in ··89.
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-3 pt-2">
              <div className="p-2 bg-slate-100 rounded text-xs text-slate-600 font-mono-numbers">
                Simulated Bank OTP: <span className="font-bold text-slate-900">774910</span>
              </div>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full text-center tracking-widest text-lg font-bold py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpCode('774910')}
                  className="w-1/2 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Autofill OTP
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={executeFinalPayment}
                  className="w-1/2 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  {isProcessing ? 'Verifying...' : 'Authorize'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInitialPay} className="p-6 space-y-5">
            {/* Order Items Preview Strip */}
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Items in Order ({itemCount} units)</span>
                <span className="font-mono-numbers text-slate-900">
                  Total: {formatINR(grandTotal)}
                </span>
              </div>
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {checkoutItems.map((item) => (
                  <div
                    key={`${item.product.id}-${item.tierType}`}
                    className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono-numbers font-semibold text-slate-700">
                        {item.quantity}x
                      </span>
                      <span className="truncate text-slate-800">{item.product.name}</span>
                      {item.selectedSellerName && (
                        <span className="text-[10px] text-emerald-700 font-medium hidden sm:inline">
                          ({item.sellerCity} · {item.sellerDistanceKm}km)
                        </span>
                      )}
                    </div>
                    <span className="font-mono-numbers font-medium text-slate-900 ml-2 shrink-0">
                      {formatINR(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono-numbers">
                <span>Subtotal: {formatINR(subtotal)}</span>
                <span>GST: {formatINR(tax)}</span>
                <span>
                  {isWholesaleCart ? 'Freight' : 'Shipping'}:{' '}
                  <strong className={shipping === 0 ? 'text-emerald-700' : 'text-slate-800'}>
                    {shipping === 0 ? 'FREE' : formatINR(shipping)}
                  </strong>
                </span>
                {shippingSavings > 0 && (
                  <span className="text-emerald-700 font-semibold">
                    Saved {formatINR(shippingSavings)} nearby
                  </span>
                )}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Payment Facility:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`p-3 text-left rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    selectedMethod === 'card'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mb-1" />
                  <div className="font-semibold">Credit / Debit</div>
                  <div className={`text-[10px] ${selectedMethod === 'card' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Visa / MC / RuPay
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('upi')}
                  className={`p-3 text-left rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    selectedMethod === 'upi'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <QrCode className="w-4 h-4 mb-1" />
                  <div className="font-semibold">UPI / Instant QR</div>
                  <div className={`text-[10px] ${selectedMethod === 'upi' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Zero Surcharge
                  </div>
                </button>

                {isCustomerAccount ? (
                  <button
                    type="button"
                    disabled={!isCodEligible}
                    onClick={() => isCodEligible && setSelectedMethod('cod')}
                    className={`p-3 text-left rounded-lg border text-xs font-medium transition-all ${
                      !isCodEligible
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-85'
                        : selectedMethod === 'cod'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm cursor-pointer'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    <Banknote className="w-4 h-4 mb-1" />
                    <div className="font-semibold">
                      {isCodEligible ? 'Cash / Pay on Delivery' : 'COD Not Available'}
                    </div>
                    <div
                      className={`text-[10px] ${
                        !isCodEligible
                          ? 'text-rose-600 font-semibold'
                          : selectedMethod === 'cod'
                          ? 'text-slate-300'
                          : 'text-emerald-700 font-medium'
                      }`}
                    >
                      {isCodEligible
                        ? 'Eligible (Under ₹5,000)'
                        : 'Only for items below ₹5,000'}
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('net30_escrow')}
                    className={`p-3 text-left rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      selectedMethod === 'net30_escrow'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Building className="w-4 h-4 mb-1" />
                    <div className="font-semibold">B2B Net-30 Escrow</div>
                    <div className={`text-[10px] ${selectedMethod === 'net30_escrow' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Commercial Trade
                    </div>
                  </button>
                )}
              </div>

              {isCustomerAccount && !isCodEligible && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>COD not available:</strong> Cash / Pay on Delivery is enabled only for products priced below ₹5,000. Please pay via Credit/Debit Card or UPI.
                  </span>
                </div>
              )}
            </div>

            {/* Method Details */}
            {selectedMethod === 'card' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 ···· ···· 4920"
                    className="w-full px-3 py-2 text-sm font-mono-numbers border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Name on card"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Expiry
                      </label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 text-sm font-mono-numbers border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="···"
                        className="w-full px-3 py-2 text-sm font-mono-numbers border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'upi' && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-4">
                <div className="w-24 h-24 bg-white p-2 border border-slate-300 rounded-lg shrink-0 flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-slate-800" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="text-xs font-semibold text-slate-800">
                    Scan with any UPI App or enter VPA
                  </div>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="user@upi"
                    className="w-full px-3 py-1.5 text-xs font-mono-numbers border border-slate-300 rounded bg-white"
                  />
                  <div className="text-[11px] text-slate-500">
                    Auto-approved in sandbox environment.
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'cod' && isCustomerAccount && isCodEligible && (
              <div className="p-4 bg-emerald-50/70 rounded-lg border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-700" />
                    <span>Cash on Delivery / Pay on Delivery</span>
                  </span>
                  <span className="font-mono-numbers font-bold text-emerald-800">
                    Payable at Doorstep: {formatINR(grandTotal)}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  Pay in cash or scan our delivery agent&apos;s UPI QR code when your order arrives. Eligible for orders under ₹5,000.
                </p>
              </div>
            )}

            {selectedMethod === 'net30_escrow' && !isCustomerAccount && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    Commercial Trade Facility (Net-30)
                  </span>
                  <span className="font-mono-numbers text-emerald-700 font-bold">
                    Available Credit: {formatINR(currentUser?.balanceCredit || 4220000)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Purchase Order Ref #
                    </label>
                    <input
                      type="text"
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono-numbers border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Buyer Tax ID / GSTIN
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser?.taxId || 'GSTIN-VERIFIED'}
                      className="w-full px-3 py-2 text-xs font-mono-numbers border border-slate-200 rounded bg-slate-100 text-slate-500"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Payment is held in Escrow until bill-of-lading confirmation. 30 days interest-free settlement.
                </div>
              </div>
            )}

            {/* Shipping Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delivery / Logistics Destination Address:
              </label>
              <input
                type="text"
                required
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Shipping address"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

            {/* Summary Line */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">
                  {selectedMethod === 'cod' ? 'Pay on Delivery Total:' : 'Settlement Amount:'}
                </span>
                <div className="text-xl font-bold font-mono-numbers text-slate-900">
                  {formatINR(grandTotal)}
                </div>
              </div>
              <button
                type="submit"
                disabled={isProcessing}
                className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isProcessing
                  ? 'Processing Transaction...'
                  : selectedMethod === 'cod'
                  ? 'Confirm Pay on Delivery Order'
                  : 'Confirm & Authorize Payment'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
