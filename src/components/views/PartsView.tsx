import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';
import { RippleButton } from '../common/RippleButton';
import { PartItem } from '../../types';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  QrCode,
  Tag,
  DollarSign,
  Sparkles,
  FileSpreadsheet,
  ScanLine,
} from 'lucide-react';
import {
  toPersianDigits,
  formatPersianCurrency,
  generatePartCode,
} from '../../utils/formatters';
import { BulkImportModal } from './BulkImportModal';

export const PartsView: React.FC = () => {
  const {
    parts,
    categories,
    brands,
    settings,
    setCurrentView,
    createOrUpdateEntity,
    deleteEntity,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Partial<PartItem> | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [technicalCode, setTechnicalCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [unit, setUnit] = useState('عدد');
  const [installationPosition, setInstallationPosition] = useState('');
  const [country, setCountry] = useState('ایران');
  const [minStockAlert, setMinStockAlert] = useState(3);
  const [initialStock, setInitialStock] = useState(0);
  const [lastPurchasePrice, setLastPurchasePrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [colleaguePrice, setColleaguePrice] = useState(0);
  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [description, setDescription] = useState('');

  const filteredParts = parts.filter((part) => {
    const matchesSearch =
      part.name.includes(searchTerm) ||
      (part.technicalCode && part.technicalCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (part.barcode && part.barcode.includes(searchTerm)) ||
      part.internalCode.includes(searchTerm);

    const matchesCategory = selectedCategory === 'ALL' || part.categoryId === selectedCategory;
    const matchesStock = !showLowStockOnly || (part.currentStock || 0) <= (part.minStockAlert || 3);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const openAddModal = () => {
    setEditingPart(null);
    setName('');
    setTechnicalCode('');
    setBarcode('');
    setCategoryId(categories[0]?.id || '');
    setBrandId(brands[0]?.id || '');
    setUnit('عدد');
    setInstallationPosition('جلو');
    setCountry('ایران');
    setMinStockAlert(3);
    setInitialStock(0);
    setLastPurchasePrice(0);
    setSalePrice(0);
    setColleaguePrice(0);
    setWholesalePrice(0);
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (part: PartItem) => {
    setEditingPart(part);
    setName(part.name);
    setTechnicalCode(part.technicalCode || '');
    setBarcode(part.barcode || '');
    setCategoryId(part.categoryId);
    setBrandId(part.brandId || '');
    setUnit(part.unit || 'عدد');
    setInstallationPosition(part.installationPosition || '');
    setCountry(part.country || 'ایران');
    setMinStockAlert(part.minStockAlert || 3);
    setInitialStock(part.currentStock || 0);
    setLastPurchasePrice(part.lastPurchasePrice || 0);
    setSalePrice(part.salePrice || 0);
    setColleaguePrice(part.colleaguePrice || 0);
    setWholesalePrice(part.wholesalePrice || 0);
    setDescription(part.description || '');
    setIsModalOpen(true);
  };

  // AI Auto Analysis for Part
  const handleAiAnalyze = async () => {
    if (!name.trim()) {
      showToast('لطفاً ابتدا نام یا کد قطعه را بنویسید تا هوش مصنوعی آن را تحلیل کند.', 'info');
      return;
    }
    setIsAnalyzingAi(true);
    try {
      const brandObj = brands.find((b) => b.id === brandId);
      const res = await fetch('/api/gemini/analyze-part', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partName: name,
          technicalCode,
          brandName: brandObj?.name,
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        const a = data.analysis;
        // Match category
        if (a.matchedCategory) {
          const matched = categories.find((c) => c.name.includes(a.matchedCategory) || a.matchedCategory.includes(c.name));
          if (matched) setCategoryId(matched.id);
        }
        if (a.technicalDetails && !description) {
          setDescription(a.technicalDetails);
        }
        if (a.suggestedMarginPercentage && lastPurchasePrice > 0 && salePrice === 0) {
          const suggested = Math.round(lastPurchasePrice * (1 + a.suggestedMarginPercentage / 100));
          setSalePrice(suggested);
        }
        showToast('تحلیل فنی و تطبیق دسته‌بندی با هوش مصنوعی انجام شد.', 'success');
      }
    } catch {
      showToast('خطا در تحلیل هوش مصنوعی', 'error');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('نام کالا الزامی است.', 'error');
      return;
    }

    const catObj = categories.find((c) => c.id === categoryId);
    const brandObj = brands.find((b) => b.id === brandId);

    const payload: Partial<PartItem> = {
      id: editingPart?.id,
      name: name.trim(),
      internalCode: editingPart?.internalCode || generatePartCode(parts.length + 1),
      technicalCode: technicalCode.trim() || undefined,
      barcode: barcode.trim() || undefined,
      categoryId,
      categoryName: catObj?.name,
      brandId: brandId || undefined,
      brandName: brandObj?.name,
      unit,
      installationPosition,
      country,
      minStockAlert: Number(minStockAlert) || 3,
      currentStock: editingPart ? editingPart.currentStock : Number(initialStock) || 0,
      lastPurchasePrice: Number(lastPurchasePrice) || 0,
      weightedAvgCost: editingPart?.weightedAvgCost || Number(lastPurchasePrice) || 0,
      salePrice: Number(salePrice) || 0,
      colleaguePrice: Number(colleaguePrice) || 0,
      wholesalePrice: Number(wholesalePrice) || 0,
      description: description.trim() || undefined,
      isActive: true,
    };

    const success = await createOrUpdateEntity('parts', payload);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string, partName: string) => {
    if (confirm(`آیا از حذف قطعه "${partName}" اطمینان دارید؟`)) {
      await deleteEntity('parts', id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              مدیریت قطعات و کالاهای انبار موهان
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تعریف، قیمت‌گذاری و مدیریت موجودی قطعات یدکی خودرو
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentView('smart_scanner')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/35 font-bold text-xs transition shadow-xs cursor-pointer"
            title="اسکن هوشمند عکس، فاکتور، اکسل و متن برای به‌روزرسانی یا ایجاد کالاها"
          >
            <ScanLine className="w-4 h-4 text-amber-500" />
            <span>اسکن هوشمند انواع فایل</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs transition shadow-xs"
            title="ورود گروهی کالاها و آپدیت قیمت‌ها از طریق فایل اکسل یا CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>ورود اکسل/CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن کالا جدید</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام، کد فنی OEM، بارکد یا کد داخلی..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500 text-slate-800 dark:text-white"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500 text-slate-800 dark:text-white"
          >
            <option value="ALL">همه دسته‌بندی‌ها ({toPersianDigits(categories.length)})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-xl border transition ${
              showLowStockOnly
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>فقط کالاهای کم‌موجود</span>
          </button>
        </div>
      </div>

      {/* Parts Table or Empty State */}
      {filteredParts.length === 0 ? (
        <EmptyState
          icon={Package}
          title={parts.length === 0 ? 'هنوز کالایی در انبار تعریف نشده است' : 'هیچ قطعه‌ای مطابق با فیلتر جستجو یافت نشد'}
          description={
            parts.length === 0
              ? 'برای شروع مدیریت فروشگاه و انبار موهان، اولین کالای یدکی خود را ثبت کنید یا فایل اکسل وارد فرمایید.'
              : 'لطفاً عبارت جستجو یا دسته‌بندی انتخابی را تغییر دهید.'
          }
          actionLabel={parts.length === 0 ? 'افزودن اولین کالا' : undefined}
          actionIcon={Plus}
          onAction={openAddModal}
          className="my-8"
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">ردیف</th>
                <th className="py-3 px-4">نام قطعه</th>
                <th className="py-3 px-4">دسته‌بندی</th>
                <th className="py-3 px-4">کد فنی / OEM</th>
                <th className="py-3 px-4 text-center">موجودی</th>
                <th className="py-3 px-4 text-left">قیمت خرید</th>
                <th className="py-3 px-4 text-left">قیمت فروش</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {filteredParts.map((part, idx) => {
                const isLow = (part.currentStock || 0) <= (part.minStockAlert || 3);
                return (
                  <tr key={part.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {toPersianDigits(idx + 1)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {part.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{part.internalCode}</span>
                        {part.brandName && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                            {part.brandName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {part.categoryName || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {part.technicalCode || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          isLow
                            ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                            : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {toPersianDigits(part.currentStock || 0)} {part.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-left font-mono text-slate-500">
                      {formatPersianCurrency(part.lastPurchasePrice, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-left font-bold font-mono text-slate-900 dark:text-white">
                      {formatPersianCurrency(part.salePrice, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(part)}
                          className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="ویرایش قطعه"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(part.id, part.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="حذف قطعه"
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

      {/* Modal for Add / Edit Part */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-6 space-y-4 my-8"
            >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {editingPart ? 'ویرایش مشخصات قطعه' : 'افزودن قطعه یدکی جدید به انبار'}
              </h3>
              <button
                type="button"
                onClick={handleAiAnalyze}
                disabled={isAnalyzingAi}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAnalyzingAi ? 'در حال تحلیل...' : 'تحلیل هوشمند با Gemini'}</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام فارسی کالا *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: لنت ترمز جلو دیسکی"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    دسته‌بندی (از ۶۷ دسته‌بندی) *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    کد فنی / OEM
                  </label>
                  <input
                    type="text"
                    value={technicalCode}
                    onChange={(e) => setTechnicalCode(e.target.value)}
                    placeholder="58101-1RA00"
                    className="w-full px-3 py-2 font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    بارکد کالا
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="6260123456789"
                    className="w-full px-3 py-2 font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    برند / سازنده
                  </label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  >
                    <option value="">(بدون برند / متفرقه)</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    واحد شمارش
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  >
                    <option value="عدد">عدد</option>
                    <option value="دست">دست</option>
                    <option value="جفت">جفت</option>
                    <option value="کارتن">کارتن</option>
                    <option value="لیتر">لیتر</option>
                    <option value="متر">متر</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    قیمت خرید ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={lastPurchasePrice}
                    onChange={(e) => setLastPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    قیمت فروش ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    قیمت همکار ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={colleaguePrice}
                    onChange={(e) => setColleaguePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    قیمت عمده ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    موجودی فعلی ({unit})
                  </label>
                  <input
                    type="number"
                    value={initialStock}
                    onChange={(e) => setInitialStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    حداقل موجودی (آلارم کسری)
                  </label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و مشخصات تکمیلی
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="خودروهای سازگار، مشخصات فنی و ضمانت..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  انصراف
                </button>
                <RippleButton
                  type="submit"
                  variant="primary"
                  className="px-5 py-2 text-xs font-bold text-slate-950"
                  glow
                >
                  <span>ذخیره قطعه</span>
                </RippleButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

      {/* Bulk Import from File Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  );
};
