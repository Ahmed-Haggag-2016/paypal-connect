import React, { useState } from 'react';
import {
  Bot,
  Cpu,
  ShieldCheck,
  Zap,
  Lock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Activity,
  Sliders,
  MessageSquare,
  Play,
  Sparkles,
} from 'lucide-react';
import { PayPalUser } from '../types/marketplace';

interface SpecializedAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: 'ACTIVE' | 'IDLE' | 'EXECUTING' | 'PAUSED';
  model: string;
  spendingLimit: number;
  tools: string[];
  permissions: string;
  lastAction: string;
  activityCount: number;
}

const SPECIALIZED_AGENTS: SpecializedAgent[] = [
  {
    id: 'AGENT-FIN',
    name: 'Financial Intelligence Agent',
    role: 'Financial Forecasting & Liquidity',
    description: 'Illustrative financial role. This screen does not read balances, predict payments, or authorize procurement.',
    status: 'ACTIVE',
    model: 'Illustrative only',
    spendingLimit: 25000,
    tools: ['get_wallet_balances', 'forecast_cash_flow', 'compute_reserve_margin'],
    permissions: 'Read Balance, Evaluate Budget, Approve Procurement Limits',
    lastAction: 'Sample activity only; no live balance was read.',
    activityCount: 142,
  },
  {
    id: 'AGENT-PROC',
    name: 'Procurement Agent',
    role: 'Equipment & Supplier Discovery',
    description: 'Searches Channel3 product listings when an API key is configured; otherwise this screen uses clearly labeled sample catalog data.',
    status: 'ACTIVE',
    model: 'Illustrative only',
    spendingLimit: 15000,
    tools: ['channel3_natural_search', 'compare_merchant_prices', 'calculate_procurement_cost'],
    permissions: 'Search Catalog, Compare Retailer Offers, Prepare Shortlists',
    lastAction: 'No search is run from this illustrative agent activity panel.',
    activityCount: 98,
  },
  {
    id: 'AGENT-TALENT',
    name: 'Talent & Contractor Agent',
    role: 'Contractor Sourcing & Proposal Matching',
    description: 'Discovers verified contractors, evaluates technical proposals, checks PayPal verification status, and structures payment milestone agreements.',
    status: 'ACTIVE',
    model: 'Illustrative only',
    spendingLimit: 10000,
    tools: ['search_contractors', 'score_proposal_match', 'structure_escrow_milestones'],
    permissions: 'Match Talent, Propose Milestones, Structure Terms',
    lastAction: 'Sample activity only; no contractor search was performed.',
    activityCount: 76,
  },
  {
    id: 'AGENT-EXEC',
    name: 'Project Execution Agent',
    role: 'Gantt Scheduling & Timeline Optimization',
    description: 'The project screen renders sample tasks in Bryntum Gantt; schedule adjustments are local previews.',
    status: 'ACTIVE',
    model: 'Illustrative only',
    spendingLimit: 0,
    tools: ['create_bryntum_schedule', 'optimize_task_dependencies', 'track_contractor_workload'],
    permissions: 'Update Project Schedules, Re-assign Workloads',
    lastAction: 'Sample schedule only; no contractor records or AI schedule optimizer are connected.',
    activityCount: 114,
  },
  {
    id: 'AGENT-VERIF',
    name: 'Deliverable Verification Agent',
    role: 'Multi-Modal Vision Audit & OCR Inspection',
    description: 'Uses Gemini Vision OCR to inspect courier shipping receipts, code repositories, and contractor deliverables against strict acceptance criteria.',
    status: 'ACTIVE',
    model: 'Illustrative only',
    spendingLimit: 0,
    tools: ['gemini_vision_ocr_audit', 'evaluate_weight_variance', 'score_code_quality'],
    permissions: 'Inspect Deliverables, Generate Audit Confidence Certificates',
    lastAction: 'Sample activity only; no manifest was audited.',
    activityCount: 88,
  },
  {
    id: 'AGENT-PAY',
    name: 'Payment Agent',
    role: 'Authorized PayPal Checkout & Payout Execution',
    description: 'Illustrative role. Real checkout and payouts are available only in the dedicated flows and are not escrow.',
    status: 'ACTIVE',
    model: 'Illustrative only',
    spendingLimit: 50000,
    tools: ['create_paypal_order', 'capture_paypal_order', 'disburse_batch_payout'],
    permissions: 'Dedicated payment flows require buyer approval or explicit payout approval.',
    lastAction: 'Sample activity only; no payout batch has been submitted from this screen.',
    activityCount: 204,
  },
  {
    id: 'AGENT-STRAT',
    name: 'Business Strategy Agent',
    role: 'Growth & Operating Strategy',
    description: 'Analyzes cross-functional data across finance, procurement, and projects to generate executive recommendations for business owners.',
    status: 'ACTIVE',
    model: 'Not connected',
    spendingLimit: 0,
    tools: ['analyze_business_performance', 'recommend_cost_savings'],
    permissions: 'Generate Strategic Reports',
    lastAction: 'Recommended 3% early payout discount strategy for active contractor milestones.',
    activityCount: 53,
  },
];

interface AgentControlRoomModuleProps {
  currentUser: PayPalUser;
}

export const AgentControlRoomModule: React.FC<AgentControlRoomModuleProps> = ({ currentUser }) => {
  const [agents, setAgents] = useState<SpecializedAgent[]>(SPECIALIZED_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<SpecializedAgent>(SPECIALIZED_AGENTS[0]);

  // Sample communication log for the illustrative agent dashboard
  const [a2aDialog, setA2aDialog] = useState<Array<{ sender: string; receiver: string; message: string; timestamp: string }>>([
    {
      sender: 'Procurement Agent',
      receiver: 'Financial Intelligence Agent',
      message: 'Req #PR-901: Need budget verification for 20 Developer Workstations via Channel3 ($3,780.00 total). Is liquidity sufficient?',
      timestamp: '14:20:05',
    },
    {
      sender: 'Financial Intelligence Agent',
      receiver: 'Procurement Agent',
      message: 'Res #PR-901: Cash reserve is $48,500. $3,780.00 is well within operating threshold (7.8% of available capital). APPROVED.',
      timestamp: '14:20:08',
    },
    {
      sender: 'Procurement Agent',
      receiver: 'Project Execution Agent',
      message: 'Req #PR-901: Procurement approved. Delivery estimated in 2 days. Update Bryntum Gantt schedule for hardware deployment.',
      timestamp: '14:20:12',
    },
    {
      sender: 'Project Execution Agent',
      receiver: 'Payment Agent',
      message: 'Req #PAY-901: Deliverable audited by Verification Agent (98% confidence). Prepare PayPal Batch Payout to contractor.',
      timestamp: '14:22:00',
    },
  ]);

  const toggleAgentPause = (id: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : a
      )
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-[11px] font-semibold text-blue-300 mb-2">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Illustrative registry · sample configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Agent Roles & Configuration Preview
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-1">
              Command center for managing autonomous AI agents. Configure individual spending limits, tools, permissions, and inspect live agent-to-agent communication logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              7 Agents Active
            </span>
          </div>
        </div>
      </div>

      {/* Grid of 7 Specialized Agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const isSelected = selectedAgent.id === agent.id;
          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                isSelected
                  ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[11px] text-blue-400 font-bold">{agent.id}</span>
                  <h3 className="text-base font-bold text-white">{agent.name}</h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAgentPause(agent.id);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                    agent.status === 'ACTIVE'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                      : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                  }`}
                >
                  {agent.status}
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {agent.description}
              </p>

              <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-800 pt-2 text-slate-400">
                <span>Limit: ${agent.spendingLimit.toLocaleString()}</span>
                <span className="text-purple-400">{agent.model}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Detail & sample agent dialogue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Selected Agent Inspector */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Agent Configuration & Permissions</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">{selectedAgent.id}</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <h3 className="text-lg font-extrabold text-white">{selectedAgent.name}</h3>
              <p className="text-slate-400 mt-1 leading-relaxed">{selectedAgent.description}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>AI Engine Model:</span>
                <span className="text-purple-400 font-bold">{selectedAgent.model}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Authorized Spending Limit:</span>
                <span className="text-emerald-400 font-bold">${selectedAgent.spendingLimit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Executed Actions:</span>
                <span className="text-white font-bold">{selectedAgent.activityCount}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-300 block uppercase tracking-wider text-[11px]">Assigned Tool Bindings:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.tools.map((t, idx) => (
                  <span key={idx} className="font-mono text-[11px] bg-blue-950 border border-blue-800 text-blue-300 px-2 py-0.5 rounded">
                    {t}()
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1">
              <span className="font-bold text-slate-400 block text-[11px]">Enforced Permissions:</span>
              <p className="text-slate-200">{selectedAgent.permissions}</p>
            </div>
          </div>
        </div>

        {/* Sample Agent Communication Log */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span>Illustrative Agent-to-Agent Dialogue</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
              A2A Active
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {a2aDialog.map((dialog, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-blue-400 font-bold">
                    {dialog.sender} <span className="text-slate-500">→</span> {dialog.receiver}
                  </span>
                  <span className="text-slate-500">{dialog.timestamp}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800/60">
                  {dialog.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
