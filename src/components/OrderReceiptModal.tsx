import React from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/currency';
import { X, Printer, Download, CheckCircle2, Package, ShieldCheck, MapPin } from 'lucide-react';

export const OrderReceiptModal: React.FC = () => {
  const { selectedOrderReceipt, setSelectedOrderReceipt, addToast } = useApp();

  if (!selectedOrderReceipt) return null;

  const order = selectedOrderReceipt;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    addToast('Invoice PDF generated and downloaded.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top actions */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-800">
              Transaction Completed & Settled in INR (₹)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors text-xs flex items-center gap-1 font-medium"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors text-xs flex items-center gap-1 font-medium"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={() => setSelectedOrderReceipt(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-8 space-y-6 text-slate-800" id="printable-receipt">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-5">
            <div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">OmniTrade</span>
              <p className="text-xs text-slate-500 mt-0.5">
                Unified B2B2C Commerce & Supply Chain Network (India/Global)
              </p>
              <div className="text-xs text-slate-500 mt-2">
                Order Reference: <span className="font-mono-numbers font-bold text-slate-900">{order.orderNumber}</span>
              </div>
              <div className="text-xs text-slate-500">
                Date: <span className="font-mono-numbers">{order.date}</span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  order.paymentStatus === 'pay_on_delivery'
                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}
              >
                {order.paymentStatus === 'pay_on_delivery'
                  ? 'Pay on Delivery'
                  : 'Payment Authorized'}
              </span>
              <div className="text-xs text-slate-500 mt-2">
                Tracking: <span className="font-mono-numbers font-bold text-slate-800">{order.trackingNumber}</span>
              </div>
              <div className="text-xs text-slate-500">
                Method:{' '}
                <span className="uppercase font-medium">
                  {order.paymentMethod === 'cod'
                    ? 'Cash / Pay on Delivery'
                    : order.paymentMethod.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-500 uppercase block mb-1">
                Fulfilled By (Seller)
              </span>
              <div className="font-bold text-slate-900 text-sm">{order.sellerName}</div>
              <div className="text-slate-500 capitalize">Ecosystem Role: {order.sellerRole}</div>
              <div className="text-slate-500 mt-1">GST Registered Trade Merchant</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-500 uppercase block mb-1">
                Billed To (Buyer)
              </span>
              <div className="font-bold text-slate-900 text-sm">{order.buyerName}</div>
              <div className="text-slate-500">{order.buyerEmail}</div>
              <div className="text-slate-600 mt-1 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{order.shippingAddress}</span>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                  <th className="py-2">Item Description</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono-numbers">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="py-2.5">
                    <td className="py-2 font-sans font-medium text-slate-900">
                      {item.productName}
                      <span className="ml-1 text-[10px] text-slate-400 capitalize">
                        ({item.tierType})
                      </span>
                    </td>
                    <td className="py-2 text-slate-500">{item.sku}</td>
                    <td className="py-2 text-center font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-2 text-right text-slate-600">{formatINR(item.unitPrice)}</td>
                    <td className="py-2 text-right font-bold text-slate-900">{formatINR(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-slate-200 pt-3 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono-numbers">{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (Goods & Services Tax):</span>
                <span className="font-mono-numbers">{formatINR(order.taxAmount)}</span>
              </div>
              {order.shippingFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Logistics & Freight:</span>
                  <span className="font-mono-numbers">{formatINR(order.shippingFee)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>Final Settle Total:</span>
                <span className="font-mono-numbers text-base">{formatINR(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Guarantee Footer */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>OmniTrade Verified Escrow & Live Inventory Allocation Guarantee</span>
            </div>
            <span className="font-mono-numbers">Estimated Delivery: {order.estimatedDelivery}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
