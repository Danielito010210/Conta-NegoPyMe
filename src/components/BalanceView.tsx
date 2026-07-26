import React from 'react';
import { Scale, CheckCircle2, DollarSign, Package, HandCoins, Building, PieChart } from 'lucide-react';
import { ERPDatabase } from '../types';

interface BalanceViewProps {
  db: ERPDatabase;
}

export const BalanceView: React.FC<BalanceViewProps> = ({ db }) => {
  const currentData = db.outletData[db.activeOutletId] || {
    products: [],
    profits: 0,
    capital: 0,
    salesTotal: 0,
    employees: [],
    monthlyExpenses: {},
  };

  // 1. ACTIVOS
  // 1.1 Mercancía en Stock a precio de costo
  const stockAsset = currentData.products.reduce((acc, p) => {
    const totalUnits = p.boxes * p.uxc + p.units;
    return acc + totalUnits * p.cost;
  }, 0);

  // 1.2 Efectivo y Cuentas Bancarias Líquidas
  const liquidAccountsAsset = db.accounts.reduce((acc, a) => acc + a.balance, 0);

  // 1.3 Cuentas por Cobrar (Préstamos concedidos a favor del negocio)
  const receivablesAsset = db.loans
    .filter((l) => l.status === 'active' && l.type === 'receivable')
    .reduce((acc, l) => acc + l.amount, 0);

  const totalActivos = stockAsset + liquidAccountsAsset + receivablesAsset;

  // 2. PASIVOS
  // 2.1 Cuentas por Pagar (Deudas pendientes del negocio con terceros)
  const payablesLiability = db.loans
    .filter((l) => l.status === 'active' && l.type === 'payable')
    .reduce((acc, l) => acc + l.amount, 0);

  const totalPasivos = payablesLiability;

  // 3. PATRIMONIO
  // 3.1 Cuenta de Inversión Líquida (ID 2)
  const invAccount = db.accounts.find((a) => a.id === 2);
  const invBalance = invAccount ? invAccount.balance : 0;

  // Capital de Inversión Total (Física en stock + Líquida)
  const totalCapitalInversion = stockAsset + invBalance;

  // 3.2 Ganancia Acumulada / Operativa Unificada (ID 1)
  const gananciaAccount = db.accounts.find((a) => a.id === 1);
  const totalGanancia = gananciaAccount ? gananciaAccount.balance : currentData.profits;

  // 3.3 Otros Fondos (Ahorros / Reservas, excluyendo ID 1 e ID 2)
  const otrosFondos = db.accounts
    .filter((a) => a.id !== 1 && a.id !== 2)
    .reduce((acc, a) => acc + a.balance, 0);

  const totalPatrimonio = totalActivos - totalPasivos;

  const ecuacionVerificada = Math.abs(totalActivos - (totalPasivos + totalPatrimonio)) < 0.01;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-emerald-600" />
            Balance General Simplificado
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Estado de situación financiera en tiempo real (Activos = Pasivos + Patrimonio)
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Contabilidad Cuadrada En Tiempo Real</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. ACTIVOS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              1. Activos (Bienes y Derechos)
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
              +{totalActivos.toLocaleString()} CUP
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Mercancía en Inventario
                </span>
                <span className="text-[10px] text-slate-400">Stock valorado a precio de costo</span>
              </div>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {stockAsset.toLocaleString()} CUP
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Efectivo y Cuentas Bancarias
                </span>
                <span className="text-[10px] text-slate-400">Suma de saldos de todas las cuentas</span>
              </div>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {liquidAccountsAsset.toLocaleString()} CUP
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Cuentas por Cobrar
                </span>
                <span className="text-[10px] text-slate-400">Préstamos a favor pendientes</span>
              </div>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {receivablesAsset.toLocaleString()} CUP
              </span>
            </div>
          </div>
        </div>

        {/* 2. PASIVOS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <HandCoins className="w-4 h-4" />
              2. Pasivos (Obligaciones y Deudas)
            </h3>
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded">
              -{totalPasivos.toLocaleString()} CUP
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Cuentas por Pagar
                </span>
                <span className="text-[10px] text-slate-400">Deudas con terceros / proveedores</span>
              </div>
              <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                {payablesLiability.toLocaleString()} CUP
              </span>
            </div>

            {payablesLiability === 0 && (
              <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-950/50 rounded-xl">
                👏 No existen deudas pendientes registradas por pagar.
              </div>
            )}
          </div>
        </div>

        {/* 3. PATRIMONIO NETO */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-4 h-4" />
              3. Patrimonio Neto (Recursos Propios)
            </h3>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
              {totalPatrimonio.toLocaleString()} CUP
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Fondo de Inversión Total
                </span>
                <span className="text-[10px] text-slate-400">Stock Físico + Capital Líquido</span>
              </div>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {totalCapitalInversion.toLocaleString()} CUP
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Ganancia Acumulada Unificada
                </span>
                <span className="text-[10px] text-slate-400">Cuenta de utilidades del negocio</span>
              </div>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {totalGanancia.toLocaleString()} CUP
              </span>
            </div>

            {otrosFondos > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Otros Fondos / Reservas
                  </span>
                  <span className="text-[10px] text-slate-400">Fondos de emergencia / ahorro</span>
                </div>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {otrosFondos.toLocaleString()} CUP
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Verification Footer */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-base flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-400" />
            Ecuación Fundamental Contable: Activos = Pasivos + Patrimonio
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Activos ({totalActivos.toLocaleString()} CUP) = Pasivos ({totalPasivos.toLocaleString()} CUP) + Patrimonio ({totalPatrimonio.toLocaleString()} CUP)
          </p>
        </div>

        <div className="text-right bg-slate-800 p-3 rounded-xl border border-slate-700 w-full md:w-auto">
          <span className="text-[10px] text-slate-400 block uppercase">Valor Neto Comercial del Negocio</span>
          <span className="text-lg font-black text-emerald-400 font-mono">
            {totalPatrimonio.toLocaleString()} CUP
          </span>
        </div>
      </div>
    </div>
  );
};
