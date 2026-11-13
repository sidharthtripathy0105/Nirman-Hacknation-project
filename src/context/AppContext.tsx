import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  User,
  UserRole,
  Product,
  CartItem,
  Order,
  InventoryLog,
  WholesaleTier,
  PaymentMethod,
  OrderStatus,
  GeoLocation,
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_INVENTORY_LOGS } from '../data/initialData';
import {
  DEFAULT_LOCATION,
  rankRetailerOfferings,
  rankWholesalerOfferings,
  estimateRetailShippingFee,
  estimateWholesaleFreightFee,
} from '../utils/location';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface SellerSelectionMeta {
  sellerId?: string;
  sellerName?: string;
  sellerCity?: string;
  distanceKm?: number;
  unitPriceOverride?: number;
}

interface AppContextType {
  authReady: boolean;
  firebaseUser: FirebaseUser | null;
  needsOnboarding: boolean;
  needsEmailVerification: boolean;
  currentUser: User | null;
  products: Product[];
  cart: CartItem[];
  buyNowItem: CartItem | null;
  setBuyNowItem: (item: CartItem | null) => void;
  orders: Order[];
  inventoryLogs: InventoryLog[];
  toasts: ToastMessage[];
  userLocation: GeoLocation;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  updateUserLocation: (loc: GeoLocation) => Promise<void>;

  // Auth Actions
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<{ ok: boolean; errorCode?: string; errorMessage?: string }>;
  registerWithEmail: (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    businessName?: string;
    taxId?: string;
    phone: string;
    location: GeoLocation;
  }) => Promise<{ ok: boolean; errorCode?: string; errorMessage?: string }>;
  completeOnboarding: (params: {
    name: string;
    role: UserRole;
    businessName?: string;
    taxId?: string;
    phone: string;
    location: GeoLocation;
  }) => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  logout: () => Promise<void>;

  // Cart & Instant Buy Actions
  addToCart: (
    product: Product,
    quantity: number,
    tierType: 'retail' | 'wholesale',
    appliedTier?: WholesaleTier,
    sellerMeta?: SellerSelectionMeta
  ) => void;
  buyNow: (
    product: Product,
    quantity: number,
    tierType?: 'retail' | 'wholesale',
    appliedTier?: WholesaleTier,
    sellerMeta?: SellerSelectionMeta
  ) => void;
  removeFromCart: (productId: string, tierType: 'retail' | 'wholesale') => void;
  updateCartQuantity: (productId: string, quantity: number, tierType: 'retail' | 'wholesale') => void;
  clearCart: () => void;
  getCartTotal: () => {
    subtotal: number;
    tax: number;
    shipping: number;
    shippingSavings: number;
    total: number;
    itemCount: number;
  };
  getCheckoutTotal: () => {
    subtotal: number;
    tax: number;
    shipping: number;
    shippingSavings: number;
    total: number;
    itemCount: number;
  };

  // Checkout & Orders
  processCheckout: (paymentDetails: {
    method: PaymentMethod;
    shippingAddress: string;
    cardNumber?: string;
    cardHolder?: string;
    upiId?: string;
    poNumber?: string;
  }) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;

  // Product & Inventory Management
  updateRetailPrice: (productId: string, newPrice: number) => Promise<void>;
  updateWholesaleTiers: (productId: string, tiers: WholesaleTier[]) => void;
  factoryProduceBatch: (productId: string, batchQty: number) => Promise<void>;
  retailerReorderBulk: (
    productId: string,
    quantity: number,
    unitPrice: number,
    sellerMeta?: SellerSelectionMeta
  ) => void;

  // Modals & Active State
  activePriceComparisonProduct: Product | null;
  setActivePriceComparisonProduct: (product: Product | null) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'signin' | 'signup';
  setAuthModalMode: (mode: 'signin' | 'signup') => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isInventoryLogOpen: boolean;
  setIsInventoryLogOpen: (open: boolean) => void;
  selectedOrderReceipt: Order | null;
  setSelectedOrderReceipt: (order: Order | null) => void;
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);

  const [userLocation, setUserLocation] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activePriceComparisonProduct, setActivePriceComparisonProduct] = useState<Product | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isInventoryLogOpen, setIsInventoryLogOpen] = useState(false);
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState<Order | null>(null);

  const addToast = useCallback(
    (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
      const id = Date.now().toString() + Math.random().toString();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  // Load split user profile from Firestore
  const loadUserProfile = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    const publicPath = `users/${fbUser.uid}`;
    const privatePath = `users/${fbUser.uid}/private/info`;

    try {
      const publicSnap = await getDoc(doc(db, 'users', fbUser.uid));
      if (!publicSnap.exists()) {
        return null;
      }
      const pubData = publicSnap.data();

      let privData: Record<string, unknown> = {};
      try {
        const privSnap = await getDoc(doc(db, 'users', fbUser.uid, 'private', 'info'));
        if (privSnap.exists()) {
          privData = privSnap.data();
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, privatePath);
      }

      const role = pubData.role as UserRole;
      const defaultCredit = role === 'wholesaler' ? 20000000 : role === 'retailer' ? 3000000 : 100000;

      const hydrated: User = {
        id: fbUser.uid,
        name: String(pubData.displayName || fbUser.displayName || 'OmniTrade User'),
        email: String(privData.email || fbUser.email || ''),
        role,
        businessName: pubData.businessName ? String(pubData.businessName) : undefined,
        taxId: privData.taxId ? String(privData.taxId) : undefined,
        address: String(privData.address || `${pubData.city || 'Mumbai'}, India`),
        city: String(pubData.city || DEFAULT_LOCATION.city),
        lat: typeof pubData.lat === 'number' ? pubData.lat : DEFAULT_LOCATION.lat,
        lng: typeof pubData.lng === 'number' ? pubData.lng : DEFAULT_LOCATION.lng,
        phone: String(privData.phone || '+91 98200 00000'),
        balanceCredit: typeof privData.balanceCredit === 'number' ? privData.balanceCredit : defaultCredit,
        avatarUrl: fbUser.photoURL || undefined,
      };

      return hydrated;
    } catch (err) {
      if (err instanceof Error && err.message.includes('"operationType"')) {
        throw err;
      }
      handleFirestoreError(err, OperationType.GET, publicPath);
    }
  }, []);

  // Atomically create both public and private user docs via writeBatch (Pillar 1 + Pillar 7)
  const createSplitProfileBatch = useCallback(
    async (
      fbUser: FirebaseUser,
      params: {
        name: string;
        role: UserRole;
        businessName?: string;
        taxId?: string;
        phone: string;
        location: GeoLocation;
      }
    ): Promise<User> => {
      const batch = writeBatch(db);
      const userPublicRef = doc(db, 'users', fbUser.uid);
      const userPrivateRef = doc(db, 'users', fbUser.uid, 'private', 'info');

      const creditLimit =
        params.role === 'wholesaler' ? 20000000 : params.role === 'retailer' ? 3000000 : 100000;

      const publicPayload: Record<string, unknown> = {
        uid: fbUser.uid,
        displayName: params.name.trim().slice(0, 100),
        role: params.role,
        city: params.location.city.trim().slice(0, 80),
        lat: params.location.lat,
        lng: params.location.lng,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (params.role !== 'customer') {
        publicPayload.businessName = (params.businessName || `${params.name} Enterprises`)
          .trim()
          .slice(0, 120);
      }

      const privatePayload: Record<string, unknown> = {
        uid: fbUser.uid,
        email: (fbUser.email || '').trim().slice(0, 150),
        phone: (params.phone || '+91 98200 00000').trim().slice(0, 40),
        address: params.location.address.trim().slice(0, 300),
        balanceCredit: creditLimit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (params.role !== 'customer' && params.taxId?.trim()) {
        privatePayload.taxId = params.taxId.trim().slice(0, 60);
      }

      batch.set(userPublicRef, publicPayload);
      batch.set(userPrivateRef, privatePayload);

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
      }

      const created: User = {
        id: fbUser.uid,
        name: String(publicPayload.displayName),
        email: String(privatePayload.email),
        role: params.role,
        businessName: publicPayload.businessName ? String(publicPayload.businessName) : undefined,
        taxId: privatePayload.taxId ? String(privatePayload.taxId) : undefined,
        address: String(privatePayload.address),
        city: String(publicPayload.city),
        lat: params.location.lat,
        lng: params.location.lng,
        phone: String(privatePayload.phone),
        balanceCredit: creditLimit,
        avatarUrl: fbUser.photoURL || undefined,
      };

      return created;
    },
    []
  );

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (!fbUser) {
        setCurrentUser(null);
        setNeedsOnboarding(false);
        setNeedsEmailVerification(false);
        setOrders([]);
        setInventoryLogs([]);
        setCart([]);
        setAuthReady(true);
        return;
      }

      if (!fbUser.emailVerified) {
        setNeedsEmailVerification(true);
        setNeedsOnboarding(false);
        setCurrentUser(null);
        setAuthReady(true);
        return;
      }

      setNeedsEmailVerification(false);
      try {
        const profile = await loadUserProfile(fbUser);
        if (profile) {
          setCurrentUser(profile);
          setUserLocation({
            city: profile.city,
            address: profile.address,
            lat: profile.lat,
            lng: profile.lng,
          });
          setNeedsOnboarding(false);
        } else {
          setCurrentUser(null);
          setNeedsOnboarding(true);
        }
      } catch (err) {
        console.error('Failed loading user profile:', err);
        setNeedsOnboarding(true);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  // Real-time Firestore data subscriptions (only active when authenticated & verified with profile)
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified || !currentUser) {
      return;
    }

    // 1. Sync Products Catalog Telemetry
    const productsQuery = query(collection(db, 'products'), where('isActive', '==', true));
    let seededOnce = false;

    const unsubProducts = onSnapshot(
      productsQuery,
      async (snapshot) => {
        if (snapshot.empty && !seededOnce) {
          seededOnce = true;
          try {
            const batch = writeBatch(db);
            for (const p of INITIAL_PRODUCTS) {
              batch.set(doc(db, 'products', p.id), {
                id: p.id,
                sku: p.sku,
                name: p.name.slice(0, 160),
                category: p.category.slice(0, 80),
                retailPrice: p.retailPrice,
                retailerStock: p.retailerStock,
                wholesalerStock: p.wholesalerStock,
                isActive: true,
                updatedAt: serverTimestamp(),
              });
            }
            await batch.commit();
          } catch (err) {
            console.warn('Product catalog seed deferred:', err);
          }
          return;
        }

        const liveById: Record<string, { retailPrice?: number; retailerStock?: number; wholesalerStock?: number }> = {};
        snapshot.docs.forEach((d) => {
          const data = d.data();
          liveById[d.id] = {
            retailPrice: typeof data.retailPrice === 'number' ? data.retailPrice : undefined,
            retailerStock: typeof data.retailerStock === 'number' ? data.retailerStock : undefined,
            wholesalerStock: typeof data.wholesalerStock === 'number' ? data.wholesalerStock : undefined,
          };
        });

        setProducts(
          INITIAL_PRODUCTS.map((base) => {
            const live = liveById[base.id];
            if (!live) return base;
            return {
              ...base,
              retailPrice: live.retailPrice ?? base.retailPrice,
              retailerStock: live.retailerStock ?? base.retailerStock,
              wholesalerStock: live.wholesalerStock ?? base.wholesalerStock,
            };
          })
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    );

    // 2. Sync Orders scoped strictly to buyerId or sellerId == uid
    const buyerOrdersQuery = query(collection(db, 'orders'), where('buyerId', '==', firebaseUser.uid));
    const sellerOrdersQuery = query(collection(db, 'orders'), where('sellerId', '==', firebaseUser.uid));

    let buyerOrdersList: Order[] = [];
    let sellerOrdersList: Order[] = [];

    const mergeOrders = () => {
      const seen: Record<string, Order> = {};
      [...buyerOrdersList, ...sellerOrdersList].forEach((ord) => {
        seen[ord.id] = ord;
      });
      const combined = Object.values(seen).sort((a, b) => b.date.localeCompare(a.date));
      // Append starter reference examples for new accounts only as read-only preview if zero user orders exist
      setOrders(combined.length > 0 ? combined : INITIAL_ORDERS.filter((o) => o.buyerRole === currentUser.role || o.sellerRole === currentUser.role));
    };

    const unsubBuyerOrders = onSnapshot(
      buyerOrdersQuery,
      (snapshot) => {
        buyerOrdersList = snapshot.docs.map((d) => d.data() as Order);
        mergeOrders();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    const unsubSellerOrders = onSnapshot(
      sellerOrdersQuery,
      (snapshot) => {
        sellerOrdersList = snapshot.docs.map((d) => d.data() as Order);
        mergeOrders();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    // 3. Sync Inventory Audit Logs scoped to actorId == uid
    const logsQuery = query(collection(db, 'inventoryLogs'), where('actorId', '==', firebaseUser.uid));
    const unsubLogs = onSnapshot(
      logsQuery,
      (snapshot) => {
        const userLogs = snapshot.docs
          .map((d) => d.data() as InventoryLog)
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setInventoryLogs(userLogs.length > 0 ? userLogs : INITIAL_INVENTORY_LOGS);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'inventoryLogs');
      }
    );

    return () => {
      unsubProducts();
      unsubBuyerOrders();
      unsubSellerOrders();
      unsubLogs();
    };
  }, [authReady, firebaseUser, currentUser]);

  // Auth Handlers
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const profile = await loadUserProfile(cred.user);
      if (profile) {
        setCurrentUser(profile);
        setUserLocation({
          city: profile.city,
          address: profile.address,
          lat: profile.lat,
          lng: profile.lng,
        });
        setNeedsOnboarding(false);
        addToast(`Signed in as ${profile.name} (${profile.role.toUpperCase()})`, 'success');
      } else {
        setNeedsOnboarding(true);
        addToast('Google account verified! Select your commerce role and delivery location.', 'info');
      }
      return true;
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code !== 'auth/popup-closed-by-user') {
        addToast('Google sign-in failed. Please allow popups and try again.', 'error');
      }
      return false;
    }
  };

  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; errorCode?: string; errorMessage?: string }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!cred.user.emailVerified) {
        setNeedsEmailVerification(true);
        addToast('Please verify your email address before accessing your dashboard.', 'warning');
        return { ok: false, errorCode: 'auth/email-not-verified', errorMessage: 'Email verification required.' };
      }
      const profile = await loadUserProfile(cred.user);
      if (profile) {
        setCurrentUser(profile);
        setUserLocation({
          city: profile.city,
          address: profile.address,
          lat: profile.lat,
          lng: profile.lng,
        });
        setNeedsOnboarding(false);
        addToast(`Welcome back, ${profile.name}!`, 'success');
      } else {
        setNeedsOnboarding(true);
      }
      return { ok: true };
    } catch (error: unknown) {
      const errObj = error as { code?: string; message?: string };
      return {
        ok: false,
        errorCode: errObj.code,
        errorMessage: errObj.message || 'Authentication failed.',
      };
    }
  };

  const registerWithEmail = async (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    businessName?: string;
    taxId?: string;
    phone: string;
    location: GeoLocation;
  }): Promise<{ ok: boolean; errorCode?: string; errorMessage?: string }> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
      await updateProfile(cred.user, { displayName: params.name.trim() });
      // Store onboarding intent locally so once email verification finishes we preserve their selected role
      localStorage.setItem(
        `omnitrade_pending_profile_${cred.user.uid}`,
        JSON.stringify({
          name: params.name,
          role: params.role,
          businessName: params.businessName,
          taxId: params.taxId,
          phone: params.phone,
          location: params.location,
        })
      );
      await sendEmailVerification(cred.user);
      setNeedsEmailVerification(true);
      addToast('Account created! Verification link sent to your email.', 'success');
      return { ok: true };
    } catch (error: unknown) {
      const errObj = error as { code?: string; message?: string };
      return {
        ok: false,
        errorCode: errObj.code,
        errorMessage: errObj.message || 'Registration failed.',
      };
    }
  };

  const completeOnboarding = async (params: {
    name: string;
    role: UserRole;
    businessName?: string;
    taxId?: string;
    phone: string;
    location: GeoLocation;
  }): Promise<boolean> => {
    if (!firebaseUser) return false;
    try {
      const profile = await createSplitProfileBatch(firebaseUser, params);
      localStorage.removeItem(`omnitrade_pending_profile_${firebaseUser.uid}`);
      setCurrentUser(profile);
      setUserLocation(params.location);
      setNeedsOnboarding(false);
      addToast(`Account activated as ${profile.role.toUpperCase()} (${profile.city})!`, 'success');
      return true;
    } catch (err) {
      addToast('Unable to save profile to Firestore. Please retry.', 'error');
      console.error(err);
      return false;
    }
  };

  const resendVerificationEmail = async () => {
    if (!firebaseUser) return;
    try {
      await sendEmailVerification(firebaseUser);
      addToast('Verification email resent! Check your inbox.', 'info');
    } catch {
      addToast('Please wait a moment before requesting another verification email.', 'warning');
    }
  };

  const refreshVerificationStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const refreshed = auth.currentUser;
    if (refreshed.emailVerified) {
      setFirebaseUser(refreshed);
      setNeedsEmailVerification(false);
      const pendingRaw = localStorage.getItem(`omnitrade_pending_profile_${refreshed.uid}`);
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        await completeOnboarding(pending);
      } else {
        const profile = await loadUserProfile(refreshed);
        if (profile) {
          setCurrentUser(profile);
          setNeedsOnboarding(false);
        } else {
          setNeedsOnboarding(true);
        }
      }
      return true;
    }
    addToast('Email is not verified yet. Please click the verification link sent to your email.', 'warning');
    return false;
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCart([]);
    setBuyNowItem(null);
    setNeedsOnboarding(false);
    setNeedsEmailVerification(false);
    addToast('Signed out securely.', 'info');
  };

  // Location Update (syncs with Firestore profile)
  const updateUserLocation = async (loc: GeoLocation) => {
    setUserLocation(loc);
    if (currentUser && firebaseUser && firebaseUser.emailVerified) {
      setCurrentUser((prev) =>
        prev ? { ...prev, city: loc.city, address: loc.address, lat: loc.lat, lng: loc.lng } : null
      );
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          city: loc.city.slice(0, 80),
          lat: loc.lat,
          lng: loc.lng,
          updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'users', firebaseUser.uid, 'private', 'info'), {
          address: loc.address.slice(0, 300),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
      }
    }
    addToast(`Delivery location set to ${loc.city}. Nearest sellers & shipping costs updated!`, 'success');
  };

  // Resolve nearest seller & pricing for either Add to Cart or Buy Now
  const buildResolvedItem = (
    product: Product,
    quantity: number,
    tierType: 'retail' | 'wholesale',
    appliedTier?: WholesaleTier,
    sellerMeta?: SellerSelectionMeta
  ): CartItem | null => {
    const availableStock = tierType === 'retail' ? product.retailerStock : product.wholesalerStock;
    if (availableStock <= 0) {
      addToast(`${product.name} is currently out of stock.`, 'warning');
      return null;
    }
    if (quantity > availableStock) {
      addToast(`Requested quantity (${quantity}) exceeds available stock (${availableStock} units).`, 'warning');
      return null;
    }

    let chosenSellerId = sellerMeta?.sellerId;
    let chosenSellerName = sellerMeta?.sellerName;
    let chosenCity = sellerMeta?.sellerCity;
    let chosenDistanceKm = sellerMeta?.distanceKm;
    let unitPrice = sellerMeta?.unitPriceOverride;

    if (tierType === 'retail') {
      const ranked = rankRetailerOfferings(product.retailerOfferings, userLocation, quantity);
      const chosen =
        (chosenSellerId ? ranked.find((r) => r.retailerId === chosenSellerId) : ranked[0]) || ranked[0];
      if (chosen) {
        chosenSellerId = chosen.retailerId;
        chosenSellerName = chosen.retailerName;
        chosenCity = chosen.city;
        chosenDistanceKm = chosen.distanceKm;
        unitPrice = unitPrice ?? chosen.price;
      } else {
        unitPrice = unitPrice ?? product.retailPrice;
      }
    } else {
      const ranked = rankWholesalerOfferings(product.wholesalerOfferings, userLocation, quantity);
      const chosen =
        (chosenSellerId ? ranked.find((w) => w.wholesalerId === chosenSellerId) : ranked[0]) || ranked[0];
      if (appliedTier) {
        unitPrice = appliedTier.unitPrice;
      } else if (chosen) {
        unitPrice = unitPrice ?? chosen.unitPriceAtQty;
      } else {
        const sorted = [...product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty);
        const tier = sorted.find((t) => quantity >= t.minQty) || product.wholesaleTiers[0];
        unitPrice = tier.unitPrice;
      }
      if (chosen) {
        chosenSellerId = chosen.wholesalerId;
        chosenSellerName = chosen.companyName;
        chosenCity = chosen.city;
        chosenDistanceKm = chosen.distanceKm;
      }
    }

    return {
      product,
      quantity,
      unitPrice: unitPrice ?? product.retailPrice,
      tierType,
      appliedTier,
      selectedSellerId: chosenSellerId,
      selectedSellerName: chosenSellerName,
      sellerCity: chosenCity,
      sellerDistanceKm: chosenDistanceKm,
    };
  };

  // Cart operations with Location-Aware Seller Selection
  const addToCart = (
    product: Product,
    quantity: number,
    tierType: 'retail' | 'wholesale',
    appliedTier?: WholesaleTier,
    sellerMeta?: SellerSelectionMeta
  ) => {
    const resolved = buildResolvedItem(product, quantity, tierType, appliedTier, sellerMeta);
    if (!resolved) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.tierType === tierType
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex].quantity = newQty;
        if (tierType === 'wholesale') {
          const sorted = [...product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty);
          const tier = sorted.find((t) => newQty >= t.minQty) || product.wholesaleTiers[0];
          updated[existingIndex].unitPrice = tier.unitPrice;
          updated[existingIndex].appliedTier = tier;
        }
        return updated;
      }

      return [...prev, resolved];
    });

    addToast(
      `Added ${quantity} unit(s) of ${product.name} (${resolved.sellerCity ? `from ${resolved.sellerCity}` : 'nearest hub'}) to cart.`,
      'success'
    );
  };

  const buyNow = (
    product: Product,
    quantity: number,
    tierType: 'retail' | 'wholesale' = 'retail',
    appliedTier?: WholesaleTier,
    sellerMeta?: SellerSelectionMeta
  ) => {
    const resolved = buildResolvedItem(product, quantity, tierType, appliedTier, sellerMeta);
    if (!resolved) return;

    setBuyNowItem(resolved);
    setIsCheckoutOpen(true);
  };

  const removeFromCart = (productId: string, tierType: 'retail' | 'wholesale') => {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.tierType === tierType)));
  };

  const updateCartQuantity = (productId: string, quantity: number, tierType: 'retail' | 'wholesale') => {
    if (quantity <= 0) {
      removeFromCart(productId, tierType);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && item.tierType === tierType) {
          let unitPrice = item.unitPrice;
          let tier = item.appliedTier;
          if (tierType === 'wholesale') {
            const sorted = [...item.product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty);
            tier = sorted.find((t) => quantity >= t.minQty) || item.product.wholesaleTiers[0];
            unitPrice = tier.unitPrice;
          }
          return { ...item, quantity, unitPrice, appliedTier: tier };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  const calculateTotalsForItems = (items: CartItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const isWholesale = items.some((i) => i.tierType === 'wholesale');
    const tax = isWholesale ? 0 : subtotal * 0.18;

    let shipping = 0;
    let shippingSavings = 0;

    if (items.length > 0) {
      const avgDistance =
        items.reduce((sum, item) => sum + (item.sellerDistanceKm ?? 45), 0) / items.length;
      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

      if (isWholesale) {
        shipping = estimateWholesaleFreightFee(avgDistance, totalQty);
        shippingSavings = Math.max(0, 14070 - shipping);
      } else {
        shipping = estimateRetailShippingFee(avgDistance, subtotal);
        shippingSavings = Math.max(0, 190 - shipping);
      }
    }

    const total = subtotal + tax + shipping;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, tax, shipping, shippingSavings, total, itemCount };
  };

  const getCartTotal = () => calculateTotalsForItems(cart);
  const getCheckoutTotal = () => calculateTotalsForItems(buyNowItem ? [buyNowItem] : cart);

  // Checkout process persisting to Firestore
  const processCheckout = async (paymentDetails: {
    method: PaymentMethod;
    shippingAddress: string;
    cardNumber?: string;
    cardHolder?: string;
    upiId?: string;
    poNumber?: string;
  }): Promise<Order | null> => {
    if (!currentUser || !firebaseUser) {
      addToast('Please sign in to proceed with checkout.', 'error');
      return null;
    }
    const isInstantBuy = Boolean(buyNowItem);
    const activeItems = buyNowItem ? [buyNowItem] : cart;

    if (activeItems.length === 0) {
      addToast('Your cart is empty.', 'warning');
      return null;
    }

    const { subtotal, tax, shipping, total } = calculateTotalsForItems(activeItems);
    const isWholesale = activeItems.some((i) => i.tierType === 'wholesale');

    if (currentUser.role === 'customer' && paymentDetails.method === 'net30_escrow') {
      addToast('B2B Net-30 Escrow is not available for Customer accounts.', 'error');
      return null;
    }

    const isCodAllowed =
      activeItems.every((item) => item.unitPrice < 5000) && subtotal < 5000;
    if (paymentDetails.method === 'cod' && !isCodAllowed) {
      addToast('COD not available for products or orders ₹5,000 and above.', 'error');
      return null;
    }

    const orderNumber = isWholesale
      ? `B2B-PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      : `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderId = `ord_${Date.now()}`;
    const primaryItem = activeItems[0];
    const sellerName =
      primaryItem?.selectedSellerName ||
      (isWholesale ? 'Apex Industrial Manufacturing Corp' : 'MetroTech Retail Stores');

    const orderItems = activeItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      image: item.product.image,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.unitPrice * item.quantity,
      tierType: item.tierType,
    }));

    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const trackingNumber = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .substring(0, 10);

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      date: dateStr,
      buyerId: firebaseUser.uid,
      buyerName: currentUser.businessName || currentUser.name,
      buyerRole: currentUser.role,
      buyerEmail: currentUser.email,
      sellerId: primaryItem?.selectedSellerId || (isWholesale ? 'user_mfg_1' : 'user_ret_1'),
      sellerName,
      sellerRole: isWholesale ? 'wholesaler' : 'retailer',
      items: orderItems,
      subtotal,
      taxAmount: tax,
      shippingFee: shipping,
      totalAmount: total,
      status: 'processing',
      paymentMethod: paymentDetails.method,
      paymentStatus:
        paymentDetails.method === 'net30_escrow'
          ? 'escrow_held'
          : paymentDetails.method === 'cod'
          ? 'pay_on_delivery'
          : 'paid',
      shippingAddress: paymentDetails.shippingAddress,
      trackingNumber,
      estimatedDelivery,
      notes: paymentDetails.poNumber ? `PO Ref: ${paymentDetails.poNumber}` : undefined,
    };

    try {
      const firestoreOrderPayload: Record<string, unknown> = {
        ...newOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (!firestoreOrderPayload.notes) {
        delete firestoreOrderPayload.notes;
      }
      await setDoc(doc(db, 'orders', orderId), firestoreOrderPayload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
    }

    // Update product inventory in Firestore & create audit logs
    const newLogs: InventoryLog[] = [];
    for (const cartItem of activeItems) {
      const prod = products.find((p) => p.id === cartItem.product.id);
      if (!prod) continue;

      let newRetailerStock = prod.retailerStock;
      let newWholesalerStock = prod.wholesalerStock;

      if (cartItem.tierType === 'retail') {
        newRetailerStock = Math.max(0, prod.retailerStock - cartItem.quantity);
      } else {
        newWholesalerStock = Math.max(0, prod.wholesalerStock - cartItem.quantity);
        newRetailerStock = prod.retailerStock + cartItem.quantity;
      }

      try {
        await updateDoc(doc(db, 'products', prod.id), {
          retailerStock: newRetailerStock,
          wholesalerStock: newWholesalerStock,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `products/${prod.id}`);
      }

      const logId = `log_${Date.now()}_${prod.id}`;
      const logEntry: InventoryLog = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        type: cartItem.tierType === 'retail' ? 'customer_sale' : 'b2b_wholesale_purchase',
        quantityDelta: cartItem.tierType === 'retail' ? -cartItem.quantity : cartItem.quantity,
        actorRole: currentUser.role,
        actorName: currentUser.businessName || currentUser.name,
        retailerStockAfter: newRetailerStock,
        wholesalerStockAfter: newWholesalerStock,
        notes:
          cartItem.tierType === 'retail'
            ? `Order #${orderNumber} dispatched from ${sellerName} (${paymentDetails.method.toUpperCase()}).`
            : `B2B Procurement #${orderNumber} (${cartItem.quantity} units) from ${sellerName}.`,
      };
      newLogs.push(logEntry);

      try {
        await setDoc(doc(db, 'inventoryLogs', logId), {
          ...logEntry,
          actorId: firebaseUser.uid,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `inventoryLogs/${logId}`);
      }
    }

    if (isInstantBuy) {
      setBuyNowItem(null);
    } else {
      setCart([]);
    }
    setSelectedOrderReceipt(newOrder);
    addToast(`Payment Confirmed! Order ${newOrder.orderNumber} saved securely.`, 'success');
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((ord) => (ord.id === orderId ? { ...ord, status } : ord)));
    try {
      const ordSnap = await getDoc(doc(db, 'orders', orderId));
      if (ordSnap.exists()) {
        await updateDoc(doc(db, 'orders', orderId), {
          status,
          updatedAt: serverTimestamp(),
        });
      }
      addToast(`Order status updated to "${status.toUpperCase()}".`, 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateRetailPrice = async (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            retailPrice: newPrice,
            retailerOfferings: p.retailerOfferings.map((ro) =>
              ro.retailerId === 'user_ret_1' ? { ...ro, price: newPrice } : ro
            ),
          };
        }
        return p;
      })
    );
    try {
      await updateDoc(doc(db, 'products', productId), {
        retailPrice: newPrice,
        updatedAt: serverTimestamp(),
      });
      addToast(
        `Retail selling price updated to ₹${newPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
        'success'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const updateWholesaleTiers = (productId: string, tiers: WholesaleTier[]) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, wholesaleTiers: tiers } : p))
    );
    addToast('Bulk wholesale discount tiers saved.', 'success');
  };

  const factoryProduceBatch = async (productId: string, batchQty: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || !firebaseUser) return;

    const newWholesaleStock = prod.wholesalerStock + batchQty;
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, wholesalerStock: newWholesaleStock } : p))
    );

    try {
      await updateDoc(doc(db, 'products', productId), {
        wholesalerStock: newWholesaleStock,
        updatedAt: serverTimestamp(),
      });

      const logId = `log_${Date.now()}`;
      const logEntry: InventoryLog = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        type: 'factory_restock',
        quantityDelta: batchQty,
        actorRole: 'wholesaler',
        actorName: currentUser?.businessName || 'Apex Industrial Manufacturing',
        retailerStockAfter: prod.retailerStock,
        wholesalerStockAfter: newWholesaleStock,
        notes: `Factory batch production run: +${batchQty} units added to plant inventory.`,
      };

      await setDoc(doc(db, 'inventoryLogs', logId), {
        ...logEntry,
        actorId: firebaseUser.uid,
        createdAt: serverTimestamp(),
      });

      addToast(`Produced +${batchQty} units of ${prod.name}. Plant stock: ${newWholesaleStock}`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const retailerReorderBulk = (
    productId: string,
    quantity: number,
    unitPrice: number,
    sellerMeta?: SellerSelectionMeta
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    addToCart(prod, quantity, 'wholesale', { minQty: quantity, unitPrice }, sellerMeta);
    setIsCheckoutOpen(true);
  };

  return (
    <AppContext.Provider
      value={{
        authReady,
        firebaseUser,
        needsOnboarding,
        needsEmailVerification,
        currentUser,
        products,
        cart,
        buyNowItem,
        setBuyNowItem,
        orders,
        inventoryLogs,
        toasts,
        userLocation,
        isLocationModalOpen,
        setIsLocationModalOpen,
        updateUserLocation,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        completeOnboarding,
        resendVerificationEmail,
        refreshVerificationStatus,
        logout,
        addToCart,
        buyNow,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        getCartTotal,
        getCheckoutTotal,
        processCheckout,
        updateOrderStatus,
        updateRetailPrice,
        updateWholesaleTiers,
        factoryProduceBatch,
        retailerReorderBulk,
        activePriceComparisonProduct,
        setActivePriceComparisonProduct,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isInventoryLogOpen,
        setIsInventoryLogOpen,
        selectedOrderReceipt,
        setSelectedOrderReceipt,
        addToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
