import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier } from '../../types';
import { Truck, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import {
  toPersianDigits,
  formatPersianCurrency,
} from '../../utils/formatters';

export const SuppliersView: React.FC = () => {
  const { suppliers, settings, createOrUpdateEntity, deleteEntity } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = suppliers.filter(
    (s) =>
      s.name.includes(searchTerm) ||
      (s.companyName && s.companyName.includes(searchTerm)) ||
      s.phone.includes(searchTerm)
  );

  const totalPayables = suppliers
    .filter((s) => (s.balance || 0) > 0)
    .reduce((sum, s) => sum + s.balance, 0);

  const openAddModal = () => {
    setEditingSupplier(null);
    setName('');
    setCompanyName('');
    setPhone('');
    setMobile('');
    setAddress('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setCompanyName(s.companyName || '');
    setPhone(s.phone);
    setMobile(s.mobile || '');
    setAddress(s.address || '');
    setNotes(s.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: Partial<Supplier> = {
      id: editingSupplier?.id,
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      phone: phone.trim(),
      mobile: mobile.trim() || undefined,
      address: address.trim() || undefined,
      balance: editingSupplier ? editingSupplier.balance : 0,
      notes: notes.trim() || undefined,
    };

    const success = await createOrUpdateEntity('suppliers', payload);
    if (success) setIsModalOpen(false);
  };

  const handleDelete = async (id: string, sName: string) => {
    if (confirm(`آیا از حذف تأمین‌کننده "${sName}" اطمینان دارید؟`)) {
      await deleteEntity('suppliers', id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              مدیریت تأمین‌کنندگان و شرکت‌های پخش قطعات
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            دفتر حساب فروشندگان عمده، کارخانجات تولیدی و حساب‌های پرداختنی فروشگاه
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت تأمین‌کننده جدید</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">تعداد تأمین‌کنندگان</span>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {toPersianDigits(suppliers.length)} شرکت/شخص
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">کل بدهی فروشگاه به تأمین‌کنندگان</span>
          <div className="text-lg font-black text-rose-600 dark:text-rose-400">
            {formatPersianCurrency(totalPayables, settings.currency)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی نام یا شرکت تأمین‌کننده..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500 text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs space-y-2">
          <Truck className="w-10 h-10 stroke-1 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            هنوز تأمین‌کننده‌ای ثبت نشده است
          </h3>
          <p className="max-w-sm mx-auto text-[11px]">
            برای ثبت فاکتورهای خرید عمده، اطلاعات اولین تأمین‌کننده را وارد کنید.
          </p>
          <button
            onClick={openAddModal}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت اولین تأمین‌کننده</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">نام مسئول / شرکت</th>
                <th className="py-3 px-4">شماره تماس</th>
                <th className="py-3 px-4">نشانی انبار / دفتر</th>
                <th className="py-3 px-4 text-left">مانده طلب تأمین‌کننده</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filtered.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-center font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold block">{s.name}</span>
                    {s.companyName && <span className="text-[11px] text-slate-400">{s.companyName}</span>}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{toPersianDigits(s.phone || s.mobile || '-')}</td>
                  <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{s.address || '-'}</td>
                  <td className="py-3 px-4 text-left font-mono font-bold text-rose-600 dark:text-rose-400">
                    {formatPersianCurrency(s.balance || 0, settings.currency)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {editingSupplier ? 'ویرایش تأمین‌کننده' : 'ثبت تأمین‌کننده جدید'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">نام طرف حساب / مسئول فروش *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: مهندس حسینی"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">نام شرکت / بازرگانی</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مثال: بازرگانی قطعات امید"
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">نشانی دفتر یا انبار پخش</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="تهران، خیابان چراغ برق، کوچه..."
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
                  ذخیره تأمین‌کننده
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
