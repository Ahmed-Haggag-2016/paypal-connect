import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Users,
  ShoppingBag,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bot,
  ShieldCheck,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { PayPalUser } from '../types/marketplace';

interface CommandCenterProps {
  currentUser: PayPalUser;
  onNavigate: (section: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Business Financial Stats
  const availableCapital = currentUser.balance || 48500;
  const incomingPayments = 18450;
  const outgoingPayments = 9200;
  const outstandingInvoices = 6400;
  const activeProjectsCount = 4;
  const pendingContractorPayouts = 3150;
  const procurementExpenses = 2840;

  // AI Generated Insights
  const aiInsights = [
    {
      id: 1,
      agent: 'Financial Intelligence Agent',
      type: 'opportunity',
      title: 'Working Capital Optimization',
      description: 'Illustrative scenario only: this sample reserve suggests a possible early-settlement discount. No real balance was read and no payout was initiated.',
      impact: '+$420 Savings',
      time: '12 min ago',
    },
    {
      id: 2,
      agent: 'Procurement Agent',
      type: 'alert',
      title: 'Channel3 Price Spike Alert',
      description: 'Sample price-comparison scenario; this dashboard card does not query live merchant inventory.',
      impact: 'Save $390',
      time: '45 min ago',
    },
    {
      id: 3,
      agent: 'Deliverable Verification Agent',
      type: 'success',
      title: 'Milestone Deliverable Audited',
      description: 'Sample activity only. No deliverable was audited; upload a real file in Verified Payments to run Gemini Vision.',
      impact: 'Milestone 2 Ready',
      time: '2 hours ago',
    },
  ];

  // Recent Agent Activities
  const recentActivities = [
    {
      id: 'ACT-901',
      agent: 'Payment Agent',
      action: 'Sample PayPal order event',
      target: 'Demo project · Milestone 1',
      amount: '$1,500.00',
      status: 'EXAMPLE',
      time: '14:22:10',
    },
    {
      id: 'ACT-902',
      agent: 'Procurement Agent',
      action: 'Sample procurement comparison',
      target: '20 High-Performance Developer Laptops',
      amount: '$14,200.00',
      status: 'EXAMPLE',
      time: '13:50:04',
    },
    {
      id: 'ACT-903',
      agent: 'Talent & Contractor Agent',
      action: 'Sample contractor proposal',
      target: 'Alex Rivera (Full-Stack Engineer)',
      amount: '$4,500.00',
      status: 'EXAMPLE',
      time: '11:15:33',
    },
    {
      id: 'ACT-904',
      agent: 'Financial Intelligence Agent',
      action: 'Sample cash-flow projection',
      target: 'Q4 Operating Reserve Projection',
      amount: '+$18.4%',
      status: 'EXAMPLE',
      time: '09:05:00',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-xs font-semibold text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>PayPal Connect Executive Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-blue-400">{currentUser.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Explore an illustrative small-business workflow. Dashboard balances, insights, and activity below are sample data—not live account information.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('money_center')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Money Center (AG Grid)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Financial KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Capital */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Available Capital</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              ${availableCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+12.4% from last month</span>
            </div>
          </div>
        </div>

        {/* Incoming vs Outgoing */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Net Cash Flow</span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/80 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              +${(incomingPayments - outgoingPayments).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400">
              In: <span className="text-emerald-400 font-mono">${incomingPayments.toLocaleString()}</span> · Out: <span className="text-rose-400 font-mono">${outgoingPayments.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Outstanding Invoices</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/80 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-amber-400 font-mono tabular-nums">
              ${outstandingInvoices.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400">
              3 invoices pending client settlement
            </div>
          </div>
        </div>

        {/* Active Projects & Contractors */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Active Operations</span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-800/80 flex items-center justify-center text-purple-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              {activeProjectsCount} Projects
            </div>
            <div className="text-xs text-slate-400">
              Pending Payouts: <span className="text-emerald-400 font-mono">${pendingContractorPayouts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Feature Inspection Checklist & PayPal Checkout Guide */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">
              Step-by-Step Feature Inspection Checklist (10 Modules)
            </h2>
          </div>
          <span className="text-xs font-mono text-blue-400 bg-blue-950 border border-blue-800 px-3 py-1 rounded-full font-bold">
            Interactive Test Protocol
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Use this interactive step-by-step checklist to systematically verify every module, AI agent, and live PayPal Sandbox payment capability:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {[
            { step: '01', sec: 'command_center', name: 'Command Center', action: 'Inspect Capital & Cash Flow' },
            { step: '02', sec: 'money_center', name: 'AG Grid Ledger', action: 'Sort, Filter & Export CSV' },
            { step: '03', sec: 'procurement', name: 'Supplier Catalog', action: 'Search sample supplier listings' },
            { step: '04', sec: 'project_ops', name: 'Project Schedule', action: 'Review local sample timeline' },
            { step: '05', sec: 'contractors', name: 'Contractor Hub', action: 'Match Proposal Milestones' },
            { step: '06', sec: 'agent_control', name: 'Agent Control Room', action: 'Review illustrative agent roles' },
            { step: '07', sec: 'a2a_commerce', name: 'A2A Studio', action: 'Run constrained Gemini negotiation' },
            { step: '08', sec: 'verified_payments', name: 'Verified Payments', action: 'Review approval-gated payout flow' },
            { step: '09', sec: 'financial_intel', name: 'Financial Intel', action: 'View Runway & Risk Alerts' },
            { step: '10', sec: 'invoicing', name: 'Invoicing Hub', action: 'Create invoice and buyer checkout' },
          ].map((item) => (
            <div
              key={item.step}
              onClick={() => onNavigate(item.sec)}
              className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-blue-500/80 transition-all cursor-pointer space-y-1.5 group"
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-blue-400">Step {item.step}</span>
                <span className="text-slate-500 group-hover:text-emerald-400 transition-colors">Test →</span>
              </div>
              <h3 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">{item.name}</h3>
              <p className="text-[11px] text-slate-400 leading-tight">{item.action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: AI Insights & Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI-Generated Business Insights */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">AI Autonomous Business Insights</h2>
            </div>
            <span className="text-xs text-slate-500">Updated Real-Time</span>
          </div>

          <div className="space-y-3">
            {aiInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-blue-900/50 transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{insight.agent}</span>
                  </span>
                  <span className="text-slate-500 text-[11px] font-mono">{insight.time}</span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                  {insight.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {insight.description}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs">
                  <span className="font-mono text-emerald-400 font-bold">{insight.impact}</span>
                  <button
                    onClick={() => onNavigate(insight.type === 'alert' ? 'procurement' : 'a2a_commerce')}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    <span>Take Action</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live Agent Activity Stream */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Live Agent Network Activity</h2>
            </div>
            <button
              onClick={() => onNavigate('agent_control')}
              className="text-xs text-blue-400 hover:underline font-semibold cursor-pointer"
            >
              Control Room →
            </button>
          </div>

          <div className="space-y-3">
            {recentActivities.map((act) => (
              <div key={act.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-purple-400 font-bold font-mono">{act.agent}</span>
                  <span className="text-slate-500 font-mono">{act.time}</span>
                </div>
                <div className="text-xs text-slate-200 font-medium">
                  {act.action}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-1.5">
                  <span className="truncate max-w-[180px]">{act.target}</span>
                  <span className="font-mono text-emerald-400 font-bold">{act.amount}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('verified_payments')}
              className="w-full py-2.5 rounded-xl bg-blue-950 border border-blue-800 text-blue-300 hover:bg-blue-900/60 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Launch Verified Payment Workflow</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
