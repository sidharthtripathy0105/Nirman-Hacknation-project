import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, GeoLocation } from '../types';
import { DEFAULT_LOCATION } from '../utils/location';
import { IndiaLocationSelector } from './IndiaLocationSelector';
import {
  ShieldCheck,
  Lock,
  Mail,
  Building,
  User as UserIcon,
  Phone,
  Shield,
  Store,
  Factory,
  ShoppingBag,
  AlertTriangle,
  RefreshCw,
  LogOut,
} from 'lucide-react';

export const AuthGate: React.FC = () => {
  const {
    authReady,
    firebaseUser,
    needsOnboarding,
    needsEmailVerification,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    completeOnboarding,
    resendVerificationEmail,
    refreshVerificationStatus,
    logout,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<UserRole>('customer');
  const [name, setName] = useState(firebaseUser?.displayName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('+91 98200 11223');
  const [selectedLoc, setSelectedLoc] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [customAddress, setCustomAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [providerDisabledNotice, setProviderDisabledNotice] = useState(false);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full text-center space-y-3 shadow-sm">
          <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-800">Verifying OmniTrade Session...</p>
          <p className="text-xs text-slate-500">Connecting securely to Firebase Auth</p>
        </div>
      </div>
    );
  }

  // Step B: Email verification gate
  if (needsEmailVerification && firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900">Verify Your Email Address</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              We sent a verification link to <strong className="text-slate-900">{firebaseUser.email}</strong>. Click the link in your inbox, then refresh below to unlock your dashboard.
            </p>
          </div>
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => void refreshVerificationStatus()}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>I&apos;ve Verified My Email — Continue</span>
            </button>
            <button
              onClick={() => void resendVerificationEmail()}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Resend Verification Email
            </button>
            <button
              onClick={() => void logout()}
              className="w-full py-2 px-4 text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out and use another account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step C: First-time Google Sign-In Role & Location Onboarding
  if (needsOnboarding && firebaseUser) {
    const handleOnboardingSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setIsSubmitting(true);
      const finalName = name.trim() || firebaseUser.displayName || 'OmniTrade Partner';
      const finalLocation: GeoLocation = {
        ...selectedLoc,
        address: customAddress.trim() || selectedLoc.address,
      };
      const ok = await completeOnboarding({
        name: finalName,
        role,
        businessName: role !== 'customer' ? businessName.trim() || `${finalName} Enterprises` : undefined,
        taxId: role !== 'customer' ? taxId.trim() : undefined,
        phone: phone.trim() || '+91 98200 11223',
        location: finalLocation,
      });
      if (!ok) {
        setErrorMsg('Could not finish creating your profile. Please try again.');
      }
      setIsSubmitting(false);
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Verified Google Account
              </div>
              <h2 className="text-lg font-bold mt-0.5">Complete Your OmniTrade Profile</h2>
              <p className="text-xs text-slate-300">{firebaseUser.email}</p>
            </div>
            <button
              onClick={() => void logout()}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch</span>
            </button>
          </div>

          <form onSubmit={handleOnboardingSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Your Dedicated Dashboard Tier (Locked to Your Account):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    role === 'customer'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-700 mb-1.5" />
                  <div className="text-xs font-bold text-slate-900">1. Customer</div>
                  <div className="text-[11px] text-slate-500">Single units & groceries</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('retailer')}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    role === 'retailer'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Store className="w-4 h-4 text-indigo-700 mb-1.5" />
                  <div className="text-xs font-bold text-slate-900">2. Retailer</div>
                  <div className="text-[11px] text-slate-500">Bulk cartons & shelf pricing</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('wholesaler')}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    role === 'wholesaler'
                      ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Factory className="w-4 h-4 text-amber-700 mb-1.5" />
                  <div className="text-xs font-bold text-slate-900">3. Wholesaler</div>
                  <div className="text-[11px] text-slate-500">Factory supply & B2B tiers</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={firebaseUser.displayName || 'Your Name'}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {role !== 'customer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Business / Factory Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. MetroMart Enterprises"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN / Trade ID</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="e.g. GSTIN-27AABCU9603R1ZM"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            <IndiaLocationSelector
              selectedLocation={selectedLoc}
              onSelectLocation={setSelectedLoc}
              customAddress={customAddress}
              onCustomAddressChange={setCustomAddress}
              showAddressInput={true}
              showGpsButton={true}
            />

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Profile...' : `Launch ${role.toUpperCase()} Dashboard →`}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step A: Primary Login / Sign Up Gate
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setProviderDisabledNotice(false);
    setIsSubmitting(true);

    if (mode === 'signin') {
      const res = await loginWithEmail(email, password);
      if (!res.ok) {
        if (res.errorCode === 'auth/operation-not-allowed') {
          setProviderDisabledNotice(true);
        } else if (res.errorCode === 'auth/invalid-credential' || res.errorCode === 'auth/wrong-password' || res.errorCode === 'auth/user-not-found') {
          setErrorMsg('Invalid email or password. Check your credentials or sign in with Google below.');
        } else {
          setErrorMsg(res.errorMessage || 'Sign-in failed.');
        }
      }
    } else {
      if (!name.trim() || !email.trim() || password.length < 6) {
        setErrorMsg('Please enter your name, a valid email, and a password (min 6 characters).');
        setIsSubmitting(false);
        return;
      }
      const res = await registerWithEmail({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        businessName: role !== 'customer' ? businessName.trim() || `${name} Enterprises` : undefined,
        taxId: role !== 'customer' ? taxId.trim() : undefined,
        phone: phone.trim(),
        location: {
          ...selectedLoc,
          address: customAddress.trim() || selectedLoc.address,
        },
      });
      if (!res.ok) {
        if (res.errorCode === 'auth/operation-not-allowed') {
          setProviderDisabledNotice(true);
        } else {
          setErrorMsg(res.errorMessage || 'Could not create account.');
        }
      }
    }

    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setProviderDisabledNotice(false);
    setIsSubmitting(true);
    await loginWithGoogle();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Hero Summary */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Multi-Tier Commerce Authentication</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              OmniTrade B2B2C Ecosystem
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              One unified platform connecting Customers, Retailers, and Manufacturers/Wholesalers. Sign in with your verified account to access your exclusive role dashboard, nearest-seller freight optimizer, and real-time inventory.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Customer Storefront</div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Buy everyday groceries & electronics in small quantities from the nearest local store to avoid shipping fees.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Retailer Bulk Portal</div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Source cartons from nearest regional factories with live truck freight comparison, Net-30 credit, and shelf markup control.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-800 shrink-0">
                <Factory className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Wholesaler / Manufacturer Hub</div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage factory stock runs, configure bulk MOQ volume pricing tiers, and fulfill regional B2B purchase orders.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Auth Card */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-900 px-6 py-5 text-white">
            <h2 className="text-lg font-bold">
              {mode === 'signin' ? 'Sign In to Your Dashboard' : 'Create Authenticated Account'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Each account is strictly scoped to its assigned dashboard tier
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Primary Google Sign-In Button */}
            <button
              type="button"
              onClick={() => void handleGoogleLogin()}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24Z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
              </svg>
              <span>Continue with Google (Recommended)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink mx-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Or use Email & Password
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Sign In / Register Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                  setProviderDisabledNotice(false);
                }}
                className={`pb-2.5 text-sm font-semibold border-b-2 mr-6 cursor-pointer ${
                  mode === 'signin'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                  setProviderDisabledNotice(false);
                }}
                className={`pb-2.5 text-sm font-semibold border-b-2 cursor-pointer ${
                  mode === 'signup'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Create Account
              </button>
            </div>

            {providerDisabledNotice && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Enable Email/Password in Firebase Console</span>
                </div>
                <p className="leading-relaxed">
                  Google Sign-In is active right now above! If you also want Email & Password login, open your{' '}
                  <a
                    href="https://console.firebase.google.com/project/atlantean-position-9lczw/authentication/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    Firebase Authentication Providers
                  </a>{' '}
                  page, click <strong>Add new provider → Email/Password</strong>, and toggle Enable.
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Account Tier:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('customer')}
                        className={`p-2 text-center rounded-lg border text-xs cursor-pointer ${
                          role === 'customer'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('retailer')}
                        className={`p-2 text-center rounded-lg border text-xs cursor-pointer ${
                          role === 'retailer'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Retailer
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('wholesaler')}
                        className={`p-2 text-center rounded-lg border text-xs cursor-pointer ${
                          role === 'wholesaler'
                            ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Wholesaler
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full name"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Phone *</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {role !== 'customer' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Business Name *</label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            required
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="Company name"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN / Trade ID</label>
                        <div className="relative">
                          <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            placeholder="Optional"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <IndiaLocationSelector
                    selectedLocation={selectedLoc}
                    onSelectLocation={setSelectedLoc}
                    customAddress={customAddress}
                    onCustomAddressChange={setCustomAddress}
                    showAddressInput={true}
                    showGpsButton={true}
                  />
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Authenticating...'
                  : mode === 'signin'
                  ? 'Sign In with Email'
                  : `Register ${role.toUpperCase()} Account`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
