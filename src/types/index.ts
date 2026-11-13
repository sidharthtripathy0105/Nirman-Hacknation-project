export type UserRole = 'customer' | 'retailer' | 'wholesaler';

export interface GeoLocation {
  city: string;
  address: string;
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  businessName?: string;
  taxId?: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
  balanceCredit?: number; // For Net-30 credit limit
  avatarUrl?: string;
}

export interface WholesaleTier {
  minQty: number;
  unitPrice: number;
  label?: string;
}

export interface RetailerOffering {
  retailerId: string;
  retailerName: string;
  price: number;
  inStock: number;
  rating: number;
  deliveryDays: number;
  warranty: string;
  city: string;
  lat: number;
  lng: number;
  isLowestPrice?: boolean;
}

export interface WholesalerOffering {
  wholesalerId: string;
  companyName: string;
  moq: number;
  tiers: WholesaleTier[];
  factoryLocation: string;
  city: string;
  lat: number;
  lng: number;
  leadTimeDays: number;
  verifiedSupplier: boolean;
  rating: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  image: string;
  specs: string[];

  // Wholesaler / Factory details
  manufacturerId: string;
  manufacturerName: string;
  factoryCost: number; // Base manufacturing cost
  wholesalerStock: number; // In factory / bulk warehouse
  minMoq: number; // Minimum Order Quantity for B2B
  wholesaleTiers: WholesaleTier[]; // Bulk tiered pricing

  // Retailer details
  retailPrice: number; // Current retail price to end consumers
  suggestedRetailPrice: number; // MSRP
  retailerStock: number; // Stock available in retail store
  retailerCost: number; // What the retailer paid per unit wholesale

  // Alerts & status
  minStockAlert: number;
  rating: number;
  reviewsCount: number;

  // Comparative data
  retailerOfferings: RetailerOffering[];
  wholesalerOfferings: WholesalerOffering[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  tierType: 'retail' | 'wholesale';
  appliedTier?: WholesaleTier;
  selectedSellerId?: string;
  selectedSellerName?: string;
  sellerCity?: string;
  sellerDistanceKm?: number;
  estimatedShipping?: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  image: string;
  quantity: number;
  unitPrice: number;
  total: number;
  tierType: 'retail' | 'wholesale';
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'card' | 'upi' | 'wallet' | 'net30_escrow' | 'cod';
export type PaymentStatus = 'paid' | 'escrow_held' | 'invoiced' | 'pay_on_delivery';

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  buyerId: string;
  buyerName: string;
  buyerRole: UserRole;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  sellerRole: UserRole;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingAddress: string;
  trackingNumber: string;
  estimatedDelivery: string;
  notes?: string;
}

export interface InventoryLog {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'customer_sale' | 'b2b_wholesale_purchase' | 'factory_restock' | 'price_adjustment';
  quantityDelta: number;
  actorRole: UserRole;
  actorName: string;
  retailerStockAfter: number;
  wholesalerStockAfter: number;
  notes: string;
}
