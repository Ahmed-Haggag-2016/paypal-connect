import React, { useEffect, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import {
  Bot,
  Sparkles,
  Zap,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Loader2,
  DollarSign,
  Cpu,
  ExternalLink,
  Code,
  Terminal,
  Activity,
  UserCheck,
  RotateCcw,
  Check,
  Play,
  Settings,
} from 'lucide-react';
import { PayPalUser } from '../types/marketplace';

interface AgenticCommerceStudioProps {
  currentUser: PayPalUser;
  activeSection?: string;
}

export const AgenticCommerceStudio: React.FC<AgenticCommerceStudioProps> = ({ currentUser, activeSection = 'a2a_commerce' }) => {
  const activeTab = activeSection === 'a2a_service' ? 'a2a_service' : activeSection === 'toolkit_tools' ? 'toolkit_tools' : 'a2a_commerce';

  // A2A Product Commerce State
  const [targetProduct, setTargetProduct] = useState<string>('Studio Monitor Audio Interface Pro');
  const [buyerBudget, setBuyerBudget] = useState<number>(340);
  const [buyerPrompt, setBuyerPrompt] = useState<string>('Find a Studio Monitor Audio Interface Pro and negotiate a price within my budget.');
  
  const [isExecutingA2A, setIsExecutingA2A] = useState<boolean>(false);
  const [a2aResult, setA2aResult] = useState<any>(null);
  const [paypalCheckoutMessage, setPaypalCheckoutMessage] = useState('');
  const [operationError, setOperationError] = useState('');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalConfigState, setPaypalConfigState] = useState<'checking' | 'ready' | 'missing' | 'error'>('checking');
  const [paypalConfigError, setPaypalConfigError] = useState('');

  // A2A Service & Contractor State
  const [serviceTitle, setServiceTitle] = useState<string>('Milestone 1: Custom AI Model Fine-Tuning');
  const [contractorEmail, setContractorEmail] = useState<string>('contractor-agent@sandbox.paypal.com');
  const [serviceAmount, setServiceAmount] = useState<number>(350);
  const [isExecutingService, setIsExecutingService] = useState<boolean>(false);
  const [serviceResult, setServiceResult] = useState<any>(null);
  const [serviceError, setServiceError] = useState('');
  const [deliverableBase64, setDeliverableBase64] = useState('');
  const [deliverableMimeType, setDeliverableMimeType] = useState('');
  const [deliverableName, setDeliverableName] = useState('');
  const [payoutApproved, setPayoutApproved] = useState(false);

  // PayPal Toolkit Tools Log State
  const [toolLog, setToolLog] = useState<Array<{ time: string; tool: string; args: any; response: any }>>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/paypal/credentials')
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not load PayPal Sandbox configuration.');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (!data.configured || !data.clientId) {
          setPaypalConfigState('missing');
          return;
        }
        setPaypalClientId(data.clientId);
        setPaypalConfigState('ready');
      })
      .catch((err) => {
        if (active) {
          setPaypalConfigError(err instanceof Error ? err.message : 'PayPal configuration unavailable.');
          setPaypalConfigState('error');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRunA2ACommerce = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecutingA2A(true);
    setA2aResult(null);
    setOperationError('');
    setPaypalCheckoutMessage('');

    try {
      const res = await fetch('/api/agent/a2a-negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userGoalPrompt: `${buyerPrompt} Target: ${targetProduct}.`,
          maxBudget: Number(buyerBudget),
          buyerEmail: currentUser.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Negotiation failed.');
      }
      setA2aResult(data);
      setToolLog((prev) => [{
        time: new Date().toLocaleTimeString(),
        tool: 'a2a_negotiate',
        args: { budget: buyerBudget, product: targetProduct },
        response: { agreedPrice: data.agreedPrice, savings: data.savings },
      }, ...prev]);
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Negotiation failed.');
    } finally {
      setIsExecutingA2A(false);
    }
  };

  const handleRunA2AService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecutingService(true);
    setServiceResult(null);
    setServiceError('');

    try {
      if (!deliverableBase64) {
        throw new Error('Upload the contractor deliverable before requesting its AI audit and payout.');
      }
      const res = await fetch('/api/agent/contractor-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: 'A2A_CONTRACT_' + Math.floor(1000 + Math.random() * 9000),
          milestoneTitle: serviceTitle,
          contractorEmail,
          amount: Number(serviceAmount),
          deliverableBase64,
          mimeType: deliverableMimeType,
          deliverableNotes: `Submitted deliverable: ${deliverableName}`,
          humanApproved: payoutApproved,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Deliverable audit or payout failed.');
      }
      setServiceResult(data);
      if (data.success) {
        setToolLog((prev) => [
          {
            time: new Date().toLocaleTimeString(),
            tool: 'paypal_disburse_payout',
            args: { recipient: contractorEmail, amount: serviceAmount, currency: 'USD' },
            response: { batchId: data.payoutBatchId, status: data.paypalResponse?.batch_header?.batch_status || 'SUBMITTED' },
          },
          ...prev,
        ]);
      }
    } catch (err) {
      setServiceError(err instanceof Error ? err.message : 'Deliverable audit or payout failed.');
    } finally {
      setIsExecutingService(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-[11px] font-semibold text-blue-300 mb-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>PayPal AI-Toolkit Protocol · Agent-to-Agent (A2A) Commerce</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Autonomous Agent-to-Agent Commerce Studio
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-1">
              Run a constrained AI price negotiation, then review a separate PayPal Sandbox checkout. A payment is confirmed only when PayPal reports a completed capture.
            </p>
          </div>
        </div>
      </div>

      {/* Tab 1: A2A Product Commerce */}
      {activeTab === 'a2a_commerce' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Configure A2A Agent Parameters</span>
              </span>
              <span className="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
                Dual AI Agents
              </span>
            </div>

            <form onSubmit={handleRunA2ACommerce} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Buyer Agent Prompt &amp; Goal:
                </label>
                <textarea
                  value={buyerPrompt}
                  onChange={(e) => setBuyerPrompt(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Target Product Name:
                </label>
                <input
                  type="text"
                  value={targetProduct}
                  onChange={(e) => setTargetProduct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-blue-400 font-semibold block mb-1">Max Budget ($)</label>
                  <input
                    type="number"
                    value={buyerBudget}
                    onChange={(e) => setBuyerBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                  />
              </div>

              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 text-[11px] text-blue-200 space-y-1 leading-relaxed">
                <p>• The server matches this request to a seeded sample catalog item and enforces its seller floor and your budget.</p>
                <p>• Negotiation does not create an order. PayPal checkout appears separately and requires buyer approval before capture.</p>
              </div>

              <button
                type="submit"
                disabled={isExecutingA2A}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isExecutingA2A ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Agents Negotiating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run A2A Negotiation</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Stream Column */}
          <div className="lg:col-span-7 space-y-4">
            {!a2aResult && !isExecutingA2A && (
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3 text-slate-400">
                <Bot className="w-12 h-12 text-blue-400/50 mx-auto" />
                <h3 className="font-bold text-slate-200">A2A Commerce Protocol Ready</h3>
                <p className="text-xs max-w-sm mx-auto">
                  Run a constrained negotiation for a sample catalog listing. No order or payment is created until you approve checkout through PayPal.
                </p>
                <p className="text-xs max-w-sm mx-auto text-slate-300">
                  The yellow PayPal checkout button appears here after negotiation returns a price. You will review and approve the order in PayPal before capture.
                </p>
                <p className="text-[11px] font-mono" role="status" aria-live="polite">
                  {paypalConfigState === 'checking' && <span className="text-slate-400">Checking PayPal Sandbox configuration…</span>}
                  {paypalConfigState === 'ready' && <span className="text-emerald-300">PayPal Sandbox is configured; run negotiation to prepare checkout.</span>}
                  {paypalConfigState === 'missing' && <span className="text-amber-300">PayPal checkout is unavailable: server Sandbox credentials are not configured.</span>}
                  {paypalConfigState === 'error' && <span className="text-rose-300">Could not check PayPal configuration: {paypalConfigError}</span>}
                </p>
              </div>
            )}

            {isExecutingA2A && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
                <h3 className="font-bold text-white text-sm">Agents Negotiating in Real Time...</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Server-side negotiation is running within server-enforced price bounds...
                </p>
              </div>
            )}

            {a2aResult && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in">
                {/* Result Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Negotiated Price — no payment made</span>
                  </div>
                  <span className={`text-xs font-mono px-2.5 py-1 rounded ${a2aResult.aiMode === 'gemini' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                    {a2aResult.aiMode === 'gemini' ? 'Gemini response' : 'Deterministic demo fallback'}
                  </span>
                </div>

                {/* Price Metrics */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">List Price</span>
                    <div className="text-sm font-bold text-slate-300">${a2aResult.product?.listPrice?.toFixed(2) || '—'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase">A2A Agreed Price</span>
                    <div className="text-lg font-extrabold text-emerald-400">${a2aResult.agreedPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-400 uppercase">Buyer Savings</span>
                    <div className="text-sm font-bold text-blue-400">${a2aResult.savings.toFixed(2)}</div>
                  </div>
                </div>

                {/* Multi-turn A2A Dialogue */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Head-to-Head Agent Dialogue
                  </label>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {a2aResult.dialogue?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
                          item.agent === 'buyer_agent'
                            ? 'bg-blue-950/40 border-blue-800/60 text-blue-200'
                            : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase">
                          <span className="flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            {item.agent === 'buyer_agent' ? 'Buyer AI Agent' : 'Seller AI Agent'}
                          </span>
                          {item.offerPrice && <span>Offer: ${Number(item.offerPrice).toFixed(2)}</span>}
                        </div>
                        <p>{item.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PayPal Execution Box & Live Smart Buttons */}
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/50 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>PayPal Sandbox checkout (buyer approval required):</span>
                    <span className="text-emerald-400 font-mono text-[11px]">Orders v2 API</span>
                  </div>
                  <p className="text-[11px] text-amber-300">After buyer approval, the app requests capture to the configured Sandbox business account. Payment is confirmed only when PayPal returns COMPLETED. A previous Sandbox capture was rejected with COMPLIANCE_VIOLATION; seller payee routing is not configured.</p>

                  {paypalClientId ? <PayPalScriptProvider options={{
                    clientId: paypalClientId,
                    currency: 'USD',
                    intent: 'capture',
                  }}>
                    <div className="pt-1 min-h-[45px]">
                      <PayPalButtons
                        style={{ layout: 'horizontal', color: 'gold', shape: 'rect', label: 'pay', height: 40 }}
                        createOrder={async () => {
                          setPaypalCheckoutMessage('');
                          const res = await fetch('/api/orders', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              amount: Number(a2aResult.agreedPrice).toFixed(2),
                              currency: 'USD',
                                        description: `A2A sample purchase: ${targetProduct}`,
                              intent: 'CAPTURE',
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok || !data.orderId) {
                            throw new Error(data.error || 'PayPal could not create the order.');
                          }
                          setPaypalCheckoutMessage('PayPal order created. Review and approve the amount in the PayPal checkout window.');
                          return data.orderId;
                        }}
                        onApprove={async (data) => {
                          setPaypalCheckoutMessage('Buyer approved the order. Confirming capture with PayPal Sandbox…');
                          const res = await fetch(`/api/orders/${encodeURIComponent(data.orderID)}/capture`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                          });
                          const details = await res.json();
                          if (details.status && details.status !== 'COMPLETED') {
                            setPaypalCheckoutMessage(`PayPal returned capture status ${details.status}. Payment is not confirmed as completed; check the order in PayPal Sandbox before taking further action.`);
                            return;
                          }
                          if (!res.ok || !details.success || !details.captureId) {
                            throw new Error(details.error || 'PayPal capture could not be verified.');
                          }
                          setPaypalCheckoutMessage(`Payment captured in PayPal Sandbox. Capture ID: ${details.captureId}`);
                          setToolLog((prev) => [{
                            time: new Date().toLocaleTimeString(),
                            tool: 'paypal_capture_order',
                            args: { orderId: data.orderID },
                            response: { captureId: details.captureId, status: details.status },
                          }, ...prev]);
                        }}
                        onCancel={() => setPaypalCheckoutMessage('Checkout was cancelled. No capture was requested.')}
                        onError={(error) => setPaypalCheckoutMessage(error instanceof Error ? error.message : 'PayPal checkout failed.')}
                      />
                    </div>
                  </PayPalScriptProvider> : (
                    <p role="alert" className="text-xs text-amber-300">
                      {paypalConfigState === 'checking'
                        ? 'Checking PayPal Sandbox configuration…'
                        : paypalConfigState === 'error'
                          ? `Could not check PayPal configuration: ${paypalConfigError}`
                          : 'PayPal Sandbox checkout is unavailable. Configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET on the server.'}
                    </p>
                  )}

                  {paypalCheckoutMessage && <p role="status" className="text-xs text-slate-300">{paypalCheckoutMessage}</p>}
                  {operationError && <p role="alert" className="text-xs text-rose-300">{operationError}</p>}

                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: A2A Service & Payout Settlement */}
      {activeTab === 'a2a_service' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span>Agent-to-Agent Service Settlement</span>
              </span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                Payout Tool
              </span>
            </div>

            <form onSubmit={handleRunA2AService} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Service / Milestone Title:
                </label>
                <input
                  type="text"
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Deliverable for Gemini audit (JPEG, PNG, WebP, or PDF):
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setPayoutApproved(false);
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        setDeliverableBase64(reader.result);
                        setDeliverableMimeType(file.type);
                        setDeliverableName(file.name);
                        setServiceError('');
                      }
                    };
                    reader.onerror = () => setServiceError('Could not read the selected deliverable.');
                    reader.readAsDataURL(file);
                  }}
                  className="w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-3 file:py-2 file:text-white"
                />
                {deliverableName && <span className="text-[11px] text-slate-400">{deliverableName}</span>}
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Contractor Agent PayPal Email:
                </label>
                <input
                  type="email"
                  value={contractorEmail}
                  onChange={(e) => {
                    setContractorEmail(e.target.value);
                    setPayoutApproved(false);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Settlement Amount ($):
                </label>
                <input
                  type="number"
                  value={serviceAmount}
                  onChange={(e) => {
                    setServiceAmount(Number(e.target.value));
                    setPayoutApproved(false);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={payoutApproved}
                  onChange={(event) => setPayoutApproved(event.target.checked)}
                  className="mt-0.5"
                />
                <span>I approve a Sandbox payout of ${serviceAmount.toFixed(2)} to {contractorEmail} if Gemini verifies this deliverable at 90% confidence or higher.</span>
              </label>
              <button
                type="submit"
                disabled={isExecutingService || !deliverableBase64 || !payoutApproved}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isExecutingService ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Payout Tool...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Audit Deliverable &amp; Request PayPal Payout</span>
                  </>
                )}
              </button>
              {serviceError && <p role="alert" className="text-xs text-rose-300">{serviceError}</p>}
              <p className="text-[11px] text-amber-300">
                A passing audit does not guarantee delivery quality. PayPal confirms batch submission; check its status before treating funds as settled.
              </p>
            </form>
          </div>

          <div className="lg:col-span-6 space-y-4">
            {!serviceResult && !isExecutingService && (
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3 text-slate-400">
                <UserCheck className="w-12 h-12 text-emerald-400/50 mx-auto" />
                <h3 className="font-bold text-slate-200">A2A Service Settlement Ready</h3>
                <p className="text-xs max-w-sm mx-auto">
                  Upload a deliverable and explicitly approve the amount and recipient. Gemini must pass the audit before the server submits a Sandbox payout.
                </p>
              </div>
            )}

            {isExecutingService && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                <h3 className="font-bold text-white text-sm">Auditing and submitting PayPal payout...</h3>
              </div>
            )}

            {serviceResult && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className={`flex items-center gap-2 text-xs font-bold ${serviceResult.success ? 'text-emerald-400' : 'text-amber-300'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  <span>{serviceResult.success ? 'PayPal Payout Batch Submitted' : 'Gemini Audit Did Not Approve Payout'}</span>
                  </div>
                {serviceResult.payoutBatchId && (
                  <span className="text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 rounded">
                    Batch ID: {serviceResult.payoutBatchId}
                  </span>
                )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Gemini confidence:</span>
                  <span className="text-white font-bold">{(Number(serviceResult.aiVerificationScore) * 100).toFixed(0)}%</span>
                </div>
                <p className="text-slate-300">{serviceResult.aiAuditSummary}</p>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient:</span>
                  <span className="text-white font-bold">{serviceResult.contractorEmail}</span>
                </div>
                {serviceResult.success && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payout amount submitted:</span>
                    <span className="text-emerald-400 font-bold">${Number(serviceResult.disbursedAmount).toFixed(2)} USD</span>
                  </div>
                )}
                </div>

                {serviceResult.success && <a
                href="https://www.sandbox.paypal.com/myaccount/transactions"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <span>Check payout status on sandbox.paypal.com</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: PayPal Toolkit Tools Trace */}
      {activeTab === 'toolkit_tools' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>PayPal AI-Toolkit Tool Call Log</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Total Logged Calls: {toolLog.length}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {toolLog.map((log, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-purple-400 font-bold flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-purple-400" />
                    <span>tool: {log.tool}()</span>
                  </span>
                  <span className="text-slate-500">{log.time}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block mb-1">Arguments:</span>
                    <pre className="text-slate-300 overflow-x-auto">{JSON.stringify(log.args, null, 2)}</pre>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-emerald-400 block mb-1">Response Payload:</span>
                    <pre className="text-emerald-300 overflow-x-auto">{JSON.stringify(log.response, null, 2)}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
