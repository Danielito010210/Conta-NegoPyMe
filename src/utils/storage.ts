import { ERPDatabase } from '../types';
import { initialDatabase } from '../data/initialData';

const STORAGE_KEY = 'ERP_CUBA_V6';

export const emptyDatabase: ERPDatabase = {
  outlets: [{ id: 1, name: 'Sucursal Principal', fund: 0 }],
  activeOutletId: 1,
  loans: [],
  history: [],
  withdrawals: [],
  shrinkages: [],
  outletData: {
    1: {
      products: [],
      profits: 0,
      capital: 0,
      salesTotal: 0,
      employees: [],
      monthlyExpenses: {}
    }
  },
  accounts: [
    { id: 1, name: "Ganancia Acumulada / Operativa", type: "ganancia", balance: 0, description: "Cuenta unificada de ganancias netas y fondos de caja chica" },
    { id: 2, name: "Inversión Patrimonial (Capital de Trabajo)", type: "capital", balance: 0, description: "Cuenta de inversión de capital. Solo se debitan retiros autorizados." }
  ],
  settings: {
    adminPin: null,
    exchangeRates: { USD: 350, MLC: 285 }
  }
};

export function loadDatabase(): ERPDatabase {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure missing structure properties exist
      if (!parsed.withdrawals) parsed.withdrawals = [];
      if (!parsed.shrinkages) parsed.shrinkages = [];
      if (!parsed.history) parsed.history = [];
      if (!parsed.loans) parsed.loans = [];
      
      // Enforce unified Ganancia Acumulada
      const gananciaAcc = parsed.accounts?.find((a: any) => a.id === 1);
      if (gananciaAcc) {
        gananciaAcc.name = "Ganancia Acumulada / Operativa";
        gananciaAcc.type = "ganancia";
      }

      const invAcc = parsed.accounts?.find((a: any) => a.id === 2);
      if (invAcc) {
        invAcc.name = "Inversión Patrimonial (Capital de Trabajo)";
        invAcc.type = "capital";
      }

      return parsed;
    }
  } catch (e) {
    console.error('Error loading database from localStorage', e);
  }
  return initialDatabase;
}

export function saveDatabase(db: ERPDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Error saving database to localStorage', e);
  }
}

export function clearDatabase(): ERPDatabase {
  try {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyDatabase));
  } catch (e) {
    console.error('Error clearing database in localStorage', e);
  }
  return emptyDatabase;
}

export function exportBackupJSON(db: ERPDatabase): void {
  const payload = JSON.stringify(db, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ERP_Cuba_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function encodeQRString(db: ERPDatabase): string {
  try {
    const jsonStr = JSON.stringify(db);
    return btoa(unescape(encodeURIComponent(jsonStr)));
  } catch (e) {
    console.error('Error encoding QR string', e);
    return '';
  }
}

export function decodeQRString(encodedStr: string): ERPDatabase | null {
  try {
    const jsonStr = decodeURIComponent(escape(atob(encodedStr.trim())));
    const parsed = JSON.parse(jsonStr);
    if (parsed.outlets && parsed.outletData && parsed.accounts) {
      return parsed;
    }
  } catch (e) {
    console.error('Error decoding QR string', e);
  }
  return null;
}
