// src/pages/AccountingReportsSystem.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  Users,
  CreditCard,
  CheckCircle,
  Activity,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL;

// --- Helpers ---------------------------------------------------------------
const safeJson = async (res, label) => {
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    const snippet = txt.length > 200 ? txt.slice(0, 200) + '...' : txt;
    throw new Error(`${label} returned ${res.status} ${res.statusText} — ${snippet}`);
  }
  return res.json();
};

const normalizeToArray = (payload) => {
  if (payload === null || payload === undefined) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.rows)) return payload.rows;
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.items)) return payload.items;
    for (const v of Object.values(payload)) {
      if (Array.isArray(v)) return v;
      if (v && typeof v === 'object') {
        for (const vv of Object.values(v)) {
          if (Array.isArray(vv)) return vv;
        }
      }
    }
    return [payload];
  }
  return [];
};

const buildAccountingData = ({ sales = [], inventory = [], customers = [], suppliers = [] }) => {
  sales = Array.isArray(sales) ? sales : [];
  inventory = Array.isArray(inventory) ? inventory : [];
  customers = Array.isArray(customers) ? customers : [];
  suppliers = Array.isArray(suppliers) ? suppliers : [];

  const totalSalesRevenue = sales.reduce((s, sale) => s + (Number(sale.totalAmount) || 0), 0);
  const totalCOGS = sales.reduce((s, sale) => s + ((Number(sale.totalAmount) || 0) * 0.6), 0);

  const totalInventoryValue = inventory.reduce((s, item) =>
    s + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0
  );

  // Calculate Accounts Receivable from unpaid sales
  const accountsReceivableFromSales = sales
    .filter(sale => sale.paymentStatus === 'PENDING' || sale.paymentStatus === 'PARTIAL')
    .reduce((s, sale) => s + (Number(sale.remainingAmount) || Number(sale.totalAmount) || 0), 0);

  // Calculate Accounts Receivable from customer outstanding balances
  const accountsReceivableFromCustomers = customers.reduce((sum, customer) =>
    sum + (Number(customer.outstandingBalance) || 0), 0);

  const accountsReceivable = accountsReceivableFromSales + accountsReceivableFromCustomers;

  // Calculate Accounts Payable from supplier outstanding balances (LIABILITIES!)
  const accountsPayable = suppliers.reduce((sum, supplier) =>
    sum + (Number(supplier.outstandingBalance) || 0), 0);

  // Calculate total purchases from suppliers
  const totalPurchases = suppliers.reduce((sum, supplier) =>
    sum + (Number(supplier.totalPurchases) || 0), 0);

  // Calculate total paid to suppliers
  const totalPaidToSuppliers = suppliers.reduce((sum, supplier) =>
    sum + (Number(supplier.totalPaid) || 0), 0);

  // Default/fallback static balances (replace with real API values if available)
  const cashBalance = 0;
  const bankBalance = 0;
  const rentExpense = 0;
  const utilitiesExpense = 0;
  const salariesExpense = 0;
  const totalOperatingExpenses = rentExpense + utilitiesExpense + salariesExpense;

  // Calculate totals
  const totalAssets = cashBalance + bankBalance + accountsReceivable + totalInventoryValue;
  const totalLiabilities = accountsPayable;

  // Calculate profit/loss
  const grossProfit = totalSalesRevenue - totalCOGS;
  const netProfit = grossProfit - totalOperatingExpenses;

  // IMPORTANT: Equity must balance the accounting equation
  // Assets = Liabilities + Equity
  // Therefore: Equity = Assets - Liabilities
  const totalEquity = totalAssets - totalLiabilities;

  // Split equity into components
  // Retained Earnings = Net Profit (accumulated over time)
  const retainedEarnings = netProfit;

  // Owner's Equity = Remaining equity after retained earnings
  // This represents initial capital + any additional investments
  const ownersEquity = totalEquity - retainedEarnings;

  const chartOfAccounts = {
    assets: [
      { code: '1010', name: 'Cash', balance: cashBalance, type: 'Current Asset' },
      { code: '1020', name: 'Bank Account', balance: bankBalance, type: 'Current Asset' },
      { code: '1030', name: 'Accounts Receivable', balance: accountsReceivable, type: 'Current Asset' },
      { code: '1040', name: 'Inventory', balance: totalInventoryValue, type: 'Current Asset' }
    ],
    liabilities: [
      { code: '2010', name: 'Accounts Payable', balance: accountsPayable, type: 'Current Liability' }
    ],
    equity: [
      { code: '3010', name: "Owner's Equity", balance: ownersEquity, type: 'Equity' },
      { code: '3020', name: 'Retained Earnings', balance: retainedEarnings, type: 'Equity' }
    ],
    income: [
      { code: '4010', name: 'Sales Revenue', balance: totalSalesRevenue, type: 'Revenue' },
      { code: '4020', name: 'Other Income', balance: 0, type: 'Revenue' }
    ],
    expenses: [
      { code: '5010', name: 'Cost of Goods Sold', balance: totalCOGS, type: 'COGS' },
      { code: '5020', name: 'Rent Expense', balance: rentExpense, type: 'Operating' },
      { code: '5030', name: 'Utilities', balance: utilitiesExpense, type: 'Operating' },
      { code: '5040', name: 'Salaries', balance: salariesExpense, type: 'Operating' }
    ]
  };

  // Generate journal entries for sales
  const salesJournalEntries = sales.slice(0, 5).map((sale, idx) => {
    const saleAmount = Number(sale.totalAmount) || 0;
    const cogAmount = saleAmount * 0.6;
    const isCashSale = sale.paymentMethod === 'CASH' || sale.paymentStatus === 'PAID';
    return {
      id: `JE-SALE-${String(sale.id || idx + 1).padStart(3, '0')}`,
      date: sale.saleDate || new Date().toISOString().split('T')[0],
      type: isCashSale ? 'Cash Sale' : 'Credit Sale',
      reference: sale.invoiceNumber || `INV-${sale.id || idx + 1}`,
      entries: [
        { account: isCashSale ? 'Cash' : 'Accounts Receivable', debit: saleAmount, credit: 0 },
        { account: 'Sales Revenue', debit: 0, credit: saleAmount },
        { account: 'Cost of Goods Sold', debit: cogAmount, credit: 0 },
        { account: 'Inventory', debit: 0, credit: cogAmount }
      ],
      status: 'Posted'
    };
  });

  // Generate journal entries for inventory purchases (IN movements)
  const inventoryPurchaseEntries = inventory
    .filter(item => item.movementType === 'IN')
    .slice(0, 5)
    .map((item, idx) => {
      const purchaseAmount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || Number(item.purchasePrice) || 0);
      const isPaid = item.paymentStatus === 'PAID';
      return {
        id: `JE-PURCH-${String(item.id || idx + 1).padStart(3, '0')}`,
        date: item.date || item.createdAt || new Date().toISOString().split('T')[0],
        type: isPaid ? 'Cash Purchase' : 'Credit Purchase',
        reference: `PURCH-${item.id || idx + 1}`,
        entries: [
          { account: 'Inventory', debit: purchaseAmount, credit: 0 },
          { account: isPaid ? 'Cash' : 'Accounts Payable', debit: 0, credit: purchaseAmount }
        ],
        status: 'Posted'
      };
    });

  // Generate journal entries for supplier payments
  const supplierPaymentEntries = suppliers
    .filter(supplier => Number(supplier.totalPaid) > 0)
    .slice(0, 3)
    .map((supplier, idx) => {
      const paymentAmount = Number(supplier.totalPaid) || 0;
      return {
        id: `JE-PAY-${String(supplier.id || idx + 1).padStart(3, '0')}`,
        date: supplier.lastPaymentDate || new Date().toISOString().split('T')[0],
        type: 'Supplier Payment',
        reference: `PAY-SUPP-${supplier.id || supplier.name}`,
        entries: [
          { account: 'Accounts Payable', debit: paymentAmount, credit: 0 },
          { account: 'Cash', debit: 0, credit: paymentAmount }
        ],
        status: 'Posted'
      };
    });

  // Combine all journal entries
  const journalEntries = [
    ...salesJournalEntries,
    ...inventoryPurchaseEntries,
    ...supplierPaymentEntries
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const monthlyMap = {};
  sales.forEach(sale => {
    const d = new Date(sale.saleDate || sale.createdAt || Date.now());
    const key = d.toLocaleString('default', { month: 'short' });
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, sales: 0, cogs: 0, expenses: 0, profit: 0 };
    const amt = Number(sale.totalAmount) || 0;
    monthlyMap[key].sales += amt;
    monthlyMap[key].cogs += amt * 0.6;
  });

  const monthlyExpense = totalOperatingExpenses / 12;
  const monthlyProfitData = Object.values(monthlyMap).map(m => ({
    ...m,
    expenses: monthlyExpense,
    profit: m.sales - m.cogs - monthlyExpense
  }));

  return {
    chartOfAccounts,
    journalEntries,
    monthlyProfitData,
    rawCounts: {
      totalSales: sales.length,
      totalInventoryItems: inventory.length,
      totalCustomers: customers.length,
      totalSuppliers: suppliers.length,
      totalJournalEntries: journalEntries.length
    },
    financialSummary: {
      totalPurchases,
      totalPaidToSuppliers,
      accountsPayable,
      accountsReceivable,
      totalSalesRevenue,
      totalInventoryValue
    }
  };
};

// --- CSS injected internally (the "calm & professional" styles you provided) ---
const accountingCss = `
/* AccountingReportsSystem.css - Calm & Professional Design */

/* Reset and Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.accounting-reports-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
}

/* Header */
.accounting-header {
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  color: white;
  padding: 2rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.accounting-header h1 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #ffffff;
}

.accounting-header p {
  color: #cbd5e0;
  font-size: 0.95rem;
}

/* Error Message */
.error-banner {
  background: #fff5f5;
  border-left: 4px solid #fc8181;
  color: #742a2a;
  padding: 1rem;
  margin: 1.5rem 0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-banner-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.error-banner-message {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* Navigation Tabs */
.nav-tabs {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #e2e8f0;
}

.nav-tabs-container {
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
  padding: 0 1.5rem;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  color: #718096;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-tab:hover {
  color: #4a5568;
  background: #f7fafc;
}

.nav-tab.active {
  color: #4a5568;
  border-bottom-color: #4a5568;
  background: #f7fafc;
}

/* Content Area */
.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* Info Banner */
.info-banner {
  background: #ebf8ff;
  border-left: 4px solid #4299e1;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.info-banner-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-banner-title {
  font-weight: 600;
  color: #2c5282;
}

.info-banner-subtitle {
  font-size: 0.9rem;
  color: #2c5282;
  margin-top: 0.25rem;
  opacity: 0.85;
}

.refresh-button {
  margin-left: auto;
  padding: 0.5rem 1rem;
  background: #4a5568;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.2s;
}

.refresh-button:hover {
  background: #2d3748;
}

/* Metric Cards */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #cbd5e0;
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-card.revenue {
  border-left-color: #4299e1;
}

.metric-card.profit {
  border-left-color: #48bb78;
}

.metric-card.assets {
  border-left-color: #9f7aea;
}

.metric-card.cash {
  border-left-color: #ed8936;
}

.metric-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.metric-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #718096;
}

.metric-badge {
  background: #edf2f7;
  color: #4a5568;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.metric-label {
  color: #718096;
  font-size: 0.9rem;
}

/* Charts */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
}

/* Tables */
.table-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.table-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f7fafc;
  border-bottom: 2px solid #e2e8f0;
}

th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  color: #4a5568;
  border-bottom: 1px solid #f7fafc;
}

tbody tr:hover {
  background: #f7fafc;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: #c6f6d5;
  color: #22543d;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Reports */
.report-card {
  background: white;
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.report-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.report-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.report-subtitle {
  color: #718096;
  font-size: 0.95rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #4a5568;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1rem;
}

.section-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
}

.section-row:hover {
  background: #f7fafc;
  border-radius: 4px;
}

.section-total {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f7fafc;
  border-radius: 4px;
  font-weight: 600;
  margin-top: 0.5rem;
}

.highlight-box {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1.5rem 0;
  border-left: 4px solid #4a5568;
}

.highlight-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.highlight-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2d3748;
}

/* Journal Entries */
.journal-entry {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.journal-header {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.journal-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.journal-id {
  font-weight: 700;
  font-size: 1.1rem;
  color: #2d3748;
}

.journal-meta {
  font-size: 0.85rem;
  color: #718096;
  margin-top: 0.25rem;
}

/* Balance Sheet Grid */
.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.balance-section {
  margin-bottom: 2rem;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.balance-item:hover {
  background: #f7fafc;
}

.balance-item-label {
  font-weight: 500;
  color: #2d3748;
}

.balance-item-code {
  font-size: 0.75rem;
  color: #a0aec0;
  margin-top: 0.15rem;
}

.balance-item-value {
  font-weight: 600;
  color: #4a5568;
}

.balance-total {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 6px;
  font-weight: 700;
  font-size: 1.1rem;
  margin-top: 1rem;
}

.balance-check {
  background: #c6f6d5;
  border-left: 4px solid #48bb78;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.balance-check-text {
  font-weight: 600;
  color: #22543d;
}

/* Footer */
.footer {
  background: white;
  border-top: 1px solid #e2e8f0;
  margin-top: 3rem;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.footer-card {
  background: #f7fafc;
  padding: 1.25rem;
  border-radius: 6px;
  border-left: 3px solid #cbd5e0;
}

.footer-card-title {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.footer-card-text {
  color: #718096;
  font-size: 0.85rem;
  line-height: 1.5;
}

/* Loading State */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
}

.loading-content {
  text-align: center;
}

.spinner {
  width: 4rem;
  height: 4rem;
  border: 4px solid #e2e8f0;
  border-top-color: #4a5568;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #718096;
  font-weight: 500;
}

/* Responsive Design */
/* Responsive Design - Mobile First */
@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
  }

  .charts-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 768px) {
  .accounting-header {
    padding: 1.5rem 1rem;
  }

  .accounting-header h1 {
    font-size: 1.5rem;
  }

  .content-wrapper {
    padding: 1rem;
  }

  /* Navigation Tabs */
  .nav-tabs-container {
    padding: 0 1rem;
  }

  .nav-tab {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
  }

  /* Premium KPI Cards */
  .metrics-grid {
    grid-template-columns: 1fr !important;
    gap: 1rem !important;
  }

  /* Charts */
  .charts-grid,
  .balance-grid {
    grid-template-columns: 1fr;
  }

  .metric-value {
    font-size: 1.5rem;
  }

  .report-card {
    padding: 1.5rem;
  }

  /* Filter Section */
  .report-card div[style*="display: flex"] {
    flex-direction: column;
    align-items: stretch !important;
  }

  /* Supplier Overview Grid */
  .report-card div[style*="grid-template-columns"] {
    grid-template-columns: 1fr !important;
  }

  /* Tables */
  .table-card {
    overflow-x: auto;
  }

  table {
    font-size: 0.85rem;
  }

  th, td {
    padding: 0.75rem 0.5rem;
  }

  /* Info Banner */
  .info-banner-header {
    flex-direction: column;
    gap: 1rem;
  }

  .info-banner-header > div:first-child {
    width: 100%;
  }

  /* Print Buttons */
  .report-header {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 1rem;
  }

  .report-header button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .accounting-header h1 {
    font-size: 1.25rem;
  }

  .accounting-header p {
    font-size: 0.85rem;
  }

  /* Even smaller KPI cards */
  .metrics-grid div[style*="font-size: 2rem"] {
    font-size: 1.5rem !important;
  }

  .metrics-grid div[style*="padding: 1.75rem"] {
    padding: 1.25rem !important;
  }

  /* Supplier cards */
  .report-card div[style*="font-size: 1.75rem"] {
    font-size: 1.25rem !important;
  }

  /* Nav tabs scroll */
  .nav-tabs-container {
    -webkit-overflow-scrolling: touch;
  }

  .nav-tab {
    padding: 0.625rem 0.875rem;
    font-size: 0.8rem;
  }

  /* Filter inputs */
  select, input[type="date"] {
    width: 100%;
    min-width: unset !important;
  }

  /* Buttons */
  button {
    font-size: 0.875rem !important;
    padding: 0.625rem 0.875rem !important;
  }
}

/* Utility Classes */
.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.font-bold {
  font-weight: 700;
}

.font-semibold {
  font-weight: 600;
}

.text-sm {
  font-size: 0.875rem;
}

.text-xs {
  font-size: 0.75rem;
}

.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }

.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.space-y-8 > * + * {
  margin-top: 2rem;
}
`;

// --- Component -------------------------------------------------------------
const AccountingReportsSystem = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [accountingData, setAccountingData] = useState(buildAccountingData({}));
  const [errorMessage, setErrorMessage] = useState(null);

  // Date filter states
  const [filterType, setFilterType] = useState('ALL'); // ALL, YEARLY, MONTHLY, CUSTOM
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rawData, setRawData] = useState({ sales: [], inventory: [], customers: [], suppliers: [] });

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [salesRes, inventoryRes, customersRes, suppliersRes] = await Promise.all([
        fetch(`${API_BASE}/sales`),
        fetch(`${API_BASE}/inventory`),
        fetch(`${API_BASE}/customers`),
        fetch(`${API_BASE}/suppliers`)
      ]);

      const [salesPayload, inventoryPayload, customersPayload, suppliersPayload] = await Promise.all([
        safeJson(salesRes, 'sales'),
        safeJson(inventoryRes, 'inventory'),
        safeJson(customersRes, 'customers'),
        safeJson(suppliersRes, 'suppliers')
      ]);

      const sales = normalizeToArray(salesPayload);
      const inventory = normalizeToArray(inventoryPayload);
      const customers = normalizeToArray(customersPayload);
      const suppliers = normalizeToArray(suppliersPayload);

      // Store raw data for filtering
      setRawData({ sales, inventory, customers, suppliers });

      const built = buildAccountingData({ sales, inventory, customers, suppliers });
      setAccountingData(built);
    } catch (err) {
      console.error('Error fetching data:', err);
      setErrorMessage(String(err.message || err));
      setAccountingData(buildAccountingData({ sales: [], inventory: [], customers: [], suppliers: [] }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Filter data based on date range
  const filterDataByDate = useCallback((data) => {
    if (filterType === 'ALL') return data;

    return data.filter(item => {
      const itemDate = new Date(item.saleDate || item.createdAt || item.date || Date.now());

      if (filterType === 'YEARLY') {
        return itemDate.getFullYear() === selectedYear;
      }

      if (filterType === 'MONTHLY') {
        return itemDate.getFullYear() === selectedYear &&
               (itemDate.getMonth() + 1) === selectedMonth;
      }

      if (filterType === 'CUSTOM' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include end date fully
        return itemDate >= start && itemDate <= end;
      }

      return true;
    });
  }, [filterType, selectedYear, selectedMonth, startDate, endDate]);

  // Apply filters whenever filter params change
  useEffect(() => {
    const filteredSales = filterDataByDate(rawData.sales);
    const built = buildAccountingData({
      sales: filteredSales,
      inventory: rawData.inventory,
      customers: rawData.customers,
      suppliers: rawData.suppliers
    });
    setAccountingData(built);
  }, [filterType, selectedYear, selectedMonth, startDate, endDate, rawData, filterDataByDate]);

  const calculateMetrics = useCallback(() => {
    if (!accountingData) return null;
    const totalRevenue = (accountingData.chartOfAccounts?.income || []).reduce((s, a) => s + (a.balance || 0), 0);
    const totalCOGS = (accountingData.chartOfAccounts?.expenses || []).find(e => e.code === '5010')?.balance || 0;
    const totalExpenses = (accountingData.chartOfAccounts?.expenses || []).filter(e => e.code !== '5010').reduce((s, a) => s + (a.balance || 0), 0);
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;
    const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0';
    const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';
    const totalAssets = (accountingData.chartOfAccounts?.assets || []).reduce((s, a) => s + (a.balance || 0), 0);
    const totalLiabilities = (accountingData.chartOfAccounts?.liabilities || []).reduce((s, a) => s + (a.balance || 0), 0);
    const totalEquity = (accountingData.chartOfAccounts?.equity || []).reduce((s, a) => s + (a.balance || 0), 0);

    return {
      totalRevenue,
      totalCOGS,
      totalExpenses,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
      totalAssets,
      totalLiabilities,
      totalEquity,
      cashBalance: (accountingData.chartOfAccounts?.assets || []).find(a => a.code === '1010')?.balance || 0,
      bankBalance: (accountingData.chartOfAccounts?.assets || []).find(a => a.code === '1020')?.balance || 0
    };
  }, [accountingData]);

  const metrics = calculateMetrics();

  // Print functions for each report type
  const printReport = (reportType) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print reports');
      return;
    }

    let reportContent = '';
    const today = new Date().toLocaleDateString();

    const printStyles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; }
        .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
        .print-header h1 { font-size: 24px; margin-bottom: 5px; }
        .print-header p { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
        th { background: #f0f0f0; font-weight: bold; }
        .text-right { text-align: right; }
        .total-row { font-weight: bold; background: #f9f9f9; }
        .section-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; }
        .balance-section { margin: 20px 0; }
        .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .metric-label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .metric-value { font-size: 20px; font-weight: bold; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    `;

    switch(reportType) {
      case 'dashboard':
        reportContent = `
          ${printStyles}
          <div class="print-header">
            <h1>SARANYA INTERNATIONAL</h1>
            <h2>Accounting Dashboard</h2>
            <p>Date: ${today}</p>
          </div>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-label">Total Revenue</div>
              <div class="metric-value">Rs ${fmt(metrics?.totalRevenue)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Gross Profit</div>
              <div class="metric-value">Rs ${fmt(metrics?.grossProfit)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Net Profit</div>
              <div class="metric-value">Rs ${fmt(metrics?.netProfit)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Assets</div>
              <div class="metric-value">Rs ${fmt(metrics?.totalAssets)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Liabilities</div>
              <div class="metric-value">Rs ${fmt(metrics?.totalLiabilities)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Equity</div>
              <div class="metric-value">Rs ${fmt(metrics?.totalEquity)}</div>
            </div>
          </div>
          <p style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
            Generated by Saranya International Accounting System
          </p>
        `;
        break;

      case 'income':
        reportContent = `
          ${printStyles}
          <div class="print-header">
            <h1>SARANYA INTERNATIONAL</h1>
            <h2>Income Statement</h2>
            <p>Date: ${today}</p>
          </div>
          <table>
            <tr><th colspan="2" style="text-align: center; background: #333; color: white;">REVENUE</th></tr>
            ${(accountingData?.chartOfAccounts?.income || []).map(acc => `
              <tr>
                <td>${acc.name}</td>
                <td class="text-right">Rs ${fmt(acc.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td>Total Revenue</td>
              <td class="text-right">Rs ${fmt(metrics?.totalRevenue)}</td>
            </tr>
            <tr><th colspan="2" style="text-align: center; background: #333; color: white;">EXPENSES</th></tr>
            ${(accountingData?.chartOfAccounts?.expenses || []).map(acc => `
              <tr>
                <td>${acc.name}</td>
                <td class="text-right">Rs ${fmt(acc.balance)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td>Gross Profit</td>
              <td class="text-right">Rs ${fmt(metrics?.grossProfit)}</td>
            </tr>
            <tr class="total-row" style="background: #e0e0e0;">
              <td>Net Profit</td>
              <td class="text-right">Rs ${fmt(metrics?.netProfit)}</td>
            </tr>
          </table>
        `;
        break;

      case 'balance':
        reportContent = `
          ${printStyles}
          <div class="print-header">
            <h1>SARANYA INTERNATIONAL</h1>
            <h2>Balance Sheet</h2>
            <p>As of: ${today}</p>
          </div>
          <div class="section-title">ASSETS</div>
          <table>
            <thead>
              <tr><th>Account Code</th><th>Account Name</th><th class="text-right">Balance</th></tr>
            </thead>
            <tbody>
              ${(accountingData?.chartOfAccounts?.assets || []).map(acc => `
                <tr>
                  <td>${acc.code}</td>
                  <td>${acc.name}</td>
                  <td class="text-right">Rs ${fmt(acc.balance)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="2">Total Assets</td>
                <td class="text-right">Rs ${fmt(metrics?.totalAssets)}</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">LIABILITIES</div>
          <table>
            <thead>
              <tr><th>Account Code</th><th>Account Name</th><th class="text-right">Balance</th></tr>
            </thead>
            <tbody>
              ${(accountingData?.chartOfAccounts?.liabilities || []).map(acc => `
                <tr>
                  <td>${acc.code}</td>
                  <td>${acc.name}</td>
                  <td class="text-right">Rs ${fmt(acc.balance)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="2">Total Liabilities</td>
                <td class="text-right">Rs ${fmt(metrics?.totalLiabilities)}</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">EQUITY</div>
          <table>
            <thead>
              <tr><th>Account Code</th><th>Account Name</th><th class="text-right">Balance</th></tr>
            </thead>
            <tbody>
              ${(accountingData?.chartOfAccounts?.equity || []).map(acc => `
                <tr>
                  <td>${acc.code}</td>
                  <td>${acc.name}</td>
                  <td class="text-right">Rs ${fmt(acc.balance)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="2">Total Equity</td>
                <td class="text-right">Rs ${fmt(metrics?.totalEquity)}</td>
              </tr>
            </tbody>
          </table>

          <p style="margin-top: 30px; padding: 15px; background: #f0f0f0; border-left: 4px solid #10b981;">
            ✓ Accounting Equation Balanced: Assets (Rs ${fmt(metrics?.totalAssets)}) =
            Liabilities (Rs ${fmt(metrics?.totalLiabilities)}) + Equity (Rs ${fmt(metrics?.totalEquity)})
          </p>
        `;
        break;

      case 'trial':
        reportContent = `
          ${printStyles}
          <div class="print-header">
            <h1>SARANYA INTERNATIONAL</h1>
            <h2>Trial Balance</h2>
            <p>Date: ${today}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Account Code</th>
                <th>Account Name</th>
                <th>Type</th>
                <th class="text-right">Debit</th>
                <th class="text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              ${[
                ...(accountingData?.chartOfAccounts?.assets || []),
                ...(accountingData?.chartOfAccounts?.liabilities || []),
                ...(accountingData?.chartOfAccounts?.equity || []),
                ...(accountingData?.chartOfAccounts?.income || []),
                ...(accountingData?.chartOfAccounts?.expenses || [])
              ].map(acc => {
                const isDebit = ['Current Asset', 'COGS', 'Operating'].includes(acc.type);
                return `
                  <tr>
                    <td>${acc.code}</td>
                    <td>${acc.name}</td>
                    <td>${acc.type}</td>
                    <td class="text-right">${isDebit ? 'Rs ' + fmt(acc.balance) : '-'}</td>
                    <td class="text-right">${!isDebit ? 'Rs ' + fmt(acc.balance) : '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
        break;

      case 'journal':
        reportContent = `
          ${printStyles}
          <div class="print-header">
            <h1>SARANYA INTERNATIONAL</h1>
            <h2>Journal Entries</h2>
            <p>Date: ${today}</p>
          </div>
          ${(accountingData?.journalEntries || []).map(entry => `
            <div style="margin: 20px 0; border: 1px solid #ddd; padding: 15px; page-break-inside: avoid;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: bold;">
                <span>Entry ID: ${entry.id}</span>
                <span>Date: ${entry.date}</span>
                <span>Type: ${entry.type}</span>
              </div>
              <div style="margin-bottom: 10px; font-size: 12px; color: #666;">Reference: ${entry.reference}</div>
              <table>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th class="text-right">Debit</th>
                    <th class="text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  ${(entry.entries || []).map(line => `
                    <tr>
                      <td>${line.account}</td>
                      <td class="text-right">${line.debit ? 'Rs ' + fmt(line.debit) : '-'}</td>
                      <td class="text-right">${line.credit ? 'Rs ' + fmt(line.credit) : '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        `;
        break;

      case 'accounts':
        reportContent = `
          ${printStyles}
          <div class="print-header">
            <h1>SARANYA INTERNATIONAL</h1>
            <h2>Chart of Accounts</h2>
            <p>Date: ${today}</p>
          </div>

          <div class="section-title">ASSETS</div>
          <table>
            <thead>
              <tr><th>Code</th><th>Account Name</th><th>Type</th><th class="text-right">Balance</th></tr>
            </thead>
            <tbody>
              ${(accountingData?.chartOfAccounts?.assets || []).map(acc => `
                <tr>
                  <td>${acc.code}</td>
                  <td>${acc.name}</td>
                  <td>${acc.type}</td>
                  <td class="text-right">Rs ${fmt(acc.balance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">LIABILITIES</div>
          <table>
            <thead>
              <tr><th>Code</th><th>Account Name</th><th>Type</th><th class="text-right">Balance</th></tr>
            </thead>
            <tbody>
              ${(accountingData?.chartOfAccounts?.liabilities || []).map(acc => `
                <tr>
                  <td>${acc.code}</td>
                  <td>${acc.name}</td>
                  <td>${acc.type}</td>
                  <td class="text-right">Rs ${fmt(acc.balance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">EQUITY</div>
          <table>
            <thead>
              <tr><th>Code</th><th>Account Name</th><th>Type</th><th class="text-right">Balance</th></tr>
            </thead>
            <tbody>
              ${(accountingData?.chartOfAccounts?.equity || []).map(acc => `
                <tr>
                  <td>${acc.code}</td>
                  <td>${acc.name}</td>
                  <td>${acc.type}</td>
                  <td class="text-right">Rs ${fmt(acc.balance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">INCOME</div>
          <table>
            <thead>
              <tr><th>Code</th><th>Account Name</th><th>Type</th><th class="text-right">Balance</th></tr>
            </thead>
            <tbody>
              ${(accountingData?.chartOfAccounts?.income || []).map(acc => `
                <tr>
                  <td>${acc.code}</td>
                  <td>${acc.name}</td>
                  <td>${acc.type}</td>
                  <td class="text-right">Rs ${fmt(acc.balance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">EXPENSES</div>
          <table>
            <thead>
              <tr><th>Code</th><th>Account Name</th><th>Type</th><th class="text-right">Balance</th></tr>
            </thead>
            <tbody>
              ${(accountingData?.chartOfAccounts?.expenses || []).map(acc => `
                <tr>
                  <td>${acc.code}</td>
                  <td>${acc.name}</td>
                  <td>${acc.type}</td>
                  <td class="text-right">Rs ${fmt(acc.balance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Saranya International - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</title>
        </head>
        <body>
          ${reportContent}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <div className="loading-text">Loading data from your system...</div>
        </div>
      </div>
    );
  }

  const fmt = (n) => ((n ?? 0)).toLocaleString();

  return (
    <div className="accounting-reports-container">
      {/* Inject internal CSS */}
      <style>{accountingCss}</style>

      <header className="accounting-header">
        <div className="content-wrapper">
          <h1>Accounting & Reports Dashboard</h1>
          <p>Real-time financial reports from your inventory system</p>
        </div>
      </header>

      <div className="content-wrapper">
        {errorMessage && (
          <div className="error-banner" role="alert">
            <AlertCircle />
            <div>
              <div className="error-banner-title">Could not load live data</div>
              <div className="error-banner-message">{errorMessage}</div>
            </div>
          </div>
        )}

        <nav className="nav-tabs">
          <div className="nav-tabs-container">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'income', label: 'Income Statement', icon: TrendingUp },
              { id: 'balance', label: 'Balance Sheet', icon: Package },
              { id: 'trial', label: 'Trial Balance', icon: CheckCircle },
              { id: 'journal', label: 'Journal Entries', icon: FileText },
              { id: 'accounts', label: 'Chart of Accounts', icon: Users }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Date Filter Section */}
        <div className="report-card" style={{ marginTop: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.5rem', display: 'block' }}>
                Filter Period
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  minWidth: '150px',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Time</option>
                <option value="YEARLY">Yearly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="CUSTOM">Custom Range</option>
              </select>
            </div>

            {(filterType === 'YEARLY' || filterType === 'MONTHLY') && (
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.5rem', display: 'block' }}>
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    minWidth: '120px',
                    cursor: 'pointer'
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}

            {filterType === 'MONTHLY' && (
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.5rem', display: 'block' }}>
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    minWidth: '140px',
                    cursor: 'pointer'
                  }}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                    <option key={idx + 1} value={idx + 1}>{month}</option>
                  ))}
                </select>
              </div>
            )}

            {filterType === 'CUSTOM' && (
              <>
                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.5rem', display: 'block' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #cbd5e0',
                      borderRadius: '6px',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.5rem', display: 'block' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #cbd5e0',
                      borderRadius: '6px',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
              </>
            )}

            <button
              onClick={fetchAllData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                marginTop: 'auto',
                background: '#4a5568',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.95rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          {activeTab === 'dashboard' && (
            <>
              <div className="info-banner">
                <div className="info-banner-header">
                  <Activity />
                  <div>
                    <div className="info-banner-title">Live Data from Your System</div>
                    <div className="info-banner-subtitle">
                      {accountingData?.rawCounts?.totalSales ?? 0} Sales • {accountingData?.rawCounts?.totalInventoryItems ?? 0} Items • {accountingData?.rawCounts?.totalCustomers ?? 0} Customers • {accountingData?.rawCounts?.totalSuppliers ?? 0} Suppliers
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: '#4a5568',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                      onClick={() => printReport('dashboard')}
                    >
                      <FileText size={16} /> Print Report
                    </button>
                    <button className="refresh-button" onClick={fetchAllData}>
                      <RefreshCw /> Refresh
                    </button>
                  </div>
                </div>
              </div>

              {/* Premium KPI Cards */}
              <div className="metrics-grid" style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {/* Revenue Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  color: 'white',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.2, fontSize: '80px' }}>
                    <DollarSign size={80} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '500' }}>Total Revenue</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Rs {fmt(metrics?.totalRevenue)}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px' }}>
                        📈 {accountingData?.rawCounts?.totalSales || 0} Sales
                      </span>
                    </div>
                  </div>
                </div>

                {/* Net Profit Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  color: 'white',
                  boxShadow: '0 10px 30px rgba(245, 87, 108, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.2, fontSize: '80px' }}>
                    <TrendingUp size={80} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '500' }}>Net Profit</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Rs {fmt(metrics?.netProfit)}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px' }}>
                        💰 Margin: {metrics?.netMargin}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Assets Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  color: 'white',
                  boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.2, fontSize: '80px' }}>
                    <Package size={80} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '500' }}>Total Assets</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Rs {fmt(metrics?.totalAssets)}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px' }}>
                        📦 Inventory: Rs {fmt(accountingData?.chartOfAccounts?.assets?.find(a => a.code === '1040')?.balance || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accounts Payable (Supplier Liability) Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  color: 'white',
                  boxShadow: '0 10px 30px rgba(250, 112, 154, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.2, fontSize: '80px' }}>
                    <Users size={80} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '500' }}>Accounts Payable</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Rs {fmt(metrics?.totalLiabilities)}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px' }}>
                        🏭 {accountingData?.rawCounts?.totalSuppliers || 0} Suppliers
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accounts Receivable Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  color: '#2d3748',
                  boxShadow: '0 10px 30px rgba(168, 237, 234, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, fontSize: '80px' }}>
                    <CreditCard size={80} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem', fontWeight: '600' }}>Accounts Receivable</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Rs {fmt(accountingData?.chartOfAccounts?.assets?.find(a => a.code === '1030')?.balance || 0)}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                      <span style={{ background: 'rgba(45, 55, 72, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                        👥 {accountingData?.rawCounts?.totalCustomers || 0} Customers
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Health Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  color: '#2d3748',
                  boxShadow: '0 10px 30px rgba(252, 182, 159, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, fontSize: '80px' }}>
                    <Activity size={80} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem', fontWeight: '600' }}>Total Equity</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Rs {fmt(metrics?.totalEquity)}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                      <span style={{ background: 'rgba(45, 55, 72, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                        ✅ A = L + E Balanced
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              

              <div className="charts-grid" style={{ marginTop: 18 }}>
                <div className="chart-card">
                  <div className="chart-title">Monthly Profit Trend</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={accountingData?.monthlyProfitData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="Sales" />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <div className="chart-title">Revenue vs Expenses</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={(accountingData?.monthlyProfitData || []).slice(-6)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" name="Sales" />
                      <Bar dataKey="cogs" name="COGS" />
                      <Bar dataKey="expenses" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="table-card" style={{ marginTop: 18 }}>
                <div className="table-title">Recent Journal Entries</div>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Reference</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(accountingData?.journalEntries || []).map(entry => (
                      <tr key={entry.id}>
                        <td>{entry.id}</td>
                        <td>{entry.date}</td>
                        <td>{entry.type}</td>
                        <td>{entry.reference}</td>
                        <td><span className="status-badge">{entry.status}</span></td>
                      </tr>
                    ))}
                    {(!accountingData?.journalEntries || accountingData.journalEntries.length === 0) && (
                      <tr>
                        <td colSpan="5" className="text-center">No journal entries available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Income Statement */}
        {activeTab === 'income' && (
          <div className="report-card" style={{ marginTop: 8 }}>
            <div className="report-header">
              <div>
                <div className="report-title">Income Statement</div>
                <div className="report-subtitle">For the reporting period</div>
              </div>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#4a5568',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                onClick={() => printReport('income')}
              >
                <FileText size={16} /> Print
              </button>
            </div>

            <div>
              <div className="section-title">Revenue</div>
              {(accountingData?.chartOfAccounts?.income || []).map(acc => (
                <div className="section-row" key={acc.code}>
                  <div>{acc.name}</div>
                  <div>Rs {fmt(acc.balance)}</div>
                </div>
              ))}

              <div className="section-total">
                <div>Total Revenue</div>
                <div>Rs {fmt(metrics?.totalRevenue)}</div>
              </div>

              <div style={{ height: 12 }}></div>

              <div className="section-title">Cost of Goods Sold</div>
              <div className="section-row">
                <div>Cost of Goods Sold</div>
                <div>Rs {fmt(metrics?.totalCOGS)}</div>
              </div>

              <div style={{ height: 12 }}></div>

              <div className="section-title">Operating Expenses</div>
              {(accountingData?.chartOfAccounts?.expenses || []).filter(e => e.code !== '5010').map(acc => (
                <div className="section-row" key={acc.code}>
                  <div>{acc.name}</div>
                  <div>Rs {fmt(acc.balance)}</div>
                </div>
              ))}

              <div className="section-total">
                <div>Total Operating Expenses</div>
                <div>Rs {fmt(metrics?.totalExpenses)}</div>
              </div>

              <div style={{ height: 18 }}></div>

              <div className="highlight-box">
                <div className="highlight-row">
                  <div>
                    <div className="highlight-value">Rs {fmt(metrics?.netProfit)}</div>
                    <div className="text-sm">Net Profit (Net Margin: {metrics?.netMargin}%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Sheet */}
        {activeTab === 'balance' && (
          <div style={{ marginTop: 8 }}>
            <div className="report-card">
              <div className="report-header">
                <div>
                  <div className="report-title">Balance Sheet</div>
                  <div className="report-subtitle">As of Today</div>
                </div>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#4a5568',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                  onClick={() => printReport('balance')}
                >
                  <FileText size={16} /> Print
                </button>
              </div>

              <div className="balance-grid">
                <div>
                  <div className="section-title">Assets</div>
                  <div>
                    {(accountingData?.chartOfAccounts?.assets || []).map(acc => (
                      <div className="balance-item" key={acc.code}>
                        <div>
                          <div className="balance-item-label">{acc.name}</div>
                          <div className="balance-item-code">{acc.code}</div>
                        </div>
                        <div className="balance-item-value">Rs {fmt(acc.balance)}</div>
                      </div>
                    ))}
                    <div className="balance-total">
                      <div>Total Assets</div>
                      <div>Rs {fmt(metrics?.totalAssets)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="section-title">Liabilities</div>
                  <div>
                    {(accountingData?.chartOfAccounts?.liabilities || []).map(acc => (
                      <div className="balance-item" key={acc.code}>
                        <div>
                          <div className="balance-item-label">{acc.name}</div>
                          <div className="balance-item-code">{acc.code}</div>
                        </div>
                        <div className="balance-item-value">Rs {fmt(acc.balance)}</div>
                      </div>
                    ))}
                    <div className="balance-total">
                      <div>Total Liabilities</div>
                      <div>Rs {fmt(metrics?.totalLiabilities)}</div>
                    </div>

                    <div style={{ height: 18 }} />

                    <div className="section-title">Equity</div>
                    {(accountingData?.chartOfAccounts?.equity || []).map(acc => (
                      <div className="balance-item" key={acc.code}>
                        <div>
                          <div className="balance-item-label">{acc.name}</div>
                          <div className="balance-item-code">{acc.code}</div>
                        </div>
                        <div className="balance-item-value">Rs {fmt(acc.balance)}</div>
                      </div>
                    ))}

                    <div className="balance-total">
                      <div>Total Equity</div>
                      <div>Rs {fmt(metrics?.totalEquity)}</div>
                    </div>

                    <div style={{ height: 18 }} />

                    <div className="balance-check">
                      <CheckCircle />
                      <div className="balance-check-text">
                        ✓ Accounting Equation Balanced: Assets (Rs {fmt(metrics?.totalAssets)}) = Liabilities (Rs {fmt(metrics?.totalLiabilities)}) + Equity (Rs {fmt(metrics?.totalEquity)})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trial Balance */}
        {activeTab === 'trial' && (
          <div className="table-card" style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="table-title">Trial Balance</div>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#4a5568',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                onClick={() => printReport('trial')}
              >
                <FileText size={16} /> Print
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Account Code</th>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th className="text-right">Debit</th>
                  <th className="text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...(accountingData?.chartOfAccounts?.assets || []),
                  ...(accountingData?.chartOfAccounts?.liabilities || []),
                  ...(accountingData?.chartOfAccounts?.equity || []),
                  ...(accountingData?.chartOfAccounts?.income || []),
                  ...(accountingData?.chartOfAccounts?.expenses || [])
                ].map(acc => {
                  const isDebit = ['Current Asset', 'COGS', 'Operating'].includes(acc.type);
                  return (
                    <tr key={acc.code}>
                      <td>{acc.code}</td>
                      <td>{acc.name}</td>
                      <td><span style={{ padding: '4px 8px', borderRadius: 6, background: isDebit ? '#ebf8ff' : '#f0fff4' }}>{acc.type}</span></td>
                      <td className="text-right">{isDebit ? `Rs ${fmt(acc.balance)}` : '-'}</td>
                      <td className="text-right">{!isDebit ? `Rs ${fmt(acc.balance)}` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Journal Entries */}
        {activeTab === 'journal' && (
          <div style={{ marginTop: 8 }}>
            <div className="report-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="report-title">Journal Entries (Auto-Generated)</div>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#4a5568',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                  onClick={() => printReport('journal')}
                >
                  <FileText size={16} /> Print
                </button>
              </div>
              <div style={{ marginTop: 12 }}>
                {(accountingData?.journalEntries || []).map(entry => (
                  <div className="journal-entry" key={entry.id} style={{ marginBottom: 12 }}>
                    <div className="journal-header">
                      <div className="journal-info">
                        <div>
                          <div className="journal-id">{entry.id}</div>
                          <div className="journal-meta">{entry.type} • {entry.date} • Ref: {entry.reference}</div>
                        </div>
                        <div><span className="status-badge">{entry.status}</span></div>
                      </div>
                    </div>

                    <div style={{ padding: 12 }}>
                      <table style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th className="text-right">Debit</th>
                            <th className="text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(entry.entries || []).map((line, idx) => (
                            <tr key={idx}>
                              <td>{line.account}</td>
                              <td className="text-right">{line.debit > 0 ? `Rs ${fmt(line.debit)}` : '-'}</td>
                              <td className="text-right">{line.credit > 0 ? `Rs ${fmt(line.credit)}` : '-'}</td>
                            </tr>
                          ))}
                          <tr style={{ background: '#f7fafc', fontWeight: 600 }}>
                            <td>Total</td>
                            <td className="text-right">Rs {fmt((entry.entries || []).reduce((s, l) => s + (l.debit || 0), 0))}</td>
                            <td className="text-right">Rs {fmt((entry.entries || []).reduce((s, l) => s + (l.credit || 0), 0))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chart of Accounts */}
        {activeTab === 'accounts' && (
          <div className="report-card" style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="report-title">Chart of Accounts</div>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#4a5568',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                onClick={() => printReport('accounts')}
              >
                <FileText size={16} /> Print
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              {['assets', 'liabilities', 'equity', 'income', 'expenses'].map(category => (
                <div key={category} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, color: '#2d3748', textTransform: 'capitalize' }}>{category}</div>
                  <table style={{ width: '100%', marginBottom: 8 }}>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Account Name</th>
                        <th>Type</th>
                        <th className="text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(accountingData?.chartOfAccounts?.[category] || []).map(acc => (
                        <tr key={acc.code}>
                          <td>{acc.code}</td>
                          <td>{acc.name}</td>
                          <td>{acc.type}</td>
                          <td className="text-right">Rs {fmt(acc.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer style={{ marginTop: 22 }}>
          © {new Date().getFullYear()} Saranya International. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default AccountingReportsSystem;
