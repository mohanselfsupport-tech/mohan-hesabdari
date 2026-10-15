import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Brand } from '../../types';
import { Tag, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, Package } from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

export const BrandsView: React.FC = () => {
  const { brands, parts, createOrUpdateEntity, deleteEntity } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Partial<Brand> | null>(null);

  const [name, setName] = useState('');
  const [country, setCountry] = useState('ایران');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const filtered = brands.filter((b) => b.name.includes(searchTerm) || (b.country && b.country.includes(searchTerm)));

  const openAddModal = () => {
    setEditingBrand(null);
    setName('');
    setCountry('ایران');
    setDescription('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Brand) => {
    setEditingBrand(b);
    setName(b.name);
    setCountry(b.country || 'ایران');
    setDescription(b.description || '');
    setIsActive(b.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: Partial<Brand> = {
      id: editingBrand?.id,
      name: name.trim(),
      country: country.trim() || undefined,
      description: description.trim() || undefined,
      isActive,
    };

    const success = await createOrUpdateEntity('brands', payload);
    if (success) setIsModalOpen(false);
  };

  const handleDelete = async (id: string, brandName: string) => {
    const hasParts = parts.some((p) => p.brandId === id);
    if (hasParts) {
      alert(`برند "${brandName}" به چند کالا متصل است و قابل حذف نیست. می‌توانید وضعیت آن را غیرفعال کنید.`);
      return;
    }
    if (confirm(`آیا از حذف برند "${brandName}" اطمینان دارید؟`)) {
      await deleteEntity('brands', id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              مدیریت برندها و سازندگان قطعات
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تعریف برندهای معتبر قطعات یدکی داخلی و خارجی (ایساکو، سایپا یدک، بوش، والئو، کروز، عظام و ...)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن برند جدید</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی برند یا کشور سازنده..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500 text-slate-800 dark:text-white"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          تعداد: <span className="font-bold text-amber-600 dark:text-amber-400">{toPersianDigits(filtered.length)}</span> برند
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <Tag className="w-10 h-10 stroke-1 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            هنوز برندی ثبت نشده است
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            برای ثبت نام‌های تجاری و تولیدکنندگان قطعات، بر روی دکمه افزودن برند کلیک کنید.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن اولین برند</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((b) => {
            const count = parts.filter((p) => p.brandId === b.id).length;
            return (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {b.name}
                    </h3>
                    {b.isActive ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> فعال
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                        <XCircle className="w-3 h-3" /> غیرفعال
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    کشور: {b.country || 'نامشخص'}
                  </span>
                  {b.description && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                      {b.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Package className="w-3.5 h-3.5" />
                    <span>{toPersianDigits(count)} کالا</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {editingBrand ? 'ویرایش اطلاعات برند' : 'افزودن برند جدید'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام برند / سازنده *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: کروز، عظام، والئو، بوش"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کشور مبدأ / سازنده
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="ایران، فرانسه، آلمان، چین، کره"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و نمایندگی
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مشخصات گارانتی، نوع بسته‌بندی، اصالت..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="brandActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <label htmlFor="brandActive" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                  برند فعال باشد
                </label>
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
                  className="px-4 py-2 font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs"
                >
                  ذخیره برند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
