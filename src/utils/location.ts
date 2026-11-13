import { GeoLocation, RetailerOffering, WholesalerOffering } from '../types';

export const INDIAN_HUBS: GeoLocation[] = [
  {
    city: 'Mumbai',
    address: 'Andheri East Commercial Hub, Mumbai, Maharashtra 400069',
    lat: 19.076,
    lng: 72.8777,
  },
  {
    city: 'Delhi NCR',
    address: 'Connaught Place & Okhla Logistics Zone, New Delhi 110020',
    lat: 28.6139,
    lng: 77.209,
  },
  {
    city: 'Bengaluru',
    address: 'Koramangala & Electronic City Hub, Bengaluru, Karnataka 560034',
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    city: 'Pune',
    address: 'Hinjewadi & Chakan Industrial Corridor, Pune, Maharashtra 411057',
    lat: 18.5204,
    lng: 73.8567,
  },
  {
    city: 'Hyderabad',
    address: 'HITEC City & Shamshabad Freight Park, Hyderabad, Telangana 500081',
    lat: 17.385,
    lng: 78.4867,
  },
  {
    city: 'Chennai',
    address: 'Guindy Industrial Estate, Chennai, Tamil Nadu 600032',
    lat: 13.0827,
    lng: 80.2707,
  },
  {
    city: 'Jaipur',
    address: 'Sitapura Agro & Trade Zone, Jaipur, Rajasthan 302022',
    lat: 26.9124,
    lng: 75.7873,
  },
  {
    city: 'Kolkata',
    address: 'Salt Lake Sector V Distribution Center, Kolkata, West Bengal 700091',
    lat: 22.5726,
    lng: 88.3639,
  },
];

export const DEFAULT_LOCATION: GeoLocation = INDIAN_HUBS[0];

/**
 * Computes approximate road distance in km using the Haversine formula * 1.18 road factor.
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightKm = R * c;
  return Math.max(1, Math.round(straightKm * 1.18 * 10) / 10);
}

/**
 * Estimates domestic retail courier cost based on distance (in INR).
 */
export function estimateRetailShippingFee(
  distanceKm: number,
  orderSubtotal: number
): number {
  if (orderSubtotal >= 4500) return 0; // Free shipping on high-value retail carts
  if (distanceKm <= 30) return 0; // Free hyperlocal city delivery
  if (distanceKm <= 200) return 45; // Same-state express courier
  if (distanceKm <= 650) return 95; // Regional zone transport
  return Math.round(130 + Math.min(220, (distanceKm - 650) * 0.14));
}

/**
 * Estimates B2B commercial pallet/truck freight cost based on distance & lot volume (in INR).
 */
export function estimateWholesaleFreightFee(
  distanceKm: number,
  totalQty: number = 50
): number {
  const loadMultiplier = totalQty >= 300 ? 1.25 : 1;
  if (distanceKm <= 100) return Math.round(1800 * loadMultiplier); // Short-haul local van
  if (distanceKm <= 350) return Math.round(4500 * loadMultiplier); // Intra-state LTL truck
  if (distanceKm <= 850) return Math.round(8900 * loadMultiplier); // Inter-state transport
  return Math.round((11500 + Math.min(11000, (distanceKm - 850) * 4.5)) * loadMultiplier);
}

export interface RankedRetailerOffering extends RetailerOffering {
  distanceKm: number;
  estimatedShipping: number;
  totalLandedCost: number;
  isNearest: boolean;
  isBestLandedValue: boolean;
  shippingSavingsVsFarthest: number;
}

export function rankRetailerOfferings(
  offerings: RetailerOffering[],
  userLoc: { lat: number; lng: number },
  qty: number = 1
): RankedRetailerOffering[] {
  if (!offerings.length) return [];

  const enriched = offerings.map((o) => {
    const distanceKm = calculateDistanceKm(userLoc.lat, userLoc.lng, o.lat, o.lng);
    const subtotal = o.price * qty;
    const estimatedShipping = estimateRetailShippingFee(distanceKm, subtotal);
    const totalLandedCost = subtotal + estimatedShipping;
    return {
      ...o,
      distanceKm,
      estimatedShipping,
      totalLandedCost,
    };
  });

  const minDistance = Math.min(...enriched.map((e) => e.distanceKm));
  const minLanded = Math.min(...enriched.map((e) => e.totalLandedCost));
  const maxShipping = Math.max(...enriched.map((e) => e.estimatedShipping));

  return enriched
    .map((e) => ({
      ...e,
      isNearest: e.distanceKm === minDistance,
      isBestLandedValue: e.totalLandedCost === minLanded,
      shippingSavingsVsFarthest: Math.max(0, maxShipping - e.estimatedShipping),
    }))
    .sort((a, b) => a.totalLandedCost - b.totalLandedCost || a.distanceKm - b.distanceKm);
}

export interface RankedWholesalerOffering extends WholesalerOffering {
  distanceKm: number;
  unitPriceAtQty: number;
  estimatedFreight: number;
  totalLandedCost: number;
  isNearest: boolean;
  isBestLandedValue: boolean;
  freightSavingsVsFarthest: number;
}

export function rankWholesalerOfferings(
  offerings: WholesalerOffering[],
  userLoc: { lat: number; lng: number },
  qty: number = 50
): RankedWholesalerOffering[] {
  if (!offerings.length) return [];

  const enriched = offerings.map((o) => {
    const distanceKm = calculateDistanceKm(userLoc.lat, userLoc.lng, o.lat, o.lng);
    const sortedTiers = [...o.tiers].sort((a, b) => b.minQty - a.minQty);
    const activeTier = sortedTiers.find((t) => qty >= t.minQty) || o.tiers[0];
    const unitPriceAtQty = activeTier ? activeTier.unitPrice : 0;
    const estimatedFreight = estimateWholesaleFreightFee(distanceKm, qty);
    const totalLandedCost = unitPriceAtQty * qty + estimatedFreight;
    return {
      ...o,
      distanceKm,
      unitPriceAtQty,
      estimatedFreight,
      totalLandedCost,
    };
  });

  const minDistance = Math.min(...enriched.map((e) => e.distanceKm));
  const minLanded = Math.min(...enriched.map((e) => e.totalLandedCost));
  const maxFreight = Math.max(...enriched.map((e) => e.estimatedFreight));

  return enriched
    .map((e) => ({
      ...e,
      isNearest: e.distanceKm === minDistance,
      isBestLandedValue: e.totalLandedCost === minLanded,
      freightSavingsVsFarthest: Math.max(0, maxFreight - e.estimatedFreight),
    }))
    .sort((a, b) => a.totalLandedCost - b.totalLandedCost || a.distanceKm - b.distanceKm);
}
