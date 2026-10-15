import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Award, Calendar, Printer, Package, TrendingUp } from 'lucide-react';
import {
  toPersianDigits,
  formatPersianCurrency,
} from '../../utils/formatters';

export const TopPartsReportView: React.FC = () => {
  const { invoices, parts, settings } = useApp();
  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');

  // Filter completed sales by date
  const now = new Date();
  const filteredInvoices = invoices.filter((inv) => {
    if (inv.type !== 'SALE' || inv.status !== 'COMPLETED') return false;
    const invDate = new Date(inv.createdAt);
    if (timeFilter === 'TODAY') {
      return invDate.toDateString() === now.toDateString();
    }
    if (timeFilter === 'WEEK') {
      const diffDays = (now.getTime() - invDate.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    }
    if (timeFilter === 'MONTH') {
      const diffDays = (now.getTime() - invDate.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 30;
    }
    return true;
  });

  // Aggregate sales by partId
  const partStatsMap: Record<string, { quantity: number; totalRevenue: number; profit: number }> = {};

  filteredInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const part = parts.find((p) => p.id === item.partId);
      const cost = part?.weightedAvgCost || part?.lastPurchasePrice || 0;
      const profit = (item.unitPrice - cost) * item.quantity - (item.discount || 0);

      if (!partStatsMap[item.partId]) {
        partStatsMap[item.partId] = { quantity: 0, totalRevenue: 0, profit: 0 };
      }
      partStatsMap[item.partId].quantity += item.quantity;
      partStatsMap[item.partId].totalRevenue += item.totalPrice;
      partStatsMap[item.partId].profit += Math.max(0, profit);
    });
  });

  // Sort and pick top 20
  const top20Parts = Object.entries(partStatsMap)
    .map(([partId, stat]) => {
      const part = parts.find((p) => p.id === partId);
      return {
        partId,
        name: part?.name || 'کالای نامشخص',
        technicalCode: part?.technicalCode || part?.internalCode || '-',
        categoryName: part?.categoryName || '-',
        brandName: part?.brandName || '-',
        unit: part?.unit || 'عدد',
        quantity: stat.quantity,
        totalRevenue: stat.totalRevenue,
        profit: stat.profit,
      };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 20);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              گزارش ۲۰ قطعه پرمصرف و پرفروش فروشگاه موهان
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            رتبه‌بندی دقیق قطعات بر اساس تعداد فروخته‌شده و سود حاصل در بازه‌های زمانی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setTimeFilter('TODAY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                timeFilter === 'TODAY' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              امروز
            </button>
            <button
              onClick={() => setTimeFilter('WEEK')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                timeFilter === 'WEEK' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              ۷ روز اخیر
            </button>
            <button
              onClick={() => setTimeFilter('MONTH')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                timeFilter === 'MONTH' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              ۳۰ روز اخیر
            </button>
            <button
              onClick={() => setTimeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                timeFilter === 'ALL' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              کل دوره
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش</span>
          </button>
        </div>
      </div>

      {top20Parts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs space-y-2">
          <Award className="w-10 h-10 stroke-1 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            در این بازه زمانی هیچ فروش قطعه‌ای ثبت نشده است
          </h3>
          <p className="max-w-sm mx-auto text-[11px]">
            این گزارش به شکل واقعی از فاکتورهای فروش نهایی محاسبه می‌شود و داده ساختگی ندارد.
          </p>
        </div>
      ) : (
        <div className="printable-area overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              بیست قطعه برتر پرمصرف (مرتب‌شده بر اساس تعداد فروش)
            </span>
            <span className="text-slate-500">
              واحد مبالغ: {settings.currency}
            </span>
          </div>

          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 w-14 text-center">رتبه</th>
                <th className="py-3 px-4">نام قطعه</th>
                <th className="py-3 px-4">کد فنی OEM</th>
                <th className="py-3 px-4">دسته‌بندی و برند</th>
                <th className="py-3 px-4 text-center">تعداد فروخته‌شده</th>
                <th className="py-3 px-4 text-left">مجموع فروش ({settings.currency})</th>
                <th className="py-3 px-4 text-left">سود ناخالص ({settings.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {top20Parts.map((item, idx) => (
                <tr key={item.partId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold font-mono text-xs ${
                      idx < 3
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {toPersianDigits(idx + 1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold">{item.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{item.technicalCode}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {item.categoryName} {item.brandName !== '-' ? `(${item.brandName})` : ''}
                  </td>
                  <td className="py-3 px-4 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                    {toPersianDigits(item.quantity)} {item.unit}
                  </td>
                  <td className="py-3 px-4 text-left font-mono font-bold">
                    {formatPersianCurrency(item.totalRevenue, '')}
                  </td>
                  <td className="py-3 px-4 text-left font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatPersianCurrency(item.profit, '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
