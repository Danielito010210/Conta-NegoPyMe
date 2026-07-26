import { ERPDatabase } from '../types';

export const initialDatabase: ERPDatabase = {
  outlets: [{ id: 1, name: 'Sucursal Principal', fund: 1000 }],
  activeOutletId: 1,
  loans: [],
  history: [],
  withdrawals: [],
  shrinkages: [],
  outletData: {
    1: {
      products: [
        { id: 1, name: 'Refresco TuKola (Latas)', uxc: 24, min: 5, boxes: 10, units: 12, cost: 80, price: 150 },
        { id: 2, name: 'Cerveza Cristal (Botellas)', uxc: 24, min: 10, boxes: 5, units: 0, cost: 120, price: 250 },
        { id: 3, name: 'Aceite Cocina 1L', uxc: 12, min: 3, boxes: 8, units: 6, cost: 350, price: 550 }
      ],
      profits: 12500,
      capital: 24000,
      salesTotal: 84000,
      employees: [
        { id: 1, name: 'Carlos Gómez', role: 'Dependiente principal', fixedSalary: 5000 },
        { id: 2, name: 'Ana Beltrán', role: 'Cajera', fixedSalary: 5500 }
      ],
      monthlyExpenses: {}
    }
  },
  accounts: [
    { id: 1, name: "Ganancia Acumulada / Operativa", type: "ganancia", balance: 12500, description: "Cuenta unificada de ganancias netas y fondos de caja chica" },
    { id: 2, name: "Inversión Patrimonial (Capital de Trabajo)", type: "capital", balance: 24000, description: "Cuenta de inversión de capital. Solo se debitan retiros autorizados." },
    { id: 3, name: "Fondo Emergencia", type: "ahorro", balance: 5000, description: "Fondo de reserva para imprevistos" }
  ],
  settings: {
    adminPin: null,
    exchangeRates: { USD: 350, MLC: 285 }
  }
};
