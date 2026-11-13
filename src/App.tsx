import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AuthGate } from './components/AuthGate';
import { CustomerDashboard } from './components/dashboards/CustomerDashboard';
import { RetailerDashboard } from './components/dashboards/RetailerDashboard';
import { WholesalerDashboard } from './components/dashboards/WholesalerDashboard';
import { PriceComparisonView } from './components/PriceComparisonView';
import { OrdersView } from './components/OrdersView';
import { PriceComparisonModal } from './components/PriceComparisonModal';
import { PaymentModal } from './components/PaymentModal';
import { InventoryTrackerModal } from './components/InventoryTrackerModal';
import { LocationFinderModal } from './components/LocationFinderModal';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { CheckCircle2, AlertCircle, Info, ArrowLeft } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    authReady,
    currentUser,
    needsOnboarding,
    needsEmailVerification,
    activePriceComparisonProduct,
    setActivePriceComparisonProduct,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isInventoryLogOpen,
    setIsInventoryLogOpen,
    toasts,
  } = useApp();

  const [activeTab, setActiveTabState] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return ['dashboard', 'compare', 'orders'].includes(hash) ? hash : 'dashboard';
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  const setActiveTab = (tab: string) => {
    if (tab !== activeTab) {
      window.history.pushState({ tab }, '', `#${tab}`);
      setActiveTabState(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
    }

    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      setActiveTabState(['dashboard', 'compare', 'orders'].includes(hash) ? hash : 'dashboard');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isAuthenticatedAndReady =
    authReady && Boolean(currentUser) && !needsOnboarding && !needsEmailVerification;

  return (
    <>
      {!isAuthenticatedAndReady ? (
        <AuthGate />
      ) : (
        <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-slate-900 selection:text-white">
          {/* Top Bar */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            openCartDrawer={() => setIsCartOpen(true)}
          />

          {/* Main Container — Strictly renders only the authenticated user's exclusive role dashboard */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            {activeTab !== 'dashboard' && (
              <div className="mb-4">
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              </div>
            )}

            {activeTab === 'dashboard' && currentUser && (
              <>
                {currentUser.role === 'customer' && <CustomerDashboard />}
                {currentUser.role === 'retailer' && <RetailerDashboard />}
                {currentUser.role === 'wholesaler' && <WholesalerDashboard />}
              </>
            )}

            {activeTab === 'compare' && <PriceComparisonView />}
            {activeTab === 'orders' && <OrdersView />}
          </main>

          {/* Modals & Overlays */}
          <PriceComparisonModal
            product={activePriceComparisonProduct}
            onClose={() => setActivePriceComparisonProduct(null)}
          />

          <PaymentModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
          />

          <InventoryTrackerModal
            isOpen={isInventoryLogOpen}
            onClose={() => setIsInventoryLogOpen(false)}
          />

          <LocationFinderModal />

          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onProceedToCheckout={() => setIsCheckoutOpen(true)}
          />

          <AuthModal />
          <OrderReceiptModal />

          {/* Footer */}
          <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">OmniTrade</span>
                <span className="text-slate-300">·</span>
                <span>Unified Supply Chain & Multi-Tier Retail Architecture</span>
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <span>Customer Tier</span>
                <span className="text-slate-300">·</span>
                <span>Retailer Tier</span>
                <span className="text-slate-300">·</span>
                <span>Wholesaler / Manufacturer Tier</span>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2.5 transition-all transform animate-in slide-in-from-bottom-3 duration-200 ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-800'
                : toast.type === 'warning'
                ? 'bg-amber-900 text-white border-amber-800'
                : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
          </div>
        ))}
      </div>
    </>
  );
};

export default function App() {
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  return (
    <AppProvider>
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <MainContent />
    </AppProvider>
  );
}