import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, WholesaleTier } from '../../types';
import { formatINR } from '../../utils/currency';
import { Factory, Package, Layers, TrendingUp, CheckCircle2, Truck, Plus, ShieldCheck, DollarSign, Settings2, BarChart2 } from 'lucide-react';

export const WholesalerDashboard: React.FC = () => {
  const {
    currentUser,
    products,
    orders,
    factoryProduceBatch,
    updateWholesaleTiers,
    updateOrderStatus,
    setIsInventoryLogOpen,
    setActivePriceComparisonProduct,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'factory_production' | 'pricing_engine' | 'b2b_pos'>('factory_production');
  const [editingTierProductId, setEditingTierProductId] = useState<string | null>(null);
  const [tempTiers, setTempTiers] = useState<WholesaleTier[]>([]);

  // B2B Wholesale POs
  const b2bOrders = orders.filter((o) => o.sellerRole === 'wholesaler');
  const totalPlantStock = products.reduce((sum, p) => sum + p.wholesalerStock, 0);
  const totalB2BVolumeSold = b2bOrders.reduce(
    (sum, o) => sum + o.items.reduce((acc, i) => acc + i.quantity, 0),
    0
  );
  const b2bGrossRevenue = b2bOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const startEditTiers = (product: Product) => {
    setEditingTierProductId(product.id);
    setTempTiers(JSON.parse(JSON.stringify(product.wholesaleTiers)));
  };

  const saveTiers = (productId: string) => {
    updateWholesaleTiers(productId, tempTiers);
    setEditingTierProductId(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Wholesaler / Manufacturer Header Bar */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Manufacturing & Wholesale Hub
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-mono-numbers">
                Facility License: {currentUser?.taxId || 'GSTIN-07AAAAA0000A1Z5'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {currentUser?.businessName || 'Apex Industrial Manufacturing Corp'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct factory supply, batch assembly line controls, tiered volume price engines & distributor PO fulfillment (in INR)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsInventoryLogOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" />
            <span>Plant Telemetry</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Plant Inventory Reserve</span>
            <Factory className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-slate-900 mt-1">
            {totalPlantStock.toLocaleString()} Units
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Warehoused across factory floor bays
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>B2B Pipeline Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-emerald-700 mt-1">
            {formatINR(b2bGrossRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Bulk orders from certified retailers
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Total B2B Volume Shipped</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-slate-900 mt-1">
            {totalB2BVolumeSold.toLocaleString()} Units
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Units distributed to retail partners
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Active Purchase Orders</span>
            <Package className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-slate-900 mt-1">
            {b2bOrders.length} POs
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Net-30 Escrow trade contracts
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6">
        <button
          onClick={() => setActiveSubTab('factory_production')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'factory_production'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>1. Production Runs & Factory Inventory</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pricing_engine')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'pricing_engine'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>2. Tiered Wholesale Pricing Engine</span>
        </button>

        <button
          onClick={() => setActiveSubTab('b2b_pos')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'b2b_pos'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>3. Incoming Retailer Purchase Orders ({b2bOrders.length})</span>
        </button>
      </div>

      {/* SubTab 1: Production Runs & Factory Inventory */}
      {activeSubTab === 'factory_production' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Manufacturing Assembly & Warehouse Stock Controls
              </h2>
              <p className="text-xs text-slate-500">
                Monitor factory cost floor and schedule automated production batches into central distribution bays.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex gap-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-20 rounded-lg object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-slate-500 font-mono-numbers">
                      SKU: {product.sku} · MOQ: {product.minMoq} units
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 truncate">{product.name}</h3>
                    <div className="text-xs text-slate-600 mt-1">
                      Direct Manufacturing Cost: <span className="font-mono-numbers font-bold text-slate-900">{formatINR(product.factoryCost)}</span>
                    </div>
                    <div className="text-xs text-amber-800 font-semibold mt-1">
                      Current Plant Stock: <span className="font-mono-numbers font-bold">{product.wholesalerStock.toLocaleString()} units</span>
                    </div>
                  </div>
                </div>

                {/* Production trigger buttons */}
                <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2">
                  <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Initiate Assembly Line Batch:</span>
                    <span className="text-[11px] text-slate-500">Instant Telemetry Update</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => factoryProduceBatch(product.id, 250)}
                      className="flex-1 py-1.5 px-3 bg-white border border-slate-300 hover:border-amber-600 hover:text-amber-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+250 Units</span>
                    </button>
                    <button
                      onClick={() => factoryProduceBatch(product.id, 500)}
                      className="flex-1 py-1.5 px-3 bg-white border border-slate-300 hover:border-amber-600 hover:text-amber-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+500 Units</span>
                    </button>
                    <button
                      onClick={() => factoryProduceBatch(product.id, 1000)}
                      className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+1,000 Units</span>
                    </button>
                  </div>
                </div>

                {/* Comparison link */}
                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Retail shelf count: {product.retailerStock} units</span>
                  <button
                    onClick={() => setActivePriceComparisonProduct(product)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    View Multi-Tier Price Matrix →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: Tiered Wholesale Pricing Engine */}
      {activeSubTab === 'pricing_engine' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Volume Discount Brackets & Tier Management
            </h2>
            <p className="text-xs text-slate-500">
              Configure minimum order quantities (MOQ) and volume rate tiers for retailers and commercial distributors.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Factory Cost</th>
                  <th className="py-3 px-4">Tier 1 Rate</th>
                  <th className="py-3 px-4">Tier 2 Rate</th>
                  <th className="py-3 px-4">Tier 3 Rate</th>
                  <th className="py-3 px-4 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((product) => {
                  const isEditing = editingTierProductId === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{product.name}</div>
                        <div className="text-[11px] font-mono-numbers text-slate-500">{product.sku}</div>
                      </td>

                      <td className="py-3 px-4 font-mono-numbers font-bold text-slate-700">
                        {formatINR(product.factoryCost)}
                      </td>

                      {/* Tier 1 */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">₹</span>
                            <input
                              type="number"
                              value={tempTiers[0]?.unitPrice || 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...tempTiers];
                                updated[0] = { ...updated[0], unitPrice: val };
                                setTempTiers(updated);
                              }}
                              className="w-20 px-1.5 py-0.5 border border-amber-500 rounded bg-white font-mono-numbers text-xs"
                            />
                            <span className="text-[10px] text-slate-400">({tempTiers[0]?.minQty}+)</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono-numbers font-bold text-slate-900">
                              {formatINR(product.wholesaleTiers[0]?.unitPrice || 0)}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({product.wholesaleTiers[0]?.minQty}+ units)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Tier 2 */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">₹</span>
                            <input
                              type="number"
                              value={tempTiers[1]?.unitPrice || 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...tempTiers];
                                updated[1] = { ...updated[1], unitPrice: val };
                                setTempTiers(updated);
                              }}
                              className="w-20 px-1.5 py-0.5 border border-amber-500 rounded bg-white font-mono-numbers text-xs"
                            />
                            <span className="text-[10px] text-slate-400">({tempTiers[1]?.minQty}+)</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono-numbers font-bold text-slate-900">
                              {formatINR(product.wholesaleTiers[1]?.unitPrice || 0)}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({product.wholesaleTiers[1]?.minQty}+ units)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Tier 3 */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">₹</span>
                            <input
                              type="number"
                              value={tempTiers[2]?.unitPrice || 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...tempTiers];
                                updated[2] = { ...updated[2], unitPrice: val };
                                setTempTiers(updated);
                              }}
                              className="w-20 px-1.5 py-0.5 border border-amber-500 rounded bg-white font-mono-numbers text-xs"
                            />
                            <span className="text-[10px] text-slate-400">({tempTiers[2]?.minQty}+)</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono-numbers font-bold text-slate-900">
                              {formatINR(product.wholesaleTiers[2]?.unitPrice || 0)}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({product.wholesaleTiers[2]?.minQty}+ units)
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => saveTiers(product.id)}
                              className="px-2.5 py-1 bg-amber-600 text-white rounded text-[11px] font-semibold"
                            >
                              Save Tiers
                            </button>
                            <button
                              onClick={() => setEditingTierProductId(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditTiers(product)}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          >
                            Configure Tiers
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 3: Incoming Retailer Purchase Orders */}
      {activeSubTab === 'b2b_pos' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              B2B Commercial Purchase Orders & Freight Dispatch
            </h2>
            <p className="text-xs text-slate-500">
              Bulk volume orders placed by certified retail store networks under Net-30 Escrow facilities.
            </p>
          </div>

          <div className="space-y-3">
            {b2bOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400">
                <Truck className="w-10 h-10 mx-auto stroke-1 mb-2" />
                <p className="text-xs">No active B2B purchase orders at this moment.</p>
              </div>
            ) : (
              b2bOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono-numbers">
                          {order.orderNumber}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500 font-mono-numbers">{order.date}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Procuring Merchant: <span className="font-semibold text-slate-900">{order.buyerName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Commercial Contract Value</div>
                      <div className="text-lg font-bold font-mono-numbers text-slate-900">
                        {formatINR(order.totalAmount)}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        Payment Facility: Net-30 Escrow
                      </div>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="space-y-1.5 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-numbers font-bold text-slate-900">
                            {item.quantity} units lot
                          </span>
                          <span>{item.productName}</span>
                          <span className="text-slate-400 text-[10px]">({item.sku})</span>
                        </div>
                        <span className="font-mono-numbers font-bold text-slate-900">
                          {formatINR(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Freight Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Destination: {order.shippingAddress} (Tracking: {order.trackingNumber})
                    </span>
                    <div className="flex items-center gap-2">
                      {order.status === 'processing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch Freight Carrier</span>
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Acknowledge Delivery & Release Escrow</span>
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Delivered & Escrow Settled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
