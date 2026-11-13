import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatINR } from '../../utils/currency';
import { rankWholesalerOfferings } from '../../utils/location';
import {
  Store,
  Package,
  TrendingUp,
  Layers,
  ShoppingCart,
  ArrowLeftRight,
  AlertTriangle,
  DollarSign,
  Truck,
  Edit3,
  CheckCircle2,
  MapPin,
  Navigation,
} from 'lucide-react';

export const RetailerDashboard: React.FC = () => {
  const {
    currentUser,
    userLocation,
    setIsLocationModalOpen,
    products,
    orders,
    addToCart,
    setActivePriceComparisonProduct,
    setIsCheckoutOpen,
    updateRetailPrice,
    updateOrderStatus,
    retailerReorderBulk,
    setIsInventoryLogOpen,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'source_bulk' | 'inventory_pricing' | 'customer_orders'>('source_bulk');
  const [selectedBulkQty, setSelectedBulkQty] = useState<Record<string, number>>({});
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<string>('');

  // Retailer specific metrics
  const retailerOrders = orders.filter((o) => o.sellerRole === 'retailer');
  const storeInventoryValuation = products.reduce((sum, p) => sum + p.retailerStock * p.retailPrice, 0);
  const totalItemsInStock = products.reduce((sum, p) => sum + p.retailerStock, 0);
  const lowStockCount = products.filter((p) => p.retailerStock <= p.minStockAlert).length;

  const handleStartEditPrice = (product: Product) => {
    setEditingPriceId(product.id);
    setNewPriceValue(product.retailPrice.toString());
  };

  const handleSavePrice = (productId: string) => {
    const val = parseFloat(newPriceValue);
    if (!isNaN(val) && val > 0) {
      void updateRetailPrice(productId, val);
    }
    setEditingPriceId(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Merchant Header Bar */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Retail Merchant Portal
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-mono-numbers">
                Tax ID: {currentUser?.taxId || 'GSTIN-27AABCU9603R1ZM'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {currentUser?.businessName || 'MetroTech Retail Stores LLC'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Wholesale procurement, regional warehouse freight optimization, real-time store stock sync &amp; retail markup controls (INR)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="px-3.5 py-2.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-xs text-indigo-900 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-indigo-700 shrink-0" />
            <div className="text-left">
              <div className="font-bold">Store Hub: {userLocation.city}</div>
              <div className="text-[10px] text-indigo-700">Nearest Factory Locator →</div>
            </div>
          </button>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-right">
            <div className="text-[11px] text-slate-500 font-medium">Available Net-30 Trade Credit</div>
            <div className="text-lg font-bold font-mono-numbers text-emerald-700">
              {formatINR(currentUser?.balanceCredit || 3000000)}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Store Inventory Value</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-slate-900 mt-1">
            {formatINR(storeInventoryValuation)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {totalItemsInStock} total units across store shelves
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-amber-600 mt-1">
            {lowStockCount} Products
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Require wholesale reorder from factory
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Average Retail Margin</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-emerald-700 mt-1">
            44.8%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Spread between wholesale cost and selling price
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Customer Orders</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-slate-900 mt-1">
            {retailerOrders.length} Fulfilled
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Direct consumer purchases processed
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('source_bulk')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'source_bulk'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Source Bulk from Manufacturers</span>
        </button>

        <button
          onClick={() => setActiveSubTab('inventory_pricing')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'inventory_pricing'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>2. Store Inventory &amp; Retail Markup</span>
        </button>

        <button
          onClick={() => setActiveSubTab('customer_orders')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'customer_orders'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>3. Customer Order Fulfillment ({retailerOrders.length})</span>
        </button>
      </div>

      {/* Tab 1: Source Bulk from Wholesalers / Manufacturers */}
      {activeSubTab === 'source_bulk' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Direct Wholesale &amp; Factory Procurement Catalog
              </h2>
              <p className="text-xs text-slate-500">
                Suppliers are ranked by nearest plant proximity to <strong>{userLocation.city}</strong> to lower bulk truck freight charges.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Factory Proximity Map ({userLocation.city})</span>
              </button>
              <button
                onClick={() => setIsInventoryLogOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Live Warehouse Telemetry
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => {
              const selectedQty = selectedBulkQty[product.id] || product.minMoq;
              const sorted = [...product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty);
              const activeTier = sorted.find((t) => selectedQty >= t.minQty) || product.wholesaleTiers[0];
              const rankedSuppliers = rankWholesalerOfferings(
                product.wholesalerOfferings,
                userLocation,
                selectedQty
              );
              const nearestSupplier = rankedSuppliers[0];

              const effectiveUnitCost = nearestSupplier ? nearestSupplier.unitPriceAtQty : activeTier.unitPrice;
              const projectedProfitPerUnit = product.retailPrice - effectiveUnitCost;
              const projectedMarginPct = Math.round((projectedProfitPerUnit / product.retailPrice) * 100);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-5 space-y-4"
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
                      <div className="text-xs text-slate-600 mt-0.5">
                        Nearest Supplier:{' '}
                        <span className="font-semibold text-slate-900">
                          {nearestSupplier ? nearestSupplier.companyName : product.manufacturerName}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium mt-1">
                        Factory Stock Available: {product.wholesalerStock.toLocaleString()} units
                      </div>
                    </div>
                  </div>

                  {/* Nearest Supplier Freight Recommendation Strip */}
                  {nearestSupplier && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-emerald-950">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-bold">
                            {nearestSupplier.city} Depot ({nearestSupplier.distanceKm} km away)
                          </div>
                          <div className="text-[11px] text-emerald-800">
                            Lead Time: {nearestSupplier.leadTimeDays} days · Est. Freight:{' '}
                            <strong className="font-mono-numbers">
                              {formatINR(nearestSupplier.estimatedFreight)}
                            </strong>
                          </div>
                        </div>
                      </div>
                      {nearestSupplier.freightSavingsVsFarthest > 0 && (
                        <span className="text-[11px] font-bold font-mono-numbers text-emerald-800 bg-white border border-emerald-300 px-2 py-1 rounded">
                          Save {formatINR(nearestSupplier.freightSavingsVsFarthest)} freight
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bulk Tiers Visual Matrix */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Volume Discount Tiers:
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {product.wholesaleTiers.map((tier, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setSelectedBulkQty((prev) => ({ ...prev, [product.id]: tier.minQty }))
                          }
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            selectedQty === tier.minQty
                              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-[11px] font-medium text-slate-500">
                            {tier.minQty}+ units
                          </div>
                          <div className="text-sm font-bold font-mono-numbers">
                            {formatINR(tier.unitPrice)}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-medium">
                            {Math.round(((product.retailPrice - tier.unitPrice) / product.retailPrice) * 100)}% margin
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity selector & Margin Calculator */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-slate-500">Procurement Order Qty:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          min={product.minMoq}
                          step={10}
                          value={selectedQty}
                          onChange={(e) =>
                            setSelectedBulkQty((prev) => ({
                              ...prev,
                              [product.id]: Math.max(product.minMoq, parseInt(e.target.value) || product.minMoq),
                            }))
                          }
                          className="w-24 px-2.5 py-1 text-xs font-mono-numbers font-bold border border-slate-300 rounded bg-white"
                        />
                        <span className="text-slate-500 text-[11px]">units</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-slate-500 text-[11px]">Total Lot Investment:</div>
                      <div className="text-base font-bold font-mono-numbers text-slate-900">
                        {formatINR(selectedQty * effectiveUnitCost)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold font-mono-numbers">
                        +{formatINR(selectedQty * projectedProfitPerUnit)} Est. Profit ({projectedMarginPct}%)
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setActivePriceComparisonProduct(product)}
                      className="w-1/2 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Compare Suppliers</span>
                    </button>
                    <button
                      onClick={() => {
                        addToCart(
                          product,
                          selectedQty,
                          'wholesale',
                          activeTier,
                          nearestSupplier
                            ? {
                                sellerId: nearestSupplier.wholesalerId,
                                sellerName: nearestSupplier.companyName,
                                sellerCity: nearestSupplier.city,
                                distanceKm: nearestSupplier.distanceKm,
                                unitPriceOverride: nearestSupplier.unitPriceAtQty,
                              }
                            : undefined
                        );
                        setIsCheckoutOpen(true);
                      }}
                      className="w-1/2 py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Order Bulk Lot ({selectedQty})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Store Inventory & Markup Control */}
      {activeSubTab === 'inventory_pricing' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Store Shelf Inventory &amp; Dynamic Retail Markup Controls
            </h2>
            <p className="text-xs text-slate-500">
              Manage your local retail shelf levels. Adjust your retail selling price here and it instantly updates across the consumer catalog.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3 px-4">Item &amp; SKU</th>
                  <th className="py-3 px-4">Wholesale Cost</th>
                  <th className="py-3 px-4">Current Retail Price</th>
                  <th className="py-3 px-4">Gross Margin</th>
                  <th className="py-3 px-4">Store Shelf Units</th>
                  <th className="py-3 px-4 text-right">Quick Restock (Nearest)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((product) => {
                  const marginDollars = product.retailPrice - product.retailerCost;
                  const marginPercent = Math.round((marginDollars / product.retailPrice) * 100);
                  const isLow = product.retailerStock <= product.minStockAlert;
                  const nearestSup = rankWholesalerOfferings(
                    product.wholesalerOfferings,
                    userLocation,
                    product.minMoq
                  )[0];

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

                      <td className="py-3 px-4 font-mono-numbers font-medium text-slate-600">
                        {formatINR(product.retailerCost)}
                      </td>

                      <td className="py-3 px-4">
                        {editingPriceId === product.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">₹</span>
                            <input
                              type="number"
                              step="10"
                              value={newPriceValue}
                              onChange={(e) => setNewPriceValue(e.target.value)}
                              className="w-24 px-2 py-1 text-xs font-mono-numbers font-bold border border-indigo-500 rounded bg-white"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSavePrice(product.id)}
                              className="px-2 py-1 bg-indigo-600 text-white rounded text-[11px] font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[11px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono-numbers font-bold text-slate-900">
                              {formatINR(product.retailPrice)}
                            </span>
                            <button
                              onClick={() => handleStartEditPrice(product)}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Edit retail price"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono-numbers font-bold text-emerald-700">
                          +{marginPercent}% ({formatINR(marginDollars)})
                        </div>
                        <div className="text-[10px] text-slate-400">
                          MSRP: {formatINR(product.suggestedRetailPrice)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono-numbers font-bold text-slate-900">
                          {product.retailerStock} units
                        </div>
                        {isLow ? (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Low Stock (Alert: {product.minStockAlert})
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Safe threshold ({product.minStockAlert})
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            retailerReorderBulk(
                              product.id,
                              product.minMoq,
                              nearestSup ? nearestSup.unitPriceAtQty : product.wholesaleTiers[0].unitPrice,
                              nearestSup
                                ? {
                                    sellerId: nearestSup.wholesalerId,
                                    sellerName: nearestSup.companyName,
                                    sellerCity: nearestSup.city,
                                    distanceKm: nearestSup.distanceKm,
                                    unitPriceOverride: nearestSup.unitPriceAtQty,
                                  }
                                : undefined
                            )
                          }
                          className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          Restock MOQ ({product.minMoq})
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Customer Orders & Fulfillment */}
      {activeSubTab === 'customer_orders' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Retail Customer Orders Fulfillment
            </h2>
            <p className="text-xs text-slate-500">
              Orders placed by direct consumers in small quantities. Update shipment status and print fulfillment labels.
            </p>
          </div>

          <div className="space-y-3">
            {retailerOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400">
                <Package className="w-10 h-10 mx-auto stroke-1 mb-2" />
                <p className="text-xs">No customer orders placed yet.</p>
              </div>
            ) : (
              retailerOrders.map((order) => (
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
                        <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Buyer: <span className="font-semibold text-slate-800">{order.buyerName}</span> ({order.buyerEmail})
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Settlement</div>
                      <div className="text-base font-bold font-mono-numbers text-slate-900">
                        {formatINR(order.totalAmount)}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-medium">
                        Paid via {order.paymentMethod.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-numbers font-bold text-slate-900">
                            {item.quantity}x
                          </span>
                          <span>{item.productName}</span>
                          <span className="text-slate-400 text-[10px]">({item.sku})</span>
                        </div>
                        <span className="font-mono-numbers font-medium">{formatINR(item.total)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Fulfillment Action Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Destination: {order.shippingAddress}
                    </span>
                    <div className="flex items-center gap-2">
                      {order.status === 'processing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch & Mark as Shipped</span>
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Delivery</span>
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Delivered & Closed
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
