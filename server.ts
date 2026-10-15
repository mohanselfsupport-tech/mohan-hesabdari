import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import { INITIAL_67_CATEGORIES } from './src/data/initialCategories';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default empty database structure
const getDefaultDatabase = () => ({
  categories: INITIAL_67_CATEGORIES,
  brands: [],
  vehicles: [],
  parts: [],
  warehouses: [
    { id: 'wh-1', name: 'انبار مرکزی موهان', code: 'WH-01', location: 'فروشگاه اصلی', isDefault: true, isActive: true },
    { id: 'wh-2', name: 'انبار دوم (پخش)', code: 'WH-02', location: 'انبار تهرانپارس', isDefault: false, isActive: true },
  ],
  stockMovements: [],
  customers: [],
  suppliers: [],
  invoices: [],
  purchaseInvoices: [],
  cashRegisters: [
    { id: 'cr-1', name: 'صندوق اصلی فروشگاه', balance: 0, isDefault: true },
  ],
  bankAccounts: [],
  expenses: [],
  checks: [],
  pricingRules: [],
  activityLogs: [],
  users: [],
  settings: {
    storeName: 'برنامه حسابداری موهان',
    storeSubtitle: 'سامانه جامع حسابداری، انبارداری و مدیریت قطعات خودرو موهان',
    phone: '۰۲۱-۳۳۹۰۰۰۰۰',
    mobile: '۰۹۱۲۰۰۰۰۰۰۰',
    address: 'تهران، خیابان امیرکبیر، پاساژ کاشانی، طبقه همکف، پلاک ۱۰',
    postalCode: '۱۱۴۵۶۷۸۹۰۱',
    invoiceHeaderNote: 'فاکتور رسمی فروش و ضمانت اصالت لوازم یدکی موهان',
    invoiceFooterNote: 'قطعات برقی و استوک فاقد مهلت تست بوده و تعویض یا مرجوع نمی‌گردند. سایر اقلام در صورت مخدوش نشدن پلمپ تا ۴۸ ساعت قابل بررسی است.',
    currency: 'تومان',
    allowNegativeStock: false,
    defaultProfitMargin: 20,
    taxRate: 0,
    lowStockThreshold: 3,
    aiEnabled: true,
    aiModel: 'gemini-3.8-flash',
    aiThinkingLevel: 'HIGH',
    showInvoiceLogo: true,
    showInvoiceSubtitle: true,
    showInvoicePhones: true,
    showInvoiceAddress: true,
  },
});

// Read and write DB helpers
function readDB(): any {
  if (!fs.existsSync(DB_FILE)) {
    const initial = getDefaultDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    // Ensure all 67 categories exist
    if (!parsed.categories || parsed.categories.length === 0) {
      parsed.categories = INITIAL_67_CATEGORIES;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB, reverting to default:', err);
    return getDefaultDatabase();
  }
}

function writeDB(data: any): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Log audit activity
function logActivity(db: any, action: string, module: string, details: string, userName = 'مدیر سیستم') {
  const log = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    action,
    module,
    userId: 'u-1',
    userName,
    details,
    timestamp: new Date().toISOString(),
  };
  if (!db.activityLogs) db.activityLogs = [];
  db.activityLogs.unshift(log);
  if (db.activityLogs.length > 500) {
    db.activityLogs = db.activityLogs.slice(0, 500);
  }
}

// Initialize Gemini SDK with telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// ======================== API ROUTES ========================

// Get full state
app.get('/api/state', (_req: Request, res: Response) => {
  const db = readDB();
  res.json({ success: true, data: db });
});

// Initial admin setup
app.post('/api/auth/setup-admin', (req: Request, res: Response) => {
  const { username, password, fullName } = req.body;
  const db = readDB();

  if (db.users && db.users.length > 0) {
    return res.status(400).json({ success: false, message: 'حساب مدیر قبلاً ایجاد شده است.' });
  }

  const adminUser = {
    id: 'usr-' + Date.now(),
    username: username || 'admin',
    password: password || 'admin123', // In production could be hashed
    fullName: fullName || 'مدیر اصلی موهان',
    role: 'SUPER_ADMIN',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  db.users = [adminUser];
  logActivity(db, 'ایجاد کاربر', 'احراز هویت', `مدیر اصلی "${adminUser.fullName}" ایجاد شد.`);
  writeDB(db);

  return res.json({ success: true, user: adminUser });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const db = readDB();

  if (!db.users || db.users.length === 0) {
    return res.status(400).json({ success: false, needSetup: true, message: 'سامانه هنوز راه‌اندازی نشده است.' });
  }

  const user = db.users.find((u: any) => u.username === username && u.password === password && u.isActive);
  if (!user) {
    return res.status(401).json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است.' });
  }

  logActivity(db, 'ورود به سامانه', 'احراز هویت', `کاربر ${user.fullName} وارد شد.`);
  writeDB(db);

  return res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  });
});

// Update Settings
app.post('/api/settings', (req: Request, res: Response) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  logActivity(db, 'ویرایش تنظیمات', 'تنظیمات', 'تنظیمات کلی سامانه به‌روزرسانی شد.');
  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// Generic entity creation
app.post('/api/entities/:collection', (req: Request, res: Response) => {
  const { collection } = req.params;
  const db = readDB();
  if (!db[collection]) db[collection] = [];

  const item = {
    ...req.body,
    id: req.body.id || `${collection.slice(0, 3)}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  db[collection].unshift(item);
  logActivity(db, 'افزودن رکورد', collection, `رکورد جدید با شناسه ${item.id} در ${collection} ثبت شد.`);
  writeDB(db);

  res.json({ success: true, item });
});

// Generic entity update
app.put('/api/entities/:collection/:id', (req: Request, res: Response) => {
  const { collection, id } = req.params;
  const db = readDB();
  if (!db[collection]) return res.status(404).json({ success: false, message: 'مجموعه یافت نشد.' });

  const idx = db[collection].findIndex((it: any) => it.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'رکورد یافت نشد.' });

  db[collection][idx] = { ...db[collection][idx], ...req.body, updatedAt: new Date().toISOString() };
  logActivity(db, 'ویرایش رکورد', collection, `رکورد ${id} در ${collection} ویرایش شد.`);
  writeDB(db);

  res.json({ success: true, item: db[collection][idx] });
});

// Generic entity delete
app.delete('/api/entities/:collection/:id', (req: Request, res: Response) => {
  const { collection, id } = req.params;
  const db = readDB();
  if (!db[collection]) return res.status(404).json({ success: false, message: 'مجموعه یافت نشد.' });

  // Prevent deleting categories that have parts
  if (collection === 'categories') {
    const hasParts = db.parts?.some((p: any) => p.categoryId === id);
    if (hasParts) {
      return res.status(400).json({ success: false, message: 'این دسته‌بندی دارای کالای متصل است و قابل حذف مستقیم نیست.' });
    }
  }

  // Prevent deleting brands that have parts
  if (collection === 'brands') {
    const hasParts = db.parts?.some((p: any) => p.brandId === id);
    if (hasParts) {
      return res.status(400).json({ success: false, message: 'این برند دارای کالای متصل است. می‌توانید آن را غیرفعال کنید.' });
    }
  }

  db[collection] = db[collection].filter((it: any) => it.id !== id);
  logActivity(db, 'حذف رکورد', collection, `رکورد ${id} از ${collection} حذف شد.`);
  writeDB(db);

  res.json({ success: true, id });
});

// Bulk Import Parts & Price Updates from Excel/CSV/JSON
app.post('/api/parts/bulk-import', (req: Request, res: Response) => {
  const { items, stockMode = 'ADD', warehouseId = 'wh-1' } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'هیچ قلم کالایی برای ورود ارسال نشده است.' });
  }

  const db = readDB();
  let addedCount = 0;
  let updatedCount = 0;

  for (const item of items) {
    const rawName = (item.name || '').trim();
    if (!rawName) continue;

    const barcode = (item.barcode || '').trim();
    const technicalCode = (item.technicalCode || '').trim();
    const internalCode = (item.internalCode || '').trim();

    // Match existing part
    let existingPart = null;
    if (barcode) {
      existingPart = db.parts.find((p: any) => p.barcode && p.barcode.trim() === barcode);
    }
    if (!existingPart && technicalCode) {
      existingPart = db.parts.find((p: any) => p.technicalCode && p.technicalCode.trim().toLowerCase() === technicalCode.toLowerCase());
    }
    if (!existingPart && internalCode) {
      existingPart = db.parts.find((p: any) => p.internalCode && p.internalCode.trim().toLowerCase() === internalCode.toLowerCase());
    }
    if (!existingPart) {
      existingPart = db.parts.find((p: any) => p.name.trim().toLowerCase() === rawName.toLowerCase());
    }

    const salePrice = Number(item.salePrice) || 0;
    const purchasePrice = Number(item.purchasePrice) || 0;
    const importedQty = item.currentStock !== undefined && item.currentStock !== null && !isNaN(Number(item.currentStock))
      ? Number(item.currentStock)
      : null;

    if (existingPart) {
      // Update existing part prices & data
      if (salePrice > 0) existingPart.salePrice = salePrice;
      if (purchasePrice > 0) {
        existingPart.lastPurchasePrice = purchasePrice;
        if (!existingPart.weightedAvgCost || existingPart.weightedAvgCost === 0) {
          existingPart.weightedAvgCost = purchasePrice;
        }
      }
      if (barcode && !existingPart.barcode) existingPart.barcode = barcode;
      if (technicalCode && !existingPart.technicalCode) existingPart.technicalCode = technicalCode;

      // Handle stock if provided
      if (importedQty !== null && importedQty >= 0) {
        const oldStock = existingPart.currentStock || 0;
        let newStock = oldStock;
        if (stockMode === 'ADD') {
          newStock = oldStock + importedQty;
        } else {
          newStock = importedQty;
        }
        existingPart.currentStock = newStock;

        if (newStock !== oldStock) {
          db.stockMovements.unshift({
            id: 'sm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
            partId: existingPart.id,
            partName: existingPart.name,
            warehouseId,
            type: newStock > oldStock ? 'IN' : 'ADJUSTMENT',
            quantity: Math.abs(newStock - oldStock),
            unitPrice: existingPart.weightedAvgCost || purchasePrice || salePrice,
            referenceType: 'FILE_IMPORT',
            description: `به‌روزرسانی گروهی از طریق فایل (${stockMode === 'ADD' ? 'افزودن موجودی' : 'تنظیم موجودی'})`,
            userId: 'u-1',
            userName: 'سیستم موهان',
            createdAt: new Date().toISOString(),
          });
        }
      }
      updatedCount++;
    } else {
      // Add as NEW part
      let matchedCategoryId = item.categoryId;
      if (!matchedCategoryId && item.categoryName) {
        const c = db.categories.find((cat: any) => cat.name.includes(item.categoryName) || item.categoryName.includes(cat.name));
        if (c) matchedCategoryId = c.id;
      }
      if (!matchedCategoryId) matchedCategoryId = db.categories[0]?.id || 'cat-1';

      let matchedBrandId = item.brandId;
      if (!matchedBrandId && item.brandName) {
        const b = db.brands.find((br: any) => br.name.toLowerCase() === item.brandName.toLowerCase());
        if (b) matchedBrandId = b.id;
      }

      const initialQty = importedQty !== null ? Math.max(0, importedQty) : 0;
      const newPartId = `prt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newPart = {
        id: newPartId,
        internalCode: internalCode || `PRT-${String(db.parts.length + 1001).padStart(4, '0')}`,
        name: rawName,
        technicalCode: technicalCode || '',
        barcode: barcode || '',
        categoryId: matchedCategoryId,
        brandId: matchedBrandId || '',
        salePrice: salePrice,
        lastPurchasePrice: purchasePrice,
        weightedAvgCost: purchasePrice > 0 ? purchasePrice : salePrice,
        currentStock: initialQty,
        minStockAlert: 3,
        unit: item.unit || 'عدد',
        compatibleVehicles: Array.isArray(item.compatibleVehicles) ? item.compatibleVehicles : [],
        createdAt: new Date().toISOString(),
      };

      db.parts.unshift(newPart);

      if (initialQty > 0) {
        db.stockMovements.unshift({
          id: 'sm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
          partId: newPartId,
          partName: rawName,
          warehouseId,
          type: 'IN',
          quantity: initialQty,
          unitPrice: purchasePrice || salePrice,
          referenceType: 'FILE_IMPORT',
          description: `ورود اولیه کالا از فایل اکسل/CSV`,
          userId: 'u-1',
          userName: 'سیستم موهان',
          createdAt: new Date().toISOString(),
        });
      }
      addedCount++;
    }
  }

  logActivity(db, 'ورود گروهی فایل', 'کالاها', `فایل با موفقیت پردازش شد: ${addedCount} کالای جدید افزوده و قیمت/مشخصات ${updatedCount} کالا به‌روزرسانی شد.`);
  writeDB(db);

  return res.json({
    success: true,
    addedCount,
    updatedCount,
    totalProcessed: addedCount + updatedCount,
  });
});

// Sales Invoice Creation with atomic transaction
app.post('/api/invoices/sales', (req: Request, res: Response) => {
  const invoiceData = req.body;
  const db = readDB();

  // Validate negative stock policy
  if (!db.settings.allowNegativeStock && invoiceData.type === 'SALE') {
    for (const line of invoiceData.items) {
      const part = db.parts.find((p: any) => p.id === line.partId);
      if (part && (part.currentStock || 0) < line.quantity) {
        return res.status(400).json({
          success: false,
          message: `موجودی قطعه "${part.name}" کافی نیست. موجودی فعلی: ${part.currentStock || 0}، درخواستی: ${line.quantity}`,
        });
      }
    }
  }

  // Create invoice
  const newInvoice = {
    ...invoiceData,
    id: 'inv-' + Date.now(),
    createdAt: new Date().toISOString(),
    status: 'COMPLETED',
  };

  db.invoices.unshift(newInvoice);

  // If finalized sale (not proforma draft), update inventory and customer ledger
  if (newInvoice.type === 'SALE') {
    for (const line of newInvoice.items) {
      const part = db.parts.find((p: any) => p.id === line.partId);
      if (part) {
        part.currentStock = (part.currentStock || 0) - line.quantity;
        // Record stock movement
        db.stockMovements.unshift({
          id: 'sm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
          partId: part.id,
          partName: part.name,
          warehouseId: newInvoice.warehouseId || 'wh-1',
          type: 'OUT',
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          referenceType: 'SALE',
          referenceId: newInvoice.invoiceNumber,
          description: `فروش فاکتور ${newInvoice.invoiceNumber} به ${newInvoice.customerName}`,
          userId: 'u-1',
          userName: newInvoice.createdBy || 'فروشنده',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Update customer balance if debt exists
    if (newInvoice.customerId && newInvoice.remainingAmount > 0) {
      const customer = db.customers.find((c: any) => c.id === newInvoice.customerId);
      if (customer) {
        customer.balance = (customer.balance || 0) - newInvoice.remainingAmount; // customer owes store
      }
    }

    // Update Cash Register or Bank if payment received
    if (newInvoice.paidAmount > 0) {
      if (newInvoice.paymentMethod === 'CASH') {
        const cashReg = db.cashRegisters.find((cr: any) => cr.isDefault) || db.cashRegisters[0];
        if (cashReg) cashReg.balance = (cashReg.balance || 0) + newInvoice.paidAmount;
      }
    }
  }

  logActivity(db, 'صدور فاکتور', 'فروش', `فاکتور شماره ${newInvoice.invoiceNumber} با مبلغ ${newInvoice.grandTotal} تومان صادر شد.`);
  writeDB(db);

  res.json({ success: true, invoice: newInvoice });
});

// Delete/Cancel Sales Invoice with stock restoration
app.delete('/api/invoices/sales/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const invIdx = db.invoices.findIndex((i: any) => i.id === id);
  if (invIdx === -1) {
    return res.status(404).json({ success: false, message: 'فاکتور مورد نظر یافت نشد.' });
  }

  const invoice = db.invoices[invIdx];
  // If it was a SALE, restore stock
  if (invoice.type === 'SALE' && invoice.items) {
    for (const line of invoice.items) {
      if (line.partId) {
        const part = db.parts.find((p: any) => p.id === line.partId);
        if (part) {
          part.currentStock = (part.currentStock || 0) + line.quantity;
        }
      }
    }
    // Reverse customer debt if applicable
    if (invoice.customerId && invoice.remainingAmount > 0) {
      const customer = db.customers.find((c: any) => c.id === invoice.customerId);
      if (customer) {
        customer.balance = (customer.balance || 0) + invoice.remainingAmount;
      }
    }
  }

  db.invoices.splice(invIdx, 1);
  logActivity(db, 'ابطال/حذف فاکتور', 'فروش', `فاکتور شماره ${invoice.invoiceNumber} حذف و ابطال شد.`);
  writeDB(db);

  res.json({ success: true, message: 'فاکتور با موفقیت حذف شد.' });
});

// Purchase Invoice Creation
app.post('/api/invoices/purchase', (req: Request, res: Response) => {
  const purchaseData = req.body;
  const db = readDB();

  const newPurchase = {
    ...purchaseData,
    id: 'pur-' + Date.now(),
    createdAt: new Date().toISOString(),
  };

  db.purchaseInvoices.unshift(newPurchase);

  // Increase stock for each item and recalculate weighted average cost
  for (const line of newPurchase.items) {
    const part = db.parts.find((p: any) => p.id === line.partId);
    if (part) {
      const oldStock = part.currentStock || 0;
      const oldCost = part.weightedAvgCost || part.lastPurchasePrice || 0;
      const newQty = line.quantity;
      const newCost = line.unitPrice;

      // Weighted average cost formula: (oldStock * oldCost + newQty * newCost) / (oldStock + newQty)
      const totalUnits = oldStock + newQty;
      const weightedAvg = totalUnits > 0
        ? Math.round(((oldStock * oldCost) + (newQty * newCost)) / totalUnits)
        : newCost;

      part.currentStock = totalUnits;
      part.lastPurchasePrice = newCost;
      part.weightedAvgCost = weightedAvg;

      // Record stock movement
      db.stockMovements.unshift({
        id: 'sm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        partId: part.id,
        partName: part.name,
        warehouseId: newPurchase.warehouseId || 'wh-1',
        type: 'IN',
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        referenceType: 'PURCHASE',
        referenceId: newPurchase.invoiceNumber,
        description: `خرید فاکتور ${newPurchase.invoiceNumber} از ${newPurchase.supplierName}`,
        userId: 'u-1',
        userName: 'مدیر خرید',
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Update supplier balance if balance due
  if (newPurchase.supplierId && newPurchase.remainingAmount > 0) {
    const supplier = db.suppliers.find((s: any) => s.id === newPurchase.supplierId);
    if (supplier) {
      supplier.balance = (supplier.balance || 0) + newPurchase.remainingAmount; // store owes supplier
    }
  }

  logActivity(db, 'ثبت فاکتور خرید', 'خرید', `فاکتور خرید شماره ${newPurchase.invoiceNumber} از ${newPurchase.supplierName} ثبت شد.`);
  writeDB(db);

  res.json({ success: true, purchase: newPurchase });
});

// Stock Adjustment (انبارگردانی و اصلاح موجودی)
app.post('/api/stock/adjust', (req: Request, res: Response) => {
  const { partId, warehouseId, newQuantity, reason, userName } = req.body;
  const db = readDB();

  const part = db.parts.find((p: any) => p.id === partId);
  if (!part) return res.status(404).json({ success: false, message: 'قطعه یافت نشد.' });

  const oldStock = part.currentStock || 0;
  const diff = newQuantity - oldStock;
  part.currentStock = newQuantity;

  db.stockMovements.unshift({
    id: 'sm-' + Date.now(),
    partId: part.id,
    partName: part.name,
    warehouseId: warehouseId || 'wh-1',
    type: 'ADJUSTMENT',
    quantity: diff,
    unitPrice: part.weightedAvgCost || part.lastPurchasePrice || 0,
    referenceType: 'STOCKTAKE',
    description: `اصلاح انبارگردانی: از ${oldStock} به ${newQuantity}. دلیل: ${reason || 'شمارش فیزیکی'}`,
    userId: 'u-1',
    userName: userName || 'انباردار',
    createdAt: new Date().toISOString(),
  });

  logActivity(db, 'انبارگردانی', 'انبار', `موجودی قطعه "${part.name}" از ${oldStock} به ${newQuantity} اصلاح شد.`);
  writeDB(db);

  res.json({ success: true, part });
});

// Full Backup Export
app.get('/api/backup/export', (_req: Request, res: Response) => {
  const db = readDB();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="mohan-autoparts-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.send(JSON.stringify(db, null, 2));
});

// Full Backup Restore
app.post('/api/backup/restore', (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload || !payload.categories || !Array.isArray(payload.categories)) {
    return res.status(400).json({ success: false, message: 'فایل پشتیبان معتبر نیست.' });
  }

  writeDB(payload);
  res.json({ success: true, message: 'اطلاعات با موفقیت بازیابی شد.' });
});

// ======================== GEMINI AI ROUTES ========================

// Auto Parts Smart Technical Analyzer
app.post('/api/gemini/analyze-part', async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ success: false, message: 'کلید اتصال به هوش مصنوعی در سرور یافت نشد.' });
    }

    const { partName, technicalCode, brandName } = req.body;
    const db = readDB();
    const categoryNames = db.categories.map((c: any) => c.name).join('، ');

    const prompt = `شما یک کارشناس ارشد قطعات خودروهای ایرانی و خارجی (سایپا، ایران‌خودرو، پژو، پراید، تارا، دنا، ال۹۰، هیوندای، کیا و ...) هستید.
اطلاعات قطعه ورودی:
نام قطعه: ${partName || 'نامشخص'}
کد فنی / OEM: ${technicalCode || 'نامشخص'}
برند: ${brandName || 'نامشخص'}

فهرست ۶۷ دسته‌بندی معتبر فروشگاه ما:
${categoryNames}

لطفاً اطلاعات زیر را با دقت بالا تحلیل کرده و فقط در قالب JSON با ساختار زیر بازگردانید:
{
  "matchedCategory": "یکی از دقیق‌ترین دسته‌بندی‌های ۶۷‌گانه از فهرست بالا",
  "technicalDetails": "توضیحات فنی، جنس قطعه و محل نصب",
  "compatibleVehicles": ["خودرو ۱", "خودرو ۲", "خودرو ۳"],
  "oemCrossReferences": ["کد فنی معادل ۱", "کد معادل ۲"],
  "suggestedMarginPercentage": 25,
  "inspectionTips": "نکات مهم بررسی سلامت فیزیکی و اصالت هنگام دریافت"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error('Gemini analyze-part error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطا در تحلیل هوش مصنوعی' });
  }
});

// Smart Assistant with high thinking capability (gemini-3.1-pro-preview / ThinkingLevel.HIGH)
app.post('/api/gemini/assistant', async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ success: false, message: 'سرویس هوش مصنوعی هنوز در سرور پیکربندی نشده است.' });
    }

    const { query, mode } = req.body;
    const db = readDB();

    // Summary of real current stats for context
    const partsCount = db.parts?.length || 0;
    const lowStockCount = db.parts?.filter((p: any) => (p.currentStock || 0) <= (p.minStockAlert || 3)).length || 0;
    const invoicesCount = db.invoices?.length || 0;
    const totalSales = db.invoices?.reduce((sum: number, inv: any) => sum + (inv.grandTotal || 0), 0) || 0;

    const systemInstruction = `شما دستیار هوشمند و مشاور ارشد سیستم مدیریت و حسابداری قطعات خودرو "موهان" (MOHAN) هستید.
وظیفه شما:
- پاسخ تخصصی، محترمانه، به زبان فارسی و با ادبیات مالی و تخصصی لوازم یدکی.
- ارائه راهکار برای تحلیل گردش انبار، قطعات پرمصرف، قیمت‌گذاری سودآور و ارتباط با مشتریان.
- آمار واقعی سامانه تا این لحظه:
  * تعداد کل قطعات ثبت‌شده: ${partsCount}
  * تعداد قطعات کم‌موجود: ${lowStockCount}
  * تعداد فاکتورهای فروش: ${invoicesCount}
  * جمع کل فروش: ${totalSales} تومان
اگر داده‌ای در سیستم هنوز ثبت نشده است، صادقانه اعلام کنید داده کافی وجود ندارد.`;

    // If deep reasoning is requested, use gemini-3.1-pro-preview with HIGH thinking level as requested in prompt instructions!
    if (mode === 'deep_thinking') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: query,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });
      return res.json({ success: true, answer: response.text, modelUsed: 'gemini-3.1-pro-preview (تفکر عمیق)' });
    }

    // Default fast/general reasoning with gemini-3.8-flash
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: query,
      config: {
        systemInstruction,
      },
    });

    return res.json({ success: true, answer: response.text, modelUsed: 'gemini-3.8-flash' });
  } catch (error: any) {
    console.error('Gemini assistant error:', error);
    res.status(500).json({ success: false, message: error.message || 'خطا در برقراری ارتباط با مدل هوش مصنوعی' });
  }
});

// Smart Invoice Text Parser
app.post('/api/gemini/parse-invoice', async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ success: false, message: 'هوش مصنوعی فعال نیست.' });
    }

    const { rawText } = req.body;
    const prompt = `شما یک دستیار حسابداری فروشگاه لوازم یدکی خودرو هستید. متن پیش‌نویس یا شرح فاکتور زیر را بخوانید و ردیف‌های اقلام را استخراج کنید:
متن:
"${rawText}"

خروجی باید به صورت آرایه‌ای از اقلام با ساختار JSON زیر باشد:
{
  "customerName": "نام مشتری در صورت وجود",
  "items": [
    {
      "partName": "نام قطعه",
      "quantity": 2,
      "unitPrice": 450000,
      "discount": 0
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'خطا در پردازش هوشمند متن فاکتور' });
  }
});

// Smart File & Image Scanner (OCR / Vision for invoices, receipts, and price sheets)
app.post('/api/gemini/scan-file', async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ success: false, message: 'سرویس هوش مصنوعی هنوز در سرور فعال نشده است.' });
    }

    const { imageBase64, mimeType = 'image/jpeg', rawText } = req.body;

    const prompt = `شما یک کارشناس حسابداری و انبارداری قطعات خودرو در «برنامه حسابداری موهان» هستید.
وظیفه شما استخراج دقیق اقلام کالا، کد فنی، قیمت‌ها و تعداد از روی این سند (تصویر فاکتور/لیست قیمت/متن) است.
قوانین استخراج:
۱. نام دقیق قطعه را استخراج یا اصلاح کنید (مثال: لنت ترمز جلو، تسمه تایم، دیسک و صفحه، شمع موتور).
۲. در صورت وجود کد فنی یا شماره فنی (OEM / Part Number)، آن را استخراج کنید.
۳. قیمت خرید یا قیمت فروش را استخراج کنید و تبدیل به عدد صحیح تومان کنید (اگر ریال بود به تومان تبدیل کنید یا صفر بگذارید).
۴. تعداد (quantity) را در صورت وجود استخراج کنید، اگر ذکر نشده بود عدد ۱ بگذارید.
۵. واحد شمارش (unit) معمولاً «عدد»، «دست»، «حلقه» یا «جفت» است.
۶. خروجی باید حتماً و فقط یک JSON با ساختار زیر باشد:
{
  "documentType": "نوع سند (مثلاً فاکتور خرید، لیست قیمت، پیش‌فاکتور)",
  "vendorName": "نام تأمین‌کننده یا فروشنده در صورت وجود",
  "items": [
    {
      "name": "نام کالا",
      "technicalCode": "کد فنی یا خالی",
      "purchasePrice": 0,
      "salePrice": 0,
      "quantity": 1,
      "unit": "عدد",
      "category": "دسته‌بندی احتمالی",
      "brand": "برند سازنده در صورت وجود"
    }
  ]
}`;

    let contents: any;
    if (imageBase64) {
      // Strip potential data URL prefix
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      contents = [
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        },
      ];
    } else if (rawText) {
      contents = `${prompt}\n\nمتن ورودی:\n${rawText}`;
    } else {
      return res.status(400).json({ success: false, message: 'تصویر یا متنی ارسال نشده است.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{"items":[]}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in scan-file:', error);
    res.status(500).json({ success: false, message: error.message || 'خطا در اسکن هوشمند فایل' });
  }
});

// ======================== MOUNT VITE ========================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 سرور سامانه حسابداری و قطعات خودرو موهان در پورت ${PORT} آماده به کار است.`);
  });
}

startServer();
