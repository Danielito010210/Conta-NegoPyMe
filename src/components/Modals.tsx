import React, { useState, useEffect } from 'react';
import { X, Lock, QrCode, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Account, Product } from '../types';

/* ================= ALERT MODAL ================= */
interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'warning' | 'error' | 'success';
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  title,
  message,
  type = 'warning',
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
            type === 'error'
              ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600'
              : type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600'
              : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600'
          }`}
        >
          {type === 'error' ? (
            <AlertTriangle className="w-6 h-6" />
          ) : type === 'success' ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <AlertTriangle className="w-6 h-6" />
          )}
        </div>

        <div>
          <h4 className="font-bold text-base text-slate-900 dark:text-white">{title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 cursor-pointer"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

/* ================= PIN REQUISITION MODAL ================= */
interface PinRequestModalProps {
  isOpen: boolean;
  onVerify: (pin: string) => void;
  onCancel: () => void;
}

export const PinRequestModal: React.FC<PinRequestModalProps> = ({
  isOpen,
  onVerify,
  onCancel,
}) => {
  const [pin, setPin] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(pin);
    setPin('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xs p-6 text-center space-y-4 shadow-2xl">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" />
        </div>

        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Operación Protegida</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ingrese su PIN de seguridad administrador
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            maxLength={4}
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-32 text-center text-lg tracking-widest font-bold px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Verificar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= PRODUCT MODAL ================= */
interface ProductModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  accounts: Account[];
  onClose: () => void;
  onSave: (productData: any) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  editingProduct,
  accounts,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [uxc, setUxc] = useState('24');
  const [min, setMin] = useState('5');
  const [boxes, setBoxes] = useState('0');
  const [units, setUnits] = useState('0');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [purchaseAccountId, setPurchaseAccountId] = useState(1);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setUxc(editingProduct.uxc.toString());
      setMin(editingProduct.min.toString());
      setCost(editingProduct.cost.toString());
      setPrice(editingProduct.price.toString());
    } else {
      setName('');
      setUxc('24');
      setMin('5');
      setBoxes('0');
      setUnits('0');
      setCost('');
      setPrice('');
      if (accounts[0]) setPurchaseAccountId(accounts[0].id);
    }
  }, [editingProduct, isOpen, accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: editingProduct ? editingProduct.id : undefined,
      name,
      uxc: parseInt(uxc) || 24,
      min: parseInt(min) || 5,
      boxes: parseInt(boxes) || 0,
      units: parseInt(units) || 0,
      cost: parseFloat(cost) || 0,
      price: parseFloat(price) || 0,
      purchaseAccountId,
    });
  };

  const nonInvAccounts = accounts.filter((a) => a.id !== 2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            {editingProduct ? 'Editar Producto' : 'Registrar Producto'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Nombre del Producto
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Refresco TuKola Latas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Unidades por Caja (UxC)
              </label>
              <input
                type="number"
                min="1"
                value={uxc}
                onChange={(e) => setUxc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Stock Mínimo (Cajas)
              </label>
              <input
                type="number"
                min="0"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
              />
            </div>
          </div>

          {!editingProduct && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Cajas Iniciales
                </label>
                <input
                  type="number"
                  min="0"
                  value={boxes}
                  onChange={(e) => setBoxes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Unidades Iniciales
                </label>
                <input
                  type="number"
                  min="0"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Precio Costo Unitario
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="CUP"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Precio Venta Unitario
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="CUP"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
              />
            </div>
          </div>

          {!editingProduct && (
            <div>
              <label className="block font-semibold mb-1 text-amber-600 font-medium">
                Cuenta de Compra (se debitará costo inicial)
              </label>
              <select
                value={purchaseAccountId}
                onChange={(e) => setPurchaseAccountId(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                {nonInvAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.balance.toLocaleString()} CUP)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= ACCOUNT MODAL ================= */
interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, type: any, balance: number, desc: string) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('ganancia');
  const [balance, setBalance] = useState('0');
  const [desc, setDesc] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name.trim(), type, parseFloat(balance) || 0, desc.trim());
    setName('');
    setBalance('0');
    setDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Nueva Cuenta Financiera
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Nombre de Cuenta
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Fondo Especial Cuba"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Tipo de Cuenta
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              <option value="ganancia">Operativa (Ganancias)</option>
              <option value="ahorro">Fondo de Ahorro</option>
              <option value="gastos">Cuentas de Gastos</option>
              <option value="libre">Libre uso</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Saldo Inicial (CUP)
            </label>
            <input
              type="number"
              min="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Descripción
            </label>
            <input
              type="text"
              placeholder="Ej. Cuenta asignada para proyectos"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Guardar Cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= EMPLOYEE MODAL ================= */
interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, role: string, fixedSalary: number) => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [salary, setSalary] = useState('5000');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name.trim(), role.trim(), parseFloat(salary) || 0);
    setName('');
    setRole('');
    setSalary('5000');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Contratar Empleado
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Roberto Martínez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Rol / Cargo
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Dependiente, Cajera"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Salario Fijo Mensual (CUP)
            </label>
            <input
              type="number"
              min="0"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Contratar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= LOAN MODAL ================= */
interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: 'receivable' | 'payable', name: string, amount: number, concept: string) => void;
}

export const LoanModal: React.FC<LoanModalProps> = ({ isOpen, onClose, onSave }) => {
  const [type, setType] = useState<'receivable' | 'payable'>('receivable');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(type, name.trim(), parseFloat(amount) || 0, concept.trim());
    setName('');
    setAmount('');
    setConcept('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Registrar Préstamo / Deuda
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Tipo de Deuda
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              <option value="receivable">Alguien me debe (Cuenta por cobrar)</option>
              <option value="payable">Yo debo (Cuenta por pagar)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Nombre del Deudor / Acreedor
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Monto (CUP)
            </label>
            <input
              type="number"
              min="1"
              required
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Concepto / Detalle
            </label>
            <input
              type="text"
              placeholder="Ej. Adelanto de salario / Compra fiada"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= SYNC MODAL ================= */
interface SyncModalProps {
  isOpen: boolean;
  mode: 'generate' | 'scan';
  qrString: string;
  onClose: () => void;
  onImportSync: (syncStr: string) => void;
  onCopySync: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  mode,
  qrString,
  onClose,
  onImportSync,
  onCopySync,
}) => {
  const [scanInput, setScanInput] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 shadow-2xl text-center">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            {mode === 'generate' ? 'Generar Sincronización Trama / QR' : 'Cargar Trama QR'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {mode === 'generate' ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Copie la trama comprimida cifrada a continuación para transferirla de forma instantánea a otro dispositivo sin internet.
            </p>
            <div className="flex justify-center p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <QrCode className="w-28 h-28 text-slate-900 dark:text-emerald-500" />
            </div>
            <textarea
              readOnly
              value={qrString}
              className="w-full h-20 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[9px] font-mono break-all focus:outline-none"
            />
            <button
              onClick={onCopySync}
              className="w-full py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Copiar Trama al Portapapeles
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Pegue la cadena comprimida de datos recibida para cargar la base de datos completa.
            </p>
            <textarea
              rows={5}
              placeholder="Pegue la cadena de datos comprimida aquí..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none"
            />
            <button
              onClick={() => {
                onImportSync(scanInput);
                setScanInput('');
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Cargar Base de Datos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================= CONFIRM RESET MODAL ================= */
interface ConfirmResetModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({
  isOpen,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-base text-slate-900 dark:text-white">
            ¿Restablecer el Sistema a Cero?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Esta acción <strong className="text-rose-600 dark:text-rose-400">borrará permanentemente</strong> todos los productos, saldos de cuentas, historial de arqueos, préstamos, fondos y nóminas. No se podrá deshacer.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-all active:scale-98"
          >
            Sí, Formatear y Restablecer Todo
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

