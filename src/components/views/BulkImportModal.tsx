import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Check,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  toPersianDigits,
  formatPersianCurrency,
  toEnglishDigits,
} from '../../utils/formatters';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  tempId: string;
  name: string;
  technicalCode: string;
  internalCode?: string;
  barcode: string;
  salePrice: number;
  purchasePrice: number;
  currentStock: number | '';
  hasQuantityInFile: boolean;
  needsQuantityInput: boolean;
  categoryName?: string;
  brandName?: string;
  compatibleVehicles?: string;
  status: 'NEW' | 'UPDATE';
  matchedPartName?: string;
  matchedPartId?: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const { parts, categories, brands, bulkImportParts, showToast, warehouses, settings } = useApp();

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stockMode, setStockMode] = useState<'ADD' | 'SET'>('ADD');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-1');
  const [filterTab, setFilterTab] = useState<'ALL' | 'NEW' | 'UPDATE' | 'MISSING_QTY'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [batchQtyValue, setBatchQtyValue] = useState<string>('1');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to detect column value by various Persian/English aliases
  const detectValue = (row: any, aliases: string[]): any => {
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase();
      for (const alias of aliases) {
        if (cleanKey === alias.toLowerCase()) {
          return row[key];
        }
      }
    }
    return undefined;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          showToast('فایل انتخابی خالی است.', 'error');
          return;
        }

        processRows(rawJson);
      } catch (err: any) {
        showToast('خطا در پردازش فایل اکسل یا CSV', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processRows = (rawJson: any[]) => {
    const processed: ParsedRow[] = [];

    rawJson.forEach((row, idx) => {
      const rawName = detectValue(row, [
        'نام قطعه', 'نام کالا', 'عنوان', 'شرح کالا', 'شرح قطعه', 'نام',
        'partName', 'part_name', 'name', 'title', 'part', 'description'
      ]);

      if (!rawName || !String(rawName).trim()) return;

      const name = String(rawName).trim();
      const techCode = String(detectValue(row, [
        'کد فنی', 'کد oem', 'پارت نامبر', 'کد قطعه',
        'technicalCode', 'tech_code', 'oem', 'partNumber', 'part_number'
      ]) || '').trim();

      const barcode = String(detectValue(row, [
        'بارکد', 'کد میله ای', 'barcode', 'upc', 'ean'
      ]) || '').trim();

      const internalCode = String(detectValue(row, [
        'کد داخلی', 'کد کالا', 'کد انبار', 'شناسه', 'internalCode', 'code'
      ]) || '').trim();

      const rawSalePrice = detectValue(row, [
        'قیمت فروش', 'قیمت', 'مبلغ فروش', 'فروش', 'نرخ فروش', 'salePrice', 'price'
      ]);
      const salePrice = rawSalePrice !== undefined && rawSalePrice !== ''
        ? Math.max(0, Number(toEnglishDigits(String(rawSalePrice)).replace(/[^0-9.-]+/g, '')) || 0)
        : 0;

      const rawBuyPrice = detectValue(row, [
        'قیمت خرید', 'خرید', 'مبلغ خرید', 'بهای خرید', 'purchasePrice', 'cost', 'buyPrice'
      ]);
      const purchasePrice = rawBuyPrice !== undefined && rawBuyPrice !== ''
        ? Math.max(0, Number(toEnglishDigits(String(rawBuyPrice)).replace(/[^0-9.-]+/g, '')) || 0)
        : 0;

      const rawQty = detectValue(row, [
        'تعداد', 'موجودی', 'موجودی انبار', 'تعداد اولیه', 'stock', 'quantity', 'qty', 'count'
      ]);

      const hasQuantityInFile = rawQty !== undefined && rawQty !== '' && rawQty !== null;
      let parsedStock: number | '' = '';
      if (hasQuantityInFile) {
        parsedStock = Math.max(0, Number(toEnglishDigits(String(rawQty)).replace(/[^0-9.-]+/g, '')) || 0);
      }

      const categoryName = String(detectValue(row, ['دسته‌بندی', 'دسته', 'گروه', 'category']) || '').trim();
      const brandName = String(detectValue(row, ['برند', 'مارک', 'سازنده', 'brand']) || '').trim();
      const compatibleVehicles = String(detectValue(row, ['خودرو', 'خودروها', 'ماشین', 'vehicle', 'car']) || '').trim();

      // Check if part matches existing inventory
      let matchedPart = null;
      if (barcode) {
        matchedPart = parts.find((p) => p.barcode && p.barcode.trim() === barcode);
      }
      if (!matchedPart && techCode) {
        matchedPart = parts.find((p) => p.technicalCode && p.technicalCode.trim().toLowerCase() === techCode.toLowerCase());
      }
      if (!matchedPart && internalCode) {
        matchedPart = parts.find((p) => p.internalCode && p.internalCode.trim().toLowerCase() === internalCode.toLowerCase());
      }
      if (!matchedPart) {
        matchedPart = parts.find((p) => p.name.trim().toLowerCase() === name.toLowerCase());
      }

      const isExisting = !!matchedPart;
      const status: 'NEW' | 'UPDATE' = isExisting ? 'UPDATE' : 'NEW';

      // Crucial requirement: If it's a new part and file didn't specify quantity, user must enter it!
      const needsQuantityInput = !isExisting && !hasQuantityInFile;

      processed.push({
        tempId: `row-${idx}-${Date.now()}`,
        name,
        technicalCode: techCode,
        internalCode,
        barcode,
        salePrice,
        purchasePrice,
        currentStock: hasQuantityInFile ? parsedStock : (matchedPart ? (matchedPart.currentStock || 0) : ''),
        hasQuantityInFile,
        needsQuantityInput,
        categoryName,
        brandName,
        compatibleVehicles,
        status,
        matchedPartName: matchedPart?.name,
        matchedPartId: matchedPart?.id,
      });
    });

    setParsedRows(processed);
    const missingQtyCount = processed.filter((r) => r.needsQuantityInput && (r.currentStock === '' || r.currentStock === 0)).length;
    if (missingQtyCount > 0) {
      showToast(`${toPersianDigits(missingQtyCount)} قطعه جدید فاقد تعداد موجودی هستند. لطفاً تعداد آن‌ها را وارد نمایید.`, 'info');
      setFilterTab('MISSING_QTY');
    } else {
      showToast(`${toPersianDigits(processed.length)} ردیف کالا با موفقیت پردازش شد.`, 'success');
    }
  };

  // Update specific field in parsed rows
  const handleUpdateRowField = (tempId: string, field: keyof ParsedRow, value: any) => {
    setParsedRows((prev) =>
      prev.map((r) => {
        if (r.tempId === tempId) {
          const updated = { ...r, [field]: value };
          if (field === 'currentStock' && value !== '') {
            updated.needsQuantityInput = false;
          }
          return updated;
        }
        return r;
      })
    );
  };

  // Remove row from import list
  const handleDeleteRow = (tempId: string) => {
    setParsedRows((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  // Batch assign quantity to all missing quantity rows
  const handleBatchSetQuantity = () => {
    const qty = Math.max(0, Number(batchQtyValue) || 0);
    setParsedRows((prev) =>
      prev.map((r) => {
        if (r.needsQuantityInput || r.currentStock === '') {
          return { ...r, currentStock: qty, needsQuantityInput: false };
        }
        return r;
      })
    );
    showToast(`تعداد ${toPersianDigits(qty)} برای تمام کالاهای بدون موجودی تنظیم شد.`, 'success');
  };

  // Download Sample Template for user
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'نام قطعه': 'دیسک چرخ جلو دنا پلاس ایساکو',
        'کد فنی / OEM': 'ISA-5021-DN',
        'بارکد': '6260123456789',
        'قیمت فروش': 980000,
        'قیمت خرید': 820000,
        'تعداد موجودی': 8,
        'دسته‌بندی': 'سیستم ترمز',
        'برند': 'ایساکو',
        'خودروهای سازگار': 'دنا پلاس، سمند سورن',
      },
      {
        'نام قطعه': 'لنت ترمز جلو دیسکی تکستار',
        'کد فنی / OEM': '2192-TEXTAR',
        'بارکد': '6260987654321',
        'قیمت فروش': 720000,
        'قیمت خرید': 590000,
        'تعداد موجودی': '', // intentionally empty to demo manual quantity prompt!
        'دسته‌بندی': 'سیستم ترمز',
        'برند': 'تکستار',
        'خودروهای سازگار': 'پژو ۴۰۵، پژو پارس، سمند',
      },
      {
        'نام قطعه': 'تسمه تایم پاورگریپ گتس رنو ال۹۰',
        'کد فنی / OEM': '132RP270',
        'بارکد': '',
        'قیمت فروش': 850000,
        'قیمت خرید': 710000,
        'تعداد موجودی': 5,
        'دسته‌بندی': 'تسمه‌ها و زنجیر',
        'برند': 'گتس',
        'خودروهای سازگار': 'تندر ۹۰، ساندرو',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قالب قطعات موهان');
    XLSX.writeFile(wb, 'mohan_parts_import_template.xlsx');
    showToast('فایل نمونه اکسل با موفقیت دانلود شد.', 'success');
  };

  // Submit and Commit to Database
  const handleCommitImport = async () => {
    if (parsedRows.length === 0) {
      showToast('هیچ ردیفی برای ورود وجود ندارد.', 'error');
      return;
    }

    // Check if any new item has empty stock
    const unassigned = parsedRows.filter((r) => r.status === 'NEW' && (r.currentStock === '' || r.currentStock === undefined));
    if (unassigned.length > 0) {
      showToast(`تعداد ${toPersianDigits(unassigned.length)} قطعه جدید هنوز فاقد موجودی هستند. لطفاً تعداد آن‌ها را وارد کنید.`, 'error');
      setFilterTab('MISSING_QTY');
      return;
    }

    setIsProcessing(true);

    const payloadItems = parsedRows.map((r) => ({
      name: r.name,
      technicalCode: r.technicalCode,
      internalCode: r.internalCode,
      barcode: r.barcode,
      salePrice: Number(r.salePrice) || 0,
      purchasePrice: Number(r.purchasePrice) || 0,
      currentStock: r.currentStock === '' ? 0 : Number(r.currentStock),
      categoryName: r.categoryName,
      brandName: r.brandName,
      compatibleVehicles: r.compatibleVehicles ? r.compatibleVehicles.split(/[,،]/).map((v) => v.trim()) : [],
    }));

    const result = await bulkImportParts(payloadItems, stockMode, selectedWarehouseId);
    setIsProcessing(false);

    if (result.success) {
      onClose();
    }
  };

  // Filtered rows for display
  const filteredRows = parsedRows.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.technicalCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.barcode.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterTab === 'NEW') return r.status === 'NEW';
    if (filterTab === 'UPDATE') return r.status === 'UPDATE';
    if (filterTab === 'MISSING_QTY') return r.needsQuantityInput || r.currentStock === '';
    return true;
  });

  const newCount = parsedRows.filter((r) => r.status === 'NEW').length;
  const updateCount = parsedRows.filter((r) => r.status === 'UPDATE').length;
  const missingQtyCount = parsedRows.filter((r) => r.needsQuantityInput || (r.status === 'NEW' && r.currentStock === '')).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
          >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-amber-50/20 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white">
                ورود گروهی کالاها و به‌روزرسانی قیمت‌ها از فایل (اکسل / CSV)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                شناسایی خودکار قطعات جدید و موجود، با امکان تعیین دستی تعداد برای کالاهای فاقد موجودی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
              title="دانلود فایل نمونه اکسل جهت پر کردن داده‌ها"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">دانلود قالب نمونه اکسل</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* File Upload Zone */}
          {parsedRows.length === 0 ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-amber-500/40 hover:border-amber-500 rounded-2xl p-10 text-center cursor-pointer bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .tsv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-800 dark:text-white">
                  فایل اکسل (.xlsx, .xls) یا فایل CSV خود را اینجا رها کنید، یا کلیک نمایید
                </p>
                <p className="text-xs text-slate-400">
                  سامانه به صورت هوشمند نام قطعه، کد فنی، قیمت فروش، قیمت خرید و تعداد موجودی را تشخیص می‌دهد.
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                  پشتیبانی از فرمت‌های XLSX, XLS, CSV
                </span>
              </div>
            </div>
          ) : (
            /* Uploaded Preview & Editing Table */
            <div className="space-y-4">
              {/* Summary Badges & Re-upload */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    فایل بارگذاری‌شده: <strong className="text-amber-600 dark:text-amber-400 font-mono">{fileName}</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                    کل سطرها: {toPersianDigits(parsedRows.length)}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold">
                    کالاهای جدید: {toPersianDigits(newCount)}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold">
                    به‌روزرسانی قیمت: {toPersianDigits(updateCount)}
                  </span>
                  {missingQtyCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold animate-pulse">
                      ⚠️ فاقد تعداد: {toPersianDigits(missingQtyCount)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setParsedRows([]);
                    setFileName('');
                  }}
                  className="flex items-center gap-1 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>انتخاب فایل دیگر</span>
                </button>
              </div>

              {/* Missing Quantity Warning and Bulk Tool */}
              {missingQtyCount > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>
                      تعداد <strong>{toPersianDigits(missingQtyCount)}</strong> قلم کالا در فایل شما تعداد موجودی نداشتند. می‌توانید در جدول زیر تعداد هر کدام را دستی وارد نمایید، یا برای همه یک عدد پیش‌فرض قرار دهید:
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-300 text-[11px] whitespace-nowrap">تعداد پیش‌فرض:</span>
                    <input
                      type="number"
                      min="0"
                      value={batchQtyValue}
                      onChange={(e) => setBatchQtyValue(e.target.value)}
                      className="w-16 px-2 py-1 text-center font-mono rounded-lg bg-white dark:bg-slate-900 border border-amber-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleBatchSetQuantity}
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition whitespace-nowrap shadow-xs"
                    >
                      اعمال به همه بدون تعداد
                    </button>
                  </div>
                </div>
              )}

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    onClick={() => setFilterTab('ALL')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      filterTab === 'ALL' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    همه ({toPersianDigits(parsedRows.length)})
                  </button>
                  <button
                    onClick={() => setFilterTab('NEW')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      filterTab === 'NEW' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    کالاهای جدید ({toPersianDigits(newCount)})
                  </button>
                  <button
                    onClick={() => setFilterTab('UPDATE')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      filterTab === 'UPDATE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    به‌روزرسانی قیمت ({toPersianDigits(updateCount)})
                  </button>
                  {missingQtyCount > 0 && (
                    <button
                      onClick={() => setFilterTab('MISSING_QTY')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        filterTab === 'MISSING_QTY' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-amber-600'
                      }`}
                    >
                      نیازمند ورود تعداد ({toPersianDigits(missingQtyCount)})
                    </button>
                  )}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute right-3 top-2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در سطرهای فایل..."
                    className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Editable Preview Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-96 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 sticky top-0 z-10 text-[11px]">
                    <tr>
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5 w-24">وضعیت</th>
                      <th className="p-2.5">نام قطعه</th>
                      <th className="p-2.5 w-28">کد فنی / OEM</th>
                      <th className="p-2.5 w-28 text-left">قیمت فروش</th>
                      <th className="p-2.5 w-28 text-left">قیمت خرید</th>
                      <th className="p-2.5 w-28 text-center bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
                        تعداد موجودی *
                      </th>
                      <th className="p-2.5 w-10 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRows.map((r, idx) => {
                      const isQtyMissing = r.currentStock === '' || (r.status === 'NEW' && r.needsQuantityInput);
                      return (
                        <tr
                          key={r.tempId}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                            isQtyMissing ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center font-mono text-slate-400">
                            {toPersianDigits(idx + 1)}
                          </td>
                          <td className="p-2.5">
                            {r.status === 'NEW' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                کالای جدید
                              </span>
                            ) : (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                title={`تطبیق با: ${r.matchedPartName}`}
                              >
                                آپدیت قیمت
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={r.name}
                              onChange={(e) => handleUpdateRowField(r.tempId, 'name', e.target.value)}
                              className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                            />
                            {r.matchedPartName && r.matchedPartName !== r.name && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                متصل به: {r.matchedPartName}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={r.technicalCode}
                              onChange={(e) => handleUpdateRowField(r.tempId, 'technicalCode', e.target.value)}
                              className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                            />
                          </td>
                          <td className="p-2.5 text-left">
                            <input
                              type="number"
                              value={r.salePrice}
                              onChange={(e) => handleUpdateRowField(r.tempId, 'salePrice', Number(e.target.value))}
                              className="w-24 px-2 py-1 text-left rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                            />
                          </td>
                          <td className="p-2.5 text-left">
                            <input
                              type="number"
                              value={r.purchasePrice}
                              onChange={(e) => handleUpdateRowField(r.tempId, 'purchasePrice', Number(e.target.value))}
                              className="w-24 px-2 py-1 text-left rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                            />
                          </td>
                          {/* Stock Quantity - User editable directly */}
                          <td className="p-2.5 text-center bg-amber-50/30 dark:bg-amber-950/20">
                            <input
                              type="number"
                              min="0"
                              value={r.currentStock}
                              placeholder="تعداد..."
                              onChange={(e) =>
                                handleUpdateRowField(
                                  r.tempId,
                                  'currentStock',
                                  e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                                )
                              }
                              className={`w-20 px-2 py-1 text-center font-mono rounded-lg border text-xs font-bold ${
                                isQtyMissing
                                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-400/40'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                              }`}
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(r.tempId)}
                              title="حذف این سطر از ورود فایل"
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {parsedRows.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600 dark:text-slate-300">نحوه اعمال موجودی:</span>
                <select
                  value={stockMode}
                  onChange={(e) => setStockMode(e.target.value as any)}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="ADD">افزودن به موجودی فعلی انبار</option>
                  <option value="SET">جایگزینی دقیق موجودی انبار</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600 dark:text-slate-300">انبار مقصد:</span>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleCommitImport}
                disabled={isProcessing || parsedRows.length === 0}
                className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md"
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'در حال اعمال در انبار...'
                    : `تأیید و ذخیره (${toPersianDigits(parsedRows.length)} کالا)`}
                </span>
              </button>
            </div>
          </div>
        )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
