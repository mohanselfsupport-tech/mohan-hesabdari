import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InvoiceItem } from '../../types';
import { ShoppingBag, Plus, Trash2, Search, CheckCircle, Truck } from 'lucide-react';
import {
  toPersianDigits,
  formatPersianCurrency,
  formatPersianDate,
  generateInvoiceCode,
} from '../../utils/formatters';

export const PurchasesView: React.FC = () => {
  const {
    parts,
    suppliers,
    purchaseInvoices,
    settings,
    createPurchaseInvoice,
    showToast,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSupplierSelect = (id: string) => {
    setSupplierId(id);
    const sup = suppliers.find((s) => s.id === id);
    setSupplierName(sup?.name || '');
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const matches = parts.filter(
      (p) =>
        p.name.includes(q) ||
        (p.technicalCode && p.technicalCode.includes(q)) ||
        p.internalCode.includes(q)
    );
    setSearchResults(matches.slice(0, 6));
  };

  const addItem = (part: any) => {
    const existingIndex = items.findIndex((i) => i.partId === part.id);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice =
        updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setItems(updated);
    } else {
      const newItem: InvoiceItem = {
        partId: part.id,
        partName: part.name,
        technicalCode: part.technicalCode || part.internalCode,
        quantity: 1,
        unitPrice: part.lastPurchasePrice || 0,
        discount: 0,
        totalPrice: part.lastPurchasePrice || 0,
      };
      setItems([...items, newItem]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, val: number) => {
    const updated = [...items];
    const row = { ...updated[index], [field]: val };
    row.totalPrice = row.quantity * row.unitPrice - (row.discount || 0);
    updated[index] = row;
    setItems(updated);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const grandTotal = Math.max(0, subtotal + Number(shippingCost) - Number(discount));
  const remainingAmount = Math.max(0, grandTotal - Number(paidAmount));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('لطفاً حداقل یک قلم کالا اضافه نمایید.', 'error');
      return;
    }
    if (!supplierName.trim()) {
      showToast('نام تأمین‌کننده را مشخص کنید.', 'error');
      return;
    }

    const invoiceNumber = `PUR-${Date.now().toString().slice(-6)}`;
    const payload = {
      invoiceNumber,
      supplierId: supplierId || undefined,
      supplierName,
      warehouseId: 'wh-1',
      items,
      subtotal,
      shippingCost: Number(shippingCost),
      discount: Number(discount),
      grandTotal,
      paidAmount: Number(paidAmount),
      remainingAmount,
      notes: notes.trim() || undefined,
    };

    const res = await createPurchaseInvoice(payload);
    if (res.success) {
      setIsModalOpen(false);
      setItems([]);
      setPaidAmount(0);
      setShippingCost(0);
      setDiscount(0);
      setNotes('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              خرید کالا، فاکتورهای ورود و انبار
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ثبت فاکتورهای خرید، افزایش خودکار موجودی انبار و به‌روزرسانی بهای تمام‌شده موزون
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت فاکتور خرید جدید</span>
        </button>
      </div>

      {/* List of Purchases */}
      {purchaseInvoices.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs space-y-2">
          <Truck className="w-10 h-10 stroke-1 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            هنوز فاکتور خریدی ثبت نشده است
          </h3>
          <p className="max-w-sm mx-auto text-[11px]">
            با ثبت خرید جدید، موجودی اقلام در انبار به طور خودکار افزایش می‌یابد.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت اولین خرید</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">شماره فاکتور</th>
                <th className="py-3 px-4">تأمین‌کننده</th>
                <th className="py-3 px-4">تاریخ ثبت</th>
                <th className="py-3 px-4 text-center">تعداد اقلام</th>
                <th className="py-3 px-4 text-left">مبلغ کل خرید</th>
                <th className="py-3 px-4 text-left">پرداخت‌شده</th>
                <th className="py-3 px-4 text-left">مانده بدهی به تأمین‌کننده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {purchaseInvoices.map((pi, idx) => (
                <tr key={pi.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-center font-mono text-slate-400">
                    {toPersianDigits(idx + 1)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">{toPersianDigits(pi.invoiceNumber)}</td>
                  <td className="py-3 px-4 font-bold">{pi.supplierName}</td>
                  <td className="py-3 px-4 text-slate-500">{formatPersianDate(pi.createdAt)}</td>
                  <td className="py-3 px-4 text-center font-mono">{toPersianDigits(pi.items.length)} قلم</td>
                  <td className="py-3 px-4 text-left font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatPersianCurrency(pi.grandTotal, settings.currency)}
                  </td>
                  <td className="py-3 px-4 text-left font-mono text-emerald-600 dark:text-emerald-400">
                    {formatPersianCurrency(pi.paidAmount, settings.currency)}
                  </td>
                  <td className="py-3 px-4 text-left font-mono font-bold text-rose-600 dark:text-rose-400">
                    {formatPersianCurrency(pi.remainingAmount, settings.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-8 text-xs">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              ثبت فاکتور خرید و ورود کالا به انبار
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    انتخاب تأمین‌کننده
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => handleSupplierSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">تأمین‌کننده جدید یا متفرقه</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.companyName ? `(${s.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام تأمین‌کننده / شرکت *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="مثال: بازرگانی قطعات پارس"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Part Search inside purchase */}
              <div className="space-y-2 relative">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  جستجو و افزودن قطعات خریداری‌شده
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="نام قطعه یا کد فنی..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute right-0 left-0 top-16 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {searchResults.map((part) => (
                      <div
                        key={part.id}
                        onClick={() => addItem(part)}
                        className="p-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer flex justify-between"
                      >
                        <span className="font-bold">{part.name}</span>
                        <span className="font-mono text-slate-500">{part.technicalCode}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                    <tr>
                      <th className="p-2">نام قطعه</th>
                      <th className="p-2 w-20 text-center">تعداد</th>
                      <th className="p-2 w-32 text-left">قیمت خرید واحد</th>
                      <th className="p-2 w-32 text-left">جمع</th>
                      <th className="p-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold">{it.partName}</td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                            className="w-16 p-1 text-center font-mono rounded bg-slate-100 dark:bg-slate-800"
                          />
                        </td>
                        <td className="p-2 text-left">
                          <input
                            type="number"
                            value={it.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                            className="w-28 p-1 text-left font-mono rounded bg-slate-100 dark:bg-slate-800"
                          />
                        </td>
                        <td className="p-2 text-left font-bold font-mono">
                          {formatPersianCurrency(it.totalPrice, settings.currency)}
                        </td>
                        <td className="p-2 text-center">
                          <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-rose-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Shipping, Discount & Paid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">هزینه حمل و انبارداری</label>
                  <input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">تخفیف تأمین‌کننده</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">مبلغ پرداختی (نقدی/بانک)</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex justify-between items-center font-bold">
                <span>مبلغ نهایی فاکتور خرید:</span>
                <span className="text-base text-amber-600 dark:text-amber-400 font-mono">
                  {formatPersianCurrency(grandTotal, settings.currency)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs"
                >
                  ثبت فاکتور خرید و افزایش موجودی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
