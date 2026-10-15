import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Vehicle } from '../../types';
import { Car, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

export const VehiclesView: React.FC = () => {
  const { vehicles, createOrUpdateEntity, deleteEntity } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(null);

  const [manufacturer, setManufacturer] = useState('ایران خودرو');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [engineType, setEngineType] = useState('');
  const [yearRange, setYearRange] = useState('');
  const [description, setDescription] = useState('');

  const filtered = vehicles.filter(
    (v) =>
      v.manufacturer.includes(searchTerm) ||
      v.model.includes(searchTerm) ||
      (v.engineType && v.engineType.includes(searchTerm))
  );

  const openAddModal = () => {
    setEditingVehicle(null);
    setManufacturer('ایران خودرو');
    setModel('');
    setTrim('');
    setEngineType('TU5');
    setYearRange('۱۳۹۰-۱۴۰۲');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setManufacturer(v.manufacturer);
    setModel(v.model);
    setTrim(v.trim || '');
    setEngineType(v.engineType || '');
    setYearRange(v.yearRange || '');
    setDescription(v.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim()) return;

    const payload: Partial<Vehicle> = {
      id: editingVehicle?.id,
      manufacturer,
      model: model.trim(),
      trim: trim.trim() || undefined,
      engineType: engineType.trim() || undefined,
      yearRange: yearRange.trim() || undefined,
      description: description.trim() || undefined,
    };

    const success = await createOrUpdateEntity('vehicles', payload);
    if (success) setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`آیا از حذف خودروی "${name}" اطمینان دارید؟`)) {
      await deleteEntity('vehicles', id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              مدیریت خودروها و سازگاری قطعات
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تعریف مدل‌های خودرو جهت فیلتر و تطبیق دقیق قطعات یدکی با موتور و سال تولید
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن مدل خودرو</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی مدل خودرو یا نوع موتور..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500 text-slate-800 dark:text-white"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          تعداد: <span className="font-bold text-amber-600 dark:text-amber-400">{toPersianDigits(filtered.length)}</span> مدل خودرو
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <Car className="w-10 h-10 stroke-1 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            هنوز خودرویی در سیستم ثبت نشده است
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            مدل‌های خودرو را جهت اتصال به قطعات و استعلام سریع سازگاری تعریف کنید.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن اولین خودرو</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {v.manufacturer}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(v)}
                      className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id, `${v.manufacturer} ${v.model}`)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">
                  {v.model} {v.trim ? `(${v.trim})` : ''}
                </h3>

                <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {v.engineType && <div>موتور: <span className="font-mono text-slate-800 dark:text-slate-200">{v.engineType}</span></div>}
                  {v.yearRange && <div>سال تولید: <span>{toPersianDigits(v.yearRange)}</span></div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {editingVehicle ? 'ویرایش خودرو' : 'افزودن مدل خودرو جدید'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شرکت سازنده *
                </label>
                <select
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                >
                  <option value="ایران خودرو">ایران خودرو</option>
                  <option value="سایپا">سایپا</option>
                  <option value="پارس خودرو">پارس خودرو</option>
                  <option value="مدیران خودرو (ام وی ام / فونیکس)">مدیران خودرو</option>
                  <option value="کرمان موتور (جک / کی‌ام‌سی)">کرمان موتور</option>
                  <option value="بهمن موتور">بهمن موتور</option>
                  <option value="هیوندای">هیوندای</option>
                  <option value="کیا">کیا</option>
                  <option value="تویوتا">تویوتا</option>
                  <option value="رنو">رنو</option>
                  <option value="پژو">پژو</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  مدل خودرو *
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="مثال: پژو ۲۰۶، تارا، دنا پلاس، شاهین، ال۹۰"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تیپ / تیپ اتاق
                  </label>
                  <input
                    type="text"
                    value={trim}
                    onChange={(e) => setTrim(e.target.value)}
                    placeholder="تیپ ۲، تیپ ۵، اتوماتیک"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    کد موتور
                  </label>
                  <input
                    type="text"
                    value={engineType}
                    onChange={(e) => setEngineType(e.target.value)}
                    placeholder="TU5, EF7, M15"
                    className="w-full px-3 py-2 font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  سال‌های تولید
                </label>
                <input
                  type="text"
                  value={yearRange}
                  onChange={(e) => setYearRange(e.target.value)}
                  placeholder="۱۳۸۵ الی ۱۴۰۳"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
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
                  className="px-4 py-2 font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs"
                >
                  ذخیره خودرو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
