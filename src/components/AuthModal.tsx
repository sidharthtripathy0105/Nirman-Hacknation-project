import React from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/currency';
import { X, Mail, MapPin, Phone, ShieldCheck, LogOut, Building, User as UserIcon } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    userLocation,
    setIsLocationModalOpen,
    logout,
  } = useApp();

  if (!isAuthModalOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Authenticated Account Profile</h3>
              <p className="text-xs text-slate-500 capitalize">
                {currentUser.role} Dashboard Access Verified
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold">Role Isolation Enforced</div>
              <div className="text-[11px] text-emerald-700">
                Your UID is cryptographically bound to the <strong>{currentUser.role.toUpperCase()}</strong> portal.
              </div>
            </div>
          </div>

          <div className="space-y-2.5 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Account Holder:</span>
              <span className="font-semibold text-slate-900">{currentUser.name}</span>
            </div>
            {currentUser.businessName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" /> Entity:
                </span>
                <span className="font-semibold text-slate-900">{currentUser.businessName}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Email:
              </span>
              <span className="font-medium text-slate-800">{currentUser.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Phone:
              </span>
              <span className="font-mono-numbers text-slate-800">{currentUser.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Credit Line / Balance:</span>
              <span className="font-mono-numbers font-bold text-emerald-700">
                {formatINR(currentUser.balanceCredit ?? 0)}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800 flex items-center gap-1 mb-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved Hub: {userLocation.city}</span>
              </div>
              <div className="text-[11px] text-slate-500">{userLocation.address}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAuthModalOpen(false);
                setIsLocationModalOpen(true);
              }}
              className="px-2.5 py-1.5 text-[11px] font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 shrink-0 cursor-pointer"
            >
              Update Map
            </button>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAuthModalOpen(false);
                void logout();
              }}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
