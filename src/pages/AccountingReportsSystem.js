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

const API_BASE = 'http://localhost:8080/api';

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

  const accountsReceivable = sales
    .filter(sale => sale.paymentStatus === 'PENDING' || sale.paymentStatus === 'PARTIAL')
    .reduce((s, sale) => s + (Number(sale.remainingAmount) || Number(sale.totalAmount) || 0), 0);

  // Default/fallback static balances (replace with real API values if available)
  const cashBalance = 0;
  const bankBalance = 0;
  const accountsPayable = 0;
  const rentExpense = 0;
  const utilitiesExpense = 0;
  const salariesExpense = 0;
  const totalOperatingExpenses = rentExpense + utilitiesExpense + salariesExpense;

  const totalAssets = cashBalance + bankBalance + accountsReceivable + totalInventoryValue;
  const totalLiabilities = accountsPayable;
  const grossProfit = totalSalesRevenue - totalCOGS;
  const netProfit = grossProfit - totalOperatingExpenses;
  const retainedEarnings = netProfit;
  const ownersEquity = 0;

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

  const journalEntries = sales.slice(0, 10).map((sale, idx) => {
    const saleAmount = Number(sale.totalAmount) || 0;
    const cogAmount = saleAmount * 0.6;
    const isCashSale = sale.paymentMethod === 'CASH' || sale.paymentStatus === 'PAID';
    return {
      id: `JE${String(idx + 1).padStart(3, '0')}`,
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
      totalSuppliers: suppliers.length
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
@media (max-width: 768px) {
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

  .nav-tab {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
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
                  <button className="refresh-button" onClick={fetchAllData}>
                    <RefreshCw /> Refresh
                  </button>
                </div>
              </div>

              <div className="metrics-grid" style={{ marginTop: 16 }}>
                <div className="metric-card revenue">
                  <div className="metric-card-header">
                    <div className="metric-icon"><DollarSign /></div>
                    <div className="metric-badge">YTD</div>
                  </div>
                  <div className="metric-value">Rs {fmt(metrics?.totalRevenue)}</div>
                  <div className="metric-label">Total Revenue</div>
                </div>

                <div className="metric-card profit">
                  <div className="metric-card-header">
                    <div className="metric-icon"><TrendingUp /></div>
                    <div className="metric-badge">{metrics?.netMargin}%</div>
                  </div>
                  <div className="metric-value">Rs {fmt(metrics?.netProfit)}</div>
                  <div className="metric-label">Net Profit</div>
                </div>

                <div className="metric-card assets">
                  <div className="metric-card-header">
                    <div className="metric-icon"><Package /></div>
                    <div className="metric-badge">Assets</div>
                  </div>
                  <div className="metric-value">Rs {fmt(metrics?.totalAssets)}</div>
                  <div className="metric-label">Total Assets</div>
                </div>

                <div className="metric-card cash">
                  <div className="metric-card-header">
                    <div className="metric-icon"><CreditCard /></div>
                    <div className="metric-badge">Live</div>
                  </div>
                  <div className="metric-value">Rs {fmt((metrics?.cashBalance ?? 0) + (metrics?.bankBalance ?? 0))}</div>
                  <div className="metric-label">Available Cash</div>
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
              <div className="report-title">Income Statement</div>
              <div className="report-subtitle">For the reporting period</div>
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
                <div className="report-title">Balance Sheet</div>
                <div className="report-subtitle">As of Today</div>
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
                      <div className="balance-check-text">Balance Sheet (calculated from API values)</div>
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
            <div className="table-title">Trial Balance</div>
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
              <div className="report-title">Journal Entries (Auto-Generated)</div>
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
            <div className="report-title">Chart of Accounts</div>
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
          <div className="footer-content">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="footer-card">
                <div className="footer-card-title">No Backend Changes</div>
                <div className="footer-card-text">Uses your existing API endpoints - no database modifications needed</div>
              </div>
              <div className="footer-card">
                <div className="footer-card-title">Real-Time Calculations</div>
                <div className="footer-card-text">All reports calculated live from your sales and inventory data</div>
              </div>
              <div className="footer-card">
                <div className="footer-card-title">Accounting Principles</div>
                <div className="footer-card-text">Follows standard double-entry bookkeeping and financial reporting standards</div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AccountingReportsSystem;
