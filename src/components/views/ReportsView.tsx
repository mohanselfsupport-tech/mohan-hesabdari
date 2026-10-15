import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, Download, Printer, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toPersianDigits, formatPersianCurrency, getTodayJalali } from '../../utils/formatters';

export const ReportsView: React.FC = () => {
  const { invoices, purchaseInvoices, expenses, parts, customers, suppliers, settings } = useApp();

  const completedSales = invoices.filter((i) => i.type === 'SALE' && i.status === 'COMPLETED');
  const totalSalesRevenue = completedSales.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const totalPurchasesCost = purchaseInvoices.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
  const totalExpensesCost = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Gross profit
  let totalGrossProfit = 0;
  completedSales.forEach((inv) => {
    inv.items.forEach((item) => {
      const part = parts.find((p) => p.id === item.partId);
      const cost = part?.weightedAvgCost || part?.lastPurchasePrice || 0;
      const profit = (item.unitPrice - cost) * item.quantity - (item.discount || 0);
      totalGrossProfit += Math.max(0, profit);
    });
  });

  const netProfit = totalGrossProfit - totalExpensesCost;

  // Receivables & Payables
  const totalReceivables = customers
    .filter((c) => (c.balance || 0) < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  const totalPayables = suppliers
    .filter((s) => (s.balance || 0) > 0)
    .reduce((sum, s) => sum + s.balance, 0);

  const totalInventoryValue = parts.reduce((sum, p) => {
    const cost = p.weightedAvgCost || p.lastPurchasePrice || 0;
    return sum + (p.currentStock || 0) * cost;
  }, 0);

  const handleExportCSV = () => {
    const csvRows = [
      ['ردیف', 'عنوان شاخص مالی', 'مقدار (تومان)'],
      ['1', 'مجموع فروش کل دوره', totalSalesRevenue.toString()],
      ['2', 'سود ناخالص فروش', totalGrossProfit.toString()],
      ['3', 'مجموع هزینه‌های جاری', totalExpensesCost.toString()],
      ['4', 'سود خالص عملکرد', netProfit.toString()],
      ['5', 'مجموع خرید کالا', totalPurchasesCost.toString()],
      ['6', 'ارزش کل موجودی انبار', totalInventoryValue.toString()],
      ['7', 'مطالبات از مشتریان', totalReceivables.toString()],
      ['8', 'بدهی به تأمین‌کنندگان', totalPayables.toString()],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mohan-financial-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              گزارش جامع تراز مالی و سود و زیان موهان
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            محاسبه سود ناخالص و خالص بر مبنای بهای تمام‌شده موزون و کسر هزینه‌های عملیاتی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>خروجی فایل اکسل / CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش</span>
          </button>
        </div>
      </div>

      {/* Main Profit KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-500">فروش کل قطعات</span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {formatPersianCurrency(totalSalesRevenue, settings.currency)}
          </div>
          <span className="text-[11px] text-slate-400 block">{toPersianDigits(completedSales.length)} فاکتور نهایی</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-500">سود ناخالص فروش</span>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {formatPersianCurrency(totalGrossProfit, settings.currency)}
          </div>
          <span className="text-[11px] text-slate-400 block">فروش منهای بهای تمام‌شده</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-500">مجموع هزینه‌های جاری</span>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {formatPersianCurrency(totalExpensesCost, settings.currency)}
          </div>
          <span className="text-[11px] text-slate-400 block">{toPersianDigits(expenses.length)} فقره هزینه ثبت‌شده</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-500">سود خالص نهایی عملکرد</span>
          <div className={`text-xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatPersianCurrency(netProfit, settings.currency)}
          </div>
          <span className="text-[11px] text-slate-400 block">سود ناخالص منهای کل مخارج</span>
        </div>
      </div>

      {/* Balance Sheet Summary Table */}
      <div className="printable-area p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
          تراز دارایی‌ها، مطالبات و تعهدات فروشگاه موهان
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Assets */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
            <h4 className="font-bold text-emerald-600 dark:text-emerald-400 pb-2 border-b">
              دارایی‌ها و مطالبات (مثبت)
            </h4>
            <div className="flex justify-between">
              <span>ارزش موجودی کالای انبار:</span>
              <span className="font-bold font-mono">{formatPersianCurrency(totalInventoryValue, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>مطالبات از مشتریان (نسیه):</span>
              <span className="font-bold font-mono">{formatPersianCurrency(totalReceivables, settings.currency)}</span>
            </div>
            <div className="pt-2 border-t flex justify-between font-black text-slate-900 dark:text-white">
              <span>جمع دارایی و مطالبات:</span>
              <span>{formatPersianCurrency(totalInventoryValue + totalReceivables, settings.currency)}</span>
            </div>
          </div>

          {/* Liabilities */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
            <h4 className="font-bold text-rose-600 dark:text-rose-400 pb-2 border-b">
              تعهدات و بدهی‌ها (منفی)
            </h4>
            <div className="flex justify-between">
              <span>بدهی به شرکت‌های تأمین‌کننده:</span>
              <span className="font-bold font-mono">{formatPersianCurrency(totalPayables, settings.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>کل هزینه‌های جاری ثبت‌شده:</span>
              <span className="font-bold font-mono">{formatPersianCurrency(totalExpensesCost, settings.currency)}</span>
            </div>
            <div className="pt-2 border-t flex justify-between font-black text-rose-600">
              <span>جمع بدهی و تعهدات:</span>
              <span>{formatPersianCurrency(totalPayables + totalExpensesCost, settings.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
