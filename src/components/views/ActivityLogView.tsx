import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { History, Search, Clock } from 'lucide-react';
import { toPersianDigits, formatPersianDateTime } from '../../utils/formatters';

export const ActivityLogView: React.FC = () => {
  const { activityLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = activityLogs.filter(
    (l) =>
      l.action.includes(searchTerm) ||
      l.module.includes(searchTerm) ||
      l.details.includes(searchTerm) ||
      l.userName.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              دفتر وقایع و تاریخچه عملیات سیستم (Audit Trail)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ثبت غیرقابل دستکاری کلیه رخدادهای مالی، تغییرات موجودی، صدور فاکتور و ورود کاربران
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در رویدادها، کاربر یا جزئیات..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
          هنوز رویدادی ثبت نشده است.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
              <tr>
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3 w-40">زمان رخداد</th>
                <th className="p-3 w-28">عملیات</th>
                <th className="p-3 w-28">ماژول</th>
                <th className="p-3 w-32">کاربر مجری</th>
                <th className="p-3">شرح کامل عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((log, idx) => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="p-3 text-center font-mono text-slate-400">{toPersianDigits(idx + 1)}</td>
                  <td className="p-3 font-mono text-slate-500">{formatPersianDateTime(log.timestamp)}</td>
                  <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{log.action}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      {log.module}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{log.userName}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
