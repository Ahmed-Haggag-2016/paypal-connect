import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  User,
  Mail,
  LogOut,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { PayPalUser } from '../types/marketplace';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: PayPalUser | null;
  onLogin: (user: PayPalUser) => void;
  onLogout: () => void;
  initialRole?: 'buyer' | 'seller';
}

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  initialRole = 'buyer',
}) => {
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeModalRole, setActiveModalRole] = useState<'buyer' | 'seller'>(
    currentUser?.role || initialRole
  );
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    if (isOpen && currentUser) {
      setEmail(currentUser.email);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleDirectConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid PayPal email address.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    const cleanEmail = email.trim().toLowerCase();
    const name = cleanEmail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    const demoProfile: PayPalUser = {
      email: cleanEmail,
      name: name || 'Demo User',
      country: 'Demo',
      currency: 'USD',
      currencySymbol: '$',
      balance: 0,
      accountId: 'DEMO-PROFILE',
      status: 'Demo profile — not authenticated with PayPal',
      role: activeModalRole,
    };
    onLogin(demoProfile);
    setSuccessMsg(`Demo profile selected for ${demoProfile.name}.`);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 cursor-default"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Brand Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#0070BA] flex items-center justify-center text-white font-black shadow-md text-lg shrink-0">
            P
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-white">PayPal Connect Session</h3>
            <p className="text-xs text-slate-400">
              {currentUser
                ? `Active ${currentUser.role === 'seller' ? 'Seller' : 'Buyer'} Profile`
                : 'Configure App Handshake'}
            </p>
          </div>
        </div>

        {/* Role Toggle Selector (Only if not logged in or switching) */}
        {!currentUser && (
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveModalRole('buyer')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeModalRole === 'buyer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Buyer Account
            </button>
            <button
              type="button"
              onClick={() => setActiveModalRole('seller')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeModalRole === 'seller'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Seller Account
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-700/60 text-xs text-red-200 flex items-center gap-2 animate-in shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {currentUser ? (
          /* Profile Details */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-mono font-bold text-blue-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {currentUser.status}
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {currentUser.accountId}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Name:
                  </span>
                  <span className="text-white font-bold">{currentUser.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Profile Email:
                  </span>
                  <span className="text-blue-300 font-mono">{currentUser.email}</span>
                </div>

                <p className="border-t border-slate-800 pt-2 text-[11px] text-amber-300">
                  This profile is for the local demo only. It is not a PayPal login and has no live wallet balance.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Window
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setSuccessMsg('');
                  setErrorMsg('');
                }}
                className="py-2.5 px-3 bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-900/30 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign-In Form */
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/30 space-y-1.5 text-xs text-slate-300">
              <p>
                Select a local demo profile. This does not sign in to or verify a PayPal account. Buyer approval happens separately at PayPal Sandbox checkout.
              </p>
            </div>

            <form onSubmit={handleDirectConnect} className="space-y-3">
              <div className="relative group">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. demo@example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !email.includes('@')}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeModalRole === 'seller' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'
                } text-white shadow-lg`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Use Demo Profile</span>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <a
                href="https://www.sandbox.paypal.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-slate-500 hover:text-blue-400 underline inline-flex items-center gap-1"
              >
                <span>Access PayPal Sandbox Dashboard</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
