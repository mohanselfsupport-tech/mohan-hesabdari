import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { RippleButton } from '../common/RippleButton';
import {
  HardDriveDownload,
  Upload,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Database,
  Package,
  FileText,
  Users,
  CheckSquare,
  Clock,
  Sparkles,
  Download,
  Info,
} from 'lucide-react';
import { toPersianDigits, getTodayJalali } from '../../utils/formatters';

export const BackupView: React.FC = () => {
  const {
    parts,
    invoices,
    customers,
    suppliers,
    checks,
    categories,
    settings,
    restoreBackup,
    showToast,
    warehouses,
    purchaseInvoices,
    bankAccounts,
    cashRegisters,
    activityLogs,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [inspectModalData, setInspectModalData] = useState<any | null>(null);

  // Generate and download full JSON backup directly (100% reliable in both dev and production)
  const handleDownloadBackup = () => {
    try {
      const fullBackup = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        jalaliDate: getTodayJalali(),
        storeName: settings.storeName,
        categories,
        parts,
        warehouses,
        customers,
        suppliers,
        invoices,
        purchaseInvoices,
        checks,
        bankAccounts,
        cashRegisters,
        settings,
        activityLogs,
      };

      const jsonStr = JSON.stringify(fullBackup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const nowStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `mohan-accounting-backup-${nowStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('فایل پشتیبان کامل برنامه حسابداری موهان با موفقیت دانلود شد.', 'success');
    } catch (err: any) {
      showToast('خطا در دانلود نسخه پشتیبان: ' + err.message, 'error');
    }
  };

  // Inspect file before applying
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed || (!parsed.categories && !parsed.parts && !parsed.invoices)) {
          showToast('فایل بارگذاری‌شده ساختار نسخه پشتیبان معتبر برنامه حسابداری موهان را ندارد.', 'error');
          return;
        }
        setInspectModalData(parsed);
      } catch (err: any) {
        showToast('فایل بارگذاری‌شده یک JSON معتبر نیست: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Confirm and execute restore
  const handleConfirmRestore = async () => {
    if (!inspectModalData) return;
    setIsRestoring(true);
    try {
      const ok = await restoreBackup(inspectModalData);
      if (ok) {
        showToast('پایگاه داده برنامه حسابداری موهان با موفقیت به نسخه پشتیبان بازگردانی شد.', 'success');
        setInspectModalData(null);
      }
    } catch (err: any) {
      showToast('خطا در بازیابی داده‌ها: ' + err.message, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border-amber-500/25">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25 shadow-xs">
              <HardDriveDownload className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              پشتیبان‌گیری و بازیابی پایگاه داده موهان
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            تهیه خروجی کامل از کلیه فاکتورها، کالاها، انبار، گردش حساب‌ها و تنظیمات با فرمت استاندارد JSON و امکان بازگردانی سریع
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>پایگاه داده در امنیت کامل</span>
          </span>
        </div>
      </div>

      {/* Live System Data Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
          <Package className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <span className="text-xs text-slate-400">کالاها و قطعات</span>
          <div className="text-base font-black text-slate-900 dark:text-white">{toPersianDigits(parts.length)}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
          <FileText className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <span className="text-xs text-slate-400">اسناد و فاکتورها</span>
          <div className="text-base font-black text-slate-900 dark:text-white">{toPersianDigits(invoices.length)}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
          <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <span className="text-xs text-slate-400">مشتریان و حساب‌ها</span>
          <div className="text-base font-black text-slate-900 dark:text-white">{toPersianDigits(customers.length)}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
          <CheckSquare className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <span className="text-xs text-slate-400">چک‌ها و اسناد بانکی</span>
          <div className="text-base font-black text-slate-900 dark:text-white">{toPersianDigits(checks.length)}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
          <Database className="w-5 h-5 text-teal-500 mx-auto mb-1" />
          <span className="text-xs text-slate-400">دسته‌بندی‌ها</span>
          <div className="text-base font-black text-slate-900 dark:text-white">{toPersianDigits(categories.length)}</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
          <Clock className="w-5 h-5 text-rose-500 mx-auto mb-1" />
          <span className="text-xs text-slate-400">تاریخ امروز</span>
          <div className="text-xs font-black text-slate-900 dark:text-white">{getTodayJalali()}</div>
        </div>
      </div>

      {/* Main 2 Cards: Backup & Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Backup Card */}
        <div className="p-6 rounded-3xl glass-panel space-y-5 flex flex-col justify-between border-emerald-500/20">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  تهیه و دانلود نسخه پشتیبان (خروجی کامل)
                </h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  شامل ۱۰۰٪ اطلاعات ثبت‌شده و تصاویر
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              با کلیک روی دکمه زیر، فایل فشرده داده‌های سامانه در فرمت استاندارد JSON تولید شده و بلافاصله بر روی رایانه یا تلفن همراه شما ذخیره می‌شود. پیشنهاد می‌شود به صورت هفتگی نسخه پشتیبان تهیه فرمایید.
            </p>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span>اقلام آماده خروجی:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-emerald-700 dark:text-emerald-400 space-y-0.5">
                <li>{toPersianDigits(parts.length)} ردیف کالای انبار</li>
                <li>{toPersianDigits(invoices.length)} فاکتور فروش و پیش‌فاکتور</li>
                <li>دفاتر حساب مشتریان و تأمین‌کنندگان</li>
                <li>تنظیمات فروشگاه و حساب‌های مالی</li>
              </ul>
            </div>
          </div>

          <RippleButton
            variant="emerald"
            onClick={handleDownloadBackup}
            className="w-full py-3.5 text-xs font-black shadow-lg"
            glow
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>دانلود فوری فایل پشتیبان (.json)</span>
          </RippleButton>
        </div>

        {/* Restore Backup Card */}
        <div className="p-6 rounded-3xl glass-panel space-y-5 flex flex-col justify-between border-amber-500/20">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-center shadow-lg">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  بازیابی اطلاعات از فایل پشتیبان
                </h3>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  همراه با پیش‌نمایش و بررسی سلامت فایل
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              فایل پشتیبان JSON را که قبلاً از سیستم دریافت کرده‌اید انتخاب فرمایید. سیستم ابتدا محتوای فایل را بازبینی و پیش‌نمایش آن را به شما نشان خواهد داد، سپس در صورت تأیید شما اطلاعات بازگردانی می‌شود.
            </p>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>نکته امنیتی:</strong> بازیابی نسخه پشتیبان کلیه اطلاعات فعلی پایگاه داده را با داده‌های مندرج در فایل جایگزین خواهد کرد.
              </span>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <RippleButton
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className="w-full py-3.5 text-xs font-black shadow-lg"
            glow
          >
            <Upload className="w-4 h-4" />
            <span>{isRestoring ? 'در حال پردازش...' : 'انتخاب و بازگردانی فایل پشتیبان'}</span>
          </RippleButton>
        </div>
      </div>

      {/* Backup Inspection Confirmation Modal */}
      <AnimatePresence>
        {inspectModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectModalData(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg rounded-3xl glass-panel p-6 border border-amber-500/30 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    تأیید نهایی بازیابی پایگاه داده
                  </h3>
                </div>
                <button
                  onClick={() => setInspectModalData(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  فایل انتخابی مورد بررسی قرار گرفت. اطلاعات مندرج در این نسخه پشتیبان به شرح زیر است:
                </p>

                <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block">فروشگاه:</span>
                    <strong className="text-slate-800 dark:text-white">{inspectModalData.storeName || inspectModalData.settings?.storeName || 'موهان'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">تاریخ خروجی:</span>
                    <strong className="text-slate-800 dark:text-white">{inspectModalData.jalaliDate || 'نامشخص'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">تعداد کالاها:</span>
                    <strong className="text-amber-500 font-black">{toPersianDigits(inspectModalData.parts?.length || 0)} قلم</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">تعداد فاکتورها:</span>
                    <strong className="text-emerald-500 font-black">{toPersianDigits(inspectModalData.invoices?.length || 0)} سند</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px]">
                  <strong>هشدار:</strong> با کلیک روی دکمه تأیید، داده‌های فعلی با این اطلاعات جایگزین خواهند شد.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setInspectModalData(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  انصراف
                </button>

                <RippleButton
                  variant="primary"
                  onClick={handleConfirmRestore}
                  disabled={isRestoring}
                  className="px-6 py-2.5 text-xs font-black"
                  glow
                >
                  <span>{isRestoring ? 'در حال بازیابی اطلاعات...' : 'تأیید و اجرای بازیابی'}</span>
                </RippleButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
