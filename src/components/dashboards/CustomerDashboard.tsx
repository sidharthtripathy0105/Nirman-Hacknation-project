import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatINR } from '../../utils/currency';
import { rankRetailerOfferings } from '../../utils/location';
import {
  Search,
  ArrowLeftRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Star,
  Banknote,
  MapPin,
  Navigation,
  Zap,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const {
    products,
    addToCart,
    buyNow,
    setActivePriceComparisonProduct,
    userLocation,
    setIsLocationModalOpen,
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedQtyMap, setSelectedQtyMap] = useState<Record<string, number>>({});

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p: Product) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getQty = (id: string) => selectedQtyMap[id] || 1;

  const handleQtyChange = (id: string, qty: number) => {
    setSelectedQtyMap((prev) => ({ ...prev, [id]: qty }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Consumer Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/40 z-10" />
        <div className="relative z-20 max-w-2xl p-8 sm:p-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Fair Price Transparency Engine Active</span>
            </div>
            <span className="text-slate-500">·</span>
            <div className="text-xs text-amber-300 font-mono-numbers flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5" />
              <span>All Pricing in INR (1 USD ≈ ₹93.80)</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Direct Consumer Storefront at Verified Fair Market Prices
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Order everyday groceries, snacks, personal care essentials, and electronics in convenient small quantities. OmniTrade automatically recommends the nearest local retailer to minimize shipping fees.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Hyperlocal Store Matching</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Free Local Shipping (&lt;30 km)</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
              <span>Real-Time Store Price Comparison</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Recommendation Bar */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-950 flex flex-wrap items-center gap-1.5">
              <span>Nearest Seller Recommendations Active for {userLocation.city}</span>
              <span className="text-[11px] font-normal text-emerald-800">
                — Zero shipping on local stores within 30 km
              </span>
            </div>
            <div className="text-[11px] text-emerald-800/80 mt-0.5 line-clamp-1">
              Delivering to: {userLocation.address}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsLocationModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold bg-white text-emerald-900 border border-emerald-300 hover:border-emerald-500 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Change Location &amp; Map</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, SKUs, groceries..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product: Product) => {
          const qty = getQty(product.id);
          const rankedOffers = rankRetailerOfferings(product.retailerOfferings, userLocation, qty);
          const bestOffer = rankedOffers[0];
          const unitPrice = bestOffer ? bestOffer.price : product.retailPrice;
          const msrpDiff = product.suggestedRetailPrice - unitPrice;
          const savingsPct = Math.round((msrpDiff / product.suggestedRetailPrice) * 100);

          return (
            <div
              key={product.id}
              className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              {/* Product Image Frame */}
              <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[10px] font-bold text-emerald-800 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs">
                    Save {savingsPct}% vs MSRP
                  </span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <span className="text-[10px] font-mono-numbers font-medium text-slate-700 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs">
                    {product.retailerStock} in stock
                  </span>
                </div>
              </div>

              {/* Product Card Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="text-[11px] uppercase tracking-wider font-medium">
                      {product.category}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-600 font-semibold text-[11px]">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {product.rating} ({product.reviewsCount})
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-800 line-clamp-1">
                    {product.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Nearest Seller Location Recommendation */}
                  {bestOffer && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-900 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{bestOffer.retailerName}</span>
                        </span>
                        <span className="font-mono-numbers font-bold text-emerald-800 shrink-0 ml-1">
                          {bestOffer.distanceKm} km
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-emerald-800">
                        <span>{bestOffer.city} Store · {bestOffer.deliveryDays}d dispatch</span>
                        <span className="font-mono-numbers font-bold">
                          {bestOffer.estimatedShipping === 0
                            ? 'FREE Shipping'
                            : `Ship ${formatINR(bestOffer.estimatedShipping)}`}
                        </span>
                      </div>
                      {bestOffer.shippingSavingsVsFarthest > 0 && (
                        <div className="text-[10px] font-semibold text-emerald-700 font-mono-numbers">
                          Saves {formatINR(bestOffer.shippingSavingsVsFarthest)} vs distant stores
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Price and Quantities */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-lg font-bold font-mono-numbers text-slate-900">
                        {formatINR(unitPrice)}
                      </span>
                      <span className="text-xs font-mono-numbers text-slate-400 line-through ml-1.5">
                        {formatINR(product.suggestedRetailPrice)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">Nearest Rate</span>
                  </div>

                  <div className="text-[11px] font-medium">
                    {unitPrice < 5000 && unitPrice * qty < 5000 ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <Banknote className="w-3 h-3 shrink-0" />
                        <span>Cash / Pay on Delivery available</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Banknote className="w-3 h-3 shrink-0 text-slate-400" />
                        <span>COD not available (₹5,000+)</span>
                      </span>
                    )}
                  </div>

                  {/* Small Quantity Selector */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Quantity:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 5, 10].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => handleQtyChange(product.id, count)}
                          className={`min-w-6 h-6 px-1 text-xs font-mono-numbers rounded transition-colors cursor-pointer ${
                            qty === count
                              ? 'bg-slate-900 text-white font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setActivePriceComparisonProduct(product)}
                        className="py-1.5 px-2 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Compare across stores and supply tiers"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Compare</span>
                      </button>

                      <button
                        type="button"
                        disabled={product.retailerStock === 0}
                        onClick={() =>
                          addToCart(
                            product,
                            qty,
                            'retail',
                            undefined,
                            bestOffer
                              ? {
                                  sellerId: bestOffer.retailerId,
                                  sellerName: bestOffer.retailerName,
                                  sellerCity: bestOffer.city,
                                  distanceKm: bestOffer.distanceKm,
                                  unitPriceOverride: bestOffer.price,
                                }
                              : undefined
                          )
                        }
                        className="py-1.5 px-2 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Add ({qty})</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={product.retailerStock === 0}
                      onClick={() =>
                        buyNow(
                          product,
                          qty,
                          'retail',
                          undefined,
                          bestOffer
                            ? {
                                sellerId: bestOffer.retailerId,
                                sellerName: bestOffer.retailerName,
                                sellerCity: bestOffer.city,
                                distanceKm: bestOffer.distanceKm,
                                unitPriceOverride: bestOffer.price,
                              }
                            : undefined
                        )
                      }
                      className="w-full py-2 px-3 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Zap className="w-3.5 h-3.5 fill-slate-950" />
                      <span>
                        {product.retailerStock === 0
                          ? 'Out of Stock'
                          : `Buy Now · ${formatINR(unitPrice * qty)}`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
