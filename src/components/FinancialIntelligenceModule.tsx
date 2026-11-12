import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Bot,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';
import { PayPalUser } from '../types/marketplace';

interface FinancialIntelligenceModuleProps {
  currentUser: PayPalUser;
}

export const FinancialIntelligenceModule: React.FC<FinancialIntelligenceModuleProps> = ({ currentUser }) => {
  const [reserveRatio, setReserveRatio] = useState<number>(30); // 30 days operating reserve target

  const currentCapital = currentUser.balance || 48500;
  const monthlyBurn = 14200;
  const daysOfRunway = Math.round((currentCapital / monthlyBurn) * 30);
  const recommendedReserve = (monthlyBurn / 30) * reserveRatio;
  const excessLiquidity = currentCapital - recommendedReserve;

  const financialRiskAlerts = [
    {
      id: 1,
      severity: 'LOW',
      title: 'Operating Reserve Healthy',
      description: `Current capital ($${currentCapital.toLocaleString()}) comfortably covers ${daysOfRunway} days of operating runway against target ${reserveRatio} days.`,
    },
    {
      id: 2,
      severity: 'MEDIUM',
      title: '1 Outstanding Client Invoice Nearing 30-Day Window',
      description: 'Acme Enterprise Solutions invoice #INV-2026-009 ($2,400.00) due in 4 days. Automated PayPal email reminder prepared.',
    },
    {
      id: 3,
      severity: 'LOW',
      title: 'Contractor Milestone Discount Opportunity',
      description: 'Early settlement of Alex Rivera Milestone 2 can capture a 3.5% discount ($52.50) without compromising liquidity reserve.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-[11px] font-semibold text-blue-300 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sample financial scenario · Local calculations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Financial Scenario & Reserve Calculator
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-1">
              Example reserve calculations based on illustrative figures. This screen does not read PayPal account data or invoke Gemini.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-purple-950 text-purple-300 border border-purple-800 px-3 py-1.5 rounded-xl font-bold">
              Demo Data
            </span>
          </div>
        </div>
      </div>

      {/* Financial Health Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Operating Runway</span>
          <div className="text-3xl font-black text-emerald-400 font-mono tabular-nums">{daysOfRunway} Days</div>
          <p className="text-[11px] text-slate-400">Based on monthly burn rate of ${monthlyBurn.toLocaleString()}/mo</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Target Operating Reserve ({reserveRatio} Days)</span>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            ${recommendedReserve.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-400">Target capital reserve floor</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Deployable Capital</span>
          <div className="text-3xl font-black text-blue-400 font-mono tabular-nums">
            +${excessLiquidity.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-400">Available for AI procurement & contractor hiring</p>
        </div>
      </div>

      {/* Risk Alerts & AI Recommendations */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Financial Risk & Optimization Alerts</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">Illustrative alerts</span>
        </div>

        <div className="space-y-3">
          {financialRiskAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border space-y-1.5 ${
                alert.severity === 'MEDIUM'
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  {alert.severity === 'MEDIUM' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {alert.title}
                </span>
                <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {alert.severity}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{alert.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
