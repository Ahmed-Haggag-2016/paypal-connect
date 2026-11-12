import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  Sparkles,
  Bot,
  ShieldCheck,
  ArrowRight,
  Loader2,
  DollarSign,
  Calendar,
  Users,
  ShoppingBag,
  FileSpreadsheet,
  AlertCircle,
  Code,
  Terminal,
} from 'lucide-react';
import { PayPalUser } from '../types/marketplace';

interface StepStatus {
  step: number;
  title: string;
  description: string;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED';
  resultData?: any;
}

interface VerifiedPaymentsA2AModuleProps {
  currentUser: PayPalUser;
}

export const VerifiedPaymentsA2AModule: React.FC<VerifiedPaymentsA2AModuleProps> = ({ currentUser }) => {
  const [userPrompt, setUserPrompt] = useState<string>(
    'I have a website development project worth $5,000. I need to complete it in 10 days. Find suitable contractors, identify required tools, create a project plan, track the work, and prepare milestone payments.'
  );

  const [isRunningDemo, setIsRunningDemo] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isHumanApproved, setIsHumanApproved] = useState<boolean>(false);
  const [payoutResult, setPayoutResult] = useState<any>(null);
  const [payoutError, setPayoutError] = useState('');
  const [deliverableBase64, setDeliverableBase64] = useState('');
  const [deliverableMimeType, setDeliverableMimeType] = useState('');
  const [deliverableName, setDeliverableName] = useState('');
  const [contractorEmail, setContractorEmail] = useState('alex-rivera-developer@sandbox.paypal.com');

  const demoSteps: StepStatus[] = [
    {
      step: 1,
      title: 'Natural Language Requirements Parsing',
      description: 'Illustrative workflow preview; this step does not call an external agent.',
      status: currentStepIndex > 0 ? 'COMPLETED' : currentStepIndex === 0 && isRunningDemo ? 'EXECUTING' : 'PENDING',
    },
    {
      step: 2,
      title: 'Channel3 Equipment & Tool Lookup',
      description: 'Illustrative workflow preview; this step does not call the Channel3 API.',
      status: currentStepIndex > 1 ? 'COMPLETED' : currentStepIndex === 1 && isRunningDemo ? 'EXECUTING' : 'PENDING',
    },
    {
      step: 3,
      title: 'Contractor Matching & Proposal Scoring',
      description: 'Illustrative workflow preview; this step does not search contractor accounts.',
      status: currentStepIndex > 2 ? 'COMPLETED' : currentStepIndex === 2 && isRunningDemo ? 'EXECUTING' : 'PENDING',
    },
    {
      step: 4,
      title: 'Bryntum Gantt Timeline Generation',
      description: 'Illustrative workflow preview; this step does not generate a live project schedule.',
      status: currentStepIndex > 3 ? 'COMPLETED' : currentStepIndex === 3 && isRunningDemo ? 'EXECUTING' : 'PENDING',
    },
    {
      step: 5,
      title: 'AG Grid Ledger Record Initialization',
      description: 'Illustrative workflow preview; this step does not create an escrow or ledger transaction.',
      status: currentStepIndex > 4 ? 'COMPLETED' : currentStepIndex === 4 && isRunningDemo ? 'EXECUTING' : 'PENDING',
    },
    {
      step: 6,
      title: 'Gemini Vision Deliverable Audit',
      description: 'Upload a real deliverable below to run Gemini Vision. No audit score is assumed.',
      status: currentStepIndex > 5 ? 'COMPLETED' : currentStepIndex === 5 && isRunningDemo ? 'EXECUTING' : 'PENDING',
    },
  ];

  const handleStartEndToEndDemo = () => {
    setIsRunningDemo(true);
    setCurrentStepIndex(0);
    setPayoutResult(null);
    setPayoutError('');
    setIsHumanApproved(false);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStepIndex(step);
      if (step >= 6) {
        clearInterval(interval);
        setIsRunningDemo(false);
      }
    }, 1000);
  };

  const handleExecutePayPalPayment = async () => {
    setPayoutError('');
    if (!isHumanApproved || !deliverableBase64) {
      setPayoutError('Upload a deliverable and explicitly authorize the Sandbox payout request.');
      return;
    }
    setIsRunningDemo(true);
    try {
      const res = await fetch('/api/agent/contractor-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: 'PROJECT_WEB_5K',
          milestoneTitle: 'Milestone 1: Web Dev Backend & API Setup',
          contractorEmail,
          amount: 1500,
          deliverableBase64,
          mimeType: deliverableMimeType,
          deliverableNotes: `Submitted deliverable: ${deliverableName}`,
          humanApproved: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gemini audit or PayPal payout failed.');
      }
      setPayoutResult(data);
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Gemini audit or PayPal payout failed.');
    } finally {
      setIsRunningDemo(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-[11px] font-semibold text-blue-300 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Signature Innovation · AI-Verified PayPal Sandbox Payout</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Agent-to-Agent Verified Payment Workflow
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-1">
              Review an illustrative business workflow, then upload a real deliverable for Gemini Vision inspection. A PayPal Sandbox payout is requested only after your explicit approval and a passing audit.
            </p>
          </div>

          <button
            onClick={handleStartEndToEndDemo}
            disabled={isRunningDemo}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-blue-500/20 cursor-pointer shrink-0"
          >
            {isRunningDemo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Showing workflow preview...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Show Workflow Preview</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Input Prompt Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Natural Language Business Objective Prompt</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">Illustrative scenario</span>
        </div>

        <textarea
          rows={3}
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
        />
      </div>

      {/* 6 Step Autonomous Workflow Sequence */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
          Illustrative Workflow Preview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoSteps.map((step) => (
            <div
              key={step.step}
              className={`p-4 rounded-xl border space-y-2 transition-all ${
                step.status === 'COMPLETED'
                  ? 'bg-slate-950 border-emerald-800/80'
                  : step.status === 'EXECUTING'
                  ? 'bg-blue-950/40 border-blue-500 animate-pulse'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-blue-400 font-bold">Step {step.step}</span>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                  step.status === 'COMPLETED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : step.status === 'EXECUTING'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : 'bg-slate-900 text-slate-500'
                }`}>
                  {step.status}
                </span>
              </div>
              <h3 className="text-xs font-bold text-white">{step.title}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Human Payment Authorization Gate & PayPal Execution */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Human Approval Gate &amp; Gemini Deliverable Audit</span>
          </span>
          <span className="text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 px-3 py-1 rounded-full uppercase flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Human Sign-Off Required Before PayPal Release</span>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-start justify-between text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">Milestone 1: Web Dev Backend Setup</h3>
              <p className="text-slate-400 text-xs">Sandbox recipient account</p>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-emerald-400 font-mono">$1,500.00</div>
              <span className="text-[10px] text-slate-400">Sandbox payout request</span>
            </div>
          </div>

          <label className="block text-xs text-slate-300">
            PayPal Sandbox recipient email
            <input
              type="email"
              required
              value={contractorEmail}
              onChange={(event) => setContractorEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono"
            />
          </label>

          <label className="block text-xs text-slate-300">
            Deliverable file for Gemini Vision (JPEG, PNG, WebP, or PDF)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === 'string') {
                    setDeliverableBase64(reader.result);
                    setDeliverableMimeType(file.type);
                    setDeliverableName(file.name);
                    setPayoutError('');
                  }
                };
                reader.onerror = () => setPayoutError('Could not read the selected deliverable.');
                reader.readAsDataURL(file);
              }}
              className="mt-1 w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-3 file:py-2 file:text-white"
            />
            {deliverableName && <span className="mt-1 block text-slate-400">{deliverableName}</span>}
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2 border-t border-slate-900">
            <input
              type="checkbox"
              checked={isHumanApproved}
              onChange={(e) => setIsHumanApproved(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
            />
            <span>I understand this will audit the uploaded file and request a real Sandbox payout only if Gemini approves it at 90% confidence or higher.</span>
          </label>

          <button
            disabled={!isHumanApproved || !deliverableBase64 || isRunningDemo}
            onClick={handleExecutePayPalPayment}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            {isRunningDemo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Communicating with https://api-m.sandbox.paypal.com/v1/payments/payouts...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Audit &amp; Request PayPal Sandbox Payout ($1,500.00)</span>
              </>
            )}
          </button>
        </div>

        {payoutResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800 text-xs space-y-2 font-mono">
            <div className={`flex items-center justify-between font-bold ${payoutResult.success ? 'text-emerald-400' : 'text-amber-300'}`}>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {payoutResult.success ? 'PayPal payout batch submitted' : 'Deliverable not approved; no payout submitted'}
              </span>
              {payoutResult.payoutBatchId && <span>Batch: {payoutResult.payoutBatchId}</span>}
            </div>
            <pre className="text-slate-300 text-[11px] overflow-x-auto p-2.5 bg-slate-900 rounded border border-slate-800">
              {JSON.stringify(payoutResult, null, 2)}
            </pre>
          </div>
        )}
        {payoutError && <p role="alert" className="text-xs text-rose-300">{payoutError}</p>}
      </div>
    </div>
  );
};
