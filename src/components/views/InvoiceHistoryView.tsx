import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';
import { RippleButton } from '../common/RippleButton';
import { SalesInvoice, PurchaseInvoice } from '../../types';
import {
  FileText,
  Calendar,
  Search,
  Printer,
  Trash2,
  Eye,
  Edit2,
  FileSpreadsheet,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Filter,
  CheckCircle,
  Clock,
  X,
  Package,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Users,
} from 'lucide-react';
import {
  toPersianDigits,
  formatPersianCurrency,
  formatPersianDate,
  formatPersianDateTime,
} from '../../utils/formatters';

export const InvoiceHistoryView: React.FC = () => {
  const {
    invoices,
    purchaseInvoices,
    settings,
    setCurrentView,
    deleteSalesInvoice,
    setDraftInvoice,
    showToast,
  } = useApp();

  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'THIS_MONTH'>('ALL');
  const [docTypeFilter, setDocTypeFilter] = useState<'ALL' | 'SALE' | 'PROFORMA' | 'PURCHASE' | 'UNPAID'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseInvoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<SalesInvoice | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Helper date filter
  const isDateInRange = (dateStr: string): boolean => {
    if (dateRange === 'ALL') return true;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (dateRange === 'TODAY') {
      return diffDays <= 1 && date.getDate() === now.getDate();
    }
    if (dateRange === '7DAYS') {
      return diffDays <= 7;
    }
    if (dateRange === '30DAYS') {
      return diffDays <= 30;
    }
    if (dateRange === 'THIS_MONTH') {
      return diffDays <= 31;
    }
    return true;
  };

  // Filter Sales & Proforma Invoices
  const filteredSalesInvoices = invoices.filter((inv) => {
    if (!isDateInRange(inv.createdAt)) return false;

    if (docTypeFilter === 'PURCHASE') return false;
    if (docTypeFilter === 'SALE' && inv.type !== 'SALE') return false;
    if (docTypeFilter === 'PROFORMA' && inv.type !== 'PROFORMA') return false;
    if (docTypeFilter === 'UNPAID' && inv.remainingAmount <= 0) return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const matchesNum = inv.invoiceNumber.toLowerCase().includes(q);
    const matchesCust = inv.customerName.toLowerCase().includes(q);
    const matchesPhone = inv.customerPhone?.includes(q);
    const matchesItem = inv.items?.some((it) => it.partName.toLowerCase().includes(q));

    return matchesNum || matchesCust || matchesPhone || matchesItem;
  });

  // Filter Purchase Invoices
  const filteredPurchases = purchaseInvoices.filter((pur) => {
    if (!isDateInRange(pur.createdAt)) return false;

    if (docTypeFilter === 'SALE' || docTypeFilter === 'PROFORMA') return false;
    if (docTypeFilter === 'UNPAID' && pur.remainingAmount <= 0) return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const matchesNum = pur.invoiceNumber.toLowerCase().includes(q);
    const matchesSupp = pur.supplierName.toLowerCase().includes(q);
    const matchesItem = pur.items?.some((it) => it.partName.toLowerCase().includes(q));

    return matchesNum || matchesSupp || matchesItem;
  });

  // Financial KPI calculations
  const totalSalesAmount = filteredSalesInvoices
    .filter((i) => i.type === 'SALE')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const totalProformaAmount = filteredSalesInvoices
    .filter((i) => i.type === 'PROFORMA')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const totalDiscounts = filteredSalesInvoices.reduce((sum, i) => sum + (i.discount || 0), 0);

  const totalUnpaidDebts = filteredSalesInvoices.reduce((sum, i) => sum + (i.remainingAmount || 0), 0);

  const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + p.grandTotal, 0);

  // Transfer to Sales Invoice editor
  const handleEditInvoice = (inv: SalesInvoice) => {
    setDraftInvoice({
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      customerAddress: inv.customerAddress,
      type: inv.type,
      paymentMethod: inv.paymentMethod,
      warehouseId: inv.warehouseId,
      discount: inv.discount,
      items: inv.items.map((it) => ({ ...it })),
    });
    showToast(`اطلاعات فاکتور ${inv.invoiceNumber} جهت ویرایش به صفحه صدور منتقل شد.`, 'info');
    setCurrentView('sales_invoice');
  };

  // Delete invoice with stock restoration
  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    const ok = await deleteSalesInvoice(invoiceToDelete.id);
    setIsDeleting(false);
    if (ok) {
      setInvoiceToDelete(null);
      if (selectedInvoice?.id === invoiceToDelete.id) {
        setSelectedInvoice(null);
      }
    }
  };

  // Export full history to Excel file
  const handleExportHistoryToExcel = () => {
    const rows: any[] = [];

    // Sales and proformas
    filteredSalesInvoices.forEach((inv, idx) => {
      rows.push({
        'ردیف': idx + 1,
        'نوع سند': inv.type === 'SALE' ? 'فروش قطعی' : 'پیش‌فاکتور',
        'شماره فاکتور': inv.invoiceNumber,
        'نام خریدار': inv.customerName,
        'تلفن خریدار': inv.customerPhone || '-',
        'تاریخ صدور': formatPersianDate(inv.createdAt),
        'تعداد اقلام': inv.items?.length || 0,
        'مبلغ ناخالص (تومان)': inv.subtotal,
        'تخفیف (تومان)': inv.discount,
        'مبلغ کل فاکتور (تومان)': inv.grandTotal,
        'مبلغ دریافتی (تومان)': inv.paidAmount,
        'مانده بدهی (تومان)': inv.remainingAmount,
        'نحوه تسویه':
          inv.paymentMethod === 'CASH' ? 'نقدی' :
          inv.paymentMethod === 'CARD' ? 'کارتخوان' :
          inv.paymentMethod === 'CREDIT' ? 'نسیه' :
          inv.paymentMethod === 'CHECK' ? 'چک' : 'حواله',
        'وضعیت': inv.remainingAmount > 0 ? 'دارای مانده' : 'تسویه کامل',
      });
    });

    if (rows.length === 0) {
      showToast('هیچ داده‌ای برای خروجی اکسل یافت نشد.', 'info');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تاریخچه فاکتورها');
    XLSX.writeFile(wb, `mohan_invoice_history_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('فایل اکسل تاریخچه فاکتورها با موفقیت دانلود شد.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
              تاریخچه جامع فاکتورها و سوابق اسناد مالی
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            آرشیو کامل فاکتورهای فروش، پیش‌فاکتورها، خریدهای انبار، فیلتر بازه زمانی و خروجی اکسل
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportHistoryToExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition shadow-xs"
            title="دانلود فایل اکسل تاریخچه فاکتورها"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>خروجی اکسل تاریخچه</span>
          </button>

          <button
            onClick={() => setCurrentView('sales_invoice')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>صدور فاکتور جدید</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>مجموع فروش قطعی</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
            {formatPersianCurrency(totalSalesAmount, settings.currency)}
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            {toPersianDigits(filteredSalesInvoices.filter((i) => i.type === 'SALE').length)} فاکتور فروش
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>مجموع پیش‌فاکتورها</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-base font-black font-mono text-blue-600 dark:text-blue-400">
            {formatPersianCurrency(totalProformaAmount, settings.currency)}
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            {toPersianDigits(filteredSalesInvoices.filter((i) => i.type === 'PROFORMA').length)} پیش‌فاکتور
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>مانده مطالبات (نسیه)</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-base font-black font-mono text-rose-600">
            {formatPersianCurrency(totalUnpaidDebts, settings.currency)}
          </div>
          <span className="text-[10px] text-slate-400 block">طلب وصول‌نشده</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>کل تخفیفات داده‌شده</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-base font-black font-mono text-slate-800 dark:text-slate-100">
            {formatPersianCurrency(totalDiscounts, settings.currency)}
          </div>
          <span className="text-[10px] text-slate-400 block">تخفیف نقدی و سطری</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>مجموع فاکتورهای خرید</span>
            <ArrowDownLeft className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-base font-black font-mono text-purple-600 dark:text-purple-400">
            {formatPersianCurrency(totalPurchasesAmount, settings.currency)}
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            {toPersianDigits(filteredPurchases.length)} فاکتور خرید
          </span>
        </div>
      </div>

      {/* Date Filter & Doc Type Tabs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Date Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
          <span className="text-slate-400 text-[11px] font-bold ml-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>بازه زمانی:</span>
          </span>
          <button
            onClick={() => setDateRange('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              dateRange === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            همه زمان‌ها
          </button>
          <button
            onClick={() => setDateRange('TODAY')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              dateRange === 'TODAY'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            امروز
          </button>
          <button
            onClick={() => setDateRange('7DAYS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              dateRange === '7DAYS'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            ۷ روز اخیر
          </button>
          <button
            onClick={() => setDateRange('30DAYS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              dateRange === '30DAYS'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            ۳۰ روز اخیر
          </button>
          <button
            onClick={() => setDateRange('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              dateRange === 'THIS_MONTH'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            ماه جاری
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی شماره، مشتری، قطعه..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Doc Type Selector */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700 text-xs overflow-x-auto">
        <button
          onClick={() => setDocTypeFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            docTypeFilter === 'ALL' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-500'
          }`}
        >
          همه فاکتورها ({toPersianDigits(filteredSalesInvoices.length + filteredPurchases.length)})
        </button>
        <button
          onClick={() => setDocTypeFilter('SALE')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            docTypeFilter === 'SALE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
          }`}
        >
          فروش قطعی ({toPersianDigits(filteredSalesInvoices.filter((i) => i.type === 'SALE').length)})
        </button>
        <button
          onClick={() => setDocTypeFilter('PROFORMA')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            docTypeFilter === 'PROFORMA' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
          }`}
        >
          پیش‌فاکتورها ({toPersianDigits(filteredSalesInvoices.filter((i) => i.type === 'PROFORMA').length)})
        </button>
        <button
          onClick={() => setDocTypeFilter('PURCHASE')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            docTypeFilter === 'PURCHASE' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-500'
          }`}
        >
          فاکتورهای خرید ({toPersianDigits(filteredPurchases.length)})
        </button>
        <button
          onClick={() => setDocTypeFilter('UNPAID')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            docTypeFilter === 'UNPAID' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-600'
          }`}
        >
          دارای مانده بدهی / نسیه ({toPersianDigits(filteredSalesInvoices.filter((i) => i.remainingAmount > 0).length)})
        </button>
      </div>

      {/* History Invoices Table */}
      {filteredSalesInvoices.length === 0 && (docTypeFilter !== 'PURCHASE' && filteredPurchases.length === 0) ? (
        <EmptyState
          icon={Clock}
          title="هیچ فاکتوری در این بازه زمانی یا فیلتر یافت نشد"
          description="فیلتر بازه زمانی را تغییر دهید یا فاکتور جدید صادر فرمایید."
          actionLabel="صدور فاکتور جدید"
          actionIcon={Plus}
          onAction={() => setCurrentView('sales_invoice')}
          className="my-8"
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px]">
              <tr>
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 w-28">شماره فاکتور</th>
                <th className="p-3 w-24">نوع سند</th>
                <th className="p-3">نام طرف حساب</th>
                <th className="p-3 w-32">تاریخ و ساعت</th>
                <th className="p-3">خلاصه اقلام</th>
                <th className="p-3 text-left w-32">مبلغ کل فاکتور</th>
                <th className="p-3 text-left w-28">مانده بدهی</th>
                <th className="p-3 text-center w-24">نحوه تسویه</th>
                <th className="p-3 text-center w-24">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Sales and Proformas */}
              {filteredSalesInvoices.map((inv, idx) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="p-3 text-center font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                  <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                    {toPersianDigits(inv.invoiceNumber)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.type === 'SALE'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}
                    >
                      {inv.type === 'SALE' ? 'فروش قطعی' : 'پیش‌فاکتور'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold block">{inv.customerName}</span>
                    {inv.customerPhone && (
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {toPersianDigits(inv.customerPhone)}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500 font-mono text-[11px]">
                    {formatPersianDate(inv.createdAt)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 max-w-xs truncate text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-amber-600 font-mono">
                        {toPersianDigits(inv.items?.length || 0)} قلم:
                      </span>
                      <span className="truncate">
                        {inv.items?.map((it) => it.partName).join('، ')}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-left font-mono font-bold text-slate-900 dark:text-white">
                    {formatPersianCurrency(inv.grandTotal, settings.currency)}
                  </td>
                  <td className="p-3 text-left font-mono font-bold">
                    {inv.remainingAmount > 0 ? (
                      <span className="text-rose-600">{formatPersianCurrency(inv.remainingAmount, settings.currency)}</span>
                    ) : (
                      <span className="text-emerald-600">تسویه کامل</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-bold text-[11px] text-slate-500">
                      {inv.paymentMethod === 'CASH' && 'نقدی'}
                      {inv.paymentMethod === 'CARD' && 'کارتخوان'}
                      {inv.paymentMethod === 'CREDIT' && 'نسیه'}
                      {inv.paymentMethod === 'TRANSFER' && 'حواله'}
                      {inv.paymentMethod === 'CHECK' && 'چک'}
                      {inv.paymentMethod === 'MIXED' && 'ترکیبی'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        title="مشاهده جزئیات فاکتور و ریز اقلام"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditInvoice(inv)}
                        title="ویرایش اقلام یا صدور مجدد در صدور فاکتور"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setInvoiceToDelete(inv)}
                        title="ابطال یا حذف فاکتور با برگشت انبار"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Purchase Invoices if matching filter */}
              {(docTypeFilter === 'ALL' || docTypeFilter === 'PURCHASE') &&
                filteredPurchases.map((pur, idx) => (
                  <tr key={pur.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 bg-purple-50/10">
                    <td className="p-3 text-center font-mono text-slate-400">
                      {toPersianDigits(filteredSalesInvoices.length + idx + 1)}
                    </td>
                    <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {toPersianDigits(pur.invoiceNumber)}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                        فاکتور خرید
                      </span>
                    </td>
                    <td className="p-3 font-bold">{pur.supplierName}</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {formatPersianDate(pur.createdAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 max-w-xs truncate text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-purple-600 font-mono">
                          {toPersianDigits(pur.items?.length || 0)} قلم:
                        </span>
                        <span className="truncate">
                          {pur.items?.map((it) => it.partName).join('، ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-purple-700 dark:text-purple-300">
                      {formatPersianCurrency(pur.grandTotal, settings.currency)}
                    </td>
                    <td className="p-3 text-left font-mono font-bold">
                      {pur.remainingAmount > 0 ? (
                        <span className="text-rose-600">{formatPersianCurrency(pur.remainingAmount, settings.currency)}</span>
                      ) : (
                        <span className="text-emerald-600">تسویه کامل</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-[11px] text-slate-500">حواله / نقدی</span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedPurchase(pur)}
                        title="مشاهده جزئیات خرید"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoice(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5"
            >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    فاکتور شماره {toPersianDigits(selectedInvoice.invoiceNumber)}
                  </h3>
                  <span className="text-xs text-slate-400">
                    تاریخ صدور: {formatPersianDate(selectedInvoice.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Type Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">نام خریدار:</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedInvoice.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">نوع سند:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedInvoice.type === 'SALE' ? 'فروش قطعی' : 'پیش‌فاکتور'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">روش تسویه:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedInvoice.paymentMethod === 'CASH' && 'نقدی'}
                  {selectedInvoice.paymentMethod === 'CARD' && 'کارتخوان'}
                  {selectedInvoice.paymentMethod === 'CREDIT' && 'نسیه'}
                  {selectedInvoice.paymentMethod === 'TRANSFER' && 'حواله'}
                  {selectedInvoice.paymentMethod === 'CHECK' && 'چک'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">وضعیت پرداخت:</span>
                <span className="font-bold text-emerald-600">
                  {selectedInvoice.remainingAmount > 0 ? 'دارای مانده' : 'تسویه کامل'}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-500" />
                <span>اقلام فاکتور ({toPersianDigits(selectedInvoice.items?.length || 0)} قلم)</span>
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 text-[11px]">
                    <tr>
                      <th className="p-2.5 w-8 text-center">#</th>
                      <th className="p-2.5">نام قطعه</th>
                      <th className="p-2.5 w-16 text-center">تعداد</th>
                      <th className="p-2.5 w-28 text-left">قیمت واحد</th>
                      <th className="p-2.5 w-24 text-left">تخفیف</th>
                      <th className="p-2.5 w-28 text-left">جمع سطر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedInvoice.items?.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 text-center font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                        <td className="p-2.5 font-bold">{it.partName}</td>
                        <td className="p-2.5 text-center font-mono">{toPersianDigits(it.quantity)}</td>
                        <td className="p-2.5 text-left font-mono">
                          {formatPersianCurrency(it.unitPrice, settings.currency)}
                        </td>
                        <td className="p-2.5 text-left font-mono text-rose-500">
                          {formatPersianCurrency(it.discount, settings.currency)}
                        </td>
                        <td className="p-2.5 text-left font-mono font-bold text-emerald-600">
                          {formatPersianCurrency(it.totalPrice, settings.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Totals */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>مجموع اقلام:</span>
                <span className="font-mono font-bold">{formatPersianCurrency(selectedInvoice.subtotal, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>تخفیف کل:</span>
                <span className="font-mono font-bold">{formatPersianCurrency(selectedInvoice.discount, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {formatPersianCurrency(selectedInvoice.grandTotal, settings.currency)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setInvoiceToDelete(selectedInvoice)}
                className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ابطال و حذف فاکتور</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditInvoice(selectedInvoice)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>تغییر یا حذف اقلام</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                >
                  بستن
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPurchase(null)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-purple-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    فاکتور خرید شماره {toPersianDigits(selectedPurchase.invoiceNumber)}
                  </h3>
                  <span className="text-xs text-slate-400">
                    تأمین‌کننده: {selectedPurchase.supplierName} · {formatPersianDate(selectedPurchase.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                اقلام خریداری‌شده ({toPersianDigits(selectedPurchase.items?.length || 0)} قلم):
              </span>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 text-[11px]">
                    <tr>
                      <th className="p-2.5 text-center w-8">#</th>
                      <th className="p-2.5">نام قطعه</th>
                      <th className="p-2.5 text-center">تعداد ورود</th>
                      <th className="p-2.5 text-left">قیمت خرید</th>
                      <th className="p-2.5 text-left">جمع ردیف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedPurchase.items?.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 text-center font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                        <td className="p-2.5 font-bold">{it.partName}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{toPersianDigits(it.quantity)}</td>
                        <td className="p-2.5 text-left font-mono">
                          {formatPersianCurrency(it.unitPrice, settings.currency)}
                        </td>
                        <td className="p-2.5 text-left font-mono font-bold text-purple-600 dark:text-purple-400">
                          {formatPersianCurrency(it.totalPrice, settings.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 flex justify-between text-base font-black text-slate-900 dark:text-white">
              <span>مبلغ کل فاکتور خرید:</span>
              <span className="font-mono text-purple-600 dark:text-purple-400">
                {formatPersianCurrency(selectedPurchase.grandTotal, settings.currency)}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                بستن
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInvoiceToDelete(null)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base">تأیید حذف فاکتور از تاریخچه</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا از ابطال و حذف فاکتور شماره <strong className="font-mono">{invoiceToDelete.invoiceNumber}</strong> اطمینان دارید؟
              {invoiceToDelete.type === 'SALE' && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-semibold">
                  ⚠️ با حذف این فاکتور، تمام اقلام کسرشده به موجودی انبار بازگردانده می‌شوند.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'در حال حذف...' : 'تأیید ابطال فاکتور'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </div>
  );
};
