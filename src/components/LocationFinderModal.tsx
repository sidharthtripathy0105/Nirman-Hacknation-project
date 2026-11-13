/// <reference types="google.maps" />
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useApp } from '../context/AppContext';
import { GeoLocation, Product } from '../types';
import {
  INDIAN_HUBS,
  rankRetailerOfferings,
  rankWholesalerOfferings,
} from '../utils/location';
import { IndiaLocationSelector } from './IndiaLocationSelector';
import { formatINR } from '../utils/currency';
import {
  X,
  MapPin,
  Navigation,
  Search,
  Truck,
  CheckCircle2,
  Store,
  Factory,
  Route as RouteIcon,
} from 'lucide-react';

const MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';

interface PlacesSearchProps {
  onSelectLocation: (loc: GeoLocation) => void;
}

const PlacesAutocompleteBox: React.FC<PlacesSearchProps> = ({ onSelectLocation }) => {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!placesLib) return;
    if (!inputVal.trim()) {
      setSuggestions([]);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: inputVal,
          sessionToken: sessionTokenRef.current!,
          includedRegionCodes: ['in'],
        });
        setSuggestions(res.suggestions || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('OVER_QUERY_LIMIT')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [placesLib, inputVal]);

  const handlePick = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!placesLib || !suggestion.placePrediction) return;
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location'],
        });
        const loc = place.location;
        if (loc) {
          onSelectLocation({
            city: String(place.displayName || inputVal.split(',')[0] || 'Selected Area'),
            address: String(place.formattedAddress || inputVal),
            lat: loc.lat(),
            lng: loc.lng(),
          });
        }
        setInputVal('');
        setSuggestions([]);
        sessionTokenRef.current = null;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      }
    },
    [placesLib, inputVal, onSelectLocation]
  );

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Search your city, area, or street in India..."
          className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              onClick={() => void handlePick(s)}
              className="px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{s.placePrediction?.text.text}</span>
            </li>
          ))}
        </ul>
      )}
      {isLoading && (
        <div className="text-[10px] text-slate-400 mt-1">Searching places via Google Maps...</div>
      )}
    </div>
  );
};

interface SellerMarkerProps {
  position: { lat: number; lng: number };
  title: string;
  subtitle: string;
  distanceKm: number;
  shippingFee: number;
  unitPrice: number;
  isNearest: boolean;
  isRetailerMode: boolean;
}

const SellerMapMarker: React.FC<SellerMarkerProps> = ({
  position,
  title,
  subtitle,
  distanceKm,
  shippingFee,
  unitPrice,
  isNearest,
  isRetailerMode,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdvancedMarker ref={markerRef} position={position} onClick={() => setOpen(true)} title={title}>
        <Pin
          background={isNearest ? '#059669' : isRetailerMode ? '#d97706' : '#4f46e5'}
          borderColor={isNearest ? '#064e3b' : '#1e293b'}
          glyphColor="#ffffff"
          scale={isNearest ? 1.25 : 1}
        />
      </AdvancedMarker>
      {open && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)} maxWidth={240}>
          <div className="p-1 space-y-1 text-xs text-slate-800">
            <div className="font-bold text-slate-900">{title}</div>
            <div className="text-[11px] text-slate-500">{subtitle}</div>
            <div className="pt-1 border-t border-slate-200 flex justify-between font-mono-numbers">
              <span>Distance:</span>
              <strong>{distanceKm} km</strong>
            </div>
            <div className="flex justify-between font-mono-numbers">
              <span>Unit Rate:</span>
              <strong>{formatINR(unitPrice)}</strong>
            </div>
            <div className="flex justify-between font-mono-numbers text-emerald-700 font-semibold">
              <span>Est. {isRetailerMode ? 'Freight' : 'Shipping'}:</span>
              <span>{shippingFee === 0 ? 'FREE' : formatINR(shippingFee)}</span>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

interface RoutePreviewProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  label: string;
}

const RouteEtaBadge: React.FC<RoutePreviewProps> = ({ origin, destination, label }) => {
  const routesLib = useMapsLibrary('routes');
  const [routeSummary, setRouteSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkLiveRoute = async () => {
    if (!routesLib) return;
    setLoading(true);
    try {
      const response = await routesLib.Route.computeRoutes({
        origin,
        destination,
        travelMode: 'DRIVING',
        fields: ['distanceMeters', 'durationMillis'],
      });
      const first = response?.routes?.[0];
      if (first) {
        const km = first.distanceMeters ? (first.distanceMeters / 1000).toFixed(1) : null;
        const mins = first.durationMillis ? Math.round(first.durationMillis / 60000) : null;
        if (km && mins) {
          const hrs = Math.floor(mins / 60);
          const remMins = mins % 60;
          setRouteSummary(`${km} km road · ${hrs > 0 ? `${hrs}h ${remMins}m` : `${mins}m`} drive`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {routeSummary ? (
        <span className="text-[11px] font-mono-numbers font-semibold text-indigo-700">
          {routeSummary}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => void checkLiveRoute()}
          disabled={loading || !routesLib}
          title={`Calculate live road route to ${label}`}
          className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 underline cursor-pointer disabled:opacity-50 flex items-center gap-1"
        >
          <RouteIcon className="w-3 h-3" />
          <span>{loading ? 'Routing...' : 'Check Road ETA'}</span>
        </button>
      )}
    </div>
  );
};

export const LocationFinderModal: React.FC = () => {
  const {
    isLocationModalOpen,
    setIsLocationModalOpen,
    userLocation,
    updateUserLocation,
    currentUser,
    products,
    addToast,
  } = useApp();

  const [draftLocation, setDraftLocation] = useState<GeoLocation>(userLocation);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    if (isLocationModalOpen) {
      setDraftLocation(userLocation);
      if (!selectedProductId && products[0]) {
        setSelectedProductId(products[0].id);
      }
    }
  }, [isLocationModalOpen, userLocation, products, selectedProductId]);

  if (!isLocationModalOpen) return null;

  const isRetailer = currentUser?.role === 'retailer';
  const activeProduct: Product | undefined =
    products.find((p) => p.id === selectedProductId) || products[0];

  const rankedRetailers = activeProduct
    ? rankRetailerOfferings(activeProduct.retailerOfferings, draftLocation, 1)
    : [];
  const rankedWholesalers = activeProduct
    ? rankWholesalerOfferings(activeProduct.wholesalerOfferings, draftLocation, activeProduct.minMoq)
    : [];

  const handleUseBrowserGps = () => {
    if (!navigator.geolocation) {
      addToast('Browser geolocation is unavailable. Pick a city hub below.', 'warning');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraftLocation({
          city: 'My GPS Location',
          address: `Detected GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsLoading(false);
      },
      () => {
        addToast('Location permission denied. Select your city hub below instead.', 'warning');
        setGpsLoading(false);
      }
    );
  };

  const handleApplyLocation = async () => {
    await updateUserLocation(draftLocation);
    setIsLocationModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isRetailer
                  ? 'Nearest Manufacturer & Freight Savings Locator'
                  : 'Hyperlocal Delivery Zone & Nearest Seller Locator'}
              </h3>
              <p className="text-xs text-slate-500">
                Set your location to automatically rank nearby sellers and minimize shipping charges
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Controls Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  1. Search Address or Pick Logistics Hub:
                </span>
                <button
                  type="button"
                  onClick={handleUseBrowserGps}
                  disabled={gpsLoading}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{gpsLoading ? 'Locating GPS...' : 'Detect My GPS Location'}</span>
                </button>
              </div>

              {MAPS_API_KEY && (
                <APIProvider apiKey={MAPS_API_KEY} language="en" region="IN">
                  <PlacesAutocompleteBox onSelectLocation={setDraftLocation} />
                </APIProvider>
              )}

              <IndiaLocationSelector
                compact
                selectedLocation={draftLocation}
                onSelectLocation={setDraftLocation}
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {INDIAN_HUBS.map((hub) => (
                  <button
                    key={hub.city}
                    type="button"
                    onClick={() => setDraftLocation(hub)}
                    className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors cursor-pointer ${
                      draftLocation.city === hub.city
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {hub.city}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                2. Preview Nearest Sellers For Product:
              </div>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-slate-500">
                Active Point: <strong className="text-slate-800">{draftLocation.city}</strong>{' '}
                <span className="font-mono-numbers">
                  ({draftLocation.lat.toFixed(2)}, {draftLocation.lng.toFixed(2)})
                </span>
              </div>
            </div>
          </div>

          {/* Map + Nearest Seller Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Map Panel */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
              {MAPS_API_KEY ? (
                <div className="h-[340px] w-full">
                  <APIProvider apiKey={MAPS_API_KEY} language="en" region="IN">
                    <GoogleMap
                      key={`${draftLocation.lat}-${draftLocation.lng}`}
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      defaultCenter={{ lat: draftLocation.lat, lng: draftLocation.lng }}
                      defaultZoom={5}
                      gestureHandling="greedy"
                      style={{ width: '100%', height: '100%' }}
                    >
                      {/* User Delivery / Warehouse Pin */}
                      <AdvancedMarker
                        position={{ lat: draftLocation.lat, lng: draftLocation.lng }}
                        title={`Your Location: ${draftLocation.city}`}
                      >
                        <Pin background="#0f172a" borderColor="#020617" glyphColor="#34d399" scale={1.2} />
                      </AdvancedMarker>

                      {/* Seller / Supplier Pins */}
                      {isRetailer
                        ? rankedWholesalers.map((w) => (
                            <SellerMapMarker
                              key={w.wholesalerId}
                              position={{ lat: w.lat, lng: w.lng }}
                              title={w.companyName}
                              subtitle={w.factoryLocation}
                              distanceKm={w.distanceKm}
                              shippingFee={w.estimatedFreight}
                              unitPrice={w.unitPriceAtQty}
                              isNearest={w.isNearest}
                              isRetailerMode={true}
                            />
                          ))
                        : rankedRetailers.map((r) => (
                            <SellerMapMarker
                              key={r.retailerId}
                              position={{ lat: r.lat, lng: r.lng }}
                              title={r.retailerName}
                              subtitle={`${r.city} Fulfillment Hub`}
                              distanceKm={r.distanceKm}
                              shippingFee={r.estimatedShipping}
                              unitPrice={r.price}
                              isNearest={r.isNearest}
                              isRetailerMode={false}
                            />
                          ))}
                    </GoogleMap>
                  </APIProvider>
                </div>
              ) : (
                <div className="h-[340px] w-full flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <MapPin className="w-8 h-8 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">Interactive Distance Matrix Active</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Seller proximity and shipping costs are calculated live from your selected coordinates ({draftLocation.city}).
                  </p>
                </div>
              )}
            </div>

            {/* Nearest Ranked Recommendations */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                {isRetailer ? <Factory className="w-3.5 h-3.5 text-amber-700" /> : <Store className="w-3.5 h-3.5 text-indigo-700" />}
                <span>
                  {isRetailer ? 'Suppliers Ranked by Lowest Freight + Landed Cost' : 'Stores Ranked by Nearest Delivery & Lowest Cost'}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {isRetailer
                  ? rankedWholesalers.map((w) => (
                      <div
                        key={w.wholesalerId}
                        className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                          w.isBestLandedValue
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900">{w.companyName}</div>
                            <div className="text-[11px] text-slate-500">{w.factoryLocation}</div>
                          </div>
                          {w.isNearest && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded shrink-0">
                              NEAREST ({w.distanceKm} km)
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-200/70 font-mono-numbers">
                          <div>
                            <div className="text-[10px] text-slate-400">Unit Rate</div>
                            <div className="font-bold text-slate-900">{formatINR(w.unitPriceAtQty)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Est. Freight</div>
                            <div className="font-bold text-amber-800">{formatINR(w.estimatedFreight)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Freight Saved</div>
                            <div className="font-bold text-emerald-700">
                              {w.freightSavingsVsFarthest > 0 ? formatINR(w.freightSavingsVsFarthest) : '—'}
                            </div>
                          </div>
                        </div>
                        {MAPS_API_KEY && (
                          <APIProvider apiKey={MAPS_API_KEY} language="en" region="IN">
                            <RouteEtaBadge
                              origin={{ lat: w.lat, lng: w.lng }}
                              destination={{ lat: draftLocation.lat, lng: draftLocation.lng }}
                              label={w.companyName}
                            />
                          </APIProvider>
                        )}
                      </div>
                    ))
                  : rankedRetailers.map((r) => (
                      <div
                        key={r.retailerId}
                        className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                          r.isBestLandedValue
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900">{r.retailerName}</div>
                            <div className="text-[11px] text-slate-500">
                              {r.city} · {r.distanceKm} km away · {r.deliveryDays}d dispatch
                            </div>
                          </div>
                          {r.isNearest && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded shrink-0">
                              NEAREST STORE
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-200/70 font-mono-numbers">
                          <div>
                            <div className="text-[10px] text-slate-400">Item Price</div>
                            <div className="font-bold text-slate-900">{formatINR(r.price)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Est. Shipping</div>
                            <div className={`font-bold ${r.estimatedShipping === 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
                              {r.estimatedShipping === 0 ? 'FREE' : formatINR(r.estimatedShipping)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Landed Cost</div>
                            <div className="font-bold text-slate-900">{formatINR(r.totalLandedCost)}</div>
                          </div>
                        </div>
                        {MAPS_API_KEY && (
                          <APIProvider apiKey={MAPS_API_KEY} language="en" region="IN">
                            <RouteEtaBadge
                              origin={{ lat: r.lat, lng: r.lng }}
                              destination={{ lat: draftLocation.lat, lng: draftLocation.lng }}
                              label={r.retailerName}
                            />
                          </APIProvider>
                        )}
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>
              Selected Hub: <strong>{draftLocation.city}</strong> — Recommending closest fulfillment centers automatically
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleApplyLocation()}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Save Location & Update Recommendations</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
