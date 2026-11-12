import React from 'react';
import { PayPalUser } from '../types/marketplace';
import {
  LayoutDashboard,
  DollarSign,
  ShoppingBag,
  Calendar,
  Users,
  Bot,
  Zap,
  ShieldCheck,
  TrendingUp,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  buyerBalance: number;
  onOpenGuide: () => void;
  onOpenLogin: () => void;
  currentUser: PayPalUser | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  setActiveSection,
  onOpenGuide,
  onOpenLogin,
  currentUser,
}) => {
  // Comprehensive compact navigation items covering all modules
  const navTabs = [
    { id: 'command_center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'money_center', label: 'Money Center (AG Grid)', icon: DollarSign },
    { id: 'procurement', label: 'Procurement (Sample)', icon: ShoppingBag },
    { id: 'project_ops', label: 'Projects (Local)', icon: Calendar },
    { id: 'contractors', label: 'Contractors', icon: Users },
    { id: 'agent_control', label: 'AI Agent Control Room', icon: Bot },
    { id: 'a2a_commerce', label: 'A2A Commerce Studio', icon: Zap },
    { id: 'verified_payments', label: 'Verified Payments Demo', icon: ShieldCheck },
    { id: 'financial_intel', label: 'Financial Intelligence', icon: TrendingUp },
    { id: 'invoicing', label: 'Invoices', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-lg border-b border-slate-800/80 px-4 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('command_center');
          }}
          className="flex items-center gap-2 text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-blue-400 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-[#0070BA] flex items-center justify-center font-black text-white text-sm shadow-sm">
            <span>P</span>
          </div>
          <span className="flex items-center gap-1 text-sm sm:text-base">
            <span className="font-extrabold text-white">PayPal</span>
            <span className="font-semibold text-blue-400">Connect</span>
          </span>
        </a>

        {/* Compact Navigation Frame */}
        <nav className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-inner max-w-3xl overflow-x-auto no-scrollbar">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Account & Profile Compact Pill */}
        <div className="flex items-center gap-2 shrink-0">
          {currentUser && (
            <button
              onClick={onOpenLogin}
              title={currentUser.status}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs transition-all cursor-pointer hover:border-slate-700"
            >
              <span className="font-bold text-white text-[11px] truncate max-w-[120px] hidden sm:inline">
                {currentUser.name}
              </span>
              <span className="text-amber-300 font-mono font-bold text-[10px]">
                {currentUser.status.toLowerCase().includes('demo')
                  ? 'DEMO'
                  : `${currentUser.currencySymbol}${currentUser.balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
              </span>
            </button>
          )}

          <button
            onClick={onOpenGuide}
            title="Interactive Feature Guide"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
