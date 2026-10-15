import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QrCode, Search, Printer, Tag } from 'lucide-react';
import { toPersianDigits, formatPersianCurrency } from '../../utils/formatters';

export const BarcodeView: React.FC = () => {
  const { parts, settings } = useApp();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedPart, setSelectedPart] = useState<any | null>(null);
  const [labelCopies, setLabelCopies] = useState(4);

  const handleScanOrSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const match = parts.find(
      (p) =>
        (p.barcode && p.barcode === barcodeInput.trim()) ||
        (p.technicalCode && p.technicalCode.toLowerCase() === barcodeInput.trim().toLowerCase()) ||
        p.internalCode.toLowerCase() === barcodeInput.trim().toLowerCase() ||
        p.name.includes(barcodeInput.trim())
    );
    if (match) {
      setSelectedPart(match);
    } else {
      alert('قطعه‌ای با این مشخصات یافت نشد.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              بارکدخوان و چاپ برچسب قیمت موهان
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            اسکن بارکد، استعلام سریع مشخصات و تولید برچسب‌های استاندارد قفسه و کالا
          </p>
        </div>

        {selectedPart && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 text-white dark:text-slate-950 font-bold text-xs shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ برچسب‌ها ({toPersianDigits(labelCopies)} عدد)</span>
          </button>
        )}
      </div>

      {/* Barcode Search Form */}
      <div className="no-print p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <form onSubmit={handleScanOrSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="بارکد را اسکن کنید یا کد فنی را وارد نمایید..."
              className="w-full pr-9 pl-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shrink-0"
          >
            یافتن کالا
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="text-slate-400">انتخاب سریع از انبار:</span>
          {parts.slice(0, 5).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPart(p)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100 transition"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Label Preview */}
      {selectedPart && (
        <div className="space-y-4">
          <div className="no-print flex items-center justify-between text-xs text-slate-500">
            <span>پیش‌نمایش لیبل‌های چاپی (آماده برای چاپگر حرارتی یا برچسب چسبی):</span>
            <div className="flex items-center gap-2">
              <span>تعداد برچسب:</span>
              <input
                type="number"
                min="1"
                max="24"
                value={labelCopies}
                onChange={(e) => setLabelCopies(Number(e.target.value))}
                className="w-16 px-2 py-1 text-center font-mono rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="printable-area grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            {Array.from({ length: labelCopies }).map((_, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white text-slate-950 border-2 border-slate-900 space-y-2 text-center"
              >
                <div className="text-[10px] font-extrabold tracking-wider border-b pb-1 flex justify-between items-center">
                  <span>MOHAN AUTO PARTS</span>
                  <span>{settings.storeName}</span>
                </div>

                <div className="font-black text-xs truncate" title={selectedPart.name}>
                  {selectedPart.name}
                </div>

                <div className="font-mono text-[10px] text-slate-700">
                  OEM: {selectedPart.technicalCode || selectedPart.internalCode}
                </div>

                {/* Simulated Barcode */}
                <div className="py-1">
                  <div className="h-9 w-full flex items-center justify-center gap-0.5 px-2 bg-slate-50 border border-slate-200">
                    {Array.from({ length: 32 }).map((_, bIdx) => (
                      <div
                        key={bIdx}
                        className={`h-full ${bIdx % 3 === 0 ? 'w-1 bg-black' : bIdx % 2 === 0 ? 'w-0.5 bg-black' : 'w-0.5 bg-transparent'}`}
                      />
                    ))}
                  </div>
                  <div className="text-[9px] font-mono tracking-widest text-slate-800 mt-0.5">
                    {toPersianDigits(selectedPart.barcode || selectedPart.internalCode)}
                  </div>
                </div>

                <div className="pt-1 border-t text-sm font-black text-black">
                  {formatPersianCurrency(selectedPart.salePrice, settings.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
