import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Category } from '../../types';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Package,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

export const CategoriesView: React.FC = () => {
  const { categories, parts, createOrUpdateEntity, deleteEntity } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [order, setOrder] = useState<number>(categories.length + 1);
  const [isActive, setIsActive] = useState(true);

  const filteredCategories = categories.filter(
    (c) =>
      c.name.includes(searchTerm) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setCode(`CAT-${String(categories.length + 1).padStart(2, '0')}`);
    setOrder(categories.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setCode(cat.code);
    setOrder(cat.order || 1);
    setIsActive(cat.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: Partial<Category> = {
      id: editingCategory?.id,
      name: name.trim(),
      code: code.trim() || `CAT-${categories.length + 1}`,
      order: Number(order) || 1,
      isActive,
    };

    const success = await createOrUpdateEntity('categories', payload);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const partsCount = parts.filter((p) => p.categoryId === id).length;
    if (partsCount > 0) {
      alert(`دسته‌بندی "${name}" دارای ${toPersianDigits(partsCount)} کالا است و امکان حذف مستقیم ندارد.`);
      return;
    }
    if (confirm(`آیا از حذف دسته‌بندی "${name}" اطمینان دارید؟`)) {
      await deleteEntity('categories', id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              مدیریت ۶۷ دسته‌بندی تخصصی قطعات خودرو
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            دسته‌بندی‌های استاندارد فروشگاه لوازم یدکی (قابل ویرایش، تعریف زیردسته و فعال‌سازی)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن دسته‌بندی جدید</span>
          </button>
        </div>
      </div>

      {/* Filter and Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در دسته‌ها یا کد فنی..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500 text-slate-800 dark:text-white"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          تعداد کل: <span className="font-bold text-amber-600 dark:text-amber-400">{toPersianDigits(filteredCategories.length)}</span> دسته
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4 w-16 text-center">ردیف</th>
              <th className="py-3 px-4">عنوان دسته‌بندی</th>
              <th className="py-3 px-4 w-32">کد سیستمی</th>
              <th className="py-3 px-4 w-28 text-center">تعداد قطعات</th>
              <th className="py-3 px-4 w-24 text-center">وضعیت</th>
              <th className="py-3 px-4 w-24 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
            {filteredCategories.map((cat, idx) => {
              const count = parts.filter((p) => p.categoryId === cat.id).length;
              return (
                <tr key={cat.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-center font-mono text-slate-400">
                    {toPersianDigits(idx + 1)}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {cat.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                    {cat.code}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      count > 0 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' : 'text-slate-400'
                    }`}>
                      <Package className="w-3 h-3" />
                      {toPersianDigits(count)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {cat.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        فعال
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        غیرفعال
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        title="ویرایش دسته"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        title="حذف دسته"
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

      {/* Modal for Add / Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید قطعات'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان دسته‌بندی (فارسی) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: دیسک و صفحه کلاچ"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    کد سیستمی
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="CLT-55"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ترتیب نمایش
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="catActive" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  دسته‌بندی فعال باشد
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition"
                >
                  ذخیره اطلاعات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
