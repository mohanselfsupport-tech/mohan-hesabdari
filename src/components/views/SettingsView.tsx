import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings as SettingsIcon, Save, Store, DollarSign, ShieldAlert } from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, showToast } = useApp();

  const [storeName, setStoreName] = useState(settings.storeName);
  const [storeSubtitle, setStoreSubtitle] = useState(settings.storeSubtitle);
  const [phone, setPhone] = useState(settings.phone);
  const [mobile, setMobile] = useState(settings.mobile);
  const [address, setAddress] = useState(settings.address);
  const [currency, setCurrency] = useState<'تومان' | 'ریال'>(settings.currency);
  const [invoiceHeaderNote, setInvoiceHeaderNote] = useState(settings.invoiceHeaderNote);
  const [invoiceFooterNote, setInvoiceFooterNote] = useState(settings.invoiceFooterNote);
  const [allowNegativeStock, setAllowNegativeStock] = useState(settings.allowNegativeStock);
  const [defaultProfitMargin, setDefaultProfitMargin] = useState(settings.defaultProfitMargin);
  const [lowStockThreshold, setLowStockThreshold] = useState(settings.lowStockThreshold);
  const [showInvoiceLogo, setShowInvoiceLogo] = useState(settings.showInvoiceLogo ?? true);
  const [showInvoiceSubtitle, setShowInvoiceSubtitle] = useState(settings.showInvoiceSubtitle ?? true);
  const [showInvoicePhones, setShowInvoicePhones] = useState(settings.showInvoicePhones ?? true);
  const [showInvoiceAddress, setShowInvoiceAddress] = useState(settings.showInvoiceAddress ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updateSettings({
      storeName,
      storeSubtitle,
      phone,
      mobile,
      address,
      currency,
      invoiceHeaderNote,
      invoiceFooterNote,
      allowNegativeStock,
      defaultProfitMargin: Number(defaultProfitMargin),
      lowStockThreshold: Number(lowStockThreshold),
      showInvoiceLogo,
      showInvoiceSubtitle,
      showInvoicePhones,
      showInvoiceAddress,
    });
    if (ok) {
      showToast('تنظیمات فروشگاه با موفقیت ذخیره شد.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              تنظیمات عمومی سامانه موهان
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ویرایش اطلاعات هویتی فروشگاه، واحد پول، شرایط فاکتور رسمی و سیاست‌های انبارداری
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Store Profile Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b">
            <Store className="w-4 h-4 text-amber-500" />
            <span>مشخصات سربرگ و اطلاعات فروشگاه</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">نام فروشگاه *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">زیرعنوان / شعار تجاری</label>
              <input
                type="text"
                value={storeSubtitle}
                onChange={(e) => setStoreSubtitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">شماره تلفن ثابت</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">شماره همراه / پشتیبانی</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">نشانی کامل فروشگاه و انبار</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Visibility checkboxes for invoice header */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <span className="block font-bold text-slate-800 dark:text-slate-200">
              مدیریت و حذف/نمایش اقلام در سربرگ فاکتور رسمی:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showInvoiceLogo}
                  onChange={(e) => setShowInvoiceLogo(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span>نمایش لوگوی موهان در سربرگ فاکتور</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showInvoiceSubtitle}
                  onChange={(e) => setShowInvoiceSubtitle(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span>نمایش زیرعنوان (شعار فروشگاه)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showInvoicePhones}
                  onChange={(e) => setShowInvoicePhones(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span>نمایش شماره تلفن‌ها و تماس</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showInvoiceAddress}
                  onChange={(e) => setShowInvoiceAddress(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span>نمایش نشانی و آدرس فروشگاه</span>
              </label>
            </div>
          </div>
        </div>

        {/* Currency & Financial Policy */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>واحد پول و سیاست‌های انبارداری</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">واحد پول نمایش قیمت‌ها</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="تومان">تومان</option>
                <option value="ریال">ریال</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">حاشیه سود پیش‌فرض (٪)</label>
              <input
                type="number"
                value={defaultProfitMargin}
                onChange={(e) => setDefaultProfitMargin(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">آلارم کمبود موجودی (حداقل)</label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="negStock"
              checked={allowNegativeStock}
              onChange={(e) => setAllowNegativeStock(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            <label htmlFor="negStock" className="cursor-pointer text-slate-700 dark:text-slate-300">
              اجازه صدور فاکتور در صورت عدم موجودی کافی در انبار (موجودی منفی)
            </label>
          </div>
        </div>

        {/* Invoice Footer note */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b">
            پانویس و شرایط ضمانت فاکتور رسمی
          </h3>

          <div>
            <textarea
              rows={3}
              value={invoiceFooterNote}
              onChange={(e) => setInvoiceFooterNote(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره کلیه تنظیمات</span>
          </button>
        </div>
      </form>
    </div>
  );
};
