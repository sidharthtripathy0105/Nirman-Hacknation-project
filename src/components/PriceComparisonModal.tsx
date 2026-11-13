import React from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { formatINR } from '../utils/currency';
import { rankRetailerOfferings, rankWholesalerOfferings } from '../utils/location';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Store,
  Factory,
  Layers,
  MapPin,
} from 'lucide-react';

interface PriceComparisonModalProps {
  product: Product | null;
  onClose: () => void;
}

export const PriceComparisonModal: React.FC<PriceComparisonModalProps> = ({
  product,
  onClose,
}) => {
  const { addToCart, setIsCheckoutOpen, userLocation, setIsLocationModalOpen } = useApp();

  if (!product) return null;

  const rankedRetailers = rankRetailerOfferings(product.retailerOfferings, userLocation, 1);
  const rankedWholesalers = rankWholesalerOfferings(
    product.wholesalerOfferings,
    userLocation,
    product.minMoq
  );

  const lowestLandedRetail = Math.min(...rankedRetailers.map((o) => o.totalLandedCost));
  const msrpSavings = product.suggestedRetailPrice - product.retailPrice;
  const msrpSavingsPct = Math.round((msrpSavings / product.suggestedRetailPrice) * 100);

  const wholesaleUnitCost = product.retailerCost;
  const currentRetailPrice = product.retailPrice;
  const retailerGrossProfit = currentRetailPrice - wholesaleUnitCost;
  const retailerGrossMarginPct = Math.round((retailerGrossProfit / currentRetailPrice) * 100);

  const factoryBaseCost = product.factoryCost;
  const wholesalerMinTierPrice = Math.min(...product.wholesaleTiers.map((t) => t.unitPrice));
  const wholesalerGrossProfit = wholesalerMinTierPrice - factoryBaseCost;
  const wholesalerMarginPct = Math.round((wholesalerGrossProfit / wholesalerMinTierPrice) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-mono-numbers">SKU: {product.sku}</span>
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Fair Price Certified
                </span>
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-indigo-700 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Hub: {userLocation.city}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Price &amp; Proximity Matrix: {product.name}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsLocationModalOpen(true);
              }}
              className="px-2.5 py-1.5 text-[11px] font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Change Hub
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Multi-Tier Value Chain Waterfall */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Supply Chain Price Waterfall (Valid Fair Price Index in INR)
                </h4>
                <p className="text-xs text-slate-500">
                  Full visibility across production, wholesale bulk lots, retail markup, and MSRP
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-md">
                  {msrpSavingsPct}% Below Suggested MSRP
                </span>
              </div>
            </div>

            {/* Stepper Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
              <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-medium flex items-center gap-1">
                    <Factory className="w-3.5 h-3.5 text-slate-400" /> Factory Cost
                  </span>
                  <span className="text-[10px] text-slate-400">Plant direct</span>
                </div>
                <div className="text-xl font-bold font-mono-numbers text-slate-800">
                  {formatINR(product.factoryCost)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Raw material &amp; labor floor</div>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-amber-200 bg-amber-50/20">
                <div className="flex items-center justify-between text-xs text-amber-800 mb-1">
                  <span className="font-medium flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-600" /> Wholesale Tier
                  </span>
                  <span className="text-[10px] font-mono-numbers font-semibold text-amber-700">
                    +{wholesalerMarginPct}% Mfg Margin
                  </span>
                </div>
                <div className="text-xl font-bold font-mono-numbers text-amber-900">
                  {formatINR(wholesalerMinTierPrice)} - {formatINR(product.wholesaleTiers[0].unitPrice)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">MOQ {product.minMoq}+ units bulk lot</div>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-indigo-200 bg-indigo-50/20">
                <div className="flex items-center justify-between text-xs text-indigo-800 mb-1">
                  <span className="font-medium flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-indigo-600" /> Store Retail
                  </span>
                  <span className="text-[10px] font-mono-numbers font-semibold text-indigo-700">
                    +{retailerGrossMarginPct}% Gross Margin
                  </span>
                </div>
                <div className="text-xl font-bold font-mono-numbers text-indigo-900">
                  {formatINR(product.retailPrice)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Single unit customer price</div>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-medium">Market MSRP</span>
                  <span className="text-[10px] text-rose-500 font-medium">Ceiling</span>
                </div>
                <div className="text-xl font-bold font-mono-numbers text-slate-500 line-through">
                  {formatINR(product.suggestedRetailPrice)}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  Save {formatINR(msrpSavings)} on OmniTrade
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Competing Retailers Ranked by Nearest Distance + Total Landed Cost */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Consumer Comparison: Ranked by Proximity to {userLocation.city} &amp; Landed Cost
                </h4>
                <p className="text-xs text-slate-500">
                  Includes estimated distance-based shipping cost so you pick the truly lowest delivered price
                </p>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {rankedRetailers.length} Authorized Stores
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-4">Retail Store &amp; City</th>
                    <th className="py-2.5 px-4">Distance</th>
                    <th className="py-2.5 px-4">Est. Shipping</th>
                    <th className="py-2.5 px-4 text-right">Item Price</th>
                    <th className="py-2.5 px-4 text-right">Total Landed</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rankedRetailers.map((offering) => (
                    <tr
                      key={offering.retailerId}
                      className={offering.isBestLandedValue ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex flex-wrap items-center gap-1.5">
                          <span>{offering.retailerName}</span>
                          {offering.isNearest && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                              Nearest Seller
                            </span>
                          )}
                          {offering.isBestLandedValue && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                              Lowest Landed
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {offering.city} · ★ {offering.rating.toFixed(1)} · {offering.inStock} units ready
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono-numbers font-semibold text-slate-700">
                        {offering.distanceKm} km
                        <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                          <Truck className="w-3 h-3" /> {offering.deliveryDays}d dispatch
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono-numbers">
                        <span
                          className={
                            offering.estimatedShipping === 0
                              ? 'text-emerald-700 font-bold'
                              : 'text-slate-700 font-medium'
                          }
                        >
                          {offering.estimatedShipping === 0 ? 'FREE' : formatINR(offering.estimatedShipping)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono-numbers text-slate-700">
                        {formatINR(offering.price)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-sm font-bold font-mono-numbers text-slate-900">
                          {formatINR(offering.totalLandedCost)}
                        </div>
                        {offering.totalLandedCost > lowestLandedRetail && (
                          <div className="text-[10px] text-rose-500 font-mono-numbers">
                            +{formatINR(offering.totalLandedCost - lowestLandedRetail)} extra
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            addToCart(product, 1, 'retail', undefined, {
                              sellerId: offering.retailerId,
                              sellerName: offering.retailerName,
                              sellerCity: offering.city,
                              distanceKm: offering.distanceKm,
                              unitPriceOverride: offering.price,
                            });
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 hover:border-slate-900 hover:bg-slate-900 hover:text-white rounded-md transition-colors cursor-pointer"
                        >
                          Pick Store
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: B2B Wholesaler Comparison Ranked by Distance + Freight Savings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  B2B Sourcing Comparison: Ranked by Proximity &amp; Freight Savings ({userLocation.city})
                </h4>
                <p className="text-xs text-slate-500">
                  Bulk tier pricing plus regional truck freight estimate for retailer procurement
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-700">MOQ Bulk Lots</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rankedWholesalers.map((supplier) => (
                <div
                  key={supplier.wholesalerId}
                  className={`p-4 rounded-xl border shadow-xs ${
                    supplier.isBestLandedValue
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        {supplier.companyName}
                        {supplier.verifiedSupplier && (
                          <span title="Verified Factory">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {supplier.factoryLocation} · <strong>{supplier.distanceKm} km</strong> from {userLocation.city}
                      </div>
                    </div>
                    <div className="text-right">
                      {supplier.isNearest && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded block mb-1">
                          NEAREST PLANT
                        </span>
                      )}
                      <div className="text-[11px] text-slate-500">
                        Est. Freight: <strong className="font-mono-numbers">{formatINR(supplier.estimatedFreight)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Tier table */}
                  <div className="mt-3 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-600 uppercase mb-1.5">
                      Wholesale Volume Tier Breakdown:
                    </div>
                    <div className="space-y-1">
                      {supplier.tiers.map((t, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-0.5 border-b border-slate-200/60 last:border-0"
                        >
                          <span className="text-slate-600">{t.minQty}+ units order lot</span>
                          <span className="font-mono-numbers font-bold text-slate-900">
                            {formatINR(t.unitPrice)} / unit
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick B2B Order Trigger */}
                  <div className="mt-3 pt-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {supplier.freightSavingsVsFarthest > 0
                        ? `Saves ${formatINR(supplier.freightSavingsVsFarthest)} freight`
                        : `Lead Time: ${supplier.leadTimeDays} Days`}
                    </span>
                    <button
                      onClick={() => {
                        addToCart(product, supplier.moq, 'wholesale', supplier.tiers[0], {
                          sellerId: supplier.wholesalerId,
                          sellerName: supplier.companyName,
                          sellerCity: supplier.city,
                          distanceKm: supplier.distanceKm,
                          unitPriceOverride: supplier.tiers[0].unitPrice,
                        });
                        onClose();
                        setIsCheckoutOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Source Bulk (MOQ {supplier.moq})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Distance &amp; shipping calculated live from {userLocation.city}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
