import React, { useState } from 'react';
import { Boxes, Plus, Search, Edit3, Trash2, ArrowUpRight, AlertCircle } from 'lucide-react';
import { ERPDatabase, Product } from '../types';

interface StockViewProps {
  db: ERPDatabase;
  onOpenNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onQuickRestock: (productId: number) => void;
}

export const StockView: React.FC<StockViewProps> = ({
  db,
  onOpenNewProduct,
  onEditProduct,
  onDeleteProduct,
  onQuickRestock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const currentData = db.outletData[db.activeOutletId] || { products: [] };

  const filteredProducts = currentData.products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-600" />
            Inventario de Productos & Stock
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestión completa de existencias, precios de costo, precio de venta y reabastecimiento.
          </p>
        </div>

        <button
          onClick={onOpenNewProduct}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          placeholder="Buscar producto por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow px-2 py-1 text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Grid of Products */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No se encontraron productos registrados en el inventario.
          </div>
        ) : (
          filteredProducts.map((p) => {
            const totalUnits = p.boxes * p.uxc + p.units;
            const isLow = totalUnits <= p.min * p.uxc;
            const margin = p.price - p.cost;
            const roiPercent = p.cost > 0 ? ((margin / p.cost) * 100).toFixed(0) : 100;

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-900 p-4.5 rounded-2xl border transition-all ${
                  isLow
                    ? 'border-rose-400 dark:border-rose-900 shadow-md shadow-rose-500/5'
                    : 'border-slate-200 dark:border-slate-800 shadow-sm'
                } space-y-3`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</h4>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">
                      UxC: {p.uxc}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      isLow
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                    }`}
                  >
                    {p.boxes} Cajas / {p.units} Unid
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Costo Unitario</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {p.cost} CUP
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Venta Unitaria</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {p.price} CUP
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Ganancia/Unid: +{margin} CUP</span>
                  <span className="font-bold font-mono text-emerald-600">{roiPercent}% ROI</span>
                </div>

                <div className="flex justify-end gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <button
                    onClick={() => onQuickRestock(p.id)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all cursor-pointer"
                  >
                    Abastecer
                  </button>
                  <button
                    onClick={() => onEditProduct(p)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDeleteProduct(p.id)}
                    className="px-2 py-1 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg hover:bg-rose-100 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
