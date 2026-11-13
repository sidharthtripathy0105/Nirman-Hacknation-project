import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, Factory, Store, ShieldCheck } from 'lucide-react';

interface InventoryTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InventoryTrackerModal: React.FC<InventoryTrackerModalProps> = ({ isOpen, onClose }) => {
  const { products, inventoryLogs, factoryProduceBatch, currentUser, retailerReorderBulk } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'audit_logs'>('overview');
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const filteredLogs = inventoryLogs.filter((log) => {
    if (filterType === 'all') return true;
    return log.type === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Real-Time Multi-Tier Inventory Tracking System
              </h3>
              <p className="text-xs text-slate-500">
                Synchronized telemetry between Factory Warehouses and Retail Store Shelves
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex p-0.5 bg-slate-200 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Stock Telemetry
              </button>
              <button
                onClick={() => setActiveTab('audit_logs')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'audit_logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Audit Log ({inventoryLogs.length})
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Factory className="w-4 h-4 text-slate-700" />
                    <span>Total Factory Reserve Units</span>
                  </div>
                  <div className="text-2xl font-bold font-mono-numbers text-slate-900 mt-1">
                    {products.reduce((acc, p) => acc + p.wholesalerStock, 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Across all manufacturing hubs</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-indigo-700" />
                    <span>Retail Store Shelf Units</span>
                  </div>
                  <div className="text-2xl font-bold font-mono-numbers text-slate-900 mt-1">
                    {products.reduce((acc, p) => acc + p.retailerStock, 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Ready for consumer checkout</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Low Stock Alerts</span>
                  </div>
                  <div className="text-2xl font-bold font-mono-numbers text-amber-700 mt-1">
                    {products.filter((p) => p.retailerStock <= p.minStockAlert).length} SKUs
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Below reorder safety threshold</div>
                </div>
              </div>

              {/* Product Live Matrix Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="py-3 px-4">Item & SKU</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Retail Store Stock</th>
                      <th className="py-3 px-4">Wholesale Plant Stock</th>
                      <th className="py-3 px-4">Status & Health</th>
                      <th className="py-3 px-4 text-right">Instant Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {products.map((product) => {
                      const isLow = product.retailerStock <= product.minStockAlert;
                      return (
                        <tr key={product.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-9 h-9 rounded object-cover border border-slate-200"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <div className="font-semibold text-slate-900">{product.name}</div>
                                <div className="text-[11px] font-mono-numbers text-slate-500">
                                  {product.sku}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600">{product.category}</td>

                          <td className="py-3 px-4">
                            <div className="font-mono-numbers font-bold text-slate-900">
                              {product.retailerStock} units
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Threshold: {product.minStockAlert}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-mono-numbers font-bold text-slate-900">
                              {product.wholesalerStock.toLocaleString()} units
                            </div>
                            <div className="text-[10px] text-slate-400">
                              MOQ: {product.minMoq} units
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded font-medium">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Retail Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded font-medium">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Optimal Stock
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Wholesaler Batch Production */}
                              <button
                                onClick={() => factoryProduceBatch(product.id, 500)}
                                className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                                title="Produce factory batch"
                              >
                                +500 Plant Units
                              </button>

                              {/* Retailer Restock Trigger */}
                              <button
                                onClick={() => retailerReorderBulk(product.id, product.minMoq, product.wholesaleTiers[0].unitPrice)}
                                className="px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                              >
                                Reorder Bulk PO
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Audit Log View */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  Real-time immutable ledger of every retail deduction, wholesale order, and factory restock:
                </span>
                <div className="flex gap-1.5 text-xs">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded border ${
                      filterType === 'all'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    All Events
                  </button>
                  <button
                    onClick={() => setFilterType('customer_sale')}
                    className={`px-2.5 py-1 rounded border ${
                      filterType === 'customer_sale'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Sales (-Qty)
                  </button>
                  <button
                    onClick={() => setFilterType('b2b_wholesale_purchase')}
                    className={`px-2.5 py-1 rounded border ${
                      filterType === 'b2b_wholesale_purchase'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Wholesale POs
                  </button>
                  <button
                    onClick={() => setFilterType('factory_restock')}
                    className={`px-2.5 py-1 rounded border ${
                      filterType === 'factory_restock'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Factory Batches
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Event Type</th>
                      <th className="py-2.5 px-4">Product</th>
                      <th className="py-2.5 px-4">Stock Delta</th>
                      <th className="py-2.5 px-4">Actor</th>
                      <th className="py-2.5 px-4">Ledger Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredLogs.map((log) => {
                      const isNegative = log.quantityDelta < 0;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 font-mono-numbers">
                          <td className="py-3 px-4 text-slate-500 font-sans">{log.timestamp}</td>
                          <td className="py-3 px-4 font-sans">
                            <span className="capitalize font-semibold text-slate-800">
                              {log.type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <div className="font-semibold text-slate-900">{log.productName}</div>
                            <div className="text-[10px] text-slate-400">{log.sku}</div>
                          </td>
                          <td className="py-3 px-4 font-bold">
                            <span
                              className={`flex items-center gap-1 ${
                                isNegative ? 'text-rose-600' : 'text-emerald-700'
                              }`}
                            >
                              {isNegative ? (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              )}
                              {log.quantityDelta > 0 ? `+${log.quantityDelta}` : log.quantityDelta}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-700">
                            <div>{log.actorName}</div>
                            <div className="text-[10px] text-slate-400 capitalize">
                              Role: {log.actorRole}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-600 max-w-xs truncate">
                            {log.notes}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
