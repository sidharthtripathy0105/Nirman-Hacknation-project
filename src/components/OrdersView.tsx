import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import { formatINR } from '../utils/currency';
import { Package, Truck, CheckCircle2, FileText, ArrowRight, Clock, ShieldCheck, MapPin } from 'lucide-react';

export const OrdersView: React.FC = () => {
  const { orders, currentUser, setSelectedOrderReceipt, updateOrderStatus } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter orders relevant to current user
  const relevantOrders = orders.filter((order) => {
    if (!currentUser) return true;
    if (currentUser.role === 'customer') {
      return order.buyerId === currentUser.id;
    } else if (currentUser.role === 'retailer') {
      // Retailer can be buyer (of wholesale lots) or seller (to customers)
      return order.buyerId === currentUser.id || order.sellerId === currentUser.id;
    } else {
      // Wholesaler is seller of B2B POs
      return order.sellerId === currentUser.id || order.sellerRole === 'wholesaler';
    }
  });

  const filteredOrders = relevantOrders.filter((order) => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'processing':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold uppercase">Processing</span>;
      case 'shipped':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[11px] font-semibold uppercase">In Transit</span>;
      case 'delivered':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold uppercase">Delivered</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders & Business Transactions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking verified trade contracts, delivery logistics, and encrypted payment records (in INR)
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
          {['all', 'processing', 'shipped', 'delivered'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-md transition-colors capitalize font-medium ${
                filterStatus === st
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400 space-y-2">
            <Package className="w-10 h-10 mx-auto stroke-1" />
            <p className="text-sm font-medium text-slate-600">No transactions match this filter.</p>
            <p className="text-xs text-slate-400">Orders placed through the store will appear here automatically.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isBuyer = order.buyerId === currentUser?.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono-numbers text-base">
                        {order.orderNumber}
                      </span>
                      {getStatusBadge(order.status)}
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 font-mono-numbers">{order.date}</span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <span>
                        {isBuyer ? (
                          <>Seller: <strong className="text-slate-800">{order.sellerName}</strong> ({order.sellerRole})</>
                        ) : (
                          <>Buyer: <strong className="text-slate-800">{order.buyerName}</strong> ({order.buyerRole})</>
                        )}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono-numbers">Tracking: {order.trackingNumber}</span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                      <div className="text-xs text-slate-400">Settled Amount</div>
                      <div className="text-lg font-bold font-mono-numbers text-slate-900">
                        {formatINR(order.totalAmount)}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium capitalize">
                        {order.paymentMethod === 'cod'
                          ? 'Cash / Pay on Delivery'
                          : order.paymentMethod.replace('_', ' ')}{' '}
                        ({order.paymentStatus.replace(/_/g, ' ')})
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedOrderReceipt(order)}
                      className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                      title="View Official Digital Invoice"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Digital Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Logistics Stepper */}
                <div className="py-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
                    <span className={order.status ? 'text-slate-900 font-bold' : ''}>1. Order Authorized</span>
                    <span className={order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? 'text-slate-900 font-bold' : ''}>
                      2. Warehouse Packaging
                    </span>
                    <span className={order.status === 'shipped' || order.status === 'delivered' ? 'text-slate-900 font-bold' : ''}>
                      3. Freight Dispatched
                    </span>
                    <span className={order.status === 'delivered' ? 'text-emerald-700 font-bold' : ''}>
                      4. Completed Delivery
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        order.status === 'delivered'
                          ? 'w-full bg-emerald-600'
                          : order.status === 'shipped'
                          ? 'w-3/4 bg-indigo-600'
                          : 'w-1/2 bg-amber-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Items in order */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-700">Order Items:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50"
                      >
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-12 h-12 rounded object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {item.productName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono-numbers">
                            {item.quantity} units @ {formatINR(item.unitPrice)}
                          </div>
                          <div className="text-xs font-bold font-mono-numbers text-slate-900">
                            Total: {formatINR(item.total)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer notes & status advance controls if seller */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Destination: {order.shippingAddress}</span>
                  </div>

                  {/* Advance status controls */}
                  <div className="flex items-center gap-2">
                    {order.status === 'processing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                        className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors"
                      >
                        Mark Shipped →
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors"
                      >
                        Confirm Delivered ✓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
