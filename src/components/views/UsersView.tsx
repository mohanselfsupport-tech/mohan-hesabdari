import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAccount } from '../../types';
import { ShieldCheck, Plus, User, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { toPersianDigits, formatPersianDate } from '../../utils/formatters';

export const UsersView: React.FC = () => {
  const { users, currentUser, createOrUpdateEntity, deleteEntity, showToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SELLER' | 'WAREHOUSEMAN' | 'ACCOUNTANT'>('SELLER');

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'مدیر اصلی سیستم',
    ADMIN: 'مدیر داخلی',
    SELLER: 'فروشنده / صندوقدار',
    WAREHOUSEMAN: 'انباردار',
    ACCOUNTANT: 'حسابدار',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('نام کاربری و رمز عبور الزامی است.', 'error');
      return;
    }

    const payload: Partial<UserAccount> = {
      username: username.trim(),
      fullName: fullName.trim() || username.trim(),
      role,
      isActive: true,
    };

    const ok = await createOrUpdateEntity('users', { ...payload, password: password.trim() });
    if (ok) {
      setIsModalOpen(false);
      setUsername('');
      setPassword('');
      setFullName('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              کاربران، کارمندان و سطوح دسترسی
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تعریف حساب کاربری برای فروشندگان، انبارداران و حسابداران با نقش‌های مجزا
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن کاربر جدید</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
            <tr>
              <th className="p-3 w-12 text-center">#</th>
              <th className="p-3">نام و نام خانوادگی</th>
              <th className="p-3">نام کاربری</th>
              <th className="p-3">نقش و سطح دسترسی</th>
              <th className="p-3">تاریخ ایجاد</th>
              <th className="p-3 text-center">وضعیت</th>
              <th className="p-3 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u, idx) => (
              <tr key={u.id}>
                <td className="p-3 text-center font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                <td className="p-3 font-bold">{u.fullName}</td>
                <td className="p-3 font-mono text-slate-500">{u.username}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                    {roleLabels[u.role] || u.role}
                  </span>
                </td>
                <td className="p-3 text-slate-500">{formatPersianDate(u.createdAt)}</td>
                <td className="p-3 text-center">
                  <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> فعال
                  </span>
                </td>
                <td className="p-3 text-center">
                  {u.role !== 'SUPER_ADMIN' && (
                    <button onClick={() => deleteEntity('users', u.id)} className="text-slate-400 hover:text-rose-500 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 text-xs border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">تعریف کاربر جدید</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">نام و نام خانوادگی *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: رضا محمدی"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">نام کاربری (جهت ورود) *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="reza_sales"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">رمز عبور *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">نقش سازمانی</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="SELLER">فروشنده / صندوقدار</option>
                  <option value="WAREHOUSEMAN">انباردار</option>
                  <option value="ACCOUNTANT">حسابدار</option>
                  <option value="ADMIN">مدیر داخلی</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500">انصراف</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 font-bold text-slate-950 rounded-xl">ایجاد حساب کاربر</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
