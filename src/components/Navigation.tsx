import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Landmark,
  Users,
  HandCoins,
  History,
  Settings,
  Scale,
  Banknote,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'balance'
  | 'stock'
  | 'caja'
  | 'retiros'
  | 'personal'
  | 'prestamos'
  | 'historial'
  | 'ajustes';

interface NavigationProps {
  activeTab: TabType;
  onSwitchTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSwitchTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'balance', label: 'Balance General', icon: Scale },
    { id: 'stock', label: 'Stock', icon: Boxes },
    { id: 'caja', label: 'Cuentas / ROI', icon: Landmark },
    { id: 'retiros', label: 'Retiros', icon: Banknote },
    { id: 'personal', label: 'Personal', icon: Users },
    { id: 'prestamos', label: 'Préstamos', icon: HandCoins },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'ajustes', label: 'Ajustes', icon: Settings },
  ] as const;

  return (
    <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl overflow-x-auto border border-slate-200/60 dark:border-slate-800">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSwitchTab(tab.id as TabType)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              isActive
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
