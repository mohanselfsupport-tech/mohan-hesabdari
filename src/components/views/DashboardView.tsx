import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { RippleButton } from '../common/RippleButton';
import { EmptyState } from '../common/EmptyState';
import { StaggerContainer, StaggerItem } from '../common/PageTransition';
import {
  TrendingUp,
  FileText,
  Package,
  AlertTriangle,
  DollarSign,
  Users,
  Truck,
  Warehouse,
  PlusCircle,
  Clock,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  ScanLine,
  HardDriveDownload,
  X,
  Search,
  ExternalLink,
  ChevronLeft,
  Calendar,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import {
  toPersianDigits,
  formatPersianCurrency,
  formatPersianDate,
  formatPersianDateTime,
} from '../../utils/formatters';

type StatModalType =
  | 'TODAY_SALES'
  | 'MONTHLY_SALES'
  | 'GROSS_PROFIT'
  | 'INVENTORY_VALUE'
  | 'CUSTOMER_DEBT'
  | 'SUPPLIER_PAYABLES'
  | 'LOW_STOCK'
  | 'PROFORMAS'
  | null;

export const DashboardView: React.FC = () => {
  const {
    invoices,
    parts,
    customers,
    suppliers,
    settings,
    setCurrentView,
    activityLogs,
    categories,
  } = useApp();

  const [activeModal, setActiveModal] = useState<StatModalType>(null);
  const [modalSearch, setModalSearch] = useState<string>('');

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const completedSales = invoices.filter((inv) => inv.type === 'SALE' && inv.status === 'COMPLETED');
  const proformas = invoices.filter((inv) => inv.type === 'PROFORMA');

  const todayCompletedSales = completedSales.filter((inv) => inv.createdAt.startsWith(todayStr));
  const todaySales = todayCompletedSales.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const monthlySales = completedSales.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  // Profit calculation based on weighted average cost of sold items
  let totalGrossProfit = 0;
  const profitItemsList: Array<{
    invoiceId: string;
    invoiceNumber: string;
    customerName: string;
    date: string;
    partName: string;
    quantity: number;
    unitPrice: number;
    cost: number;
    profit: number;
    profitMargin: number;
  }> = [];

  completedSales.forEach((inv) => {
    inv.items.forEach((item) => {
      const part = parts.find((p) => p.id === item.partId);
      const cost = part?.weightedAvgCost || part?.lastPurchasePrice || 0;
      const profit = Math.max(0, (item.unitPrice - cost) * item.quantity - (item.discount || 0));
      totalGrossProfit += profit;
      const margin = item.unitPrice > 0 ? Math.round(((item.unitPrice - cost) / item.unitPrice) * 100) : 0;

      profitItemsList.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName || 'مشتری متفرقه',
        date: inv.createdAt,
        partName: item.partName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        cost,
        profit,
        profitMargin: margin,
      });
    });
  });

  // Customer debt
  const debtorCustomers = customers.filter((c) => (c.balance || 0) < 0);
  const totalCustomerDebt = debtorCustomers.reduce((sum, c) => sum + Math.abs(c.balance), 0);

  // Supplier payables
  const payableSuppliers = suppliers.filter((s) => (s.balance || 0) > 0);
  const totalSupplierPayables = payableSuppliers.reduce((sum, s) => sum + s.balance, 0);

  // Total inventory value
  const partsWithStock = parts.filter((p) => (p.currentStock || 0) > 0);
  const totalInventoryValue = parts.reduce((sum, p) => {
    const cost = p.weightedAvgCost || p.lastPurchasePrice || 0;
    return sum + (p.currentStock || 0) * cost;
  }, 0);

  const lowStockParts = parts.filter((p) => (p.currentStock || 0) <= (p.minStockAlert || 3));

  // Interactive Stats Cards Configuration
  const stats = [
    {
      id: 'TODAY_SALES' as StatModalType,
      title: 'فروش امروز',
      numValue: todaySales,
      formatter: (val: number) => formatPersianCurrency(val, settings.currency),
      subtext: `تعداد: ${toPersianDigits(todayCompletedSales.length)} فاکتور نهایی`,
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      badge: 'مشاهده لیست اقلام ↗',
    },
    {
      id: 'MONTHLY_SALES' as StatModalType,
      title: 'فروش ماه جاری',
      numValue: monthlySales,
      formatter: (val: number) => formatPersianCurrency(val, settings.currency),
      subtext: `${toPersianDigits(completedSales.length)} فاکتور ثبت‌شده`,
      icon: TrendingUp,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      badge: 'مشاهده فاکتورها ↗',
    },
    {
      id: 'GROSS_PROFIT' as StatModalType,
      title: 'سود ناخالص تخمینی',
      numValue: totalGrossProfit,
      formatter: (val: number) => formatPersianCurrency(val, settings.currency),
      subtext: 'محاسبه بر مبنای بهای خرید',
      icon: TrendingUp,
      color: 'from-amber-500 to-yellow-600',
      textColor: 'text-amber-600 dark:text-amber-400',
      badge: 'تفکیک سود اقلام ↗',
    },
    {
      id: 'INVENTORY_VALUE' as StatModalType,
      title: 'ارزش موجودی انبار',
      numValue: totalInventoryValue,
      formatter: (val: number) => formatPersianCurrency(val, settings.currency),
      subtext: `${toPersianDigits(parts.length)} ردیف کالای تعریف‌شده`,
      icon: Warehouse,
      color: 'from-purple-500 to-violet-600',
      textColor: 'text-purple-600 dark:text-purple-400',
      badge: 'لیست سرمایه انبار ↗',
    },
    {
      id: 'CUSTOMER_DEBT' as StatModalType,
      title: 'مانده بدهی مشتریان',
      numValue: totalCustomerDebt,
      formatter: (val: number) => formatPersianCurrency(val, settings.currency),
      subtext: `${toPersianDigits(debtorCustomers.length)} مشتری دارای مانده بدهی`,
      icon: Users,
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-600 dark:text-rose-400',
      badge: 'لیست بدهکاران ↗',
    },
    {
      id: 'SUPPLIER_PAYABLES' as StatModalType,
      title: 'بدهی به تأمین‌کنندگان',
      numValue: totalSupplierPayables,
      formatter: (val: number) => formatPersianCurrency(val, settings.currency),
      subtext: `${toPersianDigits(payableSuppliers.length)} تأمین‌کننده بستانکار`,
      icon: Truck,
      color: 'from-orange-500 to-amber-600',
      textColor: 'text-orange-600 dark:text-orange-400',
      badge: 'لیست پرداختنی‌ها ↗',
    },
    {
      id: 'LOW_STOCK' as StatModalType,
      title: 'اقلام کم‌موجود یا اتمام',
      numValue: lowStockParts.length,
      formatter: (val: number) => `${toPersianDigits(val)} قلم`,
      subtext: 'نیاز فوری به ثبت سفارش خرید',
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-600',
      textColor: 'text-red-600 dark:text-red-400',
      badge: 'لیست کسری کالاها ↗',
    },
    {
      id: 'PROFORMAS' as StatModalType,
      title: 'پیش‌فاکتورهای باز',
      numValue: proformas.length,
      formatter: (val: number) => `${toPersianDigits(val)} عدد`,
      subtext: 'در انتظار تأیید یا صدور نهایی',
      icon: FileText,
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      badge: 'لیست پیش‌فاکتورها ↗',
    },
  ];

  // Quick action items including smart scanner and backup
  const quickActions = [
    { label: 'صدور فاکتور', view: 'sales_invoice', icon: FileText, color: 'text-emerald-500' },
    { label: 'اسکن هوشمند فایل', view: 'smart_scanner', icon: ScanLine, color: 'text-amber-500' },
    { label: 'ثبت خرید', view: 'purchases', icon: Truck, color: 'text-blue-500' },
    { label: 'افزودن کالا', view: 'parts', icon: Package, color: 'text-amber-500' },
    { label: 'انبارگردانی', view: 'inventory', icon: Warehouse, color: 'text-purple-500' },
    { label: 'مشتریان', view: 'customers', icon: Users, color: 'text-teal-500' },
    { label: 'پشتیبان‌گیری', view: 'backup', icon: HardDriveDownload, color: 'text-emerald-500' },
    { label: 'دستیار موهان', view: 'ai_assistant', icon: Sparkles, color: 'text-yellow-500' },
  ];

  const handleOpenStat = (statId: StatModalType) => {
    setActiveModal(statId);
    setModalSearch('');
  };

  return (
    <div className="space-y-6">
      {/* Quick Action Buttons with Staggered Entrance */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3" delay={0.03}>
        {quickActions.map((act, i) => {
          const Icon = act.icon;
          return (
            <StaggerItem key={i}>
              <motion.button
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
                onClick={() => setCurrentView(act.view)}
                className="w-full flex flex-col items-center justify-center p-3.5 rounded-2xl glass-panel glass-panel-hover text-center group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/70 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
                  <Icon className={`w-4 h-4 ${act.color}`} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-amber-500 transition-colors">
                  {act.label}
                </span>
              </motion.button>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Interactive Statistics Cards with Animated Count-Up & Clickable Drill-down */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" delay={0.04}>
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <StaggerItem key={idx}>
              <motion.div
                whileHover={{ y: -4, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleOpenStat(s.id)}
                className="relative p-5 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-between h-full group cursor-pointer border border-transparent hover:border-amber-500/40 transition-all shadow-sm hover:shadow-lg"
                title={`برای مشاهده لیست کامل و جزئیات ${s.title} کلیک کنید`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-amber-500 transition-colors">
                      {s.title}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${s.color} text-white flex items-center justify-center shadow-md group-hover:rotate-6 transition-transform`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-1 my-1">
                    <div className={`text-xl sm:text-2xl font-black ${s.textColor} tracking-tight`}>
                      <AnimatedCounter value={s.numValue} formatter={s.formatter} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="truncate max-w-[140px]">{s.subtext}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shadow-xs">
                    {s.badge}
                  </span>
                </div>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Visual Summary & Status Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Progress & Category Breakdown */}
        <div className="lg:col-span-1 p-5 rounded-3xl glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                وضعیت و گردش موجودی انبار
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">برنامه موهان</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300">اقلام دارای موجودی کافی</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {toPersianDigits(Math.max(0, parts.length - lowStockParts.length))} کالا
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: parts.length > 0 ? `${((parts.length - lowStockParts.length) / parts.length) * 100}%` : '0%',
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300">اقلام نیازمند سفارش خرید</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {toPersianDigits(lowStockParts.length)} کالا
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: parts.length > 0 ? `${(lowStockParts.length / parts.length) * 100}%` : '0%',
                  }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300">دسته‌بندی‌های فعال</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {toPersianDigits(categories.length)} دسته
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <button
              onClick={() => setCurrentView('reports')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده گزارش‌های تحلیلی کامل</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-1 p-5 rounded-3xl glass-panel space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  هشدار موجودی انبار
                </h3>
              </div>
              <button
                onClick={() => handleOpenStat('LOW_STOCK')}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                مشاهده همه
              </button>
            </div>

            {lowStockParts.length === 0 ? (
              <EmptyState
                icon={Package}
                title="تمامی کالاها دارای موجودی کافی هستند"
                description={
                  parts.length === 0
                    ? 'هنوز کالایی در انبار تعریف نشده است.'
                    : 'هیچ کالایی به نقطه سفارش یا کسری نرسیده است.'
                }
                actionLabel={parts.length === 0 ? 'افزودن کالا' : undefined}
                onAction={() => setCurrentView('parts')}
                className="py-6 border-none bg-transparent shadow-none"
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-64 overflow-y-auto">
                {lowStockParts.slice(0, 5).map((part) => (
                  <div
                    key={part.id}
                    className="py-2.5 px-2 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[160px]">
                        {part.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        کد: {part.technicalCode || part.internalCode}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-[11px]">
                      {toPersianDigits(part.currentStock || 0)} {part.unit || 'عدد'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {lowStockParts.length > 0 && (
            <div className="pt-2">
              <RippleButton
                variant="secondary"
                onClick={() => setCurrentView('purchases')}
                className="w-full py-2 text-xs font-bold"
              >
                <span>ثبت فاکتور خرید برای اقلام کسری</span>
              </RippleButton>
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="lg:col-span-1 p-5 rounded-3xl glass-panel space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  آخرین اسناد فروش
                </h3>
              </div>
              <button
                onClick={() => handleOpenStat('TODAY_SALES')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                آمار فروش
              </button>
            </div>

            {invoices.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="هنوز فاکتور فروشی ثبت نشده است"
                description="با صدور اولین فاکتور فروش، اطلاعات و اسناد در اینجا نمایش می‌یابد."
                actionLabel="صدور فاکتور جدید"
                onAction={() => setCurrentView('sales_invoice')}
                className="py-6 border-none bg-transparent shadow-none"
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-64 overflow-y-auto">
                {invoices.slice(0, 5).map((inv) => (
                  <div
                    key={inv.id}
                    className="py-2.5 px-2 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[150px]">
                        {inv.customerName || 'مشتری متفرقه'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        فاکتور {toPersianDigits(inv.invoiceNumber)} · {formatPersianDate(inv.createdAt)}
                      </span>
                    </div>
                    <div className="text-left font-black text-emerald-600 dark:text-emerald-400">
                      {formatPersianCurrency(inv.grandTotal, settings.currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <RippleButton
              variant="emerald"
              onClick={() => setCurrentView('sales_invoice')}
              className="w-full py-2 text-xs font-bold"
            >
              <span>صدور فاکتور جدید</span>
            </RippleButton>
          </div>
        </div>
      </div>

      {/* Activity Logs Audit Trail */}
      <div className="p-5 rounded-3xl glass-panel space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              دفتر وقایع و تاریخچه عملیات اخیر
            </h3>
          </div>
          <button
            onClick={() => setCurrentView('activity_logs')}
            className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
          >
            مشاهده کامل
          </button>
        </div>

        {activityLogs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            هنوز رویدادی ثبت نشده است. با انجام عملیات در سیستم، گزارش آن در اینجا نمایش داده می‌شود.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activityLogs.slice(0, 3).map((log) => (
              <motion.div
                key={log.id}
                whileHover={{ y: -2 }}
                className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5 transition-shadow"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10">
                    {log.action}
                  </span>
                  <span>{formatPersianDateTime(log.timestamp)}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 truncate">
                  {log.details}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ================= DETAILED METRIC BREAKDOWN MODAL ================= */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-4xl max-h-[88vh] rounded-3xl glass-panel p-5 sm:p-6 border border-amber-500/30 shadow-2xl flex flex-col space-y-4 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25">
                    {activeModal === 'TODAY_SALES' && <DollarSign className="w-5 h-5" />}
                    {activeModal === 'MONTHLY_SALES' && <TrendingUp className="w-5 h-5" />}
                    {activeModal === 'GROSS_PROFIT' && <TrendingUp className="w-5 h-5 text-amber-500" />}
                    {activeModal === 'INVENTORY_VALUE' && <Warehouse className="w-5 h-5" />}
                    {activeModal === 'CUSTOMER_DEBT' && <Users className="w-5 h-5 text-rose-500" />}
                    {activeModal === 'SUPPLIER_PAYABLES' && <Truck className="w-5 h-5 text-orange-500" />}
                    {activeModal === 'LOW_STOCK' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                    {activeModal === 'PROFORMAS' && <FileText className="w-5 h-5 text-cyan-500" />}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {activeModal === 'TODAY_SALES' && 'لیست و آمار کامل: فروش امروز'}
                      {activeModal === 'MONTHLY_SALES' && 'لیست و آمار کامل: فروش ماه جاری'}
                      {activeModal === 'GROSS_PROFIT' && 'تفکیک و جزئیات کامل: سود ناخالص تخمینی'}
                      {activeModal === 'INVENTORY_VALUE' && 'لیست تفصیلی: ارزش موجودی انبار'}
                      {activeModal === 'CUSTOMER_DEBT' && 'لیست بدهکاران: مانده بدهی مشتریان'}
                      {activeModal === 'SUPPLIER_PAYABLES' && 'لیست بستانکاران: بدهی به تأمین‌کنندگان'}
                      {activeModal === 'LOW_STOCK' && 'لیست اقلام دارای کسری یا در نقطه سفارش'}
                      {activeModal === 'PROFORMAS' && 'فهرست پیش‌فاکتورهای باز سیستم'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      اطلاعات دقیق، مبالغ و ردیف‌های محاسباتی ثبت‌شده در سامانه موهان
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Search Toolbar */}
              <div className="flex items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="جستجو در این بخش..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {activeModal === 'TODAY_SALES' && `جمع کل فروش امروز: ${formatPersianCurrency(todaySales, settings.currency)}`}
                  {activeModal === 'MONTHLY_SALES' && `جمع کل فروش ماه: ${formatPersianCurrency(monthlySales, settings.currency)}`}
                  {activeModal === 'GROSS_PROFIT' && `جمع کل سود ناخالص: ${formatPersianCurrency(totalGrossProfit, settings.currency)}`}
                  {activeModal === 'INVENTORY_VALUE' && `جمع ارزش انبار: ${formatPersianCurrency(totalInventoryValue, settings.currency)}`}
                  {activeModal === 'CUSTOMER_DEBT' && `جمع کل طلبکاری: ${formatPersianCurrency(totalCustomerDebt, settings.currency)}`}
                  {activeModal === 'SUPPLIER_PAYABLES' && `جمع بدهکاری: ${formatPersianCurrency(totalSupplierPayables, settings.currency)}`}
                  {activeModal === 'LOW_STOCK' && `${toPersianDigits(lowStockParts.length)} قلم کالا`}
                  {activeModal === 'PROFORMAS' && `${toPersianDigits(proformas.length)} پیش‌فاکتور`}
                </div>
              </div>

              {/* Modal Content Table */}
              <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                {/* 1. TODAY'S SALES & 2. MONTHLY SALES */}
                {(activeModal === 'TODAY_SALES' || activeModal === 'MONTHLY_SALES') && (
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 sticky top-0">
                      <tr>
                        <th className="p-3">شماره فاکتور</th>
                        <th className="p-3">نام مشتری</th>
                        <th className="p-3">تاریخ و ساعت</th>
                        <th className="p-3">تعداد اقلام</th>
                        <th className="p-3">روش پرداخت</th>
                        <th className="p-3 text-left">مبلغ کل (تومان)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {(activeModal === 'TODAY_SALES' ? todayCompletedSales : completedSales)
                        .filter((inv) => {
                          if (!modalSearch) return true;
                          const q = modalSearch.toLowerCase();
                          return (
                            inv.invoiceNumber.toLowerCase().includes(q) ||
                            (inv.customerName || '').toLowerCase().includes(q)
                          );
                        })
                        .map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-amber-500">
                              {toPersianDigits(inv.invoiceNumber)}
                            </td>
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                              {inv.customerName || 'مشتری متفرقه'}
                            </td>
                            <td className="p-3 text-slate-400">
                              {formatPersianDateTime(inv.createdAt)}
                            </td>
                            <td className="p-3 font-semibold text-slate-600 dark:text-slate-300">
                              {toPersianDigits(inv.items.length)} ردیف
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {inv.paymentMethod === 'CASH'
                                  ? 'نقدی'
                                  : inv.paymentMethod === 'CARD'
                                  ? 'کارتخوان'
                                  : inv.paymentMethod === 'CREDIT'
                                  ? 'نسیه'
                                  : 'ترکیبی'}
                              </span>
                            </td>
                            <td className="p-3 text-left font-black text-emerald-600 dark:text-emerald-400">
                              {formatPersianCurrency(inv.grandTotal, settings.currency)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}

                {/* 3. ESTIMATED GROSS PROFIT */}
                {activeModal === 'GROSS_PROFIT' && (
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 sticky top-0">
                      <tr>
                        <th className="p-3">نام قطعه و کالا</th>
                        <th className="p-3">فاکتور / مشتری</th>
                        <th className="p-3">تعداد فروخته‌شده</th>
                        <th className="p-3">قیمت فروش</th>
                        <th className="p-3">بهای تمام‌شده (خرید)</th>
                        <th className="p-3">سود ناخالص</th>
                        <th className="p-3 text-left">حاشیه سود</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {profitItemsList
                        .filter((it) => {
                          if (!modalSearch) return true;
                          const q = modalSearch.toLowerCase();
                          return (
                            it.partName.toLowerCase().includes(q) ||
                            it.customerName.toLowerCase().includes(q) ||
                            it.invoiceNumber.toLowerCase().includes(q)
                          );
                        })
                        .map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                              {it.partName}
                            </td>
                            <td className="p-3 text-slate-400">
                              فاکتور {toPersianDigits(it.invoiceNumber)} ({it.customerName})
                            </td>
                            <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                              {toPersianDigits(it.quantity)} عدد
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300 font-mono">
                              {formatPersianCurrency(it.unitPrice, '')}
                            </td>
                            <td className="p-3 text-slate-400 font-mono">
                              {formatPersianCurrency(it.cost, '')}
                            </td>
                            <td className="p-3 font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              {formatPersianCurrency(it.profit, settings.currency)}
                            </td>
                            <td className="p-3 text-left">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  it.profitMargin >= 20
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {toPersianDigits(it.profitMargin)}٪
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}

                {/* 4. INVENTORY VALUE */}
                {activeModal === 'INVENTORY_VALUE' && (
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 sticky top-0">
                      <tr>
                        <th className="p-3">نام قطعه</th>
                        <th className="p-3">کد فنی</th>
                        <th className="p-3">موجودی انبار</th>
                        <th className="p-3">بهای واحد خرید</th>
                        <th className="p-3">قیمت فروش مصوب</th>
                        <th className="p-3 text-left">ارزش کل دارایی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {partsWithStock
                        .filter((p) => {
                          if (!modalSearch) return true;
                          const q = modalSearch.toLowerCase();
                          return (
                            p.name.toLowerCase().includes(q) ||
                            (p.technicalCode || '').toLowerCase().includes(q)
                          );
                        })
                        .map((p) => {
                          const cost = p.weightedAvgCost || p.lastPurchasePrice || 0;
                          const totalValue = (p.currentStock || 0) * cost;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                {p.name}
                              </td>
                              <td className="p-3 font-mono text-slate-400">
                                {p.technicalCode || p.internalCode}
                              </td>
                              <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                                {toPersianDigits(p.currentStock || 0)} {p.unit || 'عدد'}
                              </td>
                              <td className="p-3 text-slate-400 font-mono">
                                {formatPersianCurrency(cost, '')}
                              </td>
                              <td className="p-3 text-slate-700 dark:text-slate-300 font-mono">
                                {formatPersianCurrency(p.salePrice, '')}
                              </td>
                              <td className="p-3 text-left font-black text-purple-600 dark:text-purple-400 font-mono">
                                {formatPersianCurrency(totalValue, settings.currency)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}

                {/* 5. CUSTOMER DEBT */}
                {activeModal === 'CUSTOMER_DEBT' && (
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 sticky top-0">
                      <tr>
                        <th className="p-3">نام مشتری</th>
                        <th className="p-3">شماره تماس</th>
                        <th className="p-3">وضعیت حساب</th>
                        <th className="p-3 text-left">مانده بدهی (تومان)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {debtorCustomers
                        .filter((c) => {
                          if (!modalSearch) return true;
                          const q = modalSearch.toLowerCase();
                          return (
                            c.fullName.toLowerCase().includes(q) ||
                            (c.phone || '').includes(q)
                          );
                        })
                        .map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                              {c.fullName}
                            </td>
                            <td className="p-3 text-slate-400 font-mono">
                              {toPersianDigits(c.phone || c.mobile || '—')}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                                بدهکار
                              </span>
                            </td>
                            <td className="p-3 text-left font-black text-rose-600 dark:text-rose-400 font-mono">
                              {formatPersianCurrency(Math.abs(c.balance || 0), settings.currency)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}

                {/* 6. SUPPLIER PAYABLES */}
                {activeModal === 'SUPPLIER_PAYABLES' && (
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 sticky top-0">
                      <tr>
                        <th className="p-3">نام تأمین‌کننده</th>
                        <th className="p-3">شماره تماس</th>
                        <th className="p-3">وضعیت</th>
                        <th className="p-3 text-left">مبلغ بستانکاری (تومان)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {payableSuppliers
                        .filter((s) => {
                          if (!modalSearch) return true;
                          const q = modalSearch.toLowerCase();
                          return (
                            s.name.toLowerCase().includes(q) ||
                            (s.phone || '').includes(q)
                          );
                        })
                        .map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                              {s.name}
                            </td>
                            <td className="p-3 text-slate-400 font-mono">
                              {toPersianDigits(s.phone || s.mobile || '—')}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400">
                                بستانکار
                              </span>
                            </td>
                            <td className="p-3 text-left font-black text-orange-600 dark:text-orange-400 font-mono">
                              {formatPersianCurrency(s.balance, settings.currency)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}

                {/* 7. LOW STOCK */}
                {activeModal === 'LOW_STOCK' && (
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 sticky top-0">
                      <tr>
                        <th className="p-3">نام قطعه</th>
                        <th className="p-3">کد فنی</th>
                        <th className="p-3">موجودی فعلی</th>
                        <th className="p-3">حداقل هشدار</th>
                        <th className="p-3">کسری تا حداقل</th>
                        <th className="p-3 text-left">قیمت خرید تقریبی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {lowStockParts
                        .filter((p) => {
                          if (!modalSearch) return true;
                          const q = modalSearch.toLowerCase();
                          return (
                            p.name.toLowerCase().includes(q) ||
                            (p.technicalCode || '').toLowerCase().includes(q)
                          );
                        })
                        .map((p) => {
                          const alertLevel = p.minStockAlert || 3;
                          const deficit = Math.max(0, alertLevel - (p.currentStock || 0));
                          return (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                {p.name}
                              </td>
                              <td className="p-3 font-mono text-slate-400">
                                {p.technicalCode || p.internalCode}
                              </td>
                              <td className="p-3 font-black text-rose-600 dark:text-rose-400">
                                {toPersianDigits(p.currentStock || 0)} {p.unit || 'عدد'}
                              </td>
                              <td className="p-3 text-slate-400">
                                {toPersianDigits(alertLevel)} {p.unit || 'عدد'}
                              </td>
                              <td className="p-3 font-bold text-amber-500">
                                {toPersianDigits(deficit)} عدد کسری
                              </td>
                              <td className="p-3 text-left font-mono text-slate-700 dark:text-slate-300">
                                {formatPersianCurrency(p.lastPurchasePrice, settings.currency)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}

                {/* 8. OPEN PROFORMAS */}
                {activeModal === 'PROFORMAS' && (
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 sticky top-0">
                      <tr>
                        <th className="p-3">شماره پیش‌فاکتور</th>
                        <th className="p-3">نام مشتری</th>
                        <th className="p-3">تاریخ صدور</th>
                        <th className="p-3">تعداد اقلام</th>
                        <th className="p-3 text-left">مبلغ پیش‌فاکتور (تومان)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {proformas
                        .filter((inv) => {
                          if (!modalSearch) return true;
                          const q = modalSearch.toLowerCase();
                          return (
                            inv.invoiceNumber.toLowerCase().includes(q) ||
                            (inv.customerName || '').toLowerCase().includes(q)
                          );
                        })
                        .map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-cyan-500">
                              {toPersianDigits(inv.invoiceNumber)}
                            </td>
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                              {inv.customerName || 'مشتری متفرقه'}
                            </td>
                            <td className="p-3 text-slate-400">
                              {formatPersianDate(inv.createdAt)}
                            </td>
                            <td className="p-3 font-semibold text-slate-600 dark:text-slate-300">
                              {toPersianDigits(inv.items.length)} ردیف
                            </td>
                            <td className="p-3 text-left font-black text-cyan-600 dark:text-cyan-400 font-mono">
                              {formatPersianCurrency(inv.grandTotal, settings.currency)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-400">
                  برای مدیریت یا ثبت عملیات، از بخش‌های اختصاصی سایدبار استفاده فرمایید.
                </span>
                <RippleButton
                  variant="primary"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2 text-xs font-bold"
                >
                  <span>بستن پنجره</span>
                </RippleButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
