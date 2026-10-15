import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Warehouse as WarehouseIcon,
  Search,
  AlertTriangle,
  History,
  RotateCcw,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import {
  toPersianDigits,
  formatPersianCurrency,
  formatPersianDateTime,
} from '../../utils/formatters';
import { BulkImportModal } from './BulkImportModal';

export const InventoryView: React.FC = () => {
  const {
    parts,
    warehouses,
    stockMovements,
    settings,
    adjustStock,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'STOCK' | 'MOVEMENTS' | 'STOCKTAKE'>('STOCK');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouses[0]?.id || 'wh-1');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Stocktake modal state
  const [stocktakePart, setStocktakePart] = useState<any | null>(null);
  const [newCount, setNewCount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('شمارش فیزیکی دوره‌ای');

  // Inventory value calculations
  const totalPurchaseValue = parts.reduce((sum, p) => {
    const cost = p.weightedAvgCost || p.lastPurchasePrice || 0;
    return sum + (p.currentStock || 0) * cost;
  }, 0);

  const totalSaleValue = parts.reduce((sum, p) => {
    return sum + (p.currentStock || 0) * (p.salePrice || 0);
  }, 0);

  const lowStockCount = parts.filter((p) => (p.currentStock || 0) <= (p.minStockAlert || 3)).length;
  const outOfStockCount = parts.filter((p) => (p.currentStock || 0) <= 0).length;

  const filteredParts = parts.filter((p) =>
    p.name.includes(searchTerm) ||
    (p.technicalCode && p.technicalCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.internalCode.includes(searchTerm)
  );

  const openStocktake = (part: any) => {
    setStocktakePart(part);
    setNewCount(part.currentStock || 0);
    setAdjustmentReason('شمارش فیزیکی دوره‌ای انبار');
  };

  const handleApplyAdjustment = async () => {
    if (!stocktakePart) return;
    const success = await adjustStock({
      partId: stocktakePart.id,
      warehouseId: selectedWarehouse,
      newQuantity: Number(newCount),
      reason: adjustmentReason,
    });
    if (success) {
      setStocktakePart(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <WarehouseIcon className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              مدیریت انبار، گردش کالا و انبارگردانی موهان
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            کنترل دقیق موجودی فیزیکی، ثبت کسری/اضافی و سوابق ورود و خروج
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs transition shadow-xs"
            title="ورود گروهی کالاها و آپدیت موجودی از طریق فایل اکسل یا CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>ورود فایل (اکسل/CSV)</span>
          </button>

          {/* Tab switchers */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'STOCK'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            موجودی فعلی انبار
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'MOVEMENTS'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            دفتر گردش کالا ({toPersianDigits(stockMovements.length)})
          </button>
        </div>
      </div>
    </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            ارزش خرید کل موجودی
          </span>
          <div className="text-base font-black text-amber-600 dark:text-amber-400">
            {formatPersianCurrency(totalPurchaseValue, settings.currency)}
          </div>
          <span className="text-[10px] text-slate-400 block">بر مبنای میانگین بهای تمام‌شده</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            ارزش تخمینی فروش موجودی
          </span>
          <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
            {formatPersianCurrency(totalSaleValue, settings.currency)}
          </div>
          <span className="text-[10px] text-slate-400 block">بر مبنای قیمت فروش مصوب</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            اقلام نزدیک به اتمام
          </span>
          <div className="text-base font-black text-orange-600 dark:text-orange-400">
            {toPersianDigits(lowStockCount)} قلم کالا
          </div>
          <span className="text-[10px] text-slate-400 block">کمتر از حداقل موجودی مجاز</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            اقلام ناموجود (صفر)
          </span>
          <div className="text-base font-black text-red-600 dark:text-red-400">
            {toPersianDigits(outOfStockCount)} قلم کالا
          </div>
          <span className="text-[10px] text-slate-400 block">نیازمند تأمین فوری</span>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'STOCK' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در نام قطعه یا کد فنی..."
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white"
              />
            </div>
            <div className="text-xs text-slate-500">
              نمایش موجودی: <span className="font-bold text-slate-900 dark:text-white">{toPersianDigits(filteredParts.length)}</span> کالا
            </div>
          </div>

          {filteredParts.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
              کالایی برای نمایش وجود ندارد.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">نام قطعه و مشخصات</th>
                    <th className="py-3 px-4">کد فنی</th>
                    <th className="py-3 px-4 text-center">حداقل هشدار</th>
                    <th className="py-3 px-4 text-center">موجودی فعلی</th>
                    <th className="py-3 px-4 text-left">میانگین بهای تمام‌شده</th>
                    <th className="py-3 px-4 text-left">ارزش کل موجودی</th>
                    <th className="py-3 px-4 text-center">انبارگردانی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {filteredParts.map((part, idx) => {
                    const isLow = (part.currentStock || 0) <= (part.minStockAlert || 3);
                    const cost = part.weightedAvgCost || part.lastPurchasePrice || 0;
                    const rowValue = (part.currentStock || 0) * cost;
                    return (
                      <tr key={part.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {toPersianDigits(idx + 1)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold block">{part.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {part.internalCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {part.technicalCode || '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {toPersianDigits(part.minStockAlert || 3)} {part.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-xs ${
                              isLow
                                ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                                : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {toPersianDigits(part.currentStock || 0)} {part.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-left font-mono text-slate-600 dark:text-slate-300">
                          {formatPersianCurrency(cost, settings.currency)}
                        </td>
                        <td className="py-3 px-4 text-left font-mono font-bold text-amber-600 dark:text-amber-400">
                          {formatPersianCurrency(rowValue, settings.currency)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => openStocktake(part)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition"
                          >
                            اصلاح شمارش
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Stock Movements Ledger */
        <div className="space-y-4">
          {stockMovements.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
              هنوز هیچ گردش انباری ثبت نشده است. با ثبت فاکتورهای فروش و خرید، گردش انبار به شکل خودکار ثبت می‌شود.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">تاریخ و زمان</th>
                    <th className="py-3 px-4">نام قطعه</th>
                    <th className="py-3 px-4 text-center">نوع عملیات</th>
                    <th className="py-3 px-4 text-center">تعداد</th>
                    <th className="py-3 px-4">مرجع / سند</th>
                    <th className="py-3 px-4">شرح و کاربر ثبت‌کننده</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {stockMovements.map((sm, idx) => (
                    <tr key={sm.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {toPersianDigits(idx + 1)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {formatPersianDateTime(sm.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-bold">{sm.partName}</td>
                      <td className="py-3 px-4 text-center">
                        {sm.type === 'IN' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="w-3 h-3" /> ورود به انبار
                          </span>
                        )}
                        {sm.type === 'OUT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                            <TrendingDown className="w-3 h-3" /> خروج از انبار
                          </span>
                        )}
                        {sm.type === 'ADJUSTMENT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                            انبارگردانی
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono">
                        {toPersianDigits(Math.abs(sm.quantity))}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {sm.referenceId ? toPersianDigits(sm.referenceId) : sm.referenceType}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {sm.description || '-'} ({sm.userName})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stocktake Adjustment Modal */}
      {stocktakePart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              انبارگردانی و اصلاح موجودی
            </h3>
            <p className="text-xs text-slate-500">
              قطعه: <span className="font-bold text-slate-900 dark:text-white">{stocktakePart.name}</span>
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-500">موجودی ثبت‌شده در سیستم:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {toPersianDigits(stocktakePart.currentStock || 0)} {stocktakePart.unit}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شمارش واقعی جدید (فیزیکی) *
                </label>
                <input
                  type="number"
                  value={newCount}
                  onChange={(e) => setNewCount(Number(e.target.value))}
                  className="w-full px-3 py-2 font-mono text-base font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  دلیل اصلاح / توضیحات انبارگردانی
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="کسری شمارش، ضایعات، اشتباه اپراتور..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStocktakePart(null)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleApplyAdjustment}
                  className="px-4 py-2 font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs"
                >
                  ثبت اصلاح انبارگردانی
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import from File Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  );
};
