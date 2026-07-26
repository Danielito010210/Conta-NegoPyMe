import React, { useState } from 'react';
import { Landmark, Plus, ArrowRightLeft, ShoppingCart, Receipt, Lock } from 'lucide-react';
import { ERPDatabase } from '../types';

interface AccountsViewProps {
  db: ERPDatabase;
  onOpenNewAccount: () => void;
  onReinvestProduct: (
    productId: number,
    boxes: number,
    units: number,
    costInput: number,
    accountId: number
  ) => void;
  onRegisterExpense: (concept: string, amount: number, accountId: number) => void;
  onCashAction: (
    type: 'deposit' | 'withdraw' | 'transfer',
    amount: number,
    origId: number,
    destId: number
  ) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  db,
  onOpenNewAccount,
  onReinvestProduct,
  onRegisterExpense,
  onCashAction,
}) => {
  const currentData = db.outletData[db.activeOutletId] || { products: [] };

  // Reinvestment state
  const [reinvestProductId, setReinvestProductId] = useState<number>(
    currentData.products[0]?.id || 1
  );
  const [reinvestBoxes, setReinvestBoxes] = useState<string>('0');
  const [reinvestUnits, setReinvestUnits] = useState<string>('0');
  const [reinvestCost, setReinvestCost] = useState<string>('');
  const [reinvestAccountId, setReinvestAccountId] = useState<number>(1);

  // Operating expense state
  const [expenseConcept, setExpenseConcept] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseAccountId, setExpenseAccountId] = useState<number>(1);

  // Cash action state
  const [cashActionType, setCashActionType] = useState<'deposit' | 'withdraw' | 'transfer'>(
    'deposit'
  );
  const [cashAmount, setCashAmount] = useState<string>('');
  const [cashOrigId, setCashOrigId] = useState<number>(1);
  const [cashDestId, setCashDestId] = useState<number>(1);

  const nonInvestmentAccounts = db.accounts.filter((a) => a.id !== 2);

  const handleReinvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const boxes = parseInt(reinvestBoxes) || 0;
    const units = parseInt(reinvestUnits) || 0;
    const cost = parseFloat(reinvestCost);

    onReinvestProduct(reinvestProductId, boxes, units, cost, reinvestAccountId);
    setReinvestBoxes('0');
    setReinvestUnits('0');
    setReinvestCost('');
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
    onRegisterExpense(expenseConcept, amount, expenseAccountId);
    setExpenseConcept('');
    setExpenseAmount('');
  };

  const handleCashActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(cashAmount);
    onCashAction(cashActionType, amount, cashOrigId, cashDestId);
    setCashAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-emerald-600" />
            Cuentas Financieras & Operaciones de Caja
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Saldos en tiempo real, reabastecimiento con costo promedio ponderado y movimientos.
          </p>
        </div>

        <button
          onClick={onOpenNewAccount}
          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
        >
          + Nueva Cuenta
        </button>
      </div>

      {/* Grid of Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {db.accounts.map((a) => {
          const isInv = a.id === 2;
          return (
            <div
              key={a.id}
              className={`bg-white dark:bg-slate-900 p-4.5 rounded-2xl border ${
                isInv
                  ? 'border-emerald-500/50 dark:border-emerald-500/40 shadow-md ring-2 ring-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-800 shadow-sm'
              } relative`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[9px] uppercase tracking-wider font-semibold ${
                    isInv ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {a.type}
                </span>
                {isInv && <Lock className="w-4 h-4 text-emerald-600" title="Caja Fuerte protegida" />}
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{a.name}</h4>
              <h3
                className={`text-lg font-black mt-1 font-mono ${
                  isInv
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {a.balance.toLocaleString()} CUP
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                {a.description || 'Sin detalles adicionales'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Reinversión Automática */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            Reinversión / Reabastecer Stock
          </h4>

          <form onSubmit={handleReinvestSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                Producto a reabastecer
              </label>
              <select
                value={reinvestProductId}
                onChange={(e) => setReinvestProductId(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                {currentData.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.boxes} C / {p.units} U)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                  Cajas nuevas
                </label>
                <input
                  type="number"
                  min="0"
                  value={reinvestBoxes}
                  onChange={(e) => setReinvestBoxes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                  Unidades sueltas
                </label>
                <input
                  type="number"
                  min="0"
                  value={reinvestUnits}
                  onChange={(e) => setReinvestUnits(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                  Costo Unitario
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="CUP"
                  value={reinvestCost}
                  onChange={(e) => setReinvestCost(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                  Cuenta de Pago
                </label>
                <select
                  value={reinvestAccountId}
                  onChange={(e) => setReinvestAccountId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                >
                  {nonInvestmentAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.balance.toLocaleString()} CUP)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              ⚠️ Al abastecer se aplicará Costo Promedio Ponderado automáticamente.
            </p>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Ejecutar Reinversión
            </button>
          </form>
        </div>

        {/* Registrar Gasto Operativo */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-rose-600" />
            Registrar Gasto Operativo
          </h4>

          <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                Concepto de Gasto
              </label>
              <input
                type="text"
                placeholder="Ej. Electricidad, Alquiler, Bolsas"
                value={expenseConcept}
                onChange={(e) => setExpenseConcept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                  Monto (CUP)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                  Cuenta de Pago
                </label>
                <select
                  value={expenseAccountId}
                  onChange={(e) => setExpenseAccountId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                >
                  {nonInvestmentAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.balance.toLocaleString()} CUP)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Registrar Egreso
            </button>
          </form>
        </div>

        {/* Depósitos / Transferencias */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            Inyección / Transferencia entre Cuentas
          </h4>

          <form onSubmit={handleCashActionSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                Tipo de Transacción
              </label>
              <select
                value={cashActionType}
                onChange={(e) => setCashActionType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <option value="deposit">Depósito Directo (Inyección de capital)</option>
                <option value="transfer">Transferencia entre Cuentas</option>
              </select>
            </div>

            {cashActionType === 'transfer' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                    Cuenta Origen
                  </label>
                  <select
                    value={cashOrigId}
                    onChange={(e) => setCashOrigId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  >
                    {nonInvestmentAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.balance.toLocaleString()} CUP)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                    Cuenta Destino
                  </label>
                  <select
                    value={cashDestId}
                    onChange={(e) => setCashDestId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                  >
                    {db.accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.balance.toLocaleString()} CUP)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {cashActionType === 'deposit' && (
              <div>
                <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                  Cuenta de Depósito
                </label>
                <select
                  value={cashDestId}
                  onChange={(e) => setCashDestId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                >
                  {db.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.balance.toLocaleString()} CUP)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-medium mb-1 text-slate-600 dark:text-slate-400">
                Monto (CUP)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Ejecutar Movimiento
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
