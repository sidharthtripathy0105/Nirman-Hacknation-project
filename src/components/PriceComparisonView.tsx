import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/currency';
import { rankRetailerOfferings, rankWholesalerOfferings } from '../utils/location';
import {
  ArrowLeftRight,
  ShieldCheck,
  Store,
  Factory,
  Layers,
  Banknote,
  MapPin,
} from 'lucide-react';

export const PriceComparisonView: React.FC = () => {
  const {
    products,
    setActivePriceComparisonProduct,
    userLocation,
    setIsLocationModalOpen,
    addToCart,
    setIsCheckoutOpen,
  } = useApp();
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [simulatedQty, setSimulatedQty] = useState<number>(50);

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];

  if (!activeProduct) return null;

  const sortedTiers = [...activeProduct.wholesaleTiers].sort((a, b) => b.minQty - a.minQty);
  const matchingTier = sortedTiers.find((t) => simulatedQty >= t.minQty) || activeProduct.wholesaleTiers[0];
  const totalWholesaleCost = simulatedQty * matchingTier.unitPrice;
  const totalRetailRevenue = simulatedQty * activeProduct.retailPrice;
  const totalProjectedProfit = totalRetailRevenue - totalWholesaleCost;
  const marginPct = Math.round((totalProjectedProfit / totalRetailRevenue) * 100);

  const rankedRetailers = rankRetailerOfferings(activeProduct.retailerOfferings, userLocation, 1);
  const rankedWholesalers = rankWholesalerOfferings(
    activeProduct.wholesalerOfferings,
    userLocation,
    simulatedQty
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Transparent Supply Chain Economics</span>
            </div>
            <span className="text-slate-300">·</span>
            <div className="text-amber-700 font-mono-numbers flex items-center gap-1 lowercase">
              <Banknote className="w-3.5 h-3.5" />
              <span>INR benchmark (1 USD ≈ ₹93.80)</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cross-Tier Price &amp; Proximity Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Compare manufacturing floor costs, nearest wholesale freight routes, retail shelf markups, and hyperlocal consumer shipping fees from <strong>{userLocation.city}</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsLocationModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Active Hub: {userLocation.city}</span>
        </button>
      </div>

      {/* Product Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProductId(p.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              selectedProductId === p.id
                ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <img
              src={p.image}
              alt={p.name}
              className="w-5 h-5 rounded object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="font-semibold">{p.name}</span>
            <span className="font-mono-numbers opacity-80">{formatINR(p.retailPrice, false)}</span>
          </button>
        ))}
      </div>

      {/* Selected Product Master Comparison Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={activeProduct.image}
              alt={activeProduct.name}
              className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-numbers text-slate-500">SKU: {activeProduct.sku}</span>
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-slate-600 font-medium">{activeProduct.category}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{activeProduct.name}</h2>
              <p className="text-xs text-slate-500 line-clamp-1">{activeProduct.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePriceComparisonProduct(activeProduct)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Full Waterfall View</span>
            </button>
          </div>
        </div>

        {/* 4-Column Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200">
          <div className="p-5">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Factory className="w-3.5 h-3.5 text-slate-400" />
              <span>1. Direct Factory Cost</span>
            </div>
            <div className="text-2xl font-bold font-mono-numbers text-slate-900 mt-1">
              {formatINR(activeProduct.factoryCost)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Manufacturing floor cost</div>
          </div>

          <div className="p-5">
            <div className="text-xs text-amber-800 font-medium flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>2. Bulk Wholesale Range</span>
            </div>
            <div className="text-2xl font-bold font-mono-numbers text-amber-900 mt-1">
              {formatINR(activeProduct.wholesaleTiers[activeProduct.wholesaleTiers.length - 1].unitPrice)} -{' '}
              {formatINR(activeProduct.wholesaleTiers[0].unitPrice)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">MOQ {activeProduct.minMoq}+ units bulk</div>
          </div>

          <div className="p-5">
            <div className="text-xs text-indigo-700 font-medium flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-indigo-600" />
              <span>3. Retail Store Price</span>
            </div>
            <div className="text-2xl font-bold font-mono-numbers text-indigo-900 mt-1">
              {formatINR(activeProduct.retailPrice)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Single unit customer shelf price</div>
          </div>

          <div className="p-5">
            <div className="text-xs text-slate-500 font-medium">4. Recommended MSRP</div>
            <div className="text-2xl font-bold font-mono-numbers text-slate-400 line-through mt-1">
              {formatINR(activeProduct.suggestedRetailPrice)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Consumer saves {formatINR(activeProduct.suggestedRetailPrice - activeProduct.retailPrice)}
            </div>
          </div>
        </div>

        {/* Interactive Volume Simulator */}
        <div className="p-6 bg-slate-50/60 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Interactive Volume &amp; Margin Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Simulate bulk order quantity to see how wholesale discounts &amp; regional freight affect net profit
              </p>
            </div>
            <div className="text-xs text-slate-600">
              Selected Quantity:{' '}
              <span className="font-bold font-mono-numbers text-slate-900">{simulatedQty} units</span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min={activeProduct.minMoq}
              max={1000}
              step={10}
              value={simulatedQty}
              onChange={(e) => setSimulatedQty(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono-numbers">
              <span>MOQ {activeProduct.minMoq} units</span>
              <span>250 units</span>
              <span>500 units</span>
              <span>1,000 units</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-[11px] text-slate-500">Applied Wholesale Rate:</div>
              <div className="text-lg font-bold font-mono-numbers text-slate-900">
                {formatINR(matchingTier.unitPrice)} / unit
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Total Lot Sourcing Cost:</div>
              <div className="text-lg font-bold font-mono-numbers text-slate-900">
                {formatINR(totalWholesaleCost)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Projected Retail Revenue:</div>
              <div className="text-lg font-bold font-mono-numbers text-slate-900">
                {formatINR(totalRetailRevenue)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Gross Merchant Profit:</div>
              <div className="text-lg font-bold font-mono-numbers text-emerald-700">
                +{formatINR(totalProjectedProfit)} ({marginPct}%)
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Side-by-Side Tables: Nearest Retailers vs Nearest Wholesalers */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-indigo-600" />
              <span>Retail Outlets Nearest to {userLocation.city}</span>
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-2.5">Retailer &amp; Hub</th>
                    <th className="p-2.5">Dist / Ship</th>
                    <th className="p-2.5 text-right">Landed Price</th>
                    <th className="p-2.5 text-right">Pick</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedRetailers.map((r) => (
                    <tr key={r.retailerId} className={r.isNearest ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}>
                      <td className="p-2.5">
                        <div className="font-medium text-slate-900 flex items-center gap-1.5">
                          <span>{r.retailerName}</span>
                          {r.isNearest && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded">
                              NEAREST
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">{r.city}</div>
                      </td>
                      <td className="p-2.5 font-mono-numbers text-slate-600">
                        <div>{r.distanceKm} km</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          {r.estimatedShipping === 0 ? 'FREE ship' : `+${formatINR(r.estimatedShipping)}`}
                        </div>
                      </td>
                      <td className="p-2.5 text-right font-bold font-mono-numbers text-slate-900">
                        {formatINR(r.totalLandedCost)}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            addToCart(activeProduct, 1, 'retail', undefined, {
                              sellerId: r.retailerId,
                              sellerName: r.retailerName,
                              sellerCity: r.city,
                              distanceKm: r.distanceKm,
                              unitPriceOverride: r.price,
                            })
                          }
                          className="px-2 py-1 text-[11px] font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 cursor-pointer"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Factory className="w-4 h-4 text-amber-600" />
              <span>Direct Factories Nearest to {userLocation.city}</span>
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-2.5">Supplier Plant</th>
                    <th className="p-2.5">Dist / Freight</th>
                    <th className="p-2.5 text-right">Unit Rate</th>
                    <th className="p-2.5 text-right">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedWholesalers.map((w) => (
                    <tr key={w.wholesalerId} className={w.isNearest ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}>
                      <td className="p-2.5">
                        <div className="font-medium text-slate-900 flex items-center gap-1.5">
                          <span>{w.companyName}</span>
                          {w.isNearest && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded">
                              NEAREST
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">{w.city} (MOQ {w.moq})</div>
                      </td>
                      <td className="p-2.5 font-mono-numbers text-slate-600">
                        <div>{w.distanceKm} km</div>
                        <div className="text-[10px] text-amber-800 font-semibold">
                          Freight {formatINR(w.estimatedFreight)}
                        </div>
                      </td>
                      <td className="p-2.5 text-right font-bold font-mono-numbers text-slate-900">
                        {formatINR(w.unitPriceAtQty)}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            addToCart(activeProduct, simulatedQty, 'wholesale', matchingTier, {
                              sellerId: w.wholesalerId,
                              sellerName: w.companyName,
                              sellerCity: w.city,
                              distanceKm: w.distanceKm,
                              unitPriceOverride: w.unitPriceAtQty,
                            });
                            setIsCheckoutOpen(true);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer"
                        >
                          Order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
