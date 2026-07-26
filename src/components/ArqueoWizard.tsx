import React, { useState } from 'react';
import {
  ClipboardCheck,
  Package,
  Trash2,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
} from 'lucide-react';
import { ERPDatabase, Product } from '../types';

interface ArqueoWizardProps {
  db: ERPDatabase;
  onClose: () => void;
  onFinishArqueo: (sessionData: any) => void;
  onShowAlert: (title: string, message: string, type?: 'warning' | 'error' | 'success') => void;
}

export const ArqueoWizard: React.FC<ArqueoWizardProps> = ({
  db,
  onClose,
  onFinishArqueo,
  onShowAlert,
}) => {
  const [step, setStep] = useState<number>(1);

  const currentData = db.outletData[db.activeOutletId] || { products: [] };
  const products: Product[] = currentData.products;

  // STEP 1 STATE: Physical Counts
  const [physicalCounts, setPhysicalCounts] = useState<
    Record<number, { boxes: number; units: number }>
  >(() => {
    const initial: Record<number, { boxes: number; units: number }> = {};
    products.forEach((p) => {
      initial[p.id] = { boxes: p.boxes, units: p.units };
    });
    return initial;
  });

  // STEP 2 STATE: Mermas / Shrinkage
  const [shrinkages, setShrinkages] = useState<
    { productId: number; qtyUnits: number; reason: string }[]
  >([]);

  // STEP 3 STATE: Bills Count
  const [bills, setBills] = useState<Record<number, number>>({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
  });

  // STEP 4 STATE: Discrepancy Allocations for Shortage
  const [allocations, setAllocations] = useState<{ name: string; amount: number }[]>([]);
  const [customName, setCustomName] = useState<string>('');
  const [allocAmount, setAllocAmount] = useState<string>('');

  // CALCULATED VALUES
  const activeOutlet = db.outlets.find((o) => o.id === db.activeOutletId);
  const outletFund = activeOutlet ? activeOutlet.fund : 0;

  // 1. Calculate sales and shrinkage totals
  let totalSalesGross = 0;
  let totalCostSold = 0;
  let totalProfitExpected = 0;
  let totalShrinkageLoss = 0;

  products.forEach((p) => {
    const counted = physicalCounts[p.id] || { boxes: p.boxes, units: p.units };
    const countedTotalUnits = counted.boxes * p.uxc + counted.units;

    // Deduct shrinkage units for this product
    const productShrinkage = shrinkages
      .filter((s) => s.productId === p.id)
      .reduce((acc, curr) => acc + curr.qtyUnits, 0);

    const expectedTotalUnits = p.boxes * p.uxc + p.units;
    // Sold units = Expected units - Counted units - Shrinkage units
    const soldUnits = Math.max(0, expectedTotalUnits - countedTotalUnits - productShrinkage);

    if (soldUnits > 0) {
      const gross = soldUnits * p.price;
      const cogs = soldUnits * p.cost;
      totalSalesGross += gross;
      totalCostSold += cogs;
      totalProfitExpected += gross - cogs;
    }

    if (productShrinkage > 0) {
      totalShrinkageLoss += productShrinkage * p.cost;
    }
  });

  // Net expected cash = Sales Gross + Outlet Fund
  const expectedCash = totalSalesGross + outletFund;

  // Counted cash
  const countedCash = Object.entries(bills).reduce(
    (acc, [denom, count]) => acc + parseInt(denom, 10) * (Number(count) || 0),
    0
  );

  const discrepancy = countedCash - expectedCash; // Negative = shortage

  // Handlers for Step Transitions
  const handleProceedToStep2 = () => {
    // Validate unit counts
    let hasError = false;
    products.forEach((p) => {
      const cnt = physicalCounts[p.id];
      if (cnt && cnt.units >= p.uxc) {
        onShowAlert(
          'Conteo Inválido',
          `Unidades sueltas de ${p.name} (${cnt.units}) no pueden ser mayores o iguales a la caja (${p.uxc}).`,
          'error'
        );
        hasError = true;
      }
    });

    if (!hasError) setStep(2);
  };

  const handleProceedToStep3 = () => setStep(3);
  const handleProceedToStep4 = () => setStep(4);

  // Shrinkage Handlers
  const handleAddShrinkage = (productId: number, qtyUnits: number, reason: string) => {
    if (qtyUnits <= 0 || !reason.trim()) return;
    setShrinkages((prev) => [...prev, { productId, qtyUnits, reason: reason.trim() }]);
  };

  const handleRemoveShrinkage = (index: number) => {
    setShrinkages((prev) => prev.filter((_, i) => i !== index));
  };

  // Allocation Handlers for Shortage
  const handleAddAllocation = () => {
    const numAmt = parseFloat(allocAmount);
    const missing = Math.abs(discrepancy);
    const currentAllocated = allocations.reduce((acc, a) => acc + a.amount, 0);
    const remaining = missing - currentAllocated;

    if (!customName.trim() || isNaN(numAmt) || numAmt <= 0 || numAmt > remaining) {
      onShowAlert('Monto Inválido', 'Verifique el nombre y el monto asignado.', 'error');
      return;
    }

    setAllocations((prev) => [...prev, { name: customName.trim(), amount: numAmt }]);
    setCustomName('');
    setAllocAmount('');
  };

  const handleRemoveAllocation = (index: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinalize = () => {
    const missing = Math.abs(discrepancy);
    const currentAllocated = allocations.reduce((acc, a) => acc + a.amount, 0);

    if (discrepancy < 0 && currentAllocated < missing) {
      onShowAlert(
        'Faltante Pendiente',
        `Debe justificar la totalidad del faltante (${missing} CUP). Faltan ${missing - currentAllocated} CUP.`,
        'error'
      );
      return;
    }

    onFinishArqueo({
      physicalCounts,
      shrinkages,
      bills,
      totalSalesGross,
      totalCostSold,
      totalProfitExpected,
      totalShrinkageLoss,
      expectedCash,
      countedCash,
      discrepancy,
      allocations,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-4 md:py-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                Asistente de Arqueo de Caja & Control de Mermas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verifique inventario físico, registre mermas/deterioro, cuente efectivo y cierre caja.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Badges */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold border-b border-slate-200 dark:border-slate-800 pb-4 overflow-x-auto">
          <span
            className={`px-3 py-1.5 rounded-full ${
              step === 1
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            1. Conteo Físico
          </span>
          <span className="text-slate-300">→</span>
          <span
            className={`px-3 py-1.5 rounded-full ${
              step === 2
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            2. Mermas y Roturas
          </span>
          <span className="text-slate-300">→</span>
          <span
            className={`px-3 py-1.5 rounded-full ${
              step === 3
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            3. Efectivo Billetes
          </span>
          <span className="text-slate-300">→</span>
          <span
            className={`px-3 py-1.5 rounded-full ${
              step === 4
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            4. Cierre y Cuadre
          </span>
        </div>

        {/* STEP 1: CONTEO FÍSICO */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                Paso 1: Conteo Físico de Productos en Local
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ingrese las cajas e unidades que posee actualmente en la estantería física.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                    <th className="py-2.5">Producto</th>
                    <th className="py-2.5">Esperado Anterior</th>
                    <th className="py-2.5">Cajas Físicas Reales</th>
                    <th className="py-2.5">Unidades Sueltas Reales</th>
                    <th className="py-2.5 text-right">Cant. Vendida Estimada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {products.map((p) => {
                    const cnt = physicalCounts[p.id] || { boxes: p.boxes, units: p.units };
                    const countedTotalUnits = cnt.boxes * p.uxc + cnt.units;
                    const expectedTotalUnits = p.boxes * p.uxc + p.units;
                    const soldUnits = expectedTotalUnits - countedTotalUnits;

                    return (
                      <tr key={p.id} className="text-slate-800 dark:text-slate-200 font-medium">
                        <td className="py-3 font-semibold">
                          {p.name}
                          <span className="text-[10px] text-slate-400 block font-normal">
                            UxC: {p.uxc}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 font-mono">
                          {p.boxes} C / {p.units} U
                        </td>
                        <td className="py-3">
                          <input
                            type="number"
                            min="0"
                            value={cnt.boxes}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setPhysicalCounts((prev) => ({
                                ...prev,
                                [p.id]: { ...prev[p.id], boxes: val },
                              }));
                            }}
                            className="w-20 px-2 py-1 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-bold font-mono"
                          />
                        </td>
                        <td className="py-3">
                          <input
                            type="number"
                            min="0"
                            value={cnt.units}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setPhysicalCounts((prev) => ({
                                ...prev,
                                [p.id]: { ...prev[p.id], units: val },
                              }));
                            }}
                            className="w-20 px-2 py-1 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-bold font-mono"
                          />
                        </td>
                        <td className="py-3 text-right font-bold font-mono">
                          {soldUnits < 0 ? (
                            <span className="text-amber-500">+{Math.abs(soldUnits)} (Ingreso)</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {soldUnits} Unid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleProceedToStep2}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span>Siguiente: Registrar Mermas / Deterioro</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REGISTRO DE MERMAS */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                Paso 2: Registro de Mermas, Roturas y Producto Deteriorado
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Si hubo botellas/latas rotas o mercancía mermada, regístrelas con su motivo exacto para deducirlas del costo.
              </p>
            </div>

            {/* Formulario rápido para añadir merma */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">
                Agregar Incidencia de Merma
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Producto</label>
                  <select
                    id="shrink-prod-select"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Unidades Mermadas</label>
                  <input
                    type="number"
                    id="shrink-qty-input"
                    min="1"
                    defaultValue="1"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Causa / Motivo</label>
                  <input
                    type="text"
                    id="shrink-reason-input"
                    placeholder="Ej. Botella rota durante descarga"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const pId = parseInt(
                    (document.getElementById('shrink-prod-select') as HTMLSelectElement).value
                  );
                  const qty = parseInt(
                    (document.getElementById('shrink-qty-input') as HTMLInputElement).value
                  );
                  const reason = (
                    document.getElementById('shrink-reason-input') as HTMLInputElement
                  ).value;

                  handleAddShrinkage(pId, qty, reason);
                  (document.getElementById('shrink-reason-input') as HTMLInputElement).value = '';
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer"
              >
                + Registrar Merma
              </button>
            </div>

            {/* Listado de mermas agregadas en esta sesión */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-500">Mermas Registradas en este Turno:</h4>
              {shrinkages.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No se han registrado mermas en este arqueo.</p>
              ) : (
                <div className="space-y-2">
                  {shrinkages.map((s, idx) => {
                    const prod = products.find((p) => p.id === s.productId);
                    const loss = prod ? s.qtyUnits * prod.cost : 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs"
                      >
                        <div>
                          <span className="font-bold text-rose-900 dark:text-rose-300">
                            {prod?.name || 'Producto'}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {s.qtyUnits} unidades — Motivo: {s.reason}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                            Pérdida: -{loss.toLocaleString()} CUP
                          </span>
                          <button
                            onClick={() => handleRemoveShrinkage(idx)}
                            className="text-rose-500 hover:text-rose-700 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <button
                onClick={handleProceedToStep3}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span>Siguiente: Conteo de Billetes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONTEO DE BILLETES */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                Paso 3: Conteo Desglosado de Billetes (Moneda CUP)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ingrese la cantidad de billetes físicos contados en el cajón de la tienda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Billetes inputs */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                {[1000, 500, 200, 100, 50, 20, 10, 5].map((denom) => (
                  <div key={denom} className="flex items-center gap-2">
                    <span className="w-12 font-bold text-right text-slate-700 dark:text-slate-300">
                      ${denom}:
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={bills[denom] || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setBills((prev) => ({ ...prev, [denom]: val }));
                      }}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center font-bold font-mono"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {((bills[denom] || 0) * denom).toLocaleString()} CUP
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary Metrics */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                    Resumen Financiero Calculado del Turno
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ventas Brutas Calculadas:</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {totalSalesGross.toLocaleString()} CUP
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ganancia Neta Estimada:</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      +{totalProfitExpected.toLocaleString()} CUP
                    </span>
                  </div>
                  {totalShrinkageLoss > 0 && (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>Pérdidas por Mermas:</span>
                      <span className="font-bold font-mono">-{totalShrinkageLoss.toLocaleString()} CUP</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Fondo de Caja Sucursal:</span>
                    <span className="font-bold font-mono">{outletFund.toLocaleString()} CUP</span>
                  </div>
                  <hr className="border-slate-200 dark:border-slate-800" />
                  <div className="flex justify-between text-sm font-bold">
                    <span>Efectivo Esperado:</span>
                    <span className="font-mono">{expectedCash.toLocaleString()} CUP</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Efectivo Contado:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {countedCash.toLocaleString()} CUP
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl text-center text-xs font-bold border ${
                    discrepancy === 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : discrepancy > 0
                      ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300'
                      : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300'
                  }`}
                >
                  {discrepancy === 0 && '✅ CAJA CUADRADA PERFECTA'}
                  {discrepancy > 0 && `SOBRANTE: +${discrepancy.toLocaleString()} CUP`}
                  {discrepancy < 0 && `DIFERENCIA NEGATIVA: -${Math.abs(discrepancy).toLocaleString()} CUP`}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <button
                onClick={handleProceedToStep4}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span>Siguiente: Conciliación y Cierre</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONCILIACIÓN Y CIERRE DE CAJA */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Paso 4: Conciliación de Diferencias y Repartición Contable
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                La Inversión tiene prioridad absoluta: Se retornará el 100% de los costes de venta a la Cuenta de Inversión para recuperar el capital.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shortage allocation or OK banner */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                {discrepancy >= 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Caja Cuadrada o Sobrante
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Excelente. El total físico en billetes satisface o supera lo requerido por ventas.
                    </p>
                    {discrepancy > 0 && (
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        Sobrante de +{discrepancy.toLocaleString()} CUP se sumará como utilidad extraordinaria.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      FALTANTE DE CAJA DE -{Math.abs(discrepancy).toLocaleString()} CUP
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Asigne el responsable de la deuda para continuar con el sellado.
                    </p>

                    <div className="space-y-2">
                      {allocations.map((a, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200">{a.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-rose-600">
                              -{a.amount.toLocaleString()} CUP
                            </span>
                            <button
                              onClick={() => handleRemoveAllocation(i)}
                              className="text-rose-500 font-bold hover:text-rose-700"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {Math.abs(discrepancy) - allocations.reduce((acc, a) => acc + a.amount, 0) > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                        <input
                          type="text"
                          placeholder="Nombre del responsable (ej. Ana Cajera)"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Monto CUP"
                            value={allocAmount}
                            onChange={(e) => setAllocAmount(e.target.value)}
                            className="flex-grow px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-center"
                          />
                          <button
                            type="button"
                            onClick={handleAddAllocation}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                          >
                            Asignar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Distribution Preview */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                  Distribución de Capital de Cierre
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/40 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-blue-900 dark:text-blue-300">
                        Cuenta de Inversión (Capital de Trabajo)
                      </p>
                      <p className="text-[10px] text-slate-500">Recuperación de costes de venta</p>
                    </div>
                    <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                      +{Math.min(totalCostSold, Math.max(0, countedCash - outletFund)).toLocaleString()} CUP
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/40 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-300">
                        Ganancia Acumulada / Operativa
                      </p>
                      <p className="text-[10px] text-slate-500">Utilidad neta líquida del turno</p>
                    </div>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      +{Math.max(0, Math.max(0, countedCash - outletFund) - totalCostSold).toLocaleString()} CUP
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <button
                onClick={handleFinalize}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm shadow-xl shadow-emerald-600/30 transition-all cursor-pointer"
              >
                🔒 Sellar Arqueo & Guardar Turno
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
