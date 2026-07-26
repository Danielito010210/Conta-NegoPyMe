import React, { useState, useEffect, useRef } from 'react';
import { ERPDatabase, Product, Account, Loan, HistoryItem, Withdrawal, Shrinkage } from './types';
import {
  loadDatabase,
  saveDatabase,
  clearDatabase,
  exportBackupJSON,
  encodeQRString,
  decodeQRString,
} from './utils/storage';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { BalanceView } from './components/BalanceView';
import { StockView } from './components/StockView';
import { AccountsView } from './components/AccountsView';
import { WithdrawalView } from './components/WithdrawalView';
import { PersonalView } from './components/PersonalView';
import { LoansView } from './components/LoansView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { ArqueoWizard } from './components/ArqueoWizard';
import {
  AlertModal,
  PinRequestModal,
  ProductModal,
  AccountModal,
  EmployeeModal,
  LoanModal,
  SyncModal,
  ConfirmResetModal,
} from './components/Modals';

export default function App() {
  const [db, setDb] = useState<ERPDatabase>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  const [adminUnlocked, setAdminUnlocked] = useState<boolean>(() => !db.settings.adminPin);
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Modal open states
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type?: 'warning' | 'error' | 'success';
  }>({ title: '', message: '' });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [isArqueoOpen, setIsArqueoOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncMode, setSyncMode] = useState<'generate' | 'scan'>('generate');

  // Sync state & Dark Mode side-effects
  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Helper Alerts
  const showAlert = (
    title: string,
    message: string,
    type: 'warning' | 'error' | 'success' = 'warning'
  ) => {
    setAlertConfig({ title, message, type });
    setIsAlertOpen(true);
  };

  // Admin PIN Gatekeeper
  const checkAdminPermission = (callback: () => void) => {
    if (!db.settings.adminPin || adminUnlocked) {
      callback();
    } else {
      pendingActionRef.current = callback;
      setIsPinModalOpen(true);
    }
  };

  const handleVerifyPin = (enteredPin: string) => {
    const cleanEntered = String(enteredPin).trim();
    const cleanStored = String(db.settings.adminPin || '').trim();

    if (cleanEntered === cleanStored) {
      setAdminUnlocked(true);
      setIsPinModalOpen(false);
      const actionToRun = pendingActionRef.current;
      pendingActionRef.current = null;
      if (actionToRun) {
        actionToRun();
      }
    } else {
      showAlert('PIN Incorrecto', 'El PIN ingresado no coincide.', 'error');
    }
  };

  const handleToggleAdminLock = () => {
    if (db.settings.adminPin) {
      if (adminUnlocked) {
        setAdminUnlocked(false);
        showAlert('Administrador Bloqueado', 'Se han ocultado los privilegios protegidos.', 'success');
      } else {
        checkAdminPermission(() => {
          showAlert('Acceso Concedido', 'Se habilitaron los privilegios de Administrador.', 'success');
        });
      }
    } else {
      showAlert('PIN No Configurado', 'Puede asignar un PIN de 4 dígitos en la pestaña "Ajustes".');
    }
  };

  // ================= BUSINESS LOGIC HANDLERS =================

  // 1. SAVE PRODUCT (Create / Edit)
  const handleSaveProduct = (prodData: any) => {
    setDb((prevDb) => {
      const newDb = { ...prevDb };
      const currentData = { ...newDb.outletData[newDb.activeOutletId] };
      currentData.products = [...currentData.products];

      if (prodData.id) {
        // Edit existing product
        currentData.products = currentData.products.map((p) =>
          p.id === prodData.id
            ? {
                ...p,
                name: prodData.name,
                uxc: prodData.uxc,
                min: prodData.min,
                cost: prodData.cost,
                price: prodData.price,
              }
            : p
        );
      } else {
        // Create new product
        const totalUnits = prodData.boxes * prodData.uxc + prodData.units;
        const totalCost = totalUnits * prodData.cost;

        if (totalCost > 0) {
          const accIndex = newDb.accounts.findIndex((a) => a.id === prodData.purchaseAccountId);
          if (accIndex !== -1) {
            if (newDb.accounts[accIndex].id === 2) {
              showAlert(
                'Restricción',
                'No se puede pagar inventario directamente con la cuenta de Inversión cerrada.',
                'error'
              );
              return prevDb;
            }
            if (newDb.accounts[accIndex].balance < totalCost) {
              showAlert(
                'Saldo Insuficiente',
                `Saldo insuficiente en la cuenta seleccionada (${newDb.accounts[accIndex].balance.toLocaleString()} CUP).`,
                'error'
              );
              return prevDb;
            }
            const updatedAccounts = [...newDb.accounts];
            updatedAccounts[accIndex] = {
              ...updatedAccounts[accIndex],
              balance: updatedAccounts[accIndex].balance - totalCost,
            };
            newDb.accounts = updatedAccounts;
          }
        }

        const newId =
          currentData.products.length > 0
            ? Math.max(...currentData.products.map((p) => p.id)) + 1
            : 1;

        currentData.products.push({
          id: newId,
          name: prodData.name,
          uxc: prodData.uxc,
          min: prodData.min,
          boxes: prodData.boxes,
          units: prodData.units,
          cost: prodData.cost,
          price: prodData.price,
        });

        if (totalCost > 0) {
          newDb.history = [
            ...newDb.history,
            {
              id: Date.now(),
              date: new Date().toISOString(),
              type: 'Compra',
              detail: `Compra inventario inicial: ${prodData.name} (${prodData.boxes} Cajas / ${prodData.units} Unid)`,
              amount: totalCost,
              accountId: prodData.purchaseAccountId,
            },
          ];
        }
      }

      newDb.outletData = { ...newDb.outletData, [newDb.activeOutletId]: currentData };
      return newDb;
    });

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: number) => {
    checkAdminPermission(() => {
      setDb((prevDb) => {
        const currentData = { ...prevDb.outletData[prevDb.activeOutletId] };
        currentData.products = currentData.products.filter((p) => p.id !== productId);
        return {
          ...prevDb,
          outletData: { ...prevDb.outletData, [prevDb.activeOutletId]: currentData },
        };
      });
      showAlert('Producto Eliminado', 'El producto ha sido borrado del inventario.', 'success');
    });
  };

  // 2. REINVESTMENT (Costo Promedio Ponderado)
  const handleReinvestProduct = (
    productId: number,
    boxes: number,
    units: number,
    costInput: number,
    accountId: number
  ) => {
    setDb((prevDb) => {
      const currentData = { ...prevDb.outletData[prevDb.activeOutletId] };
      const product = currentData.products.find((p) => p.id === productId);
      const account = prevDb.accounts.find((a) => a.id === accountId);

      if (!product || !account) return prevDb;

      const newTotalUnitsAdded = boxes * product.uxc + units;
      const totalCost = newTotalUnitsAdded * costInput;

      if (account.balance < totalCost) {
        showAlert(
          'Saldo Insuficiente',
          `Saldo insuficiente en "${account.name}". Posee ${account.balance.toLocaleString()} CUP y requiere ${totalCost.toLocaleString()} CUP.`,
          'error'
        );
        return prevDb;
      }

      const currentTotalUnits = product.boxes * product.uxc + product.units;
      const currentTotalValue = currentTotalUnits * product.cost;

      const finalTotalUnits = currentTotalUnits + newTotalUnitsAdded;
      const finalTotalValue = currentTotalValue + totalCost;
      const newAverageCost = finalTotalValue / finalTotalUnits;

      const updatedAccounts = prevDb.accounts.map((a) =>
        a.id === accountId ? { ...a, balance: a.balance - totalCost } : a
      );

      const updatedProducts = currentData.products.map((p) => {
        if (p.id === productId) {
          const boxesTotal = Math.floor(finalTotalUnits / p.uxc);
          const unitsTotal = finalTotalUnits % p.uxc;
          return {
            ...p,
            boxes: boxesTotal,
            units: unitsTotal,
            cost: parseFloat(newAverageCost.toFixed(2)),
          };
        }
        return p;
      });

      currentData.products = updatedProducts;

      const newHistoryItem: HistoryItem = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: 'Compra',
        detail: `Abastecimiento: ${product.name} (+${boxes} Cajas, +${units} Unid) | Costo Promediar: ${newAverageCost.toFixed(2)} CUP`,
        amount: totalCost,
        accountId: account.id,
      };

      showAlert(
        'Reabastecimiento Exitoso',
        `Se agregaron ${newTotalUnitsAdded} unidades de ${product.name} aplicando Costo Promedio Ponderado (${newAverageCost.toFixed(2)} CUP).`,
        'success'
      );

      return {
        ...prevDb,
        accounts: updatedAccounts,
        history: [...prevDb.history, newHistoryItem],
        outletData: { ...prevDb.outletData, [prevDb.activeOutletId]: currentData },
      };
    });
  };

  // 3. OPERATING EXPENSE
  const handleRegisterExpense = (concept: string, amount: number, accountId: number) => {
    if (!concept || amount <= 0) {
      showAlert('Campos Inválidos', 'Indique un concepto y un monto positivo.', 'error');
      return;
    }

    setDb((prevDb) => {
      const account = prevDb.accounts.find((a) => a.id === accountId);
      if (!account) return prevDb;

      if (account.balance < amount) {
        showAlert('Saldo Insuficiente', `Saldo insuficiente en "${account.name}".`, 'error');
        return prevDb;
      }

      const updatedAccounts = prevDb.accounts.map((a) =>
        a.id === accountId ? { ...a, balance: a.balance - amount } : a
      );

      const newHistoryItem: HistoryItem = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: 'Gasto',
        detail: `Gasto Operativo: ${concept}`,
        amount,
        accountId,
      };

      showAlert('Gasto Registrado', 'El egreso operativo ha sido procesado.', 'success');

      return {
        ...prevDb,
        accounts: updatedAccounts,
        history: [...prevDb.history, newHistoryItem],
      };
    });
  };

  // 4. CASH ACTIONS
  const handleCashAction = (
    type: 'deposit' | 'withdraw' | 'transfer',
    amount: number,
    origId: number,
    destId: number
  ) => {
    if (isNaN(amount) || amount <= 0) {
      showAlert('Monto Inválido', 'Ingrese un monto superior a cero.', 'error');
      return;
    }

    setDb((prevDb) => {
      const updatedAccounts = [...prevDb.accounts];

      if (type === 'deposit') {
        const destAcc = updatedAccounts.find((a) => a.id === destId);
        if (!destAcc) return prevDb;
        destAcc.balance += amount;

        const newHistory: HistoryItem = {
          id: Date.now(),
          date: new Date().toISOString(),
          type: 'Transferencia',
          detail: `Inyección de Capital: Depósito en "${destAcc.name}"`,
          amount,
          accountId: destId,
        };

        showAlert('Inyección Exitosa', `Se depositaron +${amount.toLocaleString()} CUP en ${destAcc.name}.`, 'success');

        return {
          ...prevDb,
          accounts: updatedAccounts,
          history: [...prevDb.history, newHistory],
        };
      }

      if (type === 'transfer') {
        if (origId === destId) {
          showAlert('Error', 'La cuenta de origen y destino deben ser distintas.', 'error');
          return prevDb;
        }

        const origAcc = updatedAccounts.find((a) => a.id === origId);
        const destAcc = updatedAccounts.find((a) => a.id === destId);

        if (!origAcc || !destAcc) return prevDb;

        if (origAcc.balance < amount) {
          showAlert('Saldo Insuficiente', `Saldo insuficiente en "${origAcc.name}".`, 'error');
          return prevDb;
        }

        origAcc.balance -= amount;
        destAcc.balance += amount;

        const newHistory: HistoryItem = {
          id: Date.now(),
          date: new Date().toISOString(),
          type: 'Transferencia',
          detail: `Transferencia entre cuentas: "${origAcc.name}" → "${destAcc.name}"`,
          amount,
          accountId: origId,
        };

        showAlert('Transferencia Exitosa', `Se transfirieron ${amount.toLocaleString()} CUP.`, 'success');

        return {
          ...prevDb,
          accounts: updatedAccounts,
          history: [...prevDb.history, newHistory],
        };
      }

      return prevDb;
    });
  };

  // 5. OFFICIAL WITHDRAWAL EXECUTION (Módulo de Retiros)
  const handleExecuteWithdrawal = (
    accountId: number,
    amount: number,
    concept: string,
    recipient: string
  ) => {
    setDb((prevDb) => {
      const account = prevDb.accounts.find((a) => a.id === accountId);
      if (!account) return prevDb;

      if (account.balance < amount) {
        showAlert('Saldo Insuficiente', `La cuenta "${account.name}" no posee suficiente balance.`, 'error');
        return prevDb;
      }

      const updatedAccounts = prevDb.accounts.map((a) =>
        a.id === accountId ? { ...a, balance: a.balance - amount } : a
      );

      const newWithdrawal: Withdrawal = {
        id: Date.now(),
        date: new Date().toISOString(),
        accountId,
        accountName: account.name,
        amount,
        concept,
        recipient,
      };

      const newHistoryItem: HistoryItem = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: 'Retiro',
        detail: `Retiro de ${account.name}: -${amount.toLocaleString()} CUP a favor de ${recipient} (${concept})`,
        amount,
        accountId,
      };

      showAlert(
        'Retiro Procesado',
        `Se han extraído ${amount.toLocaleString()} CUP de "${account.name}" a favor de ${recipient}.`,
        'success'
      );

      return {
        ...prevDb,
        accounts: updatedAccounts,
        withdrawals: [...(prevDb.withdrawals || []), newWithdrawal],
        history: [...prevDb.history, newHistoryItem],
      };
    });
  };

  // 6. FINISH ARQUEO DE CAJA (with Mermas & Cost priority recovery)
  const handleFinishArqueo = (sessionData: any) => {
    setDb((prevDb) => {
      const currentData = { ...prevDb.outletData[prevDb.activeOutletId] };
      const {
        physicalCounts,
        shrinkages,
        totalSalesGross,
        totalCostSold,
        totalProfitExpected,
        totalShrinkageLoss,
        countedCash,
        discrepancy,
        allocations,
      } = sessionData;

      const activeOutlet = prevDb.outlets.find((o) => o.id === prevDb.activeOutletId);
      const outletFund = activeOutlet ? activeOutlet.fund : 0;
      const netCashCounted = Math.max(0, countedCash - outletFund);

      // Prioridad Absoluta a la Cuenta de Inversión (Account ID 2)
      const recoveredInversion = Math.min(totalCostSold, netCashCounted);
      const profitReceived = Math.max(0, netCashCounted - recoveredInversion);

      const updatedAccounts = prevDb.accounts.map((a) => {
        if (a.id === 2) return { ...a, balance: a.balance + recoveredInversion };
        if (a.id === 1) return { ...a, balance: a.balance + profitReceived };
        return a;
      });

      // Discrepancy handling
      const missing = Math.abs(discrepancy < 0 ? discrepancy : 0);
      let subtractedFromGanancia = 0;
      let subtractedFromInversion = 0;

      if (discrepancy < 0) {
        subtractedFromGanancia = Math.min(totalProfitExpected, missing);
        subtractedFromInversion = Math.max(0, missing - totalProfitExpected);

        if (subtractedFromInversion > 0) {
          const invIndex = updatedAccounts.findIndex((a) => a.id === 2);
          if (invIndex !== -1) {
            updatedAccounts[invIndex].balance = Math.max(
              0,
              updatedAccounts[invIndex].balance - subtractedFromInversion
            );
          }
        }
      }

      // Update loans for missing allocations
      const updatedLoans = [...prevDb.loans];
      allocations.forEach((alloc: any) => {
        const ratio = missing > 0 ? alloc.amount / missing : 1;
        const allocSubInversion = subtractedFromInversion * ratio;
        const allocSubGanancia = subtractedFromGanancia * ratio;

        const newLoan: Loan = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: alloc.name,
          amount: alloc.amount,
          date: new Date().toISOString(),
          status: 'active',
          type: 'receivable',
          concept: 'Faltante de arqueo de caja',
          subtractedFromInversion: allocSubInversion,
          subtractedFromGanancia: allocSubGanancia,
        };
        updatedLoans.push(newLoan);
      });

      // Update physical inventory
      currentData.products = currentData.products.map((p) => {
        const cnt = physicalCounts[p.id];
        if (cnt) {
          return { ...p, boxes: cnt.boxes, units: cnt.units };
        }
        return p;
      });

      currentData.salesTotal += totalSalesGross;

      // Register Shrinkages
      const newShrinkageRecords: Shrinkage[] = shrinkages.map((s: any) => {
        const prod = currentData.products.find((p) => p.id === s.productId);
        return {
          id: Date.now() + Math.floor(Math.random() * 1000),
          date: new Date().toISOString(),
          productId: s.productId,
          productName: prod?.name || 'Producto',
          qtyUnits: s.qtyUnits,
          totalLoss: s.qtyUnits * (prod?.cost || 0),
          reason: s.reason,
        };
      });

      // History Logs
      const newHistoryItems: HistoryItem[] = [
        {
          id: Date.now(),
          date: new Date().toISOString(),
          type: 'Arqueo',
          detail: `Arqueo Turno: Ventas +${totalSalesGross.toLocaleString()} CUP. Inversión Recuperada: +${recoveredInversion.toLocaleString()} CUP, Ganancia Recibida: +${profitReceived.toLocaleString()} CUP.${
            missing > 0 ? ` Faltante: -${missing.toLocaleString()} CUP.` : ''
          }`,
          amount: netCashCounted,
          accountId: 1,
        },
      ];

      if (totalShrinkageLoss > 0) {
        newHistoryItems.push({
          id: Date.now() + 1,
          date: new Date().toISOString(),
          type: 'Merma',
          detail: `Mermas / Pérdidas de producto registradas en el turno (-${totalShrinkageLoss.toLocaleString()} CUP)`,
          amount: totalShrinkageLoss,
          accountId: null,
        });
      }

      showAlert('Arqueo Completado', 'El turno de caja ha sido sellado con éxito.', 'success');

      return {
        ...prevDb,
        accounts: updatedAccounts,
        loans: updatedLoans,
        shrinkages: [...(prevDb.shrinkages || []), ...newShrinkageRecords],
        history: [...prevDb.history, ...newHistoryItems],
        outletData: { ...prevDb.outletData, [prevDb.activeOutletId]: currentData },
      };
    });

    setIsArqueoOpen(false);
  };

  // 7. PAYROLL & SALARIES
  const handlePayPayroll = (
    employeeId: number,
    grossAmount: number,
    deduction: number,
    accountId: number
  ) => {
    setDb((prevDb) => {
      const currentData = { ...prevDb.outletData[prevDb.activeOutletId] };
      const emp = currentData.employees.find((e) => e.id === employeeId);
      const account = prevDb.accounts.find((a) => a.id === accountId);

      if (!emp || !account) return prevDb;

      const netPayout = grossAmount - deduction;

      if (account.balance < netPayout) {
        showAlert('Saldo Insuficiente', `Saldo insuficiente en "${account.name}".`, 'error');
        return prevDb;
      }

      const updatedAccounts = prevDb.accounts.map((a) =>
        a.id === accountId ? { ...a, balance: a.balance - netPayout } : a
      );

      // Deduct active loan if applied
      let updatedLoans = [...prevDb.loans];
      if (deduction > 0) {
        let remDeduction = deduction;
        updatedLoans = updatedLoans.map((loan) => {
          if (
            remDeduction > 0 &&
            loan.name.toLowerCase() === emp.name.toLowerCase() &&
            loan.status === 'active' &&
            loan.type === 'receivable'
          ) {
            if (loan.amount <= remDeduction) {
              remDeduction -= loan.amount;
              return { ...loan, amount: 0, status: 'paid' as const };
            } else {
              const newAmt = loan.amount - remDeduction;
              remDeduction = 0;
              return { ...loan, amount: newAmt };
            }
          }
          return loan;
        });
      }

      const newHistory: HistoryItem = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: 'Nómina',
        detail: `Pago Nómina a ${emp.name}: Netos ${netPayout.toLocaleString()} CUP ${
          deduction > 0 ? `(Retención por deuda: -${deduction.toLocaleString()} CUP)` : ''
        }`,
        amount: netPayout,
        accountId,
      };

      showAlert(
        'Nómina Liquidada',
        `Se le abonaron ${netPayout.toLocaleString()} CUP a ${emp.name}.`,
        'success'
      );

      return {
        ...prevDb,
        accounts: updatedAccounts,
        loans: updatedLoans,
        history: [...prevDb.history, newHistory],
      };
    });
  };

  // 8. LOAN RESOLUTION & SETTLEMENT
  const handleResolveLoan = (loanId: number, accountId: number) => {
    setDb((prevDb) => {
      const loan = prevDb.loans.find((l) => l.id === loanId);
      const account = prevDb.accounts.find((a) => a.id === accountId);

      if (!loan || !account) return prevDb;

      const updatedAccounts = [...prevDb.accounts];
      const currentData = { ...prevDb.outletData[prevDb.activeOutletId] };

      if (loan.type === 'payable') {
        if (account.balance < loan.amount) {
          showAlert('Saldo Insuficiente', `Saldo insuficiente en "${account.name}".`, 'error');
          return prevDb;
        }
        const accIdx = updatedAccounts.findIndex((a) => a.id === accountId);
        updatedAccounts[accIdx].balance -= loan.amount;
      } else {
        // Receivable collection with priority restoration to Inversion (ID 2)
        const totalPay = loan.amount;
        if (loan.subtractedFromInversion !== undefined && loan.subtractedFromInversion > 0) {
          const restoreToInversion = Math.min(loan.subtractedFromInversion, totalPay);
          const remainingPaid = totalPay - restoreToInversion;

          const invAcc = updatedAccounts.find((a) => a.id === 2);
          if (invAcc) invAcc.balance += restoreToInversion;

          if (remainingPaid > 0) {
            const chosenAcc = updatedAccounts.find((a) => a.id === accountId);
            if (chosenAcc) chosenAcc.balance += remainingPaid;
          }
        } else {
          const chosenAcc = updatedAccounts.find((a) => a.id === accountId);
          if (chosenAcc) chosenAcc.balance += totalPay;
        }
      }

      const updatedLoans = prevDb.loans.map((l) =>
        l.id === loanId ? { ...l, status: 'paid' as const } : l
      );

      const newHistory: HistoryItem = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: loan.type === 'receivable' ? 'Cobro' : 'Pago Deuda',
        detail: `${loan.type === 'receivable' ? 'Cobro de préstamo' : 'Pago de deudas propias'}: ${loan.name}`,
        amount: loan.amount,
        accountId,
      };

      showAlert('Transacción Conciliada', 'El préstamo ha sido saldado y registrado.', 'success');

      return {
        ...prevDb,
        accounts: updatedAccounts,
        loans: updatedLoans,
        history: [...prevDb.history, newHistory],
      };
    });
  };

  const handleDecreaseLoan = (loanId: number, amount: number) => {
    setDb((prevDb) => {
      const loan = prevDb.loans.find((l) => l.id === loanId);
      if (!loan) return prevDb;

      const updatedLoans = prevDb.loans.map((l) => {
        if (l.id === loanId) {
          const newAmt = l.amount - amount;
          return {
            ...l,
            amount: Math.max(0, newAmt),
            status: newAmt <= 0 ? ('paid' as const) : l.status,
          };
        }
        return l;
      });

      const newHistory: HistoryItem = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: 'Préstamo',
        detail: `Amortización parcial de deudas de: ${loan.name} (-${amount.toLocaleString()} CUP)`,
        amount,
        accountId: null,
      };

      showAlert('Abono Aplicado', 'Se ha reducido la deuda.', 'success');

      return {
        ...prevDb,
        loans: updatedLoans,
        history: [...prevDb.history, newHistory],
      };
    });
  };

  const handleDeleteLoan = (loanId: number) => {
    checkAdminPermission(() => {
      setDb((prevDb) => ({
        ...prevDb,
        loans: prevDb.loans.filter((l) => l.id !== loanId),
      }));
      showAlert('Préstamo Eliminado', 'Se quitó el registro sin alterar cuentas.', 'success');
    });
  };

  // 9. SETTINGS & OUTLETS
  const handleAddOutlet = (name: string, fund: number) => {
    setDb((prevDb) => {
      const newId = Math.max(...prevDb.outlets.map((o) => o.id)) + 1;
      const newOutlet = { id: newId, name, fund };
      const newOutletData = {
        ...prevDb.outletData,
        [newId]: {
          products: [],
          profits: 0,
          capital: 0,
          salesTotal: 0,
          employees: [],
          monthlyExpenses: {},
        },
      };
      return {
        ...prevDb,
        outlets: [...prevDb.outlets, newOutlet],
        outletData: newOutletData,
      };
    });
    showAlert('Sucursal Creada', `Se creó la sucursal "${name}".`, 'success');
  };

  const handleSwitchOutlet = (outletId: number) => {
    setDb((prevDb) => ({ ...prevDb, activeOutletId: outletId }));
    showAlert('Sucursal Activada', 'Se han cargado los datos de la sucursal.', 'success');
  };

  const handleDeleteOutlet = (outletId: number) => {
    checkAdminPermission(() => {
      setDb((prevDb) => {
        const outlets = prevDb.outlets.filter((o) => o.id !== outletId);
        const outletData = { ...prevDb.outletData };
        delete outletData[outletId];
        return {
          ...prevDb,
          outlets,
          outletData,
          activeOutletId: prevDb.activeOutletId === outletId ? 1 : prevDb.activeOutletId,
        };
      });
    });
  };

  const handleSaveAdminPin = (pin: string | null) => {
    setDb((prevDb) => ({
      ...prevDb,
      settings: { ...prevDb.settings, adminPin: pin },
    }));
    setAdminUnlocked(!pin);
    showAlert(
      pin ? 'PIN Resguardado' : 'PIN Eliminado',
      pin
        ? 'El dispositivo se encuentra protegido por PIN.'
        : 'La seguridad por PIN ha sido deshabilitada.',
      'success'
    );
  };

  const handleExportBackup = () => {
    exportBackupJSON(db);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    checkAdminPermission(() => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          if (parsed.outlets && parsed.outletData && parsed.accounts) {
            setDb(parsed);
            showAlert('Restauración Completada', 'Los datos del respaldo fueron cargados.', 'success');
          } else {
            showAlert('Archivo Erróneo', 'Estructura JSON no reconocida.', 'error');
          }
        } catch (err) {
          showAlert('Error', 'No se pudo leer el archivo JSON.', 'error');
        }
      };
      reader.readAsText(file);
    });
  };

  const handleOpenSyncModal = (mode: 'generate' | 'scan') => {
    setSyncMode(mode);
    setIsSyncModalOpen(true);
  };

  const handleImportSync = (syncStr: string) => {
    checkAdminPermission(() => {
      const decoded = decodeQRString(syncStr);
      if (decoded) {
        setDb(decoded);
        setIsSyncModalOpen(false);
        showAlert('Sincronización Exitosa', 'Base de datos sincronizada impecablemente.', 'success');
      } else {
        showAlert('Error de Trama', 'La cadena comprimida no es válida.', 'error');
      }
    });
  };

  const handleCopySync = () => {
    const encoded = encodeQRString(db);
    navigator.clipboard.writeText(encoded);
    showAlert('Copiado', 'Trama comprimida guardada en el portapapeles.', 'success');
  };

  const handleFactoryReset = () => {
    setIsConfirmResetOpen(true);
  };

  const handleExecuteReset = () => {
    setIsConfirmResetOpen(false);
    const clean = clearDatabase();
    setDb(clean);
    setAdminUnlocked(true);
    showAlert('Sistema Formateado', 'Se han restablecido todos los datos a cero correctamente.', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Header */}
      <Header
        outlets={db.outlets}
        activeOutletId={db.activeOutletId}
        adminUnlocked={adminUnlocked}
        hasPin={!!db.settings.adminPin}
        darkMode={darkMode}
        onToggleLock={handleToggleAdminLock}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 space-y-6">
        {/* Navigation Tabs */}
        <Navigation activeTab={activeTab} onSwitchTab={(tab) => setActiveTab(tab)} />

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardView
            db={db}
            onStartArqueo={() => setIsArqueoOpen(true)}
            onOpenNewProduct={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
          />
        )}

        {activeTab === 'balance' && <BalanceView db={db} />}

        {activeTab === 'stock' && (
          <StockView
            db={db}
            onOpenNewProduct={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            onEditProduct={(p) => {
              setEditingProduct(p);
              setIsProductModalOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onQuickRestock={(productId) => {
              setActiveTab('caja');
            }}
          />
        )}

        {activeTab === 'caja' && (
          <AccountsView
            db={db}
            onOpenNewAccount={() => setIsAccountModalOpen(true)}
            onReinvestProduct={handleReinvestProduct}
            onRegisterExpense={handleRegisterExpense}
            onCashAction={handleCashAction}
          />
        )}

        {activeTab === 'retiros' && (
          <WithdrawalView
            db={db}
            onExecuteWithdrawal={handleExecuteWithdrawal}
            onShowAlert={showAlert}
            checkAdminPermission={checkAdminPermission}
          />
        )}

        {activeTab === 'personal' && (
          <PersonalView
            db={db}
            onOpenNewEmployee={() => setIsEmployeeModalOpen(true)}
            onTerminateEmployee={(id) => {
              checkAdminPermission(() => {
                setDb((prevDb) => {
                  const currentData = { ...prevDb.outletData[prevDb.activeOutletId] };
                  currentData.employees = currentData.employees.filter((e) => e.id !== id);
                  return {
                    ...prevDb,
                    outletData: { ...prevDb.outletData, [prevDb.activeOutletId]: currentData },
                  };
                });
              });
            }}
            onPayPayroll={handlePayPayroll}
          />
        )}

        {activeTab === 'prestamos' && (
          <LoansView
            db={db}
            onOpenNewLoan={() => setIsLoanModalOpen(true)}
            onResolveLoan={handleResolveLoan}
            onDecreaseLoan={handleDecreaseLoan}
            onDeleteLoan={handleDeleteLoan}
          />
        )}

        {activeTab === 'historial' && <HistoryView db={db} />}

        {activeTab === 'ajustes' && (
          <SettingsView
            db={db}
            onAddOutlet={handleAddOutlet}
            onSwitchOutlet={handleSwitchOutlet}
            onDeleteOutlet={handleDeleteOutlet}
            onSaveAdminPin={handleSaveAdminPin}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onOpenSyncModal={handleOpenSyncModal}
            onFactoryReset={handleFactoryReset}
            checkAdminPermission={checkAdminPermission}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© 2026 ERP Cuba v6.0 - Sistema de Gestión de Negocios.</p>
        <p className="mt-1">100% Funcional Offline en el Navegador sin Internet.</p>
      </footer>

      {/* MODALS */}
      <AlertModal
        isOpen={isAlertOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setIsAlertOpen(false)}
      />

      <PinRequestModal
        isOpen={isPinModalOpen}
        onVerify={handleVerifyPin}
        onCancel={() => {
          setIsPinModalOpen(false);
          pendingActionRef.current = null;
        }}
      />

      <ConfirmResetModal
        isOpen={isConfirmResetOpen}
        onConfirm={handleExecuteReset}
        onClose={() => setIsConfirmResetOpen(false)}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        editingProduct={editingProduct}
        accounts={db.accounts}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={(name, type, balance, desc) => {
          setDb((prevDb) => {
            const newId = Math.max(...prevDb.accounts.map((a) => a.id)) + 1;
            return {
              ...prevDb,
              accounts: [...prevDb.accounts, { id: newId, name, type, balance, description: desc }],
            };
          });
          setIsAccountModalOpen(false);
        }}
      />

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSave={(name, role, fixedSalary) => {
          setDb((prevDb) => {
            const currentData = { ...prevDb.outletData[prevDb.activeOutletId] };
            const newId =
              currentData.employees.length > 0
                ? Math.max(...currentData.employees.map((e) => e.id)) + 1
                : 1;
            currentData.employees = [...currentData.employees, { id: newId, name, role, fixedSalary }];
            return {
              ...prevDb,
              outletData: { ...prevDb.outletData, [prevDb.activeOutletId]: currentData },
            };
          });
          setIsEmployeeModalOpen(false);
        }}
      />

      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        onSave={(type, name, amount, concept) => {
          setDb((prevDb) => ({
            ...prevDb,
            loans: [
              ...prevDb.loans,
              {
                id: Date.now(),
                name,
                amount,
                date: new Date().toISOString(),
                status: 'active',
                type,
                concept,
              },
            ],
          }));
          setIsLoanModalOpen(false);
        }}
      />

      <SyncModal
        isOpen={isSyncModalOpen}
        mode={syncMode}
        qrString={encodeQRString(db)}
        onClose={() => setIsSyncModalOpen(false)}
        onImportSync={handleImportSync}
        onCopySync={handleCopySync}
      />

      {/* ARQUEO DE CAJA WIZARD */}
      {isArqueoOpen && (
        <ArqueoWizard
          db={db}
          onClose={() => setIsArqueoOpen(false)}
          onFinishArqueo={handleFinishArqueo}
          onShowAlert={showAlert}
        />
      )}
    </div>
  );
}
