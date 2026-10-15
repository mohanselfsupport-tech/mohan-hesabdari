import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';
import { RippleButton } from '../common/RippleButton';
import { SalesInvoice } from '../../types';
import {
  FileText,
  Search,
  Printer,
  Trash2,
  Eye,
  Plus,
  Sparkles,
  CheckCircle,
  X,
  AlertTriangle,
  Edit2,
  User,
  Calendar,
  DollarSign,
  Package,
  Clock,
} from 'lucide-react';
import {
  toPersianDigits,
  formatPersianCurrency,
  formatPersianDate,
} from '../../utils/formatters';

export const InvoiceListView: React.FC = () => {
  const {
    invoices,
    settings,
    setCurrentView,
    deleteSalesInvoice,
    setDraftInvoice,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SALE' | 'PROFORMA'>('ALL');

  // Modals
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<SalesInvoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<SalesInvoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || inv.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Handle Edit: loads items into SalesInvoiceView
  const handleEditInSalesInvoice = (inv: SalesInvoice) => {
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
    showToast(`اطلاعات فاکتور شماره ${inv.invoiceNumber} جهت ویرایش به صفحه صدور فاکتور منتقل شد.`, 'info');
    setCurrentView('sales_invoice');
  };

  // Confirm delete invoice
  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    const ok = await deleteSalesInvoice(invoiceToDelete.id);
    setIsDeleting(false);
    if (ok) {
      setInvoiceToDelete(null);
      if (selectedInvoiceForView?.id === invoiceToDelete.id) {
        setSelectedInvoiceForView(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              فهرست فاکتورهای فروش و پیش‌فاکتورها
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مشاهده، ویرایش، حذف یا چاپ فاکتورهای ثبت‌شده و اسناد استخراج‌شده با هوش مصنوعی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('ai_assistant')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-xs transition"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>استخراج فاکتور با هوش مصنوعی</span>
          </button>

          <button
            onClick={() => setCurrentView('invoice_history')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>تاریخچه فاکتورها</span>
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

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی شماره فاکتور یا نام خریدار..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              typeFilter === 'ALL' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-500'
            }`}
          >
            همه اسناد ({toPersianDigits(invoices.length)})
          </button>
          <button
            onClick={() => setTypeFilter('SALE')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              typeFilter === 'SALE' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-500'
            }`}
          >
            فاکتورهای فروش ({toPersianDigits(invoices.filter((i) => i.type === 'SALE').length)})
          </button>
          <button
            onClick={() => setTypeFilter('PROFORMA')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              typeFilter === 'PROFORMA' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-500'
            }`}
          >
            پیش‌فاکتورها ({toPersianDigits(invoices.filter((i) => i.type === 'PROFORMA').length)})
          </button>
        </div>
      </div>

      {/* Invoices List Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="فاکتوری در این بخش یافت نشد"
          description="می‌توانید با استفاده از فرم صدور فاکتور یا استخراج هوشمند توسط هوش مصنوعی، فاکتورهای جدید ثبت نمایید."
          actionLabel="صدور فاکتور جدید"
          actionIcon={Plus}
          onAction={() => setCurrentView('sales_invoice')}
          className="my-8"
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
              <tr>
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3">شماره فاکتور</th>
                <th className="p-3">نوع سند</th>
                <th className="p-3">نام خریدار</th>
                <th className="p-3">تعداد اقلام</th>
                <th className="p-3">تاریخ صدور</th>
                <th className="p-3 text-left">مبلغ کل فاکتور</th>
                <th className="p-3 text-left">مانده بدهی</th>
                <th className="p-3 text-center">وضعیت تسویه</th>
                <th className="p-3 text-center w-28">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((inv, idx) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="p-3 text-center font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                  <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                    {toPersianDigits(inv.invoiceNumber)}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.type === 'SALE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    }`}>
                      {inv.type === 'SALE' ? 'فروش قطعی' : 'پیش‌فاکتور'}
                    </span>
                  </td>
                  <td className="p-3 font-bold">{inv.customerName}</td>
                  <td className="p-3 font-mono text-slate-500">
                    {toPersianDigits(inv.items?.length || 0)} ردیف
                  </td>
                  <td className="p-3 text-slate-500">{formatPersianDate(inv.createdAt)}</td>
                  <td className="p-3 text-left font-mono font-bold text-slate-900 dark:text-white">
                    {formatPersianCurrency(inv.grandTotal, settings.currency)}
                  </td>
                  <td className="p-3 text-left font-mono font-bold">
                    {inv.remainingAmount > 0 ? (
                      <span className="text-rose-600">{formatPersianCurrency(inv.remainingAmount, settings.currency)}</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">تسویه کامل</span>
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
                      {/* View details */}
                      <button
                        onClick={() => setSelectedInvoiceForView(inv)}
                        title="مشاهده جزئیات و اقلام فاکتور"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit items */}
                      <button
                        onClick={() => handleEditInSalesInvoice(inv)}
                        title="ویرایش، تغییر اقلام یا چاپ در صدور فاکتور"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setInvoiceToDelete(inv)}
                        title="حذف یا ابطال فاکتور"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Details Modal */}
      <AnimatePresence>
        {selectedInvoiceForView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoiceForView(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5"
            >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    جزئیات فاکتور {toPersianDigits(selectedInvoiceForView.invoiceNumber)}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {formatPersianDate(selectedInvoiceForView.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoiceForView(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Type Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">نام خریدار:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedInvoiceForView.customerName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">نوع سند:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedInvoiceForView.type === 'SALE' ? 'فروش قطعی' : 'پیش‌فاکتور'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">نحوه پرداخت:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedInvoiceForView.paymentMethod === 'CASH' && 'نقدی'}
                  {selectedInvoiceForView.paymentMethod === 'CARD' && 'کارتخوان'}
                  {selectedInvoiceForView.paymentMethod === 'CREDIT' && 'نسیه / اعتباری'}
                  {selectedInvoiceForView.paymentMethod === 'TRANSFER' && 'حواله'}
                  {selectedInvoiceForView.paymentMethod === 'CHECK' && 'چک'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">وضعیت:</span>
                <span className="font-bold text-emerald-600">
                  {selectedInvoiceForView.status === 'COMPLETED' ? 'ثبت نهایی' : 'پیش‌نویس'}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-500" />
                <span>اقلام و کالاهای فاکتور</span>
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
                    {selectedInvoiceForView.items?.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 text-center font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                        <td className="p-2.5">
                          <span className="font-bold block">{it.partName}</span>
                          {it.technicalCode && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {it.technicalCode}
                            </span>
                          )}
                        </td>
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

            {/* Totals */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>جمع کل اقلام:</span>
                <span className="font-mono font-bold">{formatPersianCurrency(selectedInvoiceForView.subtotal, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>تخفیف:</span>
                <span className="font-mono font-bold">{formatPersianCurrency(selectedInvoiceForView.discount, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>مبلغ نهایی فاکتور:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {formatPersianCurrency(selectedInvoiceForView.grandTotal, settings.currency)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setInvoiceToDelete(selectedInvoiceForView)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف این فاکتور</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleEditInSalesInvoice(selectedInvoiceForView)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>تغییر یا حذف اقلام در فاکتور</span>
                </button>
                <button
                  onClick={() => setSelectedInvoiceForView(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                >
                  بستن
                </button>
              </div>
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
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-bold text-base">تأیید حذف فاکتور</h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                آیا از حذف فاکتور شماره <strong className="font-mono">{invoiceToDelete.invoiceNumber}</strong> به نام <strong>{invoiceToDelete.customerName}</strong> اطمینان دارید؟
                {invoiceToDelete.type === 'SALE' && (
                  <span className="block mt-1 text-amber-600 dark:text-amber-400">
                    ⚠️ با حذف این فاکتور، اقلام خارج‌شده از انبار مجدداً به موجودی انبار بازگردانده می‌شوند.
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
                  <span>{isDeleting ? 'در حال حذف...' : 'بله، فاکتور حذف شود'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
