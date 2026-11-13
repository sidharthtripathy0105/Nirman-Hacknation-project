import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  ArrowLeftRight,
  User as UserIcon,
  LogOut,
  Package,
  Factory,
  Store,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openCartDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openCartDrawer }) => {
  const {
    currentUser,
    userLocation,
    setIsLocationModalOpen,
    logout,
    setIsAuthModalOpen,
    getCartTotal,
    setIsInventoryLogOpen,
  } = useApp();

  const { itemCount } = getCartTotal();

  const roleLabels: Record<string, { label: string; icon: React.ReactNode; badgeClass: string }> = {
    customer: {
      label: 'Customer Tier',
      icon: <UserIcon className="w-3.5 h-3.5" />,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    retailer: {
      label: 'Retailer Tier',
      icon: <Store className="w-3.5 h-3.5" />,
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    },
    wholesaler: {
      label: 'Wholesaler / Mfg Tier',
      icon: <Factory className="w-3.5 h-3.5" />,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    },
  };

  const roleMeta = currentUser ? roleLabels[currentUser.role] : roleLabels.customer;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Brand Wordmark + Exclusive Role Tag */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors">
                OmniTrade
              </span>
            </button>
            {currentUser && (
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-semibold ${roleMeta.badgeClass}`}
              >
                {roleMeta.icon}
                <span>{roleMeta.label}</span>
              </span>
            )}
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              {currentUser?.role === 'customer'
                ? 'Store Catalog'
                : currentUser?.role === 'retailer'
                ? 'Retailer Dashboard'
                : 'Wholesale & Factory Hub'}
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'compare' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Price Comparison Matrix</span>
            </button>

            <button
              onClick={() => setIsInventoryLogOpen(true)}
              className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>Real-Time Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'orders' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Orders & Transactions
            </button>
          </nav>

          {/* Zone 3: Location Picker, Cart, Authenticated Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Location Picker Button */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 transition-colors cursor-pointer"
              title="Set your delivery or warehouse location to match nearest sellers"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-900 max-w-28 truncate">
                {userLocation.city}
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold hidden sm:inline">
                Change
              </span>
            </button>

            {/* Cart Button */}
            <button
              onClick={openCartDrawer}
              className="relative p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-slate-900 text-white font-mono-numbers text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-right hidden sm:block hover:opacity-80 cursor-pointer"
                  title="View account details"
                >
                  <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="max-w-36 truncate">
                      {currentUser.businessName || currentUser.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight capitalize">
                    {currentUser.email}
                  </div>
                </button>
                <button
                  onClick={() => void logout()}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Secondary Nav */}
        <div className="flex lg:hidden items-center gap-4 pb-2.5 overflow-x-auto text-xs font-medium text-slate-600 border-t border-slate-100 pt-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard' ? 'text-slate-900 font-bold' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`whitespace-nowrap cursor-pointer ${
              activeTab === 'compare' ? 'text-slate-900 font-bold' : ''
            }`}
          >
            Price Comparison
          </button>
          <button
            onClick={() => setIsInventoryLogOpen(true)}
            className="whitespace-nowrap cursor-pointer"
          >
            Inventory Logs
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`whitespace-nowrap cursor-pointer ${
              activeTab === 'orders' ? 'text-slate-900 font-bold' : ''
            }`}
          >
            Orders
          </button>
        </div>
      </div>
    </header>
  );
};
