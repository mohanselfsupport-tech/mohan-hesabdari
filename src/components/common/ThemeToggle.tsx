import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useApp();

  const handleClick = (e: React.MouseEvent) => {
    toggleDarkMode(e);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={isDarkMode ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
      title={isDarkMode ? 'حالت روز (روشن)' : 'حالت شب (تاریک)'}
      className={`relative group p-2 rounded-xl transition-all duration-300 overflow-hidden border ${
        isDarkMode
          ? 'bg-slate-800/80 border-slate-700/80 text-amber-300 hover:border-amber-400/50 shadow-sm shadow-amber-500/10'
          : 'bg-amber-50/80 border-amber-200/80 text-amber-700 hover:border-amber-400/50 shadow-sm'
      }`}
    >
      {/* Background ambient glow */}
      <span
        className={`absolute inset-0 rounded-xl transition-opacity duration-500 blur-sm pointer-events-none ${
          isDarkMode
            ? 'bg-amber-400/15 group-hover:opacity-100 opacity-40'
            : 'bg-amber-500/15 group-hover:opacity-100 opacity-30'
        }`}
      />

      {/* Rotating and Morphing Icon Container */}
      <div className="relative w-5 h-5 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isDarkMode ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center text-amber-400"
            >
              <Sun className="w-5 h-5 transition-transform group-hover:rotate-45" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center text-indigo-700"
            >
              <Moon className="w-5 h-5 transition-transform group-hover:-rotate-12" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
};
