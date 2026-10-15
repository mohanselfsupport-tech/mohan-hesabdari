import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ThemeToggle } from './common/ThemeToggle';
import { RippleButton } from './common/RippleButton';
import {
  FileText,
  Package,
  User,
  LogOut,
  Menu,
  Bell,
  Sparkles,
  Calendar,
  Clock,
  ScanLine,
  HardDriveDownload,
} from 'lucide-react';
import {
  toPersianDigits,
  getJalaliDateWithDay,
  formatLiveTime,
} from '../utils/formatters';

interface HeaderProps {
  onToggleSidebarMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebarMobile }) => {
  const {
    currentView,
    setCurrentView,
    currentUser,
    logout,
    settings,
    parts,
    checks,
  } = useApp();

  // Live timer for live Jalali Date & Clock
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Page title mapping in Persian
  const pageTitles: Record<string, string> = {
    dashboard: 'داشبورد برنامه حسابداری موهان',
    parts: 'مدیریت کالاها و قطعات',
    categories: 'مدیریت دسته‌بندی قطعات',
    brands: 'مدیریت برندها و سازندگان',
    vehicles: 'مدیریت خودروها و سازگاری',
    inventory: 'مدیریت انبار و گردش کالا',
    sales_invoice: 'صدور فاکتور فروش و پیش‌فاکتور',
    invoices_list: 'فهرست اسناد فروش',
    invoice_list: 'فهرست اسناد فروش',
    invoice_history: 'تاریخچه فاکتورها',
    purchases: 'خرید و ورود قطعات',
    customers: 'مشتریان و دفتر حساب',
    suppliers: 'تأمین‌کنندگان و بدهی‌ها',
    finance: 'صندوق، بانک، هزینه‌ها و چک‌ها',
    pricing: 'مدیریت قیمت و حاشیه سود',
    top_parts: 'گزارش ۲۰ قطعه پرمصرف',
    reports: 'گزارش‌های جامع مالی و عملکرد',
    barcode: 'بارکدخوان و چاپ لیبل',
    messages: 'مرکز یکپارچه پیام‌رسان‌ها',
    smart_scanner: 'اسکن هوشمند فایل و به‌روزرسانی کالاها',
    ai_assistant: 'دستیار هوشمند و تحلیلگر موهان',
    users: 'کاربران و سطوح دسترسی',
    activity_logs: 'دفتر وقایع و تاریخچه عملیات',
    backup: 'پشتیبان‌گیری و بازیابی داده‌ها',
    settings: 'تنظیمات کلی برنامه حسابداری موهان',
  };

  const lowStockCount = parts.filter((p) => (p.currentStock || 0) <= (p.minStockAlert || 3)).length;
  const pendingChecksCount = checks.filter((c) => c.status === 'IN_VAULT').length;
  const totalNotifications = lowStockCount + pendingChecksCount;

  return (
    <header className="no-print sticky top-0 z-30 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors shadow-xs">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 h-16 gap-2">
        {/* Right side: Mobile Menu Toggle, Mohan Logo and Current Page Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={onToggleSidebarMobile}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="منوی اصلی"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col justify-center">
            <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-none">
              {pageTitles[currentView] || 'برنامه حسابداری موهان'}
            </h1>
          </div>
        </div>

        {/* Center: Live Jalali Date & Clock on Top of the System */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-2.5 py-1 text-xs rounded-xl bg-amber-500/10 dark:bg-slate-800/80 border border-amber-500/20 dark:border-slate-700/60 shadow-xs">
            <div className="hidden md:flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{getJalaliDateWithDay(currentDate)}</span>
            </div>
            <span className="hidden md:inline-block w-1 h-3 bg-amber-400/40 dark:bg-slate-600 rounded-full" />
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 hidden sm:inline" />
              <span className="tabular-nums tracking-wider">{formatLiveTime(currentDate)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="سامانه برخط" />
            </div>
          </div>
        </div>

        {/* Left side: Quick Tools, Alerts, Theme, User */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Smart Scan button */}
          <button
            onClick={() => setCurrentView('smart_scanner')}
            className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              currentView === 'smart_scanner'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/30'
            }`}
            title="اسکن هوشمند عکس، فاکتور و اکسل برای به‌روزرسانی کالاها"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>اسکن هوشمند فایل</span>
          </button>

          {/* Quick Backup button */}
          <button
            onClick={() => setCurrentView('backup')}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              currentView === 'backup'
                ? 'bg-emerald-600 text-white font-black'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
            title="پشتیبان‌گیری و بازیابی داده‌ها"
          >
            <HardDriveDownload className="w-3.5 h-3.5 text-emerald-500" />
            <span>بک‌آپ</span>
          </button>

          {/* Notification bell with micro-interaction */}
          <div className="relative">
            <button
              onClick={() => setCurrentView(lowStockCount > 0 ? 'inventory' : 'finance')}
              className={`p-2 rounded-xl relative transition-all duration-300 cursor-pointer ${
                totalNotifications > 0
                  ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={totalNotifications > 0 ? `${toPersianDigits(totalNotifications)} اعلان بررسی‌نشده` : 'بدون اعلان جدید'}
            >
              <Bell className={`w-4 h-4 ${totalNotifications > 0 ? 'animate-bell-shake' : ''}`} />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {toPersianDigits(totalNotifications)}
                </span>
              )}
            </button>
          </div>

          {/* Dedicated Animated Theme Switcher */}
          <ThemeToggle />

          {/* User Account info */}
          {currentUser ? (
            <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-sm ring-1 ring-amber-400/30">
                {currentUser.fullName ? currentUser.fullName[0] : 'م'}
              </div>
              <div className="hidden xl:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400">
                  {currentUser.role === 'SUPER_ADMIN' ? 'مدیر ارشد' : 'کاربر سیستم'}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
                title="خروج از حساب"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentView('users')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>ورود</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
