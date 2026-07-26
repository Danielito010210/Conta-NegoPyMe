import React, { useState } from 'react';
import { Banknote, ShieldAlert, CheckCircle2, History, UserCheck, AlertTriangle } from 'lucide-react';
import { ERPDatabase, Account } from '../types';

interface WithdrawalViewProps {
  db: ERPDatabase;
  onExecuteWithdrawal: (
    accountId: number,
    amount: number,
    concept: string,
    recipient: string
  ) => void;
  onShowAlert: (title: string, message: string, type?: 'warning' | 'error' | 'success') => void;
  checkAdminPermission: (callback: () => void) => void;
}

export const WithdrawalView: React.FC<WithdrawalViewProps> = ({
  db,
  onExecuteWithdrawal,
  onShowAlert,
  checkAdminPermission,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<number>(2); // Default to Inversión (Account 2)
  const [amount, setAmount] = useState<string>('');
  const [concept, setConcept] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');

  const availableAccounts = db.accounts.filter((a) => a.id === 1 || a.id === 2);
  const selectedAccount = db.accounts.find((a) => a.id === selectedAccountId);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      onShowAlert('Monto Inválido', 'Ingrese un valor numérico superior a cero.', 'error');
      return;
    }

    if (!concept.trim() || !recipient.trim()) {
      onShowAlert('Campos Incompletos', 'Indique el concepto y la persona que recibe el retiro.', 'error');
      return;
    }

    if (!selectedAccount) return;

    if (selectedAccount.balance < numAmount) {
      onShowAlert(
        'Saldo Insuficiente',
        `La cuenta "${selectedAccount.name}" solo posee ${selectedAccount.balance.toLocaleString()} CUP disponibles.`,
        'error'
      );
      return;
    }

    checkAdminPermission(() => {
      onExecuteWithdrawal(selectedAccountId, numAmount, concept.trim(), recipient.trim());
      setAmount('');
      setConcept('');
      setRecipient('');
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Banknote className="w-6 h-6 text-emerald-600" />
          Módulo Oficial de Retiros y Extracciones
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Procese extracciones de capital o utilidades de forma resguardada con verificación de administrador.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulario de Retiro */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              Solicitud de Retiro de Fondos
            </h3>
            <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-2 py-0.5 rounded">
              Requiere PIN Admin
            </span>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Cuenta Origen del Retiro
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
              >
                {availableAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — Saldo: {acc.balance.toLocaleString()} CUP
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Nombre del Socio / Recipiente
              </label>
              <input
                type="text"
                placeholder="Ej. Dhaniel (Socio Inversionista)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Monto del Retiro (CUP)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Ej. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Concepto / Motivo de la Extracción
              </label>
              <textarea
                rows={2}
                placeholder="Ej. Retiro parcial de dividendo de utilidades correspondiente al mes de Julio"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            {selectedAccount && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
                <span className="text-slate-500">Disponible tras extracción:</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {Math.max(0, selectedAccount.balance - (parseFloat(amount) || 0)).toLocaleString()} CUP
                </span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ejecutar Retiro Seguro</span>
            </button>
          </form>
        </div>

        {/* Historial de Retiros */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" />
              Historial de Retiros Efectuados
            </h3>
            <span className="text-xs text-slate-400">
              {db.withdrawals?.length || 0} Registros
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {!db.withdrawals || db.withdrawals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No se han realizado extracciones o retiros de fondos aún.
              </div>
            ) : (
              db.withdrawals.slice().reverse().map((w) => (
                <div
                  key={w.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {w.recipient}
                      </h4>
                      <p className="text-[10px] text-slate-400">{w.accountName}</p>
                    </div>
                    <span className="font-bold text-sm text-rose-600 dark:text-rose-400 font-mono">
                      -{w.amount.toLocaleString()} CUP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{w.concept}</p>
                  <span className="text-[9px] text-slate-400 block font-mono">
                    {new Date(w.date).toLocaleDateString()} {new Date(w.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
