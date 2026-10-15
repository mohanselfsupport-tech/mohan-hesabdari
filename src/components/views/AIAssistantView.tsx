import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import {
  Sparkles,
  Send,
  BrainCircuit,
  FileSearch,
  Package,
  Wand2,
  CheckCircle,
  Plus,
  Trash2,
  ArrowRight,
  FileText,
  DollarSign,
  User,
  ShoppingBag,
  RefreshCw,
  Edit2,
  Sliders,
} from 'lucide-react';
import {
  toPersianDigits,
  formatPersianCurrency,
  generateInvoiceCode,
} from '../../utils/formatters';

interface ExtractedInvoiceItem {
  id: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export const AIAssistantView: React.FC = () => {
  const {
    parts,
    categories,
    settings,
    showToast,
    invoices,
    warehouses,
    createSalesInvoice,
    setCurrentView,
    setDraftInvoice,
  } = useApp();

  const [activeMode, setActiveMode] = useState<'CHAT' | 'PART_ANALYZER' | 'INVOICE_OCR'>('INVOICE_OCR');
  const [useDeepThinking, setUseDeepThinking] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Chat conversation
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; model?: string }>>([
    {
      role: 'assistant',
      text: 'درود! من دستیار هوشمند و تحلیلگر تخصصی سامانه قطعات خودرو موهان هستم. می‌توانید سوالات فنی درباره کدهای OEM، سازگاری قطعات، بهای تمام‌شده، یا راهکارهای بهینه‌سازی انبار را از من بپرسید.',
      model: 'سیستم موهان',
    },
  ]);

  // Part Analyzer state
  const [partNameInput, setPartNameInput] = useState('');
  const [techCodeInput, setTechCodeInput] = useState('');
  const [partAnalysisResult, setPartAnalysisResult] = useState<any | null>(null);

  // Invoice OCR state
  const [rawInvoiceText, setRawInvoiceText] = useState(
    'فاکتور آقای احمدی:\n۲ عدد دیسک چرخ جلو دنا پلاس ایساکو هر کدام ۹۵۰ هزار تومان\n۱ دست لنت ترمز جلو دیسکی تکستار ۶۸۰ هزار تومان\nتخفیف ۵۰ هزار تومان'
  );
  const [parsedInvoiceResult, setParsedInvoiceResult] = useState<any | null>(null);

  // Editable extracted invoice state
  const [extractedItems, setExtractedItems] = useState<ExtractedInvoiceItem[]>([
    {
      id: 'init-1',
      partName: 'دیسک چرخ جلو دنا پلاس ایساکو',
      quantity: 2,
      unitPrice: 950000,
      discount: 0,
    },
    {
      id: 'init-2',
      partName: 'لنت ترمز جلو دیسکی تکستار',
      quantity: 1,
      unitPrice: 680000,
      discount: 50000,
    },
  ]);
  const [extractedCustomerName, setExtractedCustomerName] = useState<string>('آقای احمدی');
  const [extractedInvoiceType, setExtractedInvoiceType] = useState<'SALE' | 'PROFORMA'>('SALE');
  const [extractedPaymentMethod, setExtractedPaymentMethod] = useState<PaymentMethod>('CASH');
  const [extractedWarehouseId, setExtractedWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-1');
  const [extractedOverallDiscount, setExtractedOverallDiscount] = useState<number>(0);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMsg = query.trim();
    setQuery('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsg,
          mode: useDeepThinking ? 'deep_thinking' : 'standard',
        }),
      });

      const data = await res.json();
      if (data.success && data.answer) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.answer,
            model: data.modelUsed,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.message || 'پاسخی از مدل دریافت نشد.',
          },
        ]);
      }
    } catch {
      showToast('خطا در برقراری ارتباط با مدل هوش مصنوعی', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Run Part Analyzer
  const handleAnalyzePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partNameInput.trim() && !techCodeInput.trim()) {
      showToast('نام یا کد فنی قطعه را وارد نمایید.', 'info');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/analyze-part', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partName: partNameInput,
          technicalCode: techCodeInput,
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setPartAnalysisResult(data.analysis);
      } else {
        showToast(data.message || 'خطا در تحلیل قطعه', 'error');
      }
    } catch {
      showToast('خطای شبکه', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Run Invoice Text Parser
  const handleParseInvoice = async () => {
    if (!rawInvoiceText.trim()) {
      showToast('لطفاً متن پیش‌نویس فاکتور را وارد کنید.', 'info');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/parse-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawInvoiceText }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setParsedInvoiceResult(data.data);
        const newItems: ExtractedInvoiceItem[] = (data.data.items || []).map((it: any, idx: number) => ({
          id: `ext-${Date.now()}-${idx}`,
          partName: it.partName || 'قطعه استخراج‌شده',
          quantity: Math.max(1, Number(it.quantity) || 1),
          unitPrice: Math.max(0, Number(it.unitPrice) || 0),
          discount: Math.max(0, Number(it.discount) || 0),
        }));
        setExtractedItems(newItems);
        setExtractedCustomerName(data.data.customerName || 'مشتری متفرقه');
        showToast('اقلام با موفقیت استخراج شدند. می‌توانید هر قلم را ویرایش یا حذف کنید.', 'success');
      } else {
        showToast('خطا در تحلیل متن فاکتور', 'error');
      }
    } catch {
      showToast('خطا در پردازش هوشمند فاکتور', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Item modifications
  const handleUpdateItem = (index: number, field: keyof ExtractedInvoiceItem, value: any) => {
    setExtractedItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteItem = (index: number) => {
    setExtractedItems((prev) => prev.filter((_, idx) => idx !== index));
    showToast('قلم کالا از پیش‌نویس فاکتور حذف شد.', 'info');
  };

  const handleAddItem = () => {
    const newItem: ExtractedInvoiceItem = {
      id: `ext-${Date.now()}-${extractedItems.length}`,
      partName: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
    };
    setExtractedItems((prev) => [...prev, newItem]);
  };

  // Financial calculations
  const subtotal = extractedItems.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1), 0);
  const itemsDiscount = extractedItems.reduce((sum, it) => sum + (Number(it.discount) || 0), 0);
  const grandTotal = Math.max(0, subtotal - itemsDiscount - Number(extractedOverallDiscount));

  // 1. Direct Conversion to Invoice & Redirect to Invoices Section
  const handleDirectConvertToInvoice = async () => {
    if (extractedItems.length === 0) {
      showToast('حداقل یک قلم کالا برای ثبت فاکتور لازم است.', 'error');
      return;
    }

    const hasEmpty = extractedItems.some((it) => !it.partName.trim());
    if (hasEmpty) {
      showToast('عنوان تمام اقلام باید تکمیل باشد.', 'error');
      return;
    }

    setIsConverting(true);
    const invoiceNumber = generateInvoiceCode(invoices.length + 101);

    const invoiceLines = extractedItems.map((it) => {
      const matched = parts.find(
        (p) =>
          p.name.toLowerCase().includes(it.partName.trim().toLowerCase()) ||
          it.partName.trim().toLowerCase().includes(p.name.toLowerCase())
      );
      return {
        partId: matched ? matched.id : `ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        partName: it.partName.trim(),
        technicalCode: matched?.technicalCode || matched?.internalCode || '',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        discount: Number(it.discount) || 0,
        totalPrice: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0),
      };
    });

    const payload = {
      invoiceNumber,
      type: extractedInvoiceType,
      customerName: extractedCustomerName.trim() || 'مشتری متفرقه',
      warehouseId: extractedWarehouseId || (warehouses[0]?.id || 'wh-1'),
      items: invoiceLines,
      subtotal,
      discount: itemsDiscount + Number(extractedOverallDiscount),
      tax: 0,
      grandTotal,
      paidAmount: extractedInvoiceType === 'PROFORMA' ? 0 : grandTotal,
      remainingAmount: 0,
      paymentMethod: extractedPaymentMethod,
      notes: 'استخراج‌شده با هوش مصنوعی موهان',
      createdBy: 'هوش مصنوعی موهان',
    };

    const res = await createSalesInvoice(payload);
    setIsConverting(false);

    if (res.success && res.invoice) {
      showToast(`فاکتور شماره ${res.invoice.invoiceNumber} با موفقیت ثبت شد و به قسمت فاکتورها اضافه گردید.`, 'success');
      // Navigate to Invoices Section
      setCurrentView('invoice_list');
    }
  };

  // 2. Transfer to Sales Invoice Editor
  const handleTransferToSalesInvoice = () => {
    if (extractedItems.length === 0) {
      showToast('هیچ قلم کالایی برای انتقال وجود ندارد.', 'error');
      return;
    }

    const invoiceLines = extractedItems.map((it) => {
      const matched = parts.find(
        (p) =>
          p.name.toLowerCase().includes(it.partName.trim().toLowerCase()) ||
          it.partName.trim().toLowerCase().includes(p.name.toLowerCase())
      );
      return {
        partId: matched ? matched.id : `ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        partName: it.partName.trim(),
        technicalCode: matched?.technicalCode || matched?.internalCode || '',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        discount: Number(it.discount) || 0,
        totalPrice: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0),
      };
    });

    setDraftInvoice({
      customerName: extractedCustomerName.trim() || 'مشتری متفرقه',
      type: extractedInvoiceType,
      paymentMethod: extractedPaymentMethod,
      warehouseId: extractedWarehouseId || (warehouses[0]?.id || 'wh-1'),
      discount: Number(extractedOverallDiscount) || 0,
      items: invoiceLines,
    });

    showToast('اقلام با موفقیت به صفحه صدور فاکتور منتقل شدند.', 'success');
    setCurrentView('sales_invoice');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-amber-300">
              دستیار هوشمند و تحلیلگر تخصصی قطعات موهان
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            مجهز به هوش مصنوعی Google Gemini جهت استخراج فاکتور، تبدیل مستقیم به اسناد مالی و تحلیل فنی قطعات
          </p>
        </div>

        {/* Mode selector */}
        <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700 text-xs">
          <button
            onClick={() => setActiveMode('INVOICE_OCR')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeMode === 'INVOICE_OCR' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            خواندن و تبدیل به فاکتور
          </button>
          <button
            onClick={() => setActiveMode('PART_ANALYZER')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeMode === 'PART_ANALYZER' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            شناسایی فنی قطعه
          </button>
          <button
            onClick={() => setActiveMode('CHAT')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeMode === 'CHAT' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            گفتگوی مشاوره‌ای
          </button>
        </div>
      </div>

      {/* INVOICE OCR & CONVERT MODE */}
      {activeMode === 'INVOICE_OCR' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Box: 4 cols */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <FileSearch className="w-4 h-4 text-amber-500" />
                  <span>متن پیش‌نویس یا سفارش</span>
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                  استخراج هوشمند
                </span>
              </div>

              <p className="text-slate-500 leading-relaxed text-[11px]">
                متن سفارش، پیام واتس‌اپ/تلگرام، یا فاکتور دست‌نویس را اینجا بنویسید تا سیستم به صورت خودکار اقلام، تعداد و قیمت را استخراج کند:
              </p>

              <textarea
                rows={7}
                value={rawInvoiceText}
                onChange={(e) => setRawInvoiceText(e.target.value)}
                placeholder="متن فاکتور یا اقلام را وارد کنید..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 leading-relaxed font-sans text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
              />

              <button
                onClick={handleParseInvoice}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-bold text-slate-950 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? 'در حال استخراج با هوش مصنوعی...' : 'استخراج اقلام با هوش مصنوعی'}</span>
              </button>
            </div>

            {/* Editable & Interactive Invoice Editor Section: 8 cols */}
            <div className="lg:col-span-8 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-emerald-500" />
                    <span>مدیریت، تغییر و حذف اقلام فاکتور</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    می‌توانید هر قلم را تغییر دهید، حذف کنید یا قلم جدید اضافه کنید و سپس به فاکتور تبدیل نمایید.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 font-mono">
                    {toPersianDigits(extractedItems.length)} قلم کالا
                  </span>
                  <button
                    onClick={handleAddItem}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-500" />
                    <span>افزودن قلم کالا</span>
                  </button>
                </div>
              </div>

              {/* Invoice Metadata Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    نام خریدار
                  </label>
                  <input
                    type="text"
                    value={extractedCustomerName}
                    onChange={(e) => setExtractedCustomerName(e.target.value)}
                    placeholder="نام مشتری یا خریدار"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    نوع سند
                  </label>
                  <select
                    value={extractedInvoiceType}
                    onChange={(e) => setExtractedInvoiceType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white"
                  >
                    <option value="SALE">فاکتور فروش قطعی</option>
                    <option value="PROFORMA">پیش‌فاکتور (استعلام)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    نحوه تسویه
                  </label>
                  <select
                    value={extractedPaymentMethod}
                    onChange={(e) => setExtractedPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white"
                  >
                    <option value="CASH">نقدی</option>
                    <option value="CARD">کارتخوان</option>
                    <option value="CREDIT">نسیه / اعتباری</option>
                    <option value="TRANSFER">حواله پایا/ساتنا</option>
                    <option value="CHECK">چک صیادی</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              {extractedItems.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <p className="text-slate-400 font-medium">هیچ قلم کالایی در این فاکتور وجود ندارد.</p>
                  <button
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن اولین قلم کالا</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500">
                      <tr>
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5">شرح و نام قطعه</th>
                        <th className="p-2.5 w-24 text-center">تعداد</th>
                        <th className="p-2.5 w-32 text-left">قیمت واحد (تومان)</th>
                        <th className="p-2.5 w-28 text-left">تخفیف (تومان)</th>
                        <th className="p-2.5 w-32 text-left">مجموع سطر</th>
                        <th className="p-2.5 w-12 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {extractedItems.map((it, idx) => {
                        const lineTotal = (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0);
                        return (
                          <tr key={it.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 text-center font-mono text-slate-400">
                              {toPersianDigits(idx + 1)}
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={it.partName}
                                onChange={(e) => handleUpdateItem(idx, 'partName', e.target.value)}
                                placeholder="نام قطعه..."
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:outline-none focus:border-amber-500"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItem(idx, 'quantity', Math.max(1, (Number(it.quantity) || 1) - 1))}
                                  className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 flex items-center justify-center text-xs"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={it.quantity}
                                  onChange={(e) => handleUpdateItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                                  className="w-12 px-1 py-1 text-center font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItem(idx, 'quantity', (Number(it.quantity) || 1) + 1)}
                                  className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 flex items-center justify-center text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="p-2.5 text-left">
                              <input
                                type="number"
                                value={it.unitPrice}
                                onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                                className="w-28 px-2 py-1 text-left font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              />
                            </td>
                            <td className="p-2.5 text-left">
                              <input
                                type="number"
                                value={it.discount}
                                onChange={(e) => handleUpdateItem(idx, 'discount', Number(e.target.value))}
                                className="w-24 px-2 py-1 text-left font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              />
                            </td>
                            <td className="p-2.5 text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatPersianCurrency(lineTotal, settings.currency)}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(idx)}
                                title="حذف این قلم کالا از فاکتور"
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Financial Summary & Action Buttons */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-amber-50/30 dark:from-slate-800/70 dark:to-slate-800/40 border border-amber-200/40 dark:border-slate-700 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-slate-500 text-[11px] block">جمع ناخالص:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {formatPersianCurrency(subtotal, settings.currency)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 text-[11px] block">تخفیف اقلام:</span>
                    <span className="font-mono font-bold text-rose-600">
                      {formatPersianCurrency(itemsDiscount, settings.currency)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 text-[11px] block">مبلغ نهایی قابل پرداخت:</span>
                    <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
                      {formatPersianCurrency(grandTotal, settings.currency)}
                    </span>
                  </div>
                </div>

                {/* The Two Prominent Actions for Converting to Invoice */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDirectConvertToInvoice}
                    disabled={isConverting || extractedItems.length === 0}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isConverting ? 'در حال ثبت در فاکتورها...' : 'تبدیل مستقیم به فاکتور و ثبت در قسمت فاکتورها'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTransferToSalesInvoice}
                    disabled={extractedItems.length === 0}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>انتقال به صدور فاکتور (ویرایش نهایی و چاپ)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PART ANALYZER MODE */}
      {activeMode === 'PART_ANALYZER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-amber-500" />
              <span>ورود اطلاعات قطعه جهت شناسایی هوشمند</span>
            </h3>

            <form onSubmit={handleAnalyzePart} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">نام یا عنوان تجاری قطعه</label>
                <input
                  type="text"
                  value={partNameInput}
                  onChange={(e) => setPartNameInput(e.target.value)}
                  placeholder="مثال: لنت ترمز جلو سرامیکی ال۹۰"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">کد فنی / OEM (در صورت وجود)</label>
                <input
                  type="text"
                  value={techCodeInput}
                  onChange={(e) => setTechCodeInput(e.target.value)}
                  placeholder="41060-2192R"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 transition flex items-center justify-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                <span>{isLoading ? 'در حال تحلیل با هوش مصنوعی...' : 'شروع تحلیل و تطبیق با ۶۷ دسته‌بندی'}</span>
              </button>
            </form>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white pb-2 border-b">
              نتیجه کارشناسی هوش مصنوعی
            </h3>

            {partAnalysisResult ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <span className="text-slate-500 block text-[11px]">دسته‌بندی پیشنهادی از ۶۷ دسته‌بندی فروشگاه:</span>
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    {partAnalysisResult.matchedCategory}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">مشخصات فنی و محل نصب:</span>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed mt-1">
                    {partAnalysisResult.technicalDetails}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">خودروهای سازگار:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {partAnalysisResult.compatibleVehicles?.map((v: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">کدهای فنی معادل (Cross-References):</span>
                  <div className="flex flex-wrap gap-1.5 mt-1 font-mono">
                    {partAnalysisResult.oemCrossReferences?.map((o: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {o}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <span className="text-slate-400 block text-[11px]">درصد سود پیشنهادی بازار:</span>
                  <span className="font-bold font-mono text-emerald-600">
                    +{toPersianDigits(partAnalysisResult.suggestedMarginPercentage || 25)}٪
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                اطلاعات قطعه را در فرم سمت راست وارد نموده و بر روی دکمه شروع تحلیل کلیک کنید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHAT MODE */}
      {activeMode === 'CHAT' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[600px] overflow-hidden">
          {/* Top Options Bar inside Chat */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">مدل فعال:</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 font-mono">
                {useDeepThinking ? 'gemini-3.1-pro-preview (تفکر عمیق)' : 'gemini-3.8-flash (پاسخ سریع)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={useDeepThinking}
                  onChange={(e) => setUseDeepThinking(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <BrainCircuit className="w-4 h-4 text-amber-500" />
                <span className="font-bold">فعال‌سازی تفکر عمیق (High Thinking)</span>
              </label>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m, idx) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={idx}
                  className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-2xl p-4 rounded-2xl space-y-1.5 ${
                    isAssistant
                      ? 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                      : 'bg-amber-500 text-slate-950 font-medium'
                  }`}>
                    {m.model && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-bold">
                        {m.model}
                      </span>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-3 text-slate-400 text-xs">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center animate-pulse">
                  <BrainCircuit className="w-4 h-4 animate-spin" />
                </div>
                <span>
                  {useDeepThinking
                    ? 'هوش مصنوعی در حال پردازش و استدلال عمیق با gemini-3.1-pro-preview است...'
                    : 'در حال دریافت پاسخ...'}
                </span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="سوالی درباره قطعات، کدهای فنی، فرمول سود یا موجودی انبار بنویسید..."
              className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>ارسال</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
