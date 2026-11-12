import React, { useState } from 'react';
import {
  Copy,
  Check,
  Layers,
  Terminal,
  Award,
  ExternalLink,
} from 'lucide-react';

export const DeveloperApiPortal: React.FC = () => {
  const [activeSdk, setActiveSdk] = useState<'typescript' | 'python' | 'curl'>('typescript');
  const [copied, setCopied] = useState<boolean>(false);
  const [copyError, setCopyError] = useState('');

  const sdkSnippets = {
    typescript: `const response = await fetch('/api/agent/a2a-negotiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userGoalPrompt: 'Find a Studio Monitor Audio Interface Pro',
    maxBudget: 340,
  }),
});

const negotiation = await response.json();
if (!response.ok) throw new Error(negotiation.error);

console.log(negotiation.aiMode, negotiation.agreedPrice);
// Negotiation is not an order or payment. PayPal checkout is separate.`,

    python: `import json
from urllib.request import Request, urlopen

request = Request(
    "http://localhost:3000/api/agent/a2a-negotiate",
    data=json.dumps({
        "userGoalPrompt": "Find a Studio Monitor Audio Interface Pro",
        "maxBudget": 340,
    }).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)

with urlopen(request) as response:
    negotiation = json.load(response)
    print(negotiation["aiMode"], negotiation["agreedPrice"])
# This endpoint does not create or capture a PayPal order.`,

    curl: `curl -X POST http://localhost:3000/api/agent/a2a-negotiate \\
  -H "Content-Type: application/json" \\
  -d '{
    "userGoalPrompt": "Find a Studio Monitor Audio Interface Pro",
    "maxBudget": 340
  }'`,
  };

  const handleCopy = async () => {
    setCopied(false);
    setCopyError('');
    try {
      await navigator.clipboard.writeText(sdkSnippets[activeSdk]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setCopyError(error instanceof Error ? error.message : 'Clipboard access was denied.');
    }
  };

  const judgingCriteria = [
    {
      title: '1. Technological Implementation',
      status: 'PARTIALLY VERIFIED',
      description: 'Gemini calls, Sandbox OAuth, and order creation were verified. A buyer-approved $325 Sandbox order could not be captured because PayPal returned COMPLIANCE_VIOLATION; end-to-end payment is not verified.',
    },
    {
      title: '2. Design & Product Experience',
      status: 'PROTOTYPE',
      description: 'Responsive multi-screen interface with an integrated AG Grid sample ledger. Procurement, project scheduling, contractor profiles, and agent dashboards are illustrative, not Channel3 or Bryntum integrations.',
    },
    {
      title: '3. Potential Impact',
      status: 'INTENDED USE',
      description: 'Targets small-business commerce coordination. The implemented path connects constrained product negotiation, buyer-approved checkout, and separately approved payouts.',
    },
    {
      title: '4. Innovation & Originality',
      status: 'AI + HUMAN APPROVAL',
      description: 'Gemini can generate a catalog-bounded negotiation and review uploaded deliverables. Payments remain separate and require PayPal buyer approval or explicit payout approval; no escrow is provided.',
    },
    {
      title: '5. Presentation & Polish',
      status: 'WALKTHROUGH NEEDED',
      description: 'The current demo video may describe older behavior. Re-record the submission walkthrough after resolving the Sandbox capture rejection and verifying the final payment flow.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 mb-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Developer API Examples</span>
          <span aria-hidden="true">·</span>
          <span>Current prototype endpoint</span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          PayPal Connect API Reference
        </h2>
        <p className="text-slate-300 text-sm mt-1 max-w-3xl">
          Examples use the current negotiation endpoint. PayPal order creation and capture are separate operations; this prototype does not provide escrow.
        </p>
      </div>

      {/* Official Hackathon Judging Criteria & Devpost Resources Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Product Capabilities & Validation Status</h3>
              <p className="text-xs text-slate-400">Current implementation boundaries and Sandbox test results</p>
            </div>
          </div>

          <a
            href="https://paypalaihackathon.devpost.com/resources"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950 border border-purple-800 text-purple-300 hover:bg-purple-900 font-mono text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            <span>Devpost Resources Guide</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {judgingCriteria.map((c, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-400 font-bold text-[10px] bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                  {c.status}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">{c.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{c.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Code Console */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <h4 className="font-bold text-white text-base">
              Current API Examples (No Client SDK)
            </h4>
          </div>

          {/* Sdk tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
            <button
              onClick={() => setActiveSdk('typescript')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeSdk === 'typescript' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              TypeScript
            </button>
            <button
              onClick={() => setActiveSdk('python')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeSdk === 'python' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveSdk('curl')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeSdk === 'curl' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              cURL
            </button>
          </div>
        </div>

        {/* Code Viewport */}
        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer z-10"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          <pre className="p-5 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
            {sdkSnippets[activeSdk]}
          </pre>
          {copyError && (
            <p role="alert" className="mt-2 text-xs text-rose-300">
              Could not copy code: {copyError}
            </p>
          )}
        </div>
      </div>

      {/* Live PayPal Sandbox API Diagnostic Inspector */}
      <PayPalSandboxDiagnosticInspector />
    </div>
  );
};

const PayPalSandboxDiagnosticInspector: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [diagResult, setDiagResult] = useState<any>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/paypal/diagnostic');
      const data = await res.json();
      setDiagResult(data);
    } catch (err: any) {
      setDiagResult({ success: false, error: err?.message || 'Network exception' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <span className="text-xs font-mono text-emerald-400 font-semibold uppercase">Live REST API Debugger</span>
          <h3 className="text-lg font-bold text-white mt-0.5">
            PayPal Sandbox OAuth 2.0 & Endpoint Health Inspector
          </h3>
        </div>
        <button
          onClick={runDiagnostic}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono rounded-xl transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          {loading ? 'Pinging PayPal Sandbox API...' : 'Run Live Diagnostic Ping'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">Endpoint Target</span>
          <span className="text-white font-bold truncate block">https://api-m.sandbox.paypal.com</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">OAuth 2.0 Status</span>
          <span className={`font-bold block ${diagResult?.success ? 'text-emerald-400' : 'text-amber-400'}`}>
            {diagResult ? (diagResult.success ? '200 OK (AUTHENTICATED)' : `HTTP ${diagResult.httpStatus || 401}`) : 'Testing...'}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">Active Client App ID</span>
          <span className="text-blue-300 font-bold truncate block">{diagResult?.clientIdUsed || 'PayPal Sandbox Client'}</span>
        </div>
      </div>

      {diagResult && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Diagnostic Response</span>
            <span>{diagResult.diagnosis}</span>
          </div>
          <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] text-emerald-300 overflow-x-auto">
            {JSON.stringify(diagResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
