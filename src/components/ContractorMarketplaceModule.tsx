import React, { useState } from 'react';
import {
  Users,
  Search,
  Star,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  FileText,
  DollarSign,
  Briefcase,
  Award,
} from 'lucide-react';
import { PayPalUser } from '../types/marketplace';

interface Contractor {
  id: string;
  name: string;
  title: string;
  hourlyRate: number;
  rating: number;
  completedJobs: number;
  skills: string[];
  avatarUrl?: string;
  matchScore: number;
  proposedMilestones: Array<{ title: string; amount: number; days: number }>;
}

const SAMPLE_CONTRACTORS: Contractor[] = [
  {
    id: 'CTR-701',
    name: 'Alex Rivera',
    title: 'Senior Full-Stack & React Engineer',
    hourlyRate: 85,
    rating: 4.9,
    completedJobs: 48,
    skills: ['React', 'TypeScript', 'Node.js', 'PayPal REST APIs', 'Express'],
    matchScore: 97,
    proposedMilestones: [
      { title: 'Milestone 1: Backend Architecture & PayPal Auth', amount: 1500, days: 3 },
      { title: 'Milestone 2: Frontend AG Grid & Bryntum Gantt UI', amount: 1500, days: 4 },
      { title: 'Milestone 3: End-to-End Testing & Deliverable OCR Audit', amount: 1500, days: 3 },
    ],
  },
  {
    id: 'CTR-702',
    name: 'Elena Rostova',
    title: 'Fintech UI/UX & Design Systems Architect',
    hourlyRate: 75,
    rating: 4.8,
    completedJobs: 32,
    skills: ['Figma', 'Tailwind CSS', 'Fintech Dashboards', 'UX Research'],
    matchScore: 92,
    proposedMilestones: [
      { title: 'Design System & Component Token Specs', amount: 1000, days: 2 },
      { title: 'High-Fidelity Dashboard Prototypes', amount: 1000, days: 3 },
    ],
  },
  {
    id: 'CTR-703',
    name: 'Marcus Vance',
    title: 'AI Agent & LLM Orchestration Specialist',
    hourlyRate: 95,
    rating: 5.0,
    completedJobs: 19,
    skills: ['Google GenAI SDK', 'Gemini', 'Agentic Workflows', 'Python'],
    matchScore: 90,
    proposedMilestones: [
      { title: 'Multi-Agent Negotiation Logic', amount: 2000, days: 4 },
      { title: 'Gemini Vision OCR Verification Pipeline', amount: 1500, days: 3 },
    ],
  },
];

interface ContractorMarketplaceModuleProps {
  currentUser: PayPalUser;
  onHireContractor?: (contractor: Contractor) => void;
}

export const ContractorMarketplaceModule: React.FC<ContractorMarketplaceModuleProps> = ({
  currentUser,
  onHireContractor,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedContractor, setSelectedContractor] = useState<Contractor>(SAMPLE_CONTRACTORS[0]);

  const filteredContractors = SAMPLE_CONTRACTORS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-[11px] font-semibold text-blue-300 mb-2">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Talent & Contractor Discovery Marketplace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Contractor Marketplace Preview
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-1">
              Review illustrative contractor profiles. No live identity verification, job posting, contract, or escrow is provided.
            </p>
          </div>

        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter contractors by skill (e.g. React, Gemini, PayPal APIs...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Contractor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* List of Contractors */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Available Top-Rated Talent ({filteredContractors.length})
            </h2>
          </div>

          <div className="space-y-3">
            {filteredContractors.map((c) => {
              const isSelected = selectedContractor.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedContractor(c)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{c.name}</h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full">
                          Sample Profile
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{c.title}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-white font-mono tabular-nums">
                        ${c.hourlyRate}/hr
                      </div>
                      <span className="text-[11px] font-bold text-purple-400">Match: {c.matchScore}%</span>
                    </div>
                  </div>

                  {/* Skills Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {c.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-emerald-400" />
                      {c.rating} ({c.completedJobs} completed jobs)
                    </span>
                    <span className="text-blue-400 font-semibold hover:underline">View Proposal Milestones →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Contractor Detail & Milestone Agreement */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 sticky top-24">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>Contractor Proposal Terms</span>
            </span>
            <span className="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
              Verified Terms
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <h3 className="text-base font-bold text-white">{selectedContractor.name}</h3>
              <p className="text-xs text-slate-400">{selectedContractor.title}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Example Milestones (Not PayPal-Linked):
              </label>

              {selectedContractor.proposedMilestones.map((m, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-white">
                    <span>{m.title}</span>
                    <span className="font-mono text-emerald-400 font-bold">${m.amount.toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Est. duration: {m.days} days · Illustrative only</div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  if (onHireContractor) onHireContractor(selectedContractor);
                }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Open Verified Payments</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
