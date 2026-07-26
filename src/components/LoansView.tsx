import React, { useState } from 'react';
import { HandCoins, Plus, ArrowDownLeft, ArrowUpRight, CheckCircle2, Minus, Trash2 } from 'lucide-react';
import { ERPDatabase, Loan } from '../types';

interface LoansViewProps {
  db: ERPDatabase;
  onOpenNewLoan: () => void;
  onResolveLoan: (loanId: number, accountId: number) => void;
  onDecreaseLoan: (loanId: number, amount: number) => void;
  onDeleteLoan: (loanId: number) => void;
}

export const LoansView: React.FC<LoansViewProps> = ({
  db,
  onOpenNewLoan,
  onResolveLoan,
  onDecreaseLoan,
  onDeleteLoan,
}) => {
  const [selectedResolveLoan, setSelectedResolveLoan] = useState<Loan | null>(null);
  const [resolveAccountId, setResolveAccountId] = useState<number>(1);

  const [selectedDecreaseLoan, setSelectedDecreaseLoan] = useState<Loan | null>(null);
  const [decreaseAmount, setDecreaseAmount] = useState<string>('');

  const receivables = db.loans.filter((l) => l.type === 'receivable' && l.status === 'active');
  const payables = db.loans.filter((l) => l.type === 'payable' && l.status === 'active');

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedResolveLoan) {
      onResolveLoan(selectedResolveLoan.id, resolveAccountId);
      setSelectedResolveLoan(null);
    }
  };

  const handleDecreaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(decreaseAmount);
    if (selectedDecreaseLoan && !isNaN(numAmt) && numAmt > 0) {
      onDecreaseLoan(selectedDecreaseLoan.id, numAmt);
      setSelectedDecreaseLoan(null);
      setDecreaseAmount('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HandCoins className="w-6 h-6 text-emerald-600" />
            Registro de Préstamos & Cuentas por Cobrar / Pagar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Control explícito de acreedores, deudores por faltante y amortizaciones parciales.
          </p>
        </div>

        <button
          onClick={onOpenNewLoan}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Préstamo / Deuda</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cuentas por Cobrar (Alguien me debe) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4" />
            Cuentas por Cobrar (Alguien me debe)
          </h3>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {receivables.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No hay cuentas por cobrar activas registradas.
              </p>
            ) : (
              receivables.map((l) => (
                <div
                  key={l.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{l.name}</h4>
                      <p className="text-[10px] text-slate-500">{l.concept || 'Préstamo general'}</p>
                      <span className="text-[9px] text-slate-400 block font-mono">
                        {new Date(l.date).toLocaleDateString()}
                      </span>
                      {l.subtractedFromInversion !== undefined && l.subtractedFromInversion > 0 && (
                        <p className="text-[9px] text-blue-500 font-bold mt-0.5">
                          ⚠️ Por restituir a Inversión: {l.subtractedFromInversion.toLocaleString()} CUP
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {l.amount.toLocaleString()} CUP
                    </span>
                  </div>

                  <div className="flex justify-end gap-1.5 border-t border-slate-100 dark:border-slate-850 pt-2">
                    <button
                      onClick={() => {
                        setSelectedDecreaseLoan(l);
                        setDecreaseAmount('');
                      }}
                      className="px-2.5 py-1 text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                    >
                      - Amortizar
                    </button>

                    <button
                      onClick={() => setSelectedResolveLoan(l)}
                      className="px-3 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all cursor-pointer"
                    >
                      Cobrar Deuda
                    </button>

                    <button
                      onClick={() => onDeleteLoan(l.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 transition-all cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cuentas por Pagar (Yo debo) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4" />
            Cuentas por Pagar (Yo debo)
          </h3>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {payables.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No posee deudas ni cuentas por pagar activas.
              </p>
            ) : (
              payables.map((l) => (
                <div
                  key={l.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{l.name}</h4>
                      <p className="text-[10px] text-slate-500">{l.concept || 'Deuda ordinaria'}</p>
                      <span className="text-[9px] text-slate-400 block font-mono">
                        {new Date(l.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                      -{l.amount.toLocaleString()} CUP
                    </span>
                  </div>

                  <div className="flex justify-end gap-1.5 border-t border-slate-100 dark:border-slate-850 pt-2">
                    <button
                      onClick={() => setSelectedResolveLoan(l)}
                      className="px-3 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all cursor-pointer"
                    >
                      Pagar Deuda
                    </button>

                    <button
                      onClick={() => onDeleteLoan(l.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 transition-all cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL CONCILIAR DEUDA / COBRAR / PAGAR */}
      {selectedResolveLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xs p-6 space-y-4 shadow-2xl text-center">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Conciliar Transacción de Deuda
            </h4>
            <p className="text-xs text-slate-500">
              Monto:{' '}
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {selectedResolveLoan.amount.toLocaleString()} CUP
              </span>
              .
              <br />
              {selectedResolveLoan.type === 'receivable'
                ? '¿En qué cuenta depositarás el cobro?'
                : '¿Desde qué cuenta debitarás el pago?'}
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-3">
              <select
                value={resolveAccountId}
                onChange={(e) => setResolveAccountId(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                {db.accounts
                  .filter((a) => selectedResolveLoan.type === 'receivable' || a.id !== 2)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.balance.toLocaleString()} CUP)
                    </option>
                  ))}
              </select>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedResolveLoan(null)}
                  className="flex-grow py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-grow py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AMORTIZAR DEUDA */}
      {selectedDecreaseLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xs p-6 space-y-4 shadow-2xl text-center">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Amortizar / Reducir Deuda
            </h4>
            <p className="text-xs text-slate-500">
              Monto actual: {selectedDecreaseLoan.amount.toLocaleString()} CUP.
              <br />
              ¿Cuánto desea abonar/reducir?
            </p>

            <form onSubmit={handleDecreaseSubmit} className="space-y-3">
              <input
                type="number"
                min="1"
                max={selectedDecreaseLoan.amount}
                placeholder="Monto CUP"
                value={decreaseAmount}
                onChange={(e) => setDecreaseAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedDecreaseLoan(null)}
                  className="flex-grow py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-grow py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Aplicar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
