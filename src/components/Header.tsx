import React from 'react';
import { Lock, Unlock, Moon, Sun, Store, Calculator } from 'lucide-react';
import { Outlet } from '../types';

interface HeaderProps {
  outlets: Outlet[];
  activeOutletId: number;
  adminUnlocked: boolean;
  hasPin: boolean;
  darkMode: boolean;
  onToggleLock: () => void;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  outlets,
  activeOutletId,
  adminUnlocked,
  hasPin,
  darkMode,
  onToggleLock,
  onToggleDarkMode,
}) => {
  const activeOutlet = outlets.find((o) => o.id === activeOutletId) || outlets[0];

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none flex items-center gap-2 text-slate-900 dark:text-white">
                ERP Cuba{' '}
                <span className="text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                  v6.0
                </span>
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Store className="w-3 h-3 text-emerald-600" />
                {activeOutlet?.name || 'Sucursal Principal'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onToggleLock}
              className={`p-2 rounded-lg font-medium text-xs flex items-center gap-1 transition-all ${
                adminUnlocked
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
              }`}
            >
              {adminUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={onToggleLock}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              adminUnlocked
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-200'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-200'
            }`}
          >
            {adminUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{adminUnlocked ? 'Admin Habilitado' : 'Admin Bloqueado'}</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            title="Cambiar tema"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
