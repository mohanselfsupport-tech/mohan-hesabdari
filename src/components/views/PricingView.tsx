import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PricingRule } from '../../types';
import { TrendingUp, Plus, Trash2, Percent, ShieldAlert } from 'lucide-react';
import { toPersianDigits, formatPersianCurrency } from '../../utils/formatters';

export const PricingView: React.FC = () => {
  const {
    parts,
    categories,
    brands,
    pricingRules,
    settings,
    createOrUpdateEntity,
    deleteEntity,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'GLOBAL' | 'CATEGORY' | 'BRAND' | 'PART'>('GLOBAL');
  const [targetId, setTargetId] = useState('');
  const [profitPercentage, setProfitPercentage] = useState(25);
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetName = 'کل فروشگاه (قانون عمومی)';
    if (targetType === 'CATEGORY') {
      const c = categories.find((cat) => cat.id === targetId);
      targetName = `دسته: ${c?.name || ''}`;
    } else if (targetType === 'BRAND') {
      const b = brands.find((br) => br.id === targetId);
      targetName = `برند: ${b?.name || ''}`;
    } else if (targetType === 'PART') {
      const p = parts.find((pt) => pt.id === targetId);
      targetName = `قطعه: ${p?.name || ''}`;
    }

    const payload: Partial<PricingRule> = {
      targetType,
      targetId: targetId || undefined,
      targetName,
      profitPercentage: Number(profitPercentage),
      description: description.trim() || undefined,
    };

    const ok = await createOrUpdateEntity('pricingRules', payload);
    if (ok) {
      setIsModalOpen(false);
      setDescription('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              مدیریت قوانین قیمت‌گذاری و حاشیه سود موهان
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            اولویت اعمال قوانین: ۱. اختصاصی کالا | ۲. برند | ۳. دسته‌بندی | ۴. قانون عمومی فروشگاه
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن قانون سود جدید</span>
        </button>
      </div>

      {/* Rules list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Default Global Rule Card */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">
              قانون عمومی پایه سیستم
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold font-mono">
              +{toPersianDigits(settings.defaultProfitMargin)}٪
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            در صورت عدم تعریف قانون اختصاصی برای دسته یا برند، قیمت فروش کالا با {toPersianDigits(settings.defaultProfitMargin)} درصد سود نسبت به آخرین قیمت خرید یا میانگین بهای تمام‌شده محاسبه می‌شود.
          </p>
        </div>

        {/* User created rules */}
        {pricingRules.map((rule) => (
          <div
            key={rule.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {rule.targetName}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                  +{toPersianDigits(rule.profitPercentage)}٪
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                سطح: {rule.targetType === 'CATEGORY' && 'دسته‌بندی'}
                {rule.targetType === 'BRAND' && 'برند'}
                {rule.targetType === 'PART' && 'کالای اختصاصی'}
                {rule.targetType === 'GLOBAL' && 'عمومی'}
              </span>
              {rule.description && (
                <p className="text-slate-500 mt-2 line-clamp-2">{rule.description}</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => deleteEntity('pricingRules', rule.id)}
                className="text-slate-400 hover:text-rose-500 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Part pricing table preview */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-800 dark:text-white">
            جدول تطبیق بهای تمام‌شده موزون و حاشیه سود قطعات
          </span>
          <span className="text-slate-400">
            تعداد: {toPersianDigits(parts.length)} کالا
          </span>
        </div>

        {parts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            هنوز قطعه‌ای برای محاسبه سود ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="text-slate-500 bg-slate-50/50 dark:bg-slate-800/30">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">نام قطعه</th>
                  <th className="p-3 text-left">آخرین قیمت خرید</th>
                  <th className="p-3 text-left">بهای تمام‌شده موزون</th>
                  <th className="p-3 text-left">قیمت فروش مصوب</th>
                  <th className="p-3 text-center">حاشیه سود ناخالص</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {parts.map((p, idx) => {
                  const cost = p.weightedAvgCost || p.lastPurchasePrice || 0;
                  const profit = p.salePrice - cost;
                  const marginPercent = cost > 0 ? Math.round((profit / cost) * 100) : 0;
                  return (
                    <tr key={p.id}>
                      <td className="p-3 text-center font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                      <td className="p-3 font-bold">{p.name}</td>
                      <td className="p-3 text-left font-mono">{formatPersianCurrency(p.lastPurchasePrice, settings.currency)}</td>
                      <td className="p-3 text-left font-mono text-slate-600 dark:text-slate-300">
                        {formatPersianCurrency(cost, settings.currency)}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPersianCurrency(p.salePrice, settings.currency)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold font-mono text-xs ${
                          marginPercent > 0 ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          +{toPersianDigits(marginPercent)}٪
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pricing Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              تعریف قانون حاشیه سود
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">سطح قانون‌گذاری *</label>
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value as any);
                    setTargetId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="CATEGORY">بر اساس دسته‌بندی</option>
                  <option value="BRAND">بر اساس برند</option>
                  <option value="PART">بر اساس کالای خاص</option>
                  <option value="GLOBAL">سراسری برای کل فروشگاه</option>
                </select>
              </div>

              {targetType === 'CATEGORY' && (
                <div>
                  <label className="block font-semibold mb-1">انتخاب دسته‌بندی</label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">(انتخاب کنید)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'BRAND' && (
                <div>
                  <label className="block font-semibold mb-1">انتخاب برند</label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">(انتخاب کنید)</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'PART' && (
                <div>
                  <label className="block font-semibold mb-1">انتخاب قطعه</label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">(انتخاب کنید)</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.internalCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">درصد سود نسبت به خرید (٪) *</label>
                <input
                  type="number"
                  required
                  value={profitPercentage}
                  onChange={(e) => setProfitPercentage(Number(e.target.value))}
                  className="w-full px-3 py-2 font-mono text-base font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">توضیحات</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="دلیل اعمال سود خاص..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500">
                  انصراف
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-500 font-bold text-slate-950 rounded-xl">
                  ذخیره قانون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
