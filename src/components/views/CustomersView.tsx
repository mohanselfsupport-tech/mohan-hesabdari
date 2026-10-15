import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { Users, Plus, Search, Edit2, Trash2, Phone, DollarSign, FileText } from 'lucide-react';
import {
  toPersianDigits,
  formatPersianCurrency,
  formatPersianDate,
} from '../../utils/formatters';

export const CustomersView: React.FC = () => {
  const { customers, invoices, settings, createOrUpdateEntity, deleteEntity } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<Customer | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [nationalCode, setNationalCode] = useState('');
  const [creditLimit, setCreditLimit] = useState(0);
  const [notes, setNotes] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.fullName.includes(searchTerm) ||
      c.phone.includes(searchTerm) ||
      (c.mobile && c.mobile.includes(searchTerm))
  );

  const totalReceivables = customers
    .filter((c) => (c.balance || 0) < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFullName('');
    setPhone('');
    setMobile('');
    setAddress('');
    setNationalCode('');
    setCreditLimit(10000000);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFullName(c.fullName);
    setPhone(c.phone);
    setMobile(c.mobile || '');
    setAddress(c.address || '');
    setNationalCode(c.nationalCode || '');
    setCreditLimit(c.creditLimit || 0);
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const payload: Partial<Customer> = {
      id: editingCustomer?.id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      mobile: mobile.trim() || undefined,
      address: address.trim() || undefined,
      nationalCode: nationalCode.trim() || undefined,
      creditLimit: Number(creditLimit) || 0,
      balance: editingCustomer ? editingCustomer.balance : 0,
      notes: notes.trim() || undefined,
    };

    const success = await createOrUpdateEntity('customers', payload);
    if (success) setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`آیا از حذف مشتری "${name}" اطمینان دارید؟`)) {
      await deleteEntity('customers', id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              مشتریان، حساب‌های دفتری و مطالبات
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            دفتر حساب مشتریان، سوابق فاکتورهای فروش و مدیریت نسیه و مانده بدهی
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت مشتری جدید</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">تعداد مشتریان ثبت‌شده</span>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {toPersianDigits(customers.length)} نفر
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">کل مطالبات بدهکاران (نسیه)</span>
          <div className="text-lg font-black text-rose-600 dark:text-rose-400">
            {formatPersianCurrency(totalReceivables, settings.currency)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">تعداد مشتریان دارای بدهی</span>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400">
            {toPersianDigits(customers.filter((c) => (c.balance || 0) < 0).length)} نفر
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی نام مشتری یا شماره تماس..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500 text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs space-y-2">
          <Users className="w-10 h-10 stroke-1 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            هنوز مشتری‌ای ثبت نشده است
          </h3>
          <p className="max-w-sm mx-auto text-[11px]">
            برای ثبت سوابق خرید و مدیریت حساب‌های دفتری، اولین مشتری خود را اضافه کنید.
          </p>
          <button
            onClick={openAddModal}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت مشتری جدید</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">نام و نام خانوادگی</th>
                <th className="py-3 px-4">شماره تماس</th>
                <th className="py-3 px-4">نشانی</th>
                <th className="py-3 px-4 text-left">مانده حساب دفتری</th>
                <th className="py-3 px-4 text-center">دفتر حساب</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filtered.map((c, idx) => {
                const isDebtor = (c.balance || 0) < 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {toPersianDigits(idx + 1)}
                    </td>
                    <td className="py-3 px-4 font-bold">{c.fullName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{toPersianDigits(c.phone || c.mobile || '-')}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{c.address || '-'}</td>
                    <td className="py-3 px-4 text-left font-mono font-bold">
                      {isDebtor ? (
                        <span className="text-rose-600 dark:text-rose-400">
                          {formatPersianCurrency(Math.abs(c.balance), settings.currency)} (بدهکار)
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">تسویه (۰ {settings.currency})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedLedgerCustomer(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition"
                      >
                        <FileText className="w-3 h-3" />
                        <span>سوابق فاکتورها</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.fullName)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {editingCustomer ? 'ویرایش مشخصات مشتری' : 'ثبت مشتری جدید'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">نام و نام خانوادگی *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: علی رضایی"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">شماره تماس ثابت</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="۰۲۱..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">شماره همراه</label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="۰۹۱۲..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">سقف اعتبار نسیه ({settings.currency})</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">نشانی و مشخصات خودرو</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="آدرس کارگاه یا مشتری، نوع خودرو..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
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
                  ذخیره مشتری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Modal for customer */}
      {selectedLedgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                دفتر حساب و سوابق: {selectedLedgerCustomer.fullName}
              </h3>
              <button
                onClick={() => setSelectedLedgerCustomer(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                بستن
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {invoices.filter((i) => i.customerId === selectedLedgerCustomer.id).length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  هنوز فاکتوری برای این مشتری صادر نشده است.
                </div>
              ) : (
                invoices
                  .filter((i) => i.customerId === selectedLedgerCustomer.id)
                  .map((inv) => (
                    <div key={inv.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold">فاکتور {toPersianDigits(inv.invoiceNumber)}</span>
                        <span className="text-[11px] text-slate-400 block">{formatPersianDate(inv.createdAt)}</span>
                      </div>
                      <div className="text-left font-mono font-bold">
                        <div>مبلغ کل: {formatPersianCurrency(inv.grandTotal, settings.currency)}</div>
                        <div className="text-red-500 text-[11px]">مانده: {formatPersianCurrency(inv.remainingAmount, settings.currency)}</div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
