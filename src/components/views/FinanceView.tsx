import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BankAccount, Expense, BankCheck } from '../../types';
import {
  DollarSign,
  Building2,
  Receipt,
  CheckSquare,
  Plus,
  Trash2,
  CreditCard,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import {
  toPersianDigits,
  formatPersianCurrency,
  formatPersianDate,
  getTodayJalali,
} from '../../utils/formatters';

export const FinanceView: React.FC = () => {
  const {
    cashRegisters,
    bankAccounts,
    expenses,
    checks,
    settings,
    createOrUpdateEntity,
    deleteEntity,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'CASH_BANK' | 'EXPENSES' | 'CHECKS'>('CASH_BANK');

  // Modals
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);

  // Bank form
  const [bankName, setBankName] = useState('بانک ملت');
  const [accountNumber, setAccountNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [bankBalance, setBankBalance] = useState(0);

  // Expense form
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('اجاره و شارژ');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseSource, setExpenseSource] = useState<'CASH' | 'BANK'>('CASH');
  const [expenseDescription, setExpenseDescription] = useState('');

  // Check form
  const [checkNumber, setCheckNumber] = useState('');
  const [checkBank, setCheckBank] = useState('صادرات');
  const [drawerName, setDrawerName] = useState('');
  const [checkAmount, setCheckAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [checkType, setCheckType] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');
  const [checkStatus, setCheckStatus] = useState<any>('IN_VAULT');

  // Total funds
  const totalCash = cashRegisters.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalBank = bankAccounts.reduce((sum, b) => sum + (b.balance || 0), 0);
  const totalLiquid = totalCash + totalBank;

  // Handle Bank Submit
  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) return;
    const payload: Partial<BankAccount> = {
      bankName,
      accountNumber: accountNumber.trim(),
      cardNumber: cardNumber.trim() || undefined,
      ownerName: ownerName.trim() || 'فروشگاه موهان',
      balance: Number(bankBalance) || 0,
    };
    const ok = await createOrUpdateEntity('bankAccounts', payload);
    if (ok) {
      setIsBankModalOpen(false);
      setAccountNumber('');
      setCardNumber('');
    }
  };

  // Handle Expense Submit
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || expenseAmount <= 0) return;
    const payload: Partial<Expense> = {
      title: expenseTitle.trim(),
      category: expenseCategory,
      amount: Number(expenseAmount),
      date: new Date().toISOString(),
      paymentSource: expenseSource,
      sourceId: expenseSource === 'CASH' ? 'cr-1' : bankAccounts[0]?.id || 'bank-1',
      description: expenseDescription.trim() || undefined,
    };
    const ok = await createOrUpdateEntity('expenses', payload);
    if (ok) {
      setIsExpenseModalOpen(false);
      setExpenseTitle('');
      setExpenseAmount(0);
      setExpenseDescription('');
    }
  };

  // Handle Check Submit
  const handleCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkNumber.trim() || checkAmount <= 0) return;
    const payload: Partial<BankCheck> = {
      checkNumber: checkNumber.trim(),
      bankName: checkBank,
      drawerName: drawerName.trim(),
      amount: Number(checkAmount),
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      type: checkType,
      status: checkStatus,
    };
    const ok = await createOrUpdateEntity('checks', payload);
    if (ok) {
      setIsCheckModalOpen(false);
      setCheckNumber('');
      setCheckAmount(0);
      setDrawerName('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              امور مالی، صندوق، بانک، هزینه‌ها و چک‌ها
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مدیریت موجودی نقد، حساب‌های بانکی، ثبت مخارج فروشگاه و وضعیت چک‌های صیادی
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('CASH_BANK')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'CASH_BANK'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            صندوق و بانک
          </button>
          <button
            onClick={() => setActiveTab('EXPENSES')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'EXPENSES'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            هزینه‌ها ({toPersianDigits(expenses.length)})
          </button>
          <button
            onClick={() => setActiveTab('CHECKS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'CHECKS'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            دفتر چک‌ها ({toPersianDigits(checks.length)})
          </button>
        </div>
      </div>

      {/* Financial Top Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">موجودی صندوق نقدی</span>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {formatPersianCurrency(totalCash, settings.currency)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">موجودی حساب‌های بانکی</span>
          <div className="text-lg font-black text-blue-600 dark:text-blue-400">
            {formatPersianCurrency(totalBank, settings.currency)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">کل نقدینگی فروشگاه موهان</span>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400">
            {formatPersianCurrency(totalLiquid, settings.currency)}
          </div>
        </div>
      </div>

      {/* CASH & BANK TAB */}
      {activeTab === 'CASH_BANK' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">حساب‌های بانکی و پوز</h3>
            <button
              onClick={() => setIsBankModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن حساب بانکی</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cash Drawer Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  صندوق اصلی فروشگاه
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 font-bold">
                  پیش‌فرض دریافت‌های نقدی
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {formatPersianCurrency(totalCash, settings.currency)}
              </div>
              <p className="text-[11px] text-slate-400">
                وجوه دریافتی از فاکتورهای فروش نقدی مستقیماً در این صندوق محاسبه می‌شود.
              </p>
            </div>

            {/* Bank accounts */}
            {bankAccounts.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    {b.bankName} - {b.ownerName}
                  </span>
                  <button
                    onClick={() => deleteEntity('bankAccounts', b.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {formatPersianCurrency(b.balance, settings.currency)}
                </div>
                <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
                  <div>شماره حساب: {toPersianDigits(b.accountNumber)}</div>
                  {b.cardNumber && <div>شماره کارت: {toPersianDigits(b.cardNumber)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXPENSES TAB */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">فهرست مخارج و هزینه‌های جاری</h3>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ثبت هزینه جدید</span>
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
              هنوز هزینه‌ای ثبت نشده است.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">عنوان هزینه</th>
                    <th className="p-3">دسته‌بندی</th>
                    <th className="p-3">تاریخ</th>
                    <th className="p-3">منبع پرداخت</th>
                    <th className="p-3 text-left">مبلغ ({settings.currency})</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {expenses.map((exp, idx) => (
                    <tr key={exp.id}>
                      <td className="p-3 text-center font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                      <td className="p-3 font-bold">{exp.title}</td>
                      <td className="p-3 text-slate-500">{exp.category}</td>
                      <td className="p-3 text-slate-500">{formatPersianDate(exp.date)}</td>
                      <td className="p-3">{exp.paymentSource === 'CASH' ? 'صندوق نقدی' : 'بانک'}</td>
                      <td className="p-3 text-left font-mono font-bold text-rose-600">
                        {formatPersianCurrency(exp.amount, '')}
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => deleteEntity('expenses', exp.id)} className="text-slate-400 hover:text-rose-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CHECKS TAB */}
      {activeTab === 'CHECKS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">دفتر ثبت چک‌های صیادی دریافتی و پرداختی</h3>
            <button
              onClick={() => setIsCheckModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ثبت چک جدید</span>
            </button>
          </div>

          {checks.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
              هیچ چکی در دفتر چک ثبت نشده است.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">شماره صیادی</th>
                    <th className="p-3">بانک و صادرکننده</th>
                    <th className="p-3">سررسید</th>
                    <th className="p-3">نوع چک</th>
                    <th className="p-3 text-left">مبلغ ({settings.currency})</th>
                    <th className="p-3 text-center">وضعیت</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {checks.map((c, idx) => (
                    <tr key={c.id}>
                      <td className="p-3 text-center font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                      <td className="p-3 font-mono font-bold">{toPersianDigits(c.checkNumber)}</td>
                      <td className="p-3">
                        <span className="block font-bold">{c.bankName}</span>
                        <span className="text-[11px] text-slate-400">{c.drawerName}</span>
                      </td>
                      <td className="p-3 font-mono">{toPersianDigits(c.dueDate)}</td>
                      <td className="p-3">{c.type === 'RECEIVABLE' ? 'دریافتی از مشتری' : 'پرداختی به تأمین‌کننده'}</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-900 dark:text-white">
                        {formatPersianCurrency(c.amount, '')}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                          {c.status === 'IN_VAULT' && 'در صندوق'}
                          {c.status === 'CLEARED' && 'وصول‌شده'}
                          {c.status === 'BOUNCED' && 'برگشتی'}
                          {c.status === 'PAID' && 'پرداخت‌شده'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => deleteEntity('checks', c.id)} className="text-slate-400 hover:text-rose-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Bank Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 text-xs border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">تعریف حساب بانکی جدید</h3>
            <form onSubmit={handleBankSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">نام بانک *</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">شماره حساب *</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">شماره کارت (متصل به پوز)</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">صاحب حساب</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="فروشگاه موهان"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">موجودی اولیه ({settings.currency})</label>
                <input
                  type="number"
                  value={bankBalance}
                  onChange={(e) => setBankBalance(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsBankModalOpen(false)} className="px-4 py-2 text-slate-500">انصراف</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 font-bold text-slate-950 rounded-xl">ذخیره حساب</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 text-xs border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">ثبت هزینه جدید</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">عنوان هزینه *</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="اجاره مغازه، قبض برق، حقوق، حمل و نقل..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">دسته‌بندی هزینه</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="اجاره و شارژ">اجاره و شارژ</option>
                    <option value="قبوض و انرژی">قبوض و انرژی</option>
                    <option value="حقوق و دستمزد">حقوق و دستمزد</option>
                    <option value="پیک و حمل و نقل">پیک و حمل و نقل</option>
                    <option value="تبلیغات و پیامک">تبلیغات و پیامک</option>
                    <option value="ملزومات و بسته‌بندی">ملزومات و بسته‌بندی</option>
                    <option value="سایر">سایر</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">منبع پرداخت</label>
                  <select
                    value={expenseSource}
                    onChange={(e) => setExpenseSource(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="CASH">صندوق نقدی</option>
                    <option value="BANK">کارتخوان / بانک</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">مبلغ هزینه ({settings.currency}) *</label>
                <input
                  type="number"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 text-slate-500">انصراف</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 font-bold text-slate-950 rounded-xl">ثبت هزینه</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Check Modal */}
      {isCheckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 text-xs border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">ثبت چک صیادی</h3>
            <form onSubmit={handleCheckSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">شناسه ۱۶ رقمی صیادی *</label>
                <input
                  type="text"
                  required
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  placeholder="۱۲۳۴-۵۶۷۸-۹۰۱۲-۳۴۵۶"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">بانک صادرکننده</label>
                  <input
                    type="text"
                    value={checkBank}
                    onChange={(e) => setCheckBank(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">صاحب چک / متعهد</label>
                  <input
                    type="text"
                    value={drawerName}
                    onChange={(e) => setDrawerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">مبلغ چک ({settings.currency}) *</label>
                  <input
                    type="number"
                    required
                    value={checkAmount}
                    onChange={(e) => setCheckAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">تاریخ سررسید (شمسی)</label>
                  <input
                    type="text"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="۱۴۰۳/۰۸/۱۵"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsCheckModalOpen(false)} className="px-4 py-2 text-slate-500">انصراف</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 font-bold text-slate-950 rounded-xl">ثبت در دفتر چک</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
