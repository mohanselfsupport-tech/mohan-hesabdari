import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { MohanLogo } from './MohanLogo';
import {
  LayoutDashboard,
  Package,
  Layers,
  Tag,
  Car,
  Warehouse,
  FileText,
  ShoppingBag,
  Users,
  Truck,
  CreditCard,
  Building2,
  Receipt,
  CheckSquare,
  TrendingUp,
  BarChart3,
  Award,
  QrCode,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  History,
  HardDriveDownload,
  ScanLine,
  ChevronRight,
  ChevronLeft,
  Clock,
} from 'lucide-react';
import { toPersianDigits } from '../utils/formatters';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  alert?: string;
  highlight?: boolean;
}

interface MenuSection {
  groupTitle: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { currentView, setCurrentView, parts, checks, categories, invoices } = useApp();

  const lowStockCount = parts.filter((p) => (p.currentStock || 0) <= (p.minStockAlert || 3)).length;
  const pendingChecksCount = checks.filter((c) => c.status === 'IN_VAULT').length;

  const menuSections: MenuSection[] = [
    {
      groupTitle: 'عملیات اصلی و کالاها',
      items: [
        { id: 'dashboard', label: '۱. داشبورد', icon: LayoutDashboard },
        { id: 'smart_scanner', label: '۲. اسکن هوشمند فایل و قیمت‌ها', icon: ScanLine, highlight: true },
        { id: 'parts', label: '۳. کالاها و قطعات', icon: Package, badge: parts.length > 0 ? toPersianDigits(parts.length) : undefined },
        { id: 'brands', label: '۴. برندها', icon: Tag },
        { id: 'categories', label: '۵. دسته‌بندی‌ها', icon: Layers, badge: toPersianDigits(categories.length) },
        { id: 'vehicles', label: '۶. خودروها و سازگاری', icon: Car },
        { id: 'inventory', label: '۷. انبار و موجودی', icon: Warehouse, alert: lowStockCount > 0 ? toPersianDigits(lowStockCount) : undefined },
      ],
    },
    {
      groupTitle: 'معاملات و اسناد مالی',
      items: [
        { id: 'sales_invoice', label: '۸. صدور فاکتور فروش', icon: FileText },
        { id: 'invoice_history', label: '۹. تاریخچه فاکتورها', icon: Clock, badge: invoices.length > 0 ? toPersianDigits(invoices.length) : undefined, highlight: true },
        { id: 'purchases', label: '۱۰. خرید و ورود قطعات', icon: ShoppingBag },
        { id: 'customers', label: '۱۱. مشتریان و حساب‌ها', icon: Users },
        { id: 'suppliers', label: '۱۲. تأمین‌کنندگان', icon: Truck },
        { id: 'finance', label: '۱۳. دریافت و پرداخت', icon: CreditCard },
        { id: 'cash_bank', label: '۱۴. صندوق و بانک', icon: Building2 },
        { id: 'expenses', label: '۱۵. هزینه‌ها', icon: Receipt },
        { id: 'checks', label: '۱۶. چک‌ها', icon: CheckSquare, alert: pendingChecksCount > 0 ? toPersianDigits(pendingChecksCount) : undefined },
      ],
    },
    {
      groupTitle: 'حسابداری و تحلیل هوشمند',
      items: [
        { id: 'pricing', label: '۱۷. حسابداری و قیمت‌گذاری', icon: TrendingUp },
        { id: 'reports', label: '۱۸. گزارش‌ها و سود و زیان', icon: BarChart3 },
        { id: 'top_parts', label: '۱۹. ۲۰ قطعه پرمصرف', icon: Award },
        { id: 'barcode', label: '۲۰. بارکد و چاپ لیبل', icon: QrCode },
        { id: 'messages', label: '۲۱. مرکز پیام‌ها', icon: MessageSquare },
        { id: 'ai_assistant', label: '۲۲. دستیار هوشمند موهان', icon: Sparkles, highlight: true },
      ],
    },
    {
      groupTitle: 'مدیریت سیستم و امنیت',
      items: [
        { id: 'backup', label: '۲۳. پشتیبان‌گیری و بازیابی داده‌ها', icon: HardDriveDownload, highlight: true },
        { id: 'users', label: '۲۴. کاربران و دسترسی‌ها', icon: ShieldCheck },
        { id: 'activity_logs', label: '۲۵. تاریخچه فعالیت‌ها', icon: History },
      ],
    },
  ];

  const handleSelect = (viewId: string) => {
    if (viewId === 'cash_bank' || viewId === 'expenses' || viewId === 'checks') {
      setCurrentView('finance');
    } else {
      setCurrentView(viewId);
    }
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`no-print fixed lg:static top-0 right-0 h-full z-50 flex flex-col bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border-l border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none ${
          mobileOpen ? 'translate-x-0 w-72' : 'translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Top Header inside sidebar with Mohan Logo */}
        <div className="flex items-center justify-between px-4 h-20 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="overflow-hidden">
            {isCollapsed ? (
              <MohanLogo size="sm" variant="icon" />
            ) : (
              <MohanLogo size="md" variant="horizontal" />
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title={isCollapsed ? 'گسترش منو' : 'جمع‌کردن منو'}
          >
            {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Menu Navigation Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {menuSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  {sec.groupTitle}
                </div>
              )}
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentView === item.id ||
                  (currentView === 'finance' && ['finance', 'cash_bank', 'expenses', 'checks'].includes(item.id)) ||
                  (currentView === 'invoices_list' && item.id === 'invoice_history');

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                      isActive
                        ? 'text-amber-600 dark:text-amber-400 font-bold'
                        : item.highlight
                        ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {/* Animated Sliding Background Indicator */}
                    {isActive && (
                      <motion.span
                        layoutId="active-sidebar-indicator"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="absolute inset-0 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 dark:border-amber-400/30 shadow-xs shadow-amber-500/10"
                      />
                    )}

                    {/* Subtle hover background when not active */}
                    {!isActive && (
                      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-slate-100/70 dark:bg-slate-800/50 transition-opacity" />
                    )}

                    <Icon
                      className={`relative z-10 w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isActive
                          ? 'scale-110 text-amber-500 dark:text-amber-400'
                          : 'group-hover:scale-105 group-hover:text-amber-500'
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="relative z-10 flex-1 text-right truncate">
                        {item.label}
                      </span>
                    )}

                    {!isCollapsed && item.alert && (
                      <span className="relative z-10 px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full shadow-xs animate-pulse">
                        {item.alert}
                      </span>
                    )}

                    {!isCollapsed && item.badge && !item.alert && (
                      <span className="relative z-10 px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200/60 dark:border-slate-700/60">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom System Status */}
        {!isCollapsed && (
          <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                <span className="font-medium">پایگاه داده متصل</span>
              </span>
              <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                v2.0
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
