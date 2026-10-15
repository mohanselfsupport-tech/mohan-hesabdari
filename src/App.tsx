import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { InitialSetupModal } from './components/InitialSetupModal';
import { MohanLogo } from './components/MohanLogo';
import { PageTransition } from './components/common/PageTransition';

// Views
import { DashboardView } from './components/views/DashboardView';
import { PartsView } from './components/views/PartsView';
import { CategoriesView } from './components/views/CategoriesView';
import { BrandsView } from './components/views/BrandsView';
import { VehiclesView } from './components/views/VehiclesView';
import { InventoryView } from './components/views/InventoryView';
import { SalesInvoiceView } from './components/views/SalesInvoiceView';
import { InvoiceListView } from './components/views/InvoiceListView';
import { InvoiceHistoryView } from './components/views/InvoiceHistoryView';
import { PurchasesView } from './components/views/PurchasesView';
import { CustomersView } from './components/views/CustomersView';
import { SuppliersView } from './components/views/SuppliersView';
import { FinanceView } from './components/views/FinanceView';
import { PricingView } from './components/views/PricingView';
import { TopPartsReportView } from './components/views/TopPartsReportView';
import { ReportsView } from './components/views/ReportsView';
import { BarcodeView } from './components/views/BarcodeView';
import { MessageCenterView } from './components/views/MessageCenterView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { UsersView } from './components/views/UsersView';
import { ActivityLogView } from './components/views/ActivityLogView';
import { BackupView } from './components/views/BackupView';
import { SettingsView } from './components/views/SettingsView';
import { SmartScannerView } from './components/views/SmartScannerView';

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentView, toasts, removeToast, users, isLoading } = useApp();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Render view dynamically
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'parts':
        return <PartsView />;
      case 'categories':
        return <CategoriesView />;
      case 'brands':
        return <BrandsView />;
      case 'vehicles':
        return <VehiclesView />;
      case 'inventory':
        return <InventoryView />;
      case 'sales_invoice':
        return <SalesInvoiceView />;
      case 'invoices_list':
      case 'invoice_list':
        return <InvoiceListView />;
      case 'invoice_history':
      case 'invoices_history':
        return <InvoiceHistoryView />;
      case 'purchases':
        return <PurchasesView />;
      case 'customers':
        return <CustomersView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'finance':
      case 'cash_bank':
      case 'expenses':
      case 'checks':
        return <FinanceView />;
      case 'pricing':
        return <PricingView />;
      case 'top_parts':
        return <TopPartsReportView />;
      case 'reports':
        return <ReportsView />;
      case 'barcode':
        return <BarcodeView />;
      case 'messages':
        return <MessageCenterView />;
      case 'ai_assistant':
        return <AIAssistantView />;
      case 'users':
        return <UsersView />;
      case 'activity_logs':
        return <ActivityLogView />;
      case 'backup':
        return <BackupView />;
      case 'smart_scanner':
        return <SmartScannerView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="p-4 rounded-3xl glass-panel shadow-2xl border border-amber-500/30">
            <MohanLogo size="lg" variant="icon" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              در حال بارگذاری سامانه موهان...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-amber-500/20 selection:text-amber-600 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header with Mohan Emblem Logo */}
        <Header onToggleSidebarMobile={() => setIsMobileSidebarOpen(true)} />

        {/* Dynamic Page Container with Smooth Page Transitions */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <PageTransition pageKey={currentView}>
              {renderCurrentView()}
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-emerald-50/95 dark:bg-emerald-950/95 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 shadow-emerald-500/10'
                  : toast.type === 'error'
                  ? 'bg-rose-50/95 dark:bg-rose-950/95 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 shadow-rose-500/10'
                  : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/20'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-amber-500 shrink-0" />}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:opacity-75 rounded-lg transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Initial Admin Setup Modal (triggers automatically if first run) */}
      <InitialSetupModal
        isOpen={users.length === 0 || isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
