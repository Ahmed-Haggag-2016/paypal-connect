import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  Plus,
  Send,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  Wallet,
  Sparkles,
  Zap,
} from 'lucide-react';
import { PayPalUser } from '../types/marketplace';

interface InvoicingCreatorHubProps {
  currentUser: PayPalUser;
}

export const InvoicingCreatorHub: React.FC<InvoicingCreatorHubProps> = ({ currentUser }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);
  const [operationError, setOperationError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Invoice Form State
  const [clientName, setClientName] = useState<string>('Acme Global Corp');
  const [clientEmail, setClientEmail] = useState<string>('client-acme@sandbox.paypal.com');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'EGP' | 'GBP' | 'JPY'>('USD');
  const [itemDesc, setItemDesc] = useState<string>('Full-Stack Software Architecture & Gemini Integration');
  const [itemPrice, setItemPrice] = useState<number>(1500);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load invoices.');
      if (data.success && data.invoices) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Could not load invoices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setOperationError('');

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorName: currentUser.name,
          creatorEmail: currentUser.email,
          clientName,
          clientEmail,
          currency,
          items: [
            {
              id: 'item_new',
              description: itemDesc,
              quantity: 1,
              unitPrice: Number(itemPrice),
              total: Number(itemPrice),
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not create invoice.');
      setShowCreateModal(false);
      await fetchInvoices();
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Could not create invoice.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCaptureApprovedPayment = async (invoice: any) => {
    setProcessingInvoiceId(invoice.id);
    setOperationError('');
    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoice.id)}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: invoice.paypalOrderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'PayPal has not confirmed the capture.');
      await fetchInvoices();
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'PayPal capture failed.');
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 mb-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Business &amp; Creator Solutions Track</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Multi-Currency Invoicing &amp; Creator Payouts
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Create PayPal Sandbox invoices. The client must approve checkout in PayPal before the creator can confirm capture; capture pays the invoice recipient directly.
          </p>
        </div>

        {operationError && <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-xs text-rose-200">{operationError}</p>}

        <button
          onClick={() => setShowCreateModal(true)}
          className="py-3 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/30 flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Multi-Currency Invoice</span>
        </button>
      </div>

      {/* Invoices List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-sm">Active Creator Invoices</h3>
          <span className="text-xs font-mono text-slate-400">Total: {invoices.length}</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400" />
            <p className="text-xs">Loading multi-currency invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FileText className="w-10 h-10 mx-auto opacity-40" />
            <p className="text-xs">No invoices found. Click "Create Multi-Currency Invoice" to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition-all hover:border-slate-700"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">{inv.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Client: <span className="text-slate-200 font-semibold">{inv.clientName}</span> ({inv.clientEmail})
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Creator Payee: {inv.creatorEmail}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-400 block">Total Amount</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      {inv.currencySymbol}
                      {inv.totalAmount.toLocaleString()} {inv.currency}
                    </span>
                  </div>

                  {inv.status === 'SENT' ? (
                    <div className="flex flex-col gap-2 shrink-0">
                      <a
                        href={inv.paypalCheckoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-center text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Open PayPal Sandbox Checkout
                      </a>
                      <button
                        onClick={() => handleCaptureApprovedPayment(inv)}
                        disabled={processingInvoiceId === inv.id}
                        className="py-2 px-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        {processingInvoiceId === inv.id ? 'Verifying capture...' : 'Capture after buyer approval'}
                      </button>
                    </div>
                  ) : (
                    <span className="py-2 px-3 bg-emerald-950 text-emerald-300 text-xs rounded-lg">
                      PayPal capture: {inv.paypalCaptureId}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">New Multi-Currency Invoice</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Client Name:</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Client Email:</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Currency:</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="EGP">EGP (E£)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Amount:</label>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Service / Deliverable Description:</label>
                <input
                  type="text"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex justify-center items-center gap-2"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Issue Invoice &amp; Link PayPal Checkout</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
