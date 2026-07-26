import React from 'react';
import {
  TrendingUp,
  Wallet,
  ShoppingBag,
  Receipt,
  HandCoins,
  Lock,
  Plus,
  ClipboardCheck,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { ERPDatabase } from '../types';

interface DashboardViewProps {
  db: ERPDatabase;
  onStartArqueo: () => void;
  onOpenNewProduct: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  db,
  onStartArqueo,
  onOpenNewProduct,
}) => {
  const currentData = db.outletData[db.activeOutletId] || {
    products: [],
    profits: 0,
    capital: 0,
    salesTotal: 0,
    employees: [],
    monthlyExpenses: {},
  };

  // 1. Ganancia Acumulada / Operativa unificada (Account ID 1)
  const gananciaAcc = db.accounts.find((a) => a.id === 1);
  const unifiedProfits = gananciaAcc ? gananciaAcc.balance : currentData.profits;

  // 2. Capital de Trabajo (Dinero líquido recuperado en la cuenta de inversión ID 2)
  const invAcc = db.accounts.find((a) => a.id === 2);
  const capitalDeTrabajo = invAcc ? invAcc.balance : 0;

  // 3. Mercancía activa en stock a precio de costo
  const activeStockCost = currentData.products.reduce((acc, curr) => {
    const totalUnits = curr.boxes * curr.uxc + curr.units;
    return acc + totalUnits * curr.cost;
  }, 0);

  // 4. Fondo de Inversión Total (Mercancía en stock + Capital de Trabajo Líquido)
  const fondoInversionTotal = activeStockCost + capitalDeTrabajo;

  // Préstamos por cobrar
  const outstandingLoans = db.loans
    .filter((l) => l.status === 'active' && l.type === 'receivable')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Egresos del mes
  const monthlyExpensesTotal = db.history
    .filter((h) => h.type === 'Gasto' || h.type === 'Nómina')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Alertas de stock bajo
  const lowStockProducts = currentData.products.filter((p) => {
    const totalUnits = p.boxes * p.uxc + p.units;
    return totalUnits <= p.min * p.uxc;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4">
        {/* Ganancia Acumulada */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ganancia Acumulada</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {unifiedProfits.toLocaleString()} CUP
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Misma cuenta operativa unificada</p>
        </div>

        {/* Capital de Trabajo */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Wallet className="w-3.5 h-3.5 text-blue-500" />
            <span>Capital de Trabajo</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {capitalDeTrabajo.toLocaleString()} CUP
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Recuperado listo para invertir</p>
        </div>

        {/* Ventas del Mes */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
            <span>Ventas Totales</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {currentData.salesTotal.toLocaleString()} CUP
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Facturación acumulada</p>
        </div>

        {/* Egresos */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Receipt className="w-3.5 h-3.5 text-rose-500" />
            <span>Egresos Operativos</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {monthlyExpensesTotal.toLocaleString()} CUP
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Gastos + Nóminas</p>
        </div>

        {/* Préstamos Activos */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <HandCoins className="w-3.5 h-3.5 text-amber-500" />
            <span>Préstamos Activos</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {outstandingLoans.toLocaleString()} CUP
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Por cobrar a deudores</p>
        </div>

        {/* Fondo de Inversión */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-500/30 dark:border-emerald-500/30 shadow-sm ring-2 ring-emerald-500/10">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Fondo de Inversión</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {fondoInversionTotal.toLocaleString()} CUP
          </h3>
          <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Stock + Capital Líquido</p>
        </div>
      </div>

      {/* Detailed Investment Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Seguimiento Patrimonial del Fondo de Inversión
          </h4>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70">
            Mantiene el equilibrio exacto entre la mercancía activa en estantería y el capital retornado listo para operar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">Aún Invertido (Stock)</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
              {activeStockCost.toLocaleString()} CUP
            </span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">Capital de Trabajo Líquido</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              {capitalDeTrabajo.toLocaleString()} CUP
            </span>
          </div>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onStartArqueo}
          className="flex-1 md:flex-initial px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <ClipboardCheck className="w-5 h-5" />
          <span>Iniciar Arqueo de Caja (Con Mermas)</span>
        </button>

        <button
          onClick={onOpenNewProduct}
          className="flex-1 md:flex-initial px-5 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 text-emerald-600" />
          <span>Registrar Producto</span>
        </button>
      </div>

      {/* Alerts and ROI Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stock warnings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h4 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alertas de Stock Mínimo
          </h4>

          {lowStockProducts.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              ✅ Todo el inventario se encuentra sobre el nivel de stock mínimo de seguridad.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl"
                >
                  <div>
                    <h5 className="font-bold text-xs text-rose-900 dark:text-rose-300">{p.name}</h5>
                    <p className="text-[10px] text-rose-600/80 dark:text-rose-400/70">
                      Mínimo requerido: {p.min} cajas
                    </p>
                  </div>
                  <span className="text-xs bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 px-2.5 py-1 rounded-full font-bold">
                    {p.boxes} Cajas / {p.units} Unid
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROI summary */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h4 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            Rendimiento (ROI) por Producto
          </h4>

          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
            {currentData.products.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                No hay productos en inventario.
              </div>
            ) : (
              currentData.products
                .slice()
                .sort((a, b) => b.price - b.cost - (a.price - a.cost))
                .map((p) => {
                  const margin = p.price - p.cost;
                  const roiPercent = p.cost > 0 ? ((margin / p.cost) * 100).toFixed(0) : 100;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl"
                    >
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</h5>
                        <p className="text-[10px] text-slate-500">
                          Costo: {p.cost} CUP | Venta: {p.price} CUP
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                          +{margin} CUP
                        </span>
                        <p className="text-[9px] text-slate-400 font-semibold font-mono">
                          {roiPercent}% ROI
                        </p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
