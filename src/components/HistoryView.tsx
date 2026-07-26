import React, { useState } from 'react';
import { History, Filter, Calendar } from 'lucide-react';
import { ERPDatabase } from '../types';

interface HistoryViewProps {
  db: ERPDatabase;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ db }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  // Extract unique months from history items
  const uniqueMonths: string[] = Array.from(
    new Set(
      db.history.map((h) => {
        const d = new Date(h.date);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      })
    )
  );

  let filtered = db.history.slice().reverse();

  if (filterType !== 'all') {
    filtered = filtered.filter((h) => h.type === filterType);
  }

  if (filterMonth !== 'all') {
    filtered = filtered.filter((h) => {
      const d = new Date(h.date);
      const mStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      return mStr === filterMonth;
    });
  }

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Venta':
      case 'Cobro':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'Compra':
      case 'Gasto':
      case 'Nómina':
      case 'Merma':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      case 'Retiro':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      case 'Transferencia':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            Bitácora de Movimientos & Transacciones
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registro cronológico inmutable de ventas, abastecimientos, mermas, retiros y nóminas.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">Todas las categorías</option>
              <option value="Venta">Ventas</option>
              <option value="Compra">Compras / Abastecimiento</option>
              <option value="Gasto">Gastos Operativos</option>
              <option value="Retiro">Retiros de Capital/Ganancia</option>
              <option value="Merma">Mermas / Pérdidas</option>
              <option value="Nómina">Nóminas</option>
              <option value="Arqueo">Arqueos de Caja</option>
              <option value="Transferencia">Transferencias</option>
              <option value="Préstamo">Préstamos</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">Todos los meses</option>
              {uniqueMonths.map((m) => {
                const [year, month] = m.split('-');
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString(
                  'es',
                  { month: 'long', year: 'numeric' }
                );
                return (
                  <option key={m} value={m}>
                    {monthName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
              <tr>
                <th className="p-3.5">Fecha y Hora</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5">Detalle / Concepto</th>
                <th className="p-3.5 text-right">Monto (CUP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-400">
                    No se encontraron registros de transacciones con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((h) => (
                  <tr key={h.id} className="text-slate-700 dark:text-slate-300 font-medium">
                    <td className="p-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(h.date).toLocaleDateString()}{' '}
                      {new Date(h.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getTypeBadgeClass(
                          h.type
                        )}`}
                      >
                        {h.type}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {h.detail}
                    </td>
                    <td className="p-3.5 text-right font-bold font-mono">
                      {h.amount > 0 ? `${h.amount.toLocaleString()} CUP` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
