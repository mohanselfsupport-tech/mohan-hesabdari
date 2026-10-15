import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { MohanLogo } from './MohanLogo';
import { RippleButton } from './common/RippleButton';
import { Lock, User, ArrowLeft, KeyRound } from 'lucide-react';

interface InitialSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InitialSetupModal: React.FC<InitialSetupModalProps> = ({ isOpen, onClose }) => {
  const { users, setupAdmin, login, showToast } = useApp();

  const isFirstRun = users.length === 0;

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('مدیر اصلی موهان');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('لطفاً نام کاربری و رمز عبور را وارد کنید.', 'error');
      return;
    }

    setIsLoading(true);
    if (isFirstRun) {
      const ok = await setupAdmin(username.trim(), password.trim(), fullName.trim());
      if (ok) onClose();
    } else {
      const ok = await login(username.trim(), password.trim());
      if (ok) onClose();
    }
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with fade animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={!isFirstRun ? onClose : undefined}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container with scale + fade animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-amber-500/35 shadow-2xl p-6 sm:p-8 space-y-6 text-xs text-right"
          >
            {/* Logo and Greeting */}
            <div className="flex flex-col items-center text-center space-y-3">
              <MohanLogo size="lg" variant="full" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {isFirstRun ? 'راه‌اندازی اولیه حساب مدیر اصلی' : 'ورود امن به برنامه حسابداری موهان'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {isFirstRun
                    ? 'لطفاً مشخصات حساب مدیر سیستم را جهت مدیریت و امنیت اطلاعات تعریف نمایید.'
                    : 'برای دسترسی به پنل مدیریت، نام کاربری و رمز عبور خود را وارد کنید.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isFirstRun && (
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    نام و نام خانوادگی مدیر *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثال: مهندس حسینی"
                      className="w-full pr-10 pl-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  نام کاربری *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pr-10 pl-3 py-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  رمز عبور *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-10 pl-3 py-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              <RippleButton
                type="submit"
                disabled={isLoading}
                variant="primary"
                className="w-full py-3 text-xs font-bold"
                glow
              >
                <span>{isLoading ? 'در حال پردازش...' : isFirstRun ? 'ایجاد حساب مدیر و ورود' : 'ورود به سامانه'}</span>
                <ArrowLeft className="w-4 h-4" />
              </RippleButton>
            </form>

            {!isFirstRun && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  ادامه به عنوان میهمان / بستن
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
