import React, { useState } from 'react';
import { Settings, Store, Lock, Download, Upload, QrCode, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { ERPDatabase } from '../types';

interface SettingsViewProps {
  db: ERPDatabase;
  onAddOutlet: (name: string, fund: number) => void;
  onSwitchOutlet: (outletId: number) => void;
  onDeleteOutlet: (outletId: number) => void;
  onSaveAdminPin: (pin: string | null) => void;
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSyncModal: (mode: 'generate' | 'scan') => void;
  onFactoryReset: () => void;
  checkAdminPermission: (callback: () => void) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  db,
  onAddOutlet,
  onSwitchOutlet,
  onDeleteOutlet,
  onSaveAdminPin,
  onExportBackup,
  onImportBackup,
  onOpenSyncModal,
  onFactoryReset,
  checkAdminPermission,
}) => {
  const [newOutletName, setNewOutletName] = useState('');
  const [newOutletFund, setNewOutletFund] = useState('');
  const [pinInput, setPinInput] = useState(db.settings.adminPin || '');

  const handleCreateOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutletName.trim()) return;
    onAddOutlet(newOutletName.trim(), parseFloat(newOutletFund) || 0);
    setNewOutletName('');
    setNewOutletFund('');
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().length === 4 && /^\d+$/.test(pinInput.trim())) {
      onSaveAdminPin(pinInput.trim());
    } else if (pinInput.trim() === '') {
      onSaveAdminPin(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          Ajustes del Sistema & Configuración
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Sucursales comerciales, PIN de seguridad, sincronización offline y respaldo de datos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sucursales del Negocio */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-emerald-600" />
            Sucursales del Negocio
          </h3>

          <div className="space-y-2.5">
            {db.outlets.map((o) => {
              const isActive = o.id === db.activeOutletId;
              return (
                <div
                  key={o.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 font-bold text-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div>
                    <span className="block">{o.name}</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      Fondo de caja: {o.fund.toLocaleString()} CUP
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {!isActive ? (
                      <button
                        onClick={() => onSwitchOutlet(o.id)}
                        className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 text-[11px] font-semibold cursor-pointer"
                      >
                        Activar
                      </button>
                    ) : (
                      <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-semibold">
                        Activa
                      </span>
                    )}

                    {o.id !== 1 && (
                      <button
                        onClick={() => onDeleteOutlet(o.id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleCreateOutlet} className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Agregar Sucursal Nueva</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre sucursal"
                value={newOutletName}
                onChange={(e) => setNewOutletName(e.target.value)}
                className="flex-grow px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
              <input
                type="number"
                placeholder="Fondo CUP"
                value={newOutletFund}
                onChange={(e) => setNewOutletFund(e.target.value)}
                className="w-28 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center font-bold"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Crear
              </button>
            </div>
          </form>
        </div>

        {/* Seguridad Administrativa */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-600" />
            Seguridad Administrativa
          </h3>

          <div className="text-xs space-y-3">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Proteja con un PIN de 4 dígitos las acciones críticas como retiros de fondos, eliminación de inventario y nóminas.
            </p>

            <form onSubmit={handleSavePin} className="flex items-center gap-3">
              <label className="font-semibold text-slate-700 dark:text-slate-300">PIN de Seguridad:</label>
              <input
                type="password"
                maxLength={4}
                placeholder="****"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-24 text-center px-2.5 py-1.5 text-base tracking-widest font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Guardar PIN
              </button>
            </form>

            <p
              className={`text-[11px] font-semibold ${
                db.settings.adminPin
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {db.settings.adminPin
                ? '🔒 El dispositivo cuenta con PIN de seguridad activo.'
                : '⚠️ Dispositivo sin PIN registrado. Se aconseja asignarlo.'}
            </p>
          </div>
        </div>

        {/* Respaldo y Sincronización */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-purple-600" />
            Sincronización & Respaldos Offline
          </h3>

          <div className="text-xs space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Exporta los datos en formato JSON para guardar copias de seguridad diarias o transferirlos mediante archivo.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onExportBackup}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exportar JSON</span>
              </button>

              <label className="flex-1 py-2 px-3 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold rounded-xl text-center cursor-pointer flex items-center justify-center gap-1.5">
                <Upload className="w-4 h-4" />
                <span>Restaurar JSON</span>
                <input type="file" accept=".json" onChange={onImportBackup} className="hidden" />
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Sincronización por Trama / Código QR</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenSyncModal('generate')}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-center cursor-pointer"
                >
                  Generar Trama QR
                </button>
                <button
                  onClick={() => onOpenSyncModal('scan')}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-center cursor-pointer"
                >
                  Cargar Trama QR
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Formateo de Fábrica */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" />
            Restauración de Fábrica
          </h3>

          <div className="text-xs space-y-3">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              ⚠️ Esta acción formateará completamente los saldos, productos e historial de la base de datos de este navegador.
            </p>
            <button
              onClick={() => checkAdminPermission(onFactoryReset)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all cursor-pointer"
            >
              Formatear Sistema por Completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
