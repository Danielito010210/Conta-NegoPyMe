export type AccountType = 'ganancia' | 'capital' | 'ahorro' | 'gastos' | 'libre';

export interface Product {
  id: number;
  name: string;
  uxc: number; // Unidades por caja
  min: number; // Stock mínimo en cajas
  boxes: number; // Cajas actuales
  units: number; // Unidades sueltas actuales
  cost: number; // Costo por unidad
  price: number; // Precio de venta por unidad
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  description: string;
}

export interface Loan {
  id: number;
  name: string;
  amount: number;
  date: string;
  status: 'active' | 'paid';
  type: 'receivable' | 'payable'; // receivable = me deben, payable = yo debo
  concept: string;
  subtractedFromInversion?: number;
  subtractedFromGanancia?: number;
}

export interface Employee {
  id: number;
  name: string;
  role: string;
  fixedSalary: number;
}

export interface HistoryItem {
  id: number;
  date: string;
  type: 'Venta' | 'Compra' | 'Gasto' | 'Nómina' | 'Arqueo' | 'Transferencia' | 'Préstamo' | 'Retiro' | 'Merma' | 'Cobro' | 'Pago Deuda' | 'Sistema';
  detail: string;
  amount: number;
  accountId: number | null;
}

export interface Withdrawal {
  id: number;
  date: string;
  accountId: number;
  accountName: string;
  amount: number;
  concept: string;
  recipient: string;
}

export interface Shrinkage {
  id: number;
  date: string;
  productId: number;
  productName: string;
  qtyUnits: number;
  totalLoss: number;
  reason: string;
}

export interface Outlet {
  id: number;
  name: string;
  fund: number;
}

export interface OutletData {
  products: Product[];
  profits: number;
  capital: number;
  salesTotal: number;
  employees: Employee[];
  monthlyExpenses: Record<string, number>;
}

export interface ERPSettings {
  adminPin: string | null;
  exchangeRates: { USD: number; MLC: number };
}

export interface ERPDatabase {
  outlets: Outlet[];
  activeOutletId: number;
  loans: Loan[];
  history: HistoryItem[];
  withdrawals: Withdrawal[];
  shrinkages: Shrinkage[];
  outletData: Record<number, OutletData>;
  accounts: Account[];
  settings: ERPSettings;
}
