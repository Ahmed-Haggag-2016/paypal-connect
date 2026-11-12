import React, { useState, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community';
import {
  DollarSign,
  Download,
  Filter,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
} from 'lucide-react';
import { PayPalUser } from '../types/marketplace';

ModuleRegistry.registerModules([AllCommunityModule]);

interface FinancialTransactionRecord {
  id: string;
  date: string;
  type: 'INCOMING' | 'OUTGOING' | 'PAYOUT' | 'REFUND';
  counterparty: string;
  category: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'RECONCILED';
  paypalTransactionId: string;
  referenceProject?: string;
  notes?: string;
}

const INITIAL_TRANSACTIONS: FinancialTransactionRecord[] = [
  {
    id: 'TX-1001',
    date: '2026-11-10 14:22',
    type: 'INCOMING',
    counterparty: 'Acme Enterprise Solutions',
    category: 'Client Retainer',
    amount: 12500.00,
    currency: 'USD',
    status: 'COMPLETED',
    paypalTransactionId: 'SAMPLE-PAYPAL-98214',
    referenceProject: 'Website Development #5K',
    notes: '50% Upfront milestone payment via PayPal Checkout',
  },
  {
    id: 'TX-1002',
    date: '2026-11-09 11:15',
    type: 'PAYOUT',
    counterparty: 'Apex Compute Labs',
    category: 'Procurement Expense',
    amount: 2490.00,
    currency: 'USD',
    status: 'COMPLETED',
    paypalTransactionId: 'SAMPLE-PAYPAL-33918',
    referenceProject: 'Hardware Procurement',
    notes: '10x NeuralPulse Workstations via Channel3 AI',
  },
  {
    id: 'TX-1003',
    date: '2026-11-08 16:45',
    type: 'PAYOUT',
    counterparty: 'Alex Rivera (Contractor)',
    category: 'Contractor Milestone',
    amount: 1500.00,
    currency: 'USD',
    status: 'PENDING',
    paypalTransactionId: 'SAMPLE-PAYPAL-7721',
    referenceProject: 'Website Development #5K',
    notes: 'Sample record for milestone 1; no payment was made',
  },
  {
    id: 'TX-1004',
    date: '2026-11-07 09:30',
    type: 'INCOMING',
    counterparty: 'Vanguard Media Group',
    category: 'Invoice Settlement',
    amount: 5950.00,
    currency: 'USD',
    status: 'RECONCILED',
    paypalTransactionId: 'SAMPLE-PAYPAL-44109',
    referenceProject: 'Q4 Brand Marketing',
    notes: 'Invoice #INV-2026-004 paid in full',
  },
  {
    id: 'TX-1005',
    date: '2026-11-06 18:10',
    type: 'OUTGOING',
    counterparty: 'AWS Cloud Services',
    category: 'SaaS Infrastructure',
    amount: 480.50,
    currency: 'USD',
    status: 'COMPLETED',
    paypalTransactionId: 'SAMPLE-PAYPAL-11029',
    referenceProject: 'Internal Hosting',
    notes: 'Monthly cloud hosting auto-charge',
  },
  {
    id: 'TX-1006',
    date: '2026-11-05 13:00',
    type: 'REFUND',
    counterparty: 'Global Supply Depot',
    category: 'Hardware Return',
    amount: 185.00,
    currency: 'USD',
    status: 'COMPLETED',
    paypalTransactionId: 'SAMPLE-PAYPAL-RFD-9012',
    referenceProject: 'Office Equipment',
    notes: 'Returned defective cable package',
  },
  {
    id: 'TX-1007',
    date: '2026-11-04 10:20',
    type: 'PAYOUT',
    counterparty: 'Elena Rostova (UI Designer)',
    category: 'Contractor Milestone',
    amount: 1200.00,
    currency: 'USD',
    status: 'COMPLETED',
    paypalTransactionId: 'SAMPLE-PAYOUT-8812',
    referenceProject: 'Mobile App Wireframes',
    notes: 'Disbursed via PayPal Batch Payouts API',
  },
];

interface MoneyCenterAgGridProps {
  currentUser: PayPalUser;
}

export const MoneyCenterAgGrid: React.FC<MoneyCenterAgGridProps> = ({ currentUser }) => {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<FinancialTransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [quickFilterText, setQuickFilterText] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Column definitions for AG Grid
  const columnDefs = useMemo<ColDef<FinancialTransactionRecord>[]>(() => [
    {
      field: 'id',
      headerName: 'Transaction ID',
      width: 130,
      pinned: 'left',
      cellRenderer: (params: any) => (
        <span className="font-mono text-xs font-bold text-blue-400">{params.value}</span>
      ),
    },
    {
      field: 'date',
      headerName: 'Timestamp',
      width: 150,
      cellClass: 'font-mono text-xs text-slate-300',
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 130,
      cellRenderer: (params: any) => {
        const val = params.value;
        if (val === 'INCOMING') {
          return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded"><ArrowDownRight className="w-3 h-3" /> Incoming</span>;
        }
        if (val === 'PAYOUT' || val === 'OUTGOING') {
          return <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/70 border border-rose-800 px-2 py-0.5 rounded"><ArrowUpRight className="w-3 h-3" /> Outgoing</span>;
        }
        return <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded">Refund</span>;
      },
    },
    {
      field: 'counterparty',
      headerName: 'Counterparty / Payee',
      width: 210,
      editable: true,
      cellClass: 'font-semibold text-white',
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 160,
      editable: true,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 140,
      type: 'numericColumn',
      cellClass: 'font-mono font-bold text-right text-slate-100',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        const prefix = params.data?.type === 'INCOMING' || params.data?.type === 'REFUND' ? '+' : '-';
        return `${prefix}$${params.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 160,
      cellRenderer: (params: any) => {
        const status = params.value;
        if (status === 'COMPLETED' || status === 'RECONCILED') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {status}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-amber-400" />
            PENDING
          </span>
        );
      },
    },
    {
      field: 'paypalTransactionId',
      headerName: 'Example PayPal Ref ID',
      width: 190,
      cellClass: 'font-mono text-xs text-slate-400',
    },
    {
      field: 'referenceProject',
      headerName: 'Reference Project',
      width: 190,
      editable: true,
    },
    {
      field: 'notes',
      headerName: 'Audit Notes',
      width: 240,
      editable: true,
      cellClass: 'text-xs text-slate-400 italic',
    },
  ], []);

  // Default Column Config
  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  // Export CSV Handler
  const handleExportCsv = () => {
    gridRef.current?.api.exportDataAsCsv({
      fileName: `paypal_connect_ledger_${new Date().toISOString().slice(0, 10)}.csv`,
    });
  };

  // Add Manual Entry
  const handleAddTransaction = () => {
    const newTx: FinancialTransactionRecord = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'PAYOUT',
      counterparty: 'New Contractor / Supplier',
      category: 'Contractor Milestone',
      amount: 1500.00,
      currency: 'USD',
      status: 'PENDING',
      paypalTransactionId: `SAMPLE-TX-${Math.floor(10000 + Math.random() * 90000)}`,
      referenceProject: 'Website Development #5K',
      notes: 'Illustrative row added in the demo ledger; no PayPal transaction was created',
    };
    setRowData((prev) => [newTx, ...prev]);
  };

  // Filtered Row Data for Category Filter
  const filteredData = useMemo(() => {
    if (selectedCategoryFilter === 'ALL') return rowData;
    return rowData.filter((r) => r.type === selectedCategoryFilter);
  }, [rowData, selectedCategoryFilter]);

  // Aggregate Stats
  const totalVolume = rowData.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPendingAmount = rowData.filter((r) => r.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-[11px] font-semibold text-blue-300 mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>AG Grid Financial Management Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Money Center & PayPal Transaction Ledger
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-1">
              AG Grid workspace with illustrative sample records. Sort, filter, edit, and export the demo ledger; it does not sync live PayPal transactions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddTransaction}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Ledger Volume</span>
            <div className="text-xl font-bold font-mono text-white tabular-nums mt-0.5">
              ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <DollarSign className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Example Pending Amount</span>
            <div className="text-xl font-bold font-mono text-blue-400 tabular-nums mt-0.5">
              ${totalPendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <Clock className="w-6 h-6 text-blue-400" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Records</span>
            <div className="text-xl font-bold font-mono text-white tabular-nums mt-0.5">
              {rowData.length} Transactions
            </div>
          </div>
          <FileSpreadsheet className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      {/* Control Bar: Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions, counterparties, PayPal IDs..."
            value={quickFilterText}
            onChange={(e) => setQuickFilterText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {['ALL', 'INCOMING', 'PAYOUT', 'REFUND'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* AG Grid Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-xl overflow-hidden">
        <div
          className="ag-theme-alpine-dark w-full"
          style={{ height: 480, width: '100%', borderRadius: '0.75rem' }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={filteredData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={quickFilterText}
            animateRows={true}
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            rowSelection="multiple"
            theme="legacy"
          />
        </div>
      </div>
    </div>
  );
};
