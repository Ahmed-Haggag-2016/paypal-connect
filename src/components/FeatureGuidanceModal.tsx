import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  Table,
  Calendar,
  Terminal,
  X,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Cpu,
  Lock,
  LayoutDashboard,
  DollarSign,
  Users,
  Bot,
  Zap,
  TrendingUp,
  FileText,
  ExternalLink,
  Play,
  CheckCircle2,
} from 'lucide-react';

interface FeatureGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (section: string) => void;
}

export const FeatureGuidanceModal: React.FC<FeatureGuidanceModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  if (!isOpen) return null;

  const featuresTour = [
    {
      id: 'command_center',
      title: '1. Executive Command Center Dashboard',
      subtitle: 'Real-Time Financial Overview & AI Insights',
      icon: LayoutDashboard,
      color: 'text-blue-400',
      description: 'A dashboard preview with illustrative business metrics, sample activity, and links to the app modules. It does not read live PayPal balances or generate live forecasts.',
      diagram: `┌────────────────────────────────────────────────────────┐
│               PayPal Connect Command Center             │
├──────────────────┬───────────────────┬─────────────────┤
│ Available Capital│ Net Cash Flow     │ Outstanding Inv.│
│    $48,500.00    │   +$9,250.00      │    $6,400.00   │
└──────────────────┴───────────────────┴─────────────────┘
 │ AI Business Insights  │ Live Agent Activity Stream   │
 └───────────────────────┴──────────────────────────────┘`,
      howToUse: [
        'Review high-level capital availability and 30-day cash-flow forecasts.',
        'Inspect AI-generated business insights from Financial and Procurement Agents.',
        'Use the Verified Payments screen to inspect the separate deliverable review and approval-gated payout flow.',
      ],
      sandboxTip: 'Dashboard figures and activity are sample data and do not update from PayPal.',
    },
    {
      id: 'money_center',
      title: '2. Money Center — AG Grid Financial Ledger',
      subtitle: 'High-Density Financial Transaction Management',
      icon: DollarSign,
      color: 'text-emerald-400',
      description: 'An AG Grid ledger populated with illustrative sample transactions. Use sorting, filtering, and CSV export to explore the interface.',
      diagram: `┌────────────────────────────────────────────────────────┐
│            AG Grid Financial Transaction Ledger         │
├─────────┬──────────┬──────────┬─────────────┬──────────┤
│ TX ID   │ Type     │ Payee    │ Amount      │ Status   │
├─────────┼──────────┼──────────┼─────────────┼──────────┤
│ TX-1001 │ INCOMING │ Acme Corp│ +$12,500.00 │ COMPLETED│
│ TX-1003 │ PAYOUT   │ Alex Dev │  -$1,500.00 │ ESCROW   │
└─────────┴──────────┴──────────┴─────────────┴──────────┘
 [Quick Search Input]  [Filter: Incoming|Payouts]  [Export CSV]`,
      howToUse: [
        'Use the quick search box to find sample rows by transaction ID or payee name.',
        'Click any cell (e.g. Counterparty or Notes) to edit records inline.',
        'Click "Export CSV" to download an official accounting spreadsheet report.',
      ],
      sandboxTip: 'Sandbox Note: Click "New Entry" to simulate adding manual financial transactions to the AG Grid ledger.',
    },
    {
      id: 'procurement',
      title: '3. AI Procurement Marketplace (Channel3)',
      subtitle: 'Natural Language Equipment Sourcing & Price Comparison',
      icon: ShoppingBag,
      color: 'text-amber-400',
      description: 'Describe hardware or equipment needs in plain English (e.g. "20 laptops for $15,000"). The Procurement Agent searches Channel3 APIs, compares merchant quotes, and calculates bulk procurement costs.',
      diagram: `┌────────────────────────────────────────────────────────┐
│       Channel3 Natural Language Procurement Request     │
├────────────────────────────────────────────────────────┤
│ "I need 20 laptops for my company, budget $15,000..."  │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Sample supplier listings: Apex Compute vs Silicon       │
│ Calc: 20 x $189 = $3,780.00 (Fits $15,000 budget ✓)     │
└────────────────────────────────────────────────────────┘`,
      howToUse: [
        'Type your equipment requirement and target budget in the prompt box.',
        'Search the local example supplier catalog and review sample pricing.',
        'Use A2A Commerce separately for a catalog-constrained negotiation and buyer-approved checkout.',
      ],
      sandboxTip: 'This screen does not connect to Channel3, live inventory, or PayPal.',
    },
    {
      id: 'project_ops',
      title: '4. Project Operations — Local Schedule Preview',
      subtitle: 'Sample task timeline and dependencies',
      icon: Calendar,
      color: 'text-purple-400',
      description: 'Review a local Gantt-style visualization of sample tasks and dependencies. Bryntum is not installed or connected.',
      diagram: `┌────────────────────────────────────────────────────────┐
│            Bryntum Gantt Interactive Timeline          │
├────────────────────────────────────────────────────────┤
│ Task 1: Requirements & Prompting  [======]             │
│ Task 2: Backend API & PayPal Webhooks   [========]     │
│ Task 3: Channel3 & AG Grid UI              [======]    │
└────────────────────────────────────────────────────────┘
 [Action: Click "AI Schedule Optimization" to Compress Timeline]`,
      howToUse: [
        'Inspect task bars, contractor assignments, and milestone dollar values.',
        'Use the local schedule preview controls to inspect the sample tasks.',
        'No AI schedule optimization or payment milestone is performed.',
      ],
      sandboxTip: 'This preview does not connect to PayPal or an external project-management service.',
    },
    {
      id: 'contractors',
      title: '5. Contractor Marketplace Preview',
      subtitle: 'Illustrative freelancer profiles',
      icon: Users,
      color: 'text-cyan-400',
      description: 'Explore illustrative contractor profiles and proposals. Profiles are not verified against a live provider and no escrow or contract is created.',
      diagram: `┌────────────────────────────────────────────────────────┐
│              Verified Contractor Discovery             │
├────────────────────────────────────────────────────────┤
│ Alex Rivera (Full-Stack Engineer) · $85/hr · Match: 97%│
│ Skills: React, TypeScript, Node.js, PayPal REST APIs    │
├────────────────────────────────────────────────────────┤
│ Proposed Milestones:                                   │
│ 1. Backend & PayPal Auth: $1,500.00 (3 Days)           │
│ 2. Frontend AG Grid & Gantt: $1,500.00 (4 Days)        │
└────────────────────────────────────────────────────────┘`,
      howToUse: [
        'Review the example profiles and proposal details.',
        'Use Verified Payments separately to review a real deliverable and submit a human-approved Sandbox payout.',
      ],
      sandboxTip: 'Profile names, ratings, skills, and recipient details are sample data.',
    },
    {
      id: 'agent_control',
      title: '6. AI Agent Control Room (7 Agents)',
      subtitle: 'Multi-Agent Orchestration & Agent-to-Agent Dialogue',
      icon: Bot,
      color: 'text-indigo-400',
      description: 'A static registry illustrating possible agent roles, sample tools, and example permissions. It does not execute or orchestrate agents from this screen.',
      diagram: `┌────────────────────────────────────────────────────────┐
│               AI Agent Control Room (7 Agents)         │
├───────────────────────┬────────────────────────────────┤
│ Financial Agent       │ Procurement Agent              │
│ Limit: $25,000        │ Limit: $15,000                 │
├───────────────────────┼────────────────────────────────┤
│ Payment Agent         │ Deliverable Verification Agent │
│ Limit: $50,000        │ Gemini Vision OCR Audit        │
└───────────────────────┴────────────────────────────────┘
 [Illustrative agent activity stream]`,
      howToUse: [
        'Inspect the sample agent cards and role descriptions.',
        'Use A2A Commerce for the implemented Gemini negotiation flow.',
      ],
      sandboxTip: 'No payment or agent action is launched from this screen.',
    },
    {
      id: 'a2a_commerce',
      title: '7. Autonomous A2A Commerce Studio',
      subtitle: 'Dual AI Agent Price Negotiation & Margin Protection',
      icon: Zap,
      color: 'text-amber-300',
      description: 'Negotiate within a seeded sample catalog and server-enforced price bounds. Gemini uses the configured model when available; the result is a proposal, not a payment.',
      diagram: `┌────────────────────────────────────────────────────────┐
│             Dual AI Agent Commerce Studio              │
├────────────────────────────┬───────────────────────────┤
│ Buyer Agent Goal           │ Seller Agent Parameters   │
│ Budget: $210.00            │ List Price: $249.00       │
│ Prompt: Find Workstation   │ Reserve Floor: $185.00    │
└────────────────────────────┴───────────────────────────┘
                           │
                           ▼
 [Gemini negotiation → proposal → separate buyer-approved PayPal checkout]`,
      howToUse: [
        'Choose a sample product and a budget within its server-enforced price bounds.',
        'Run negotiation and review whether the response used Gemini or demo fallback.',
        'Approve any PayPal checkout separately in the Sandbox buyer flow.',
      ],
      sandboxTip: 'Negotiation does not create an order. PayPal Sandbox checkout captures directly to the configured payee after buyer approval; there is no escrow.',
    },
    {
      id: 'verified_payments',
      title: '8. Verified Payments',
      subtitle: 'Deliverable review and human-approved payout flow',
      icon: ShieldCheck,
      color: 'text-emerald-300',
      description: 'Upload a real deliverable for Gemini review. A payout is submitted only after a passing review, explicit human approval, and valid PayPal Sandbox configuration.',
      diagram: `┌────────────────────────────────────────────────────────┐
│          Deliverable review (Gemini, if configured)     │
│          Human confirms recipient and exact amount      │
├────────────────────────────────────────────────────────┤
│      PayPal Sandbox payout batch (not escrow)            │
│      Check PayPal batch status for settlement            │
└────────────────────────────────────────────────────────┘`,
      howToUse: [
        'Upload a genuine deliverable and review the Gemini audit result.',
        'Confirm the recipient and exact amount before approving any payout.',
        'Verify the returned PayPal batch status in Sandbox; submission is not final settlement.',
      ],
      sandboxTip: 'Payouts require valid Sandbox credentials and an explicit human approval; a batch submission does not prove settlement.',
    },
    {
      id: 'financial_intel',
      title: '9. Financial Intelligence & Analytics',
      subtitle: 'Predictive Cash-Flow Forecasting & Risk Monitoring',
      icon: TrendingUp,
      color: 'text-purple-300',
      description: 'AI-driven cash-flow forecasting, operating reserve floor calculations, late invoice detection, and financial risk monitoring.',
      diagram: `┌────────────────────────────────────────────────────────┐
│           Financial Intelligence Analytics             │
├───────────────────┬───────────────────┬────────────────┤
│ Operating Runway  │ Target Reserve    │ Deployable Cap │
│     102 Days      │    $14,200.00     │  +$34,300.00   │
└───────────────────┴───────────────────┴────────────────┘
 [Risk Alert: Acme Corp Invoice #INV-2026-009 Due in 4 Days]`,
      howToUse: [
        'Monitor your business operating runway days based on monthly burn rates.',
        'Review risk alerts for approaching invoice due dates and early payout discounts.',
      ],
      sandboxTip: 'Sandbox Note: Automatically computes deployable capital available for procurement.',
    },
    {
      id: 'invoicing',
      title: '10. Multi-Currency Invoicing Hub',
      subtitle: 'Invoice Creation, Tracking & Automated Settlement',
      icon: FileText,
      color: 'text-blue-300',
      description: 'Create, send, and track multi-currency invoices (USD, EUR, EGP). Mark invoices as paid and disburse funds directly via PayPal REST APIs.',
      diagram: `┌────────────────────────────────────────────────────────┐
│             Multi-Currency Invoicing Hub               │
├───────────┬─────────────────┬──────────┬───────────────┤
│ Inv ID    │ Client          │ Amount   │ Status        │
├───────────┼─────────────────┼──────────┼───────────────┤
│ INV-001   │ Acme Enterprise │ $12,500  │ PAID          │
│ INV-002   │ Vanguard Media  │ €5,950   │ DISBURSED     │
└───────────┴─────────────────┴──────────┴───────────────┘`,
      howToUse: [
        'Click "Create New Invoice" to generate a multi-currency invoice.',
        'Click "Mark Paid & Disburse" to trigger automated PayPal payout disbursement.',
      ],
      sandboxTip: 'Sandbox Note: Supports multi-currency conversion and automated payout discursals.',
    },
  ];

  const current = featuresTour[activeStep];
  const Icon = current.icon;
  const guidance: Record<string, { description: string; steps: string[]; limit: string }> = {
    command_center: {
      description: 'This dashboard is a presentation view. Its balances, forecasts, alerts, and activity are sample data and are not retrieved from a PayPal account.',
      steps: ['Use the shortcuts to open a module.', 'Choose the A2A Studio to test a separate negotiation and, when configured, buyer-approved Sandbox checkout.'],
      limit: 'The demo profile is not authenticated; no financial action is taken from this dashboard.',
    },
    money_center: {
      description: 'A real AG Grid Community ledger component populated with illustrative sample rows.',
      steps: ['Sort and filter sample rows.', 'Export the visible demo ledger as CSV.'],
      limit: 'This grid does not sync, reconcile, or edit PayPal transactions.',
    },
    procurement: {
      description: 'A local, curated supplier catalog with a basic keyword filter and price estimate. Channel3 is not connected.',
      steps: ['Search or select a sample listing.', 'The navigation action opens a separate A2A demo catalog; it does not carry the supplier listing into checkout.'],
      limit: 'Inventory, ratings, match scores, and delivery estimates are sample data.',
    },
    project_ops: {
      description: 'A local Gantt-style visualization for sample tasks and dependencies. Bryntum is not installed or connected.',
      steps: ['Review the sample schedule.', 'Run the rule-based preview to see local task dates change.'],
      limit: 'No project database, AI optimizer, or payment milestone is linked.',
    },
    contractors: {
      description: 'Illustrative contractor profiles and proposals for exploring the small-business workflow.',
      steps: ['Review the example profiles.', 'Use Verified Payments separately to submit a real file for audit and, after explicit approval, a Sandbox payout.'],
      limit: 'Profiles and ratings are not verified or searchable from a live service.',
    },
    agent_control: {
      description: 'A static registry illustrating possible agent roles and permissions.',
      steps: ['Inspect the sample agent cards.', 'Run actual supported AI/payment flows from A2A Commerce or Verified Payments.'],
      limit: 'The agents and activity shown here are not executing tools from this screen.',
    },
    a2a_commerce: {
      description: 'The server matches requests against seeded sample products, enforces the stored seller floor and buyer budget, and asks Gemini for structured negotiation when configured.',
      steps: ['Choose a matching sample product and a budget at or above its floor.', 'Review whether the result is Gemini or deterministic fallback.', 'Separately approve checkout in PayPal Sandbox before capture.'],
      limit: 'No order is created by negotiation. The Sandbox order is paid to the configured app account; seller routing is not configured.',
    },
    verified_payments: {
      description: 'The six-step sequence is an illustrative preview. The separate payout flow audits an uploaded deliverable with Gemini and submits a real Sandbox payout only after explicit user approval.',
      steps: ['Upload a genuine deliverable and enter the intended Sandbox recipient.', 'Review and approve the amount and recipient.', 'Verify the returned payout batch status in PayPal; submission is not settlement.'],
      limit: 'AI review is advisory and does not guarantee work quality. No escrow or dispute protection is provided.',
    },
    financial_intel: {
      description: 'Local calculations based on example inputs and static alerts.',
      steps: ['Adjust the reserve target to see the sample calculation update.'],
      limit: 'This screen neither reads account balances nor calls Gemini.',
    },
    invoicing: {
      description: 'Creates an in-memory invoice and genuine PayPal Sandbox order when server credentials are configured.',
      steps: ['Create an invoice with valid email addresses and a supported Sandbox currency.', 'Have the client approve the PayPal order, then confirm capture.'],
      limit: 'PayPal approval is required; records are lost on server restart. Capture pays the configured payee directly—there is no payout or escrow.',
    },
    developer: {
      description: 'A reference page for the prototype API and setup.',
      steps: ['Use the README environment setup and API walkthrough.', 'Check /api/health before testing PayPal or Gemini actions.'],
      limit: 'Only routes implemented by the running server are functional; no credentials are shown here.',
    },
  };
  const currentGuidance = guidance[current.id];

  const handleTryFeature = () => {
    if (onNavigate) {
      onNavigate(current.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                Interactive User Guide
              </span>
              <span className="text-xs text-slate-400 font-mono">{featuresTour.length} Modules Covered</span>
            </div>
            <h3 className="font-extrabold text-xl text-white tracking-tight mt-0.5">
              PayPal Connect — Step-by-Step Feature Walkthrough
            </h3>
          </div>
        </div>

        {/* Step Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {featuresTour.map((f, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
                activeStep === idx
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              Step 0{idx + 1}
            </button>
          ))}
        </div>

        {/* Active Module Card */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center ${current.color} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-lg text-white">{current.title}</h4>
                <p className="text-xs text-slate-400">{current.subtitle}</p>
              </div>
            </div>

            {onNavigate && (
              <button
                onClick={handleTryFeature}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md shrink-0"
              >
                <span>Try This Feature</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {currentGuidance.description}
          </p>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
              How to use:
            </span>
            <ul className="space-y-1.5">
              {currentGuidance.steps.map((stepText, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>{stepText}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sandbox Tip */}
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 text-xs text-blue-300 flex items-start gap-2 font-mono">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{currentGuidance.limit}</span>
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400 font-mono">
            Step {activeStep + 1} of {featuresTour.length}
          </span>

          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                onClick={() => setActiveStep((prev) => prev - 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}
            {activeStep < featuresTour.length - 1 ? (
              <button
                onClick={() => setActiveStep((prev) => prev + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all cursor-pointer shadow-md shadow-blue-500/20"
              >
                <span>Next Module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20"
              >
                Got It, Explore Workspace
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
