import React, { useState } from 'react';
import { Users, UserPlus, DollarSign, AlertTriangle, Trash2 } from 'lucide-react';
import { ERPDatabase } from '../types';

interface PersonalViewProps {
  db: ERPDatabase;
  onOpenNewEmployee: () => void;
  onTerminateEmployee: (employeeId: number) => void;
  onPayPayroll: (
    employeeId: number,
    grossAmount: number,
    deduction: number,
    accountId: number
  ) => void;
}

export const PersonalView: React.FC<PersonalViewProps> = ({
  db,
  onOpenNewEmployee,
  onTerminateEmployee,
  onPayPayroll,
}) => {
  const currentData = db.outletData[db.activeOutletId] || { employees: [] };

  const [selectedEmpId, setSelectedEmpId] = useState<number>(
    currentData.employees[0]?.id || 1
  );
  const [payrollAmount, setPayrollAmount] = useState<string>('');
  const [payrollDeduction, setPayrollDeduction] = useState<string>('0');
  const [payrollAccountId, setPayrollAccountId] = useState<number>(1);

  const selectedEmployee = currentData.employees.find((e) => e.id === selectedEmpId);

  // Active loans for selected employee
  const employeeLoans = selectedEmployee
    ? db.loans.filter(
        (l) =>
          l.name.toLowerCase() === selectedEmployee.name.toLowerCase() &&
          l.status === 'active' &&
          l.type === 'receivable'
      )
    : [];

  const totalEmployeeDebt = employeeLoans.reduce((acc, l) => acc + l.amount, 0);

  const handlePayrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(payrollAmount) || (selectedEmployee?.fixedSalary || 0);
    const ded = parseFloat(payrollDeduction) || 0;

    onPayPayroll(selectedEmpId, gross, ded, payrollAccountId);
    setPayrollDeduction('0');
  };

  const nonInvestmentAccounts = db.accounts.filter((a) => a.id !== 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Gestión de Personal & Nómina
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registro de empleados, salarios fijos y retenciones automáticas por faltante de caja.
          </p>
        </div>

        <button
          onClick={onOpenNewEmployee}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Contratar Empleado</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lista de Empleados Activos */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Empleados Activos ({currentData.employees.length})
          </h3>

          <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
            {currentData.employees.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No hay empleados activos contratados en esta sucursal.
              </p>
            ) : (
              currentData.employees.map((emp) => {
                const debt = db.loans
                  .filter(
                    (l) =>
                      l.name.toLowerCase() === emp.name.toLowerCase() &&
                      l.status === 'active' &&
                      l.type === 'receivable'
                  )
                  .reduce((acc, curr) => acc + curr.amount, 0);

                return (
                  <div
                    key={emp.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{emp.name}</h4>
                      <p className="text-[10px] text-slate-500">
                        {emp.role} | Salario: {emp.fixedSalary.toLocaleString()} CUP/Mes
                      </p>
                      {debt > 0 && (
                        <p className="text-[9.5px] font-bold text-amber-500 mt-0.5">
                          ⚠️ Deuda activa por faltante: {debt.toLocaleString()} CUP
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onTerminateEmployee(emp.id)}
                      className="px-2.5 py-1 text-[10px] bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-lg font-semibold hover:bg-rose-100 transition-all cursor-pointer"
                    >
                      Despedir
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Procesar Pago de Nómina */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Procesar Pago de Nómina
          </h3>

          <form onSubmit={handlePayrollSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Seleccionar Empleado
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  setSelectedEmpId(id);
                  const emp = currentData.employees.find((x) => x.id === id);
                  if (emp) setPayrollAmount(emp.fixedSalary.toString());
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                {currentData.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Monto Bruto (CUP)
                </label>
                <input
                  type="number"
                  min="1"
                  value={payrollAmount || selectedEmployee?.fixedSalary || ''}
                  onChange={(e) => setPayrollAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Cuenta de Origen
                </label>
                <select
                  value={payrollAccountId}
                  onChange={(e) => setPayrollAccountId(parseInt(e.target.value))}
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

            {/* Loan Deduction Box */}
            {totalEmployeeDebt > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-2">
                <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Deuda Activa de Faltante Detectada ({totalEmployeeDebt.toLocaleString()} CUP)
                </p>
                <p className="text-[10.5px] text-slate-600 dark:text-slate-400">
                  ¿Deseas aplicar una retención para descontar de su salario y abonar a la deuda?
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={totalEmployeeDebt}
                    value={payrollDeduction}
                    onChange={(e) => setPayrollDeduction(e.target.value)}
                    className="w-28 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold font-mono text-center"
                  />
                  <span className="text-[11px] text-slate-500">CUP de retención</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Efectuar Pago de Nómina
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
