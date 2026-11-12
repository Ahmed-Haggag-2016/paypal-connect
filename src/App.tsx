import React, { Suspense, lazy, useState } from 'react';
import { PayPalUser } from './types/marketplace';
import { Navbar } from './components/Navbar';
import { FeatureGuidanceModal } from './components/FeatureGuidanceModal';
import { CustomerLoginModal } from './components/CustomerLoginModal';

// Core Application Module Components
import { CommandCenter } from './components/CommandCenter';
import { MoneyCenterAgGrid } from './components/MoneyCenterAgGrid';
import { ProcurementMarketplaceChannel3 } from './components/ProcurementMarketplaceChannel3';
import { ContractorMarketplaceModule } from './components/ContractorMarketplaceModule';
import { AgentControlRoomModule } from './components/AgentControlRoomModule';
import { AgenticCommerceStudio } from './components/AgenticCommerceStudio';
import { VerifiedPaymentsA2AModule } from './components/VerifiedPaymentsA2AModule';
import { FinancialIntelligenceModule } from './components/FinancialIntelligenceModule';
import { InvoicingCreatorHub } from './components/InvoicingCreatorHub';
import { DeveloperApiPortal } from './components/DeveloperApiPortal';

const ProjectOperationsBryntum = lazy(() => import('./components/ProjectOperationsBryntum').then((module) => ({
  default: module.ProjectOperationsBryntum,
})));

const DEFAULT_USER: PayPalUser = {
  email: 'demo@example.com',
  name: 'Demo Business',
  given_name: 'Demo',
  surname: 'Business',
  country: 'Demo',
  currency: 'USD',
  currencySymbol: '$',
  balance: 0,
  accountId: 'DEMO-PROFILE',
  status: 'Demo profile — not authenticated with PayPal',
  role: 'buyer',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<PayPalUser>(DEFAULT_USER);
  const [activeSection, setActiveSection] = useState<string>('command_center');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

  const currentBalance = currentUser.balance;

  return (
    <div dir="ltr" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        buyerBalance={currentBalance}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        currentUser={currentUser}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Module A: Executive Command Center */}
        {activeSection === 'command_center' && (
          <CommandCenter
            currentUser={currentUser}
            onNavigate={(sec) => setActiveSection(sec)}
          />
        )}

        {/* Module B: Money Center AG Grid */}
        {activeSection === 'money_center' && (
          <MoneyCenterAgGrid currentUser={currentUser} />
        )}

        {/* Module C: AI Procurement Marketplace (Channel3) */}
        {activeSection === 'procurement' && (
          <ProcurementMarketplaceChannel3 />
        )}

        {/* Module D: Project Operations (Bryntum Gantt) */}
        {activeSection === 'project_ops' && (
          <Suspense fallback={<p className="text-sm text-slate-400">Loading Bryntum Gantt…</p>}>
            <ProjectOperationsBryntum />
          </Suspense>
        )}

        {/* Module E: Contractor Marketplace */}
        {activeSection === 'contractors' && (
          <ContractorMarketplaceModule
            currentUser={currentUser}
            onHireContractor={() => setActiveSection('verified_payments')}
          />
        )}

        {/* Module F: AI Agent Control Room */}
        {activeSection === 'agent_control' && (
          <AgentControlRoomModule currentUser={currentUser} />
        )}

        {/* Module G: Agent-to-Agent Commerce Studio */}
        {activeSection === 'a2a_commerce' && (
          <AgenticCommerceStudio currentUser={currentUser} activeSection="a2a_commerce" />
        )}

        {/* Verified Payments */}
        {activeSection === 'verified_payments' && (
          <VerifiedPaymentsA2AModule currentUser={currentUser} />
        )}

        {/* Module H: Financial Intelligence */}
        {activeSection === 'financial_intel' && (
          <FinancialIntelligenceModule currentUser={currentUser} />
        )}

        {/* Multi-Currency Invoicing Hub */}
        {activeSection === 'invoicing' && (
          <InvoicingCreatorHub currentUser={currentUser} />
        )}

        {/* Developer API & Integrations */}
        {activeSection === 'developer' && (
          <DeveloperApiPortal />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">PayPal Connect</span>
            <span aria-hidden="true">·</span>
            <span>The Autonomous Economy for Small Businesses</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <button onClick={() => setActiveSection('command_center')} className="hover:text-white cursor-pointer">
              Dashboard
            </button>
            <button onClick={() => setActiveSection('money_center')} className="hover:text-white cursor-pointer">
              AG Grid Money Center
            </button>
            <button onClick={() => setActiveSection('procurement')} className="hover:text-white cursor-pointer">
              Channel3 Procurement
            </button>
            <button onClick={() => setActiveSection('project_ops')} className="hover:text-white cursor-pointer">
              Bryntum Gantt
            </button>
            <span className="text-slate-600">© 2026 PayPal Connect</span>
          </div>
        </div>
      </footer>

      <FeatureGuidanceModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onNavigate={(sec) => setActiveSection(sec)}
      />

      <CustomerLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => {
          setCurrentUser(user);
          setIsLoginOpen(false);
        }}
        onLogout={() => setCurrentUser(DEFAULT_USER)}
      />
    </div>
  );
}
