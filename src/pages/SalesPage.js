import React, { useState, useEffect, useCallback } from 'react';

// Mock API service for demonstration
const api = {
  defaults: { timeout: 30000 },
  interceptors: {
    request: { use: () => {}, eject: () => {} },
    response: { use: () => {}, eject: () => {} }
  },
  get: async (url) => {
    // Mock data based on URL
    if (url === '/sales') {
      return {
        data: [
          {
            id: 1,
            customer: { id: 1, name: 'John Smith', email: 'john@example.com' },
            saleDate: '2024-12-15',
            totalAmount: 1500.00,
            paymentMethod: 'CREDIT_CHECK',
            checkNumber: 'CHK001',
            checkDate: '2025-01-15',
            isPaid: false,
            notes: 'Customer prefers check payment',
            saleItems: [
              { id: 1, productId: 1, product: { name: 'Laptop Pro' }, quantity: 1, unitPrice: 1500.00, lineTotal: 1500.00 }
            ]
          },
          {
            id: 2,
            customer: { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
            saleDate: '2024-12-10',
            totalAmount: 800.00,
            paymentMethod: 'CREDIT_CARD',
            isPaid: true,
            notes: 'Express delivery requested',
            saleItems: [
              { id: 2, productId: 2, product: { name: 'Wireless Headphones' }, quantity: 2, unitPrice: 400.00, lineTotal: 800.00 }
            ]
          }
        ]
      };
    }
    if (url === '/customers') {
      return {
        data: [
          { id: 1, name: 'John Smith', email: 'john@example.com' },
          { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
        ]
      };
    }
    if (url === '/products') {
      return {
        data: [
          { id: 1, name: 'Laptop Pro', fixedPrice: 1500.00 },
          { id: 2, name: 'Wireless Headphones', fixedPrice: 400.00 },
          { id: 3, name: 'Smartphone', fixedPrice: 800.00 },
          { id: 4, name: 'Tablet', fixedPrice: 600.00 }
        ]
      };
    }
    return { data: [] };
  },
  post: async () => ({ data: { success: true } }),
  put: async () => ({ data: { success: true } }),
  delete: async () => ({ data: { success: true } })
};

const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [checkReminders, setCheckReminders] = useState([]);

  const extractDataFromResponse = (response, fallback = []) => {
    if (response && response.data && response.data.data) {
      return Array.isArray(response.data.data) ? response.data.data : fallback;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    return fallback;
  };

  const fetchData = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      const [salesRes, customersRes, productsRes] = await Promise.all([
        api.get('/sales').catch(err => ({ data: [] })),
        api.get('/customers').catch(err => ({ data: [] })),
        api.get('/products').catch(err => ({ data: [] }))
      ]);

      const salesData = extractDataFromResponse(salesRes, []);
      const customersData = extractDataFromResponse(customersRes, []);
      const productsData = extractDataFromResponse(productsRes, []);

      setSales(salesData);
      setCustomers(customersData);
      setProducts(productsData);

      checkPendingReminders(salesData);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load sales data');
      setSales([]);
      setCustomers([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPendingReminders = (salesData) => {
    const today = new Date();
    const pendingChecks = salesData.filter(sale => 
      sale.paymentMethod === 'CREDIT_CHECK' && 
      !sale.isPaid && 
      sale.checkDate
    );

    const reminders = pendingChecks.map(sale => {
      const checkDate = new Date(sale.checkDate);
      const daysDiff = Math.ceil((checkDate - today) / (1000 * 60 * 60 * 24));
      
      let status = 'pending';
      let message = '';
      
      if (daysDiff < 0) {
        status = 'overdue';
        message = `Check #${sale.checkNumber} is ${Math.abs(daysDiff)} days overdue`;
      } else if (daysDiff <= 3) {
        status = 'due-soon';
        message = `Check #${sale.checkNumber} is due in ${daysDiff} days`;
      } else if (daysDiff <= 7) {
        status = 'upcoming';
        message = `Check #${sale.checkNumber} is due in ${daysDiff} days`;
      }

      return {
        sale,
        daysDiff,
        status,
        message,
        checkDate
      };
    }).filter(reminder => reminder.status !== 'pending');

    setCheckReminders(reminders);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSales = Array.isArray(sales) 
    ? sales.filter(sale => {
        if (!sale) return false;
        
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
          (sale.customer?.name && sale.customer.name.toLowerCase().includes(searchLower)) ||
          (sale.id && sale.id.toString().includes(searchTerm)) ||
          (sale.checkNumber && sale.checkNumber.toLowerCase().includes(searchLower));

        const matchesStatus = filterStatus === 'ALL' || 
          (filterStatus === 'PAID' && sale.isPaid) ||
          (filterStatus === 'UNPAID' && !sale.isPaid);

        const matchesPaymentMethod = filterPaymentMethod === 'ALL' || 
          sale.paymentMethod === filterPaymentMethod;

        return matchesSearch && matchesStatus && matchesPaymentMethod;
      })
    : [];

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  const handleCreateSale = () => {
    setSelectedSale(null);
    setShowModal(true);
  };

  const handleSaveSale = async (saleData) => {
    try {
      if (selectedSale) {
        await api.put(`/sales/${selectedSale.id}`, saleData);
      } else {
        await api.post('/sales', saleData);
      }
      setShowModal(false);
      setSelectedSale(null);
      await fetchData();
      alert('Sale saved successfully!');
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Failed to save sale: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleMarkAsPaid = async (saleId) => {
    if (window.confirm('Mark this sale as paid?')) {
      try {
        await api.put(`/sales/${saleId}/mark-paid`);
        fetchData();
        alert('Sale marked as paid successfully!');
      } catch (error) {
        console.error('Error marking sale as paid:', error);
        alert('Failed to mark sale as paid');
      }
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await api.delete(`/sales/${saleId}`);
        fetchData();
        alert('Sale deleted successfully!');
      } catch (error) {
        console.error('Error deleting sale:', error);
        alert('Failed to delete sale');
      }
    }
  };

  const getPaymentStatusColor = (isPaid) => {
    return isPaid 
      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/50' 
      : 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200/50';
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'CASH': return 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200/50';
      case 'CREDIT_CARD': return 'bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 border border-sky-200/50';
      case 'DEBIT_CARD': return 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border border-violet-200/50';
      case 'BANK_TRANSFER': return 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-200/50';
      case 'CREDIT_CHECK': return 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200/50';
      default: return 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border border-slate-200/50';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Add calm premium styles
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .calm-container {
        background: linear-gradient(135deg, 
          #f8fafc 0%, 
          #f1f5f9 25%, 
          #e2e8f0 50%, 
          #f1f5f9 75%, 
          #f8fafc 100%);
        min-height: 100vh;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }
      
      .calm-card {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(20px);
        border-radius: 24px;
        box-shadow: 
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06),
          0 0 0 1px rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.3);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .calm-card:hover {
        box-shadow: 
          0 10px 15px -3px rgba(0, 0, 0, 0.1),
          0 4px 6px -2px rgba(0, 0, 0, 0.05),
          0 0 0 1px rgba(255, 255, 255, 0.6);
        transform: translateY(-2px);
      }
      
      .calm-button {
        background: linear-gradient(135deg, #64748b 0%, #475569 100%);
        color: white;
        font-weight: 600;
        padding: 14px 28px;
        border-radius: 16px;
        border: none;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 
          0 4px 6px -1px rgba(100, 116, 139, 0.3),
          0 2px 4px -1px rgba(100, 116, 139, 0.1);
        position: relative;
        overflow: hidden;
      }
      
      .calm-button:hover {
        background: linear-gradient(135deg, #475569 0%, #334155 100%);
        box-shadow: 
          0 10px 15px -3px rgba(100, 116, 139, 0.4),
          0 4px 6px -2px rgba(100, 116, 139, 0.2);
        transform: translateY(-3px);
      }
      
      .calm-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      
      .calm-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s;
      }
      
      .calm-button:hover::before {
        left: 100%;
      }
      
      .calm-input {
        width: 100%;
        padding: 16px 20px;
        border: 2px solid rgba(148, 163, 184, 0.2);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        font-size: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        outline: none;
        box-sizing: border-box;
      }
      
      .calm-input:focus {
        border-color: #64748b;
        box-shadow: 
          0 0 0 4px rgba(100, 116, 139, 0.1),
          0 4px 6px -1px rgba(0, 0, 0, 0.1);
        background: rgba(255, 255, 255, 0.95);
      }
      
      .calm-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }
      
      .calm-table-header {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        position: relative;
      }
      
      .calm-table-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      }
      
      .calm-table-cell {
        padding: 20px 24px;
        border-bottom: 1px solid rgba(226, 232, 240, 0.5);
        transition: all 0.3s ease;
      }
      
      .calm-table-row {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .calm-table-row:hover {
        background: linear-gradient(135deg, 
          rgba(100, 116, 139, 0.03) 0%, 
          rgba(71, 85, 105, 0.02) 100%);
        transform: translateY(-1px);
      }
      
      .calm-badge {
        display: inline-flex;
        align-items: center;
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      
      .calm-badge:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      
      .calm-reminder {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 32px;
        border-left: 4px solid #f59e0b;
        box-shadow: 
          0 4px 6px -1px rgba(245, 158, 11, 0.1),
          0 2px 4px -1px rgba(245, 158, 11, 0.06);
        animation: gentle-pulse 2s ease-in-out infinite;
      }
      
      @keyframes gentle-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.95; }
      }
      
      .calm-title {
        background: linear-gradient(135deg, #64748b 0%, #475569 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: -0.025em;
        margin: 0;
      }
      
      .calm-subtitle {
        color: #64748b;
        font-size: 1.1rem;
        font-weight: 400;
        margin-top: 8px;
        opacity: 0.8;
      }
      
      .calm-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        gap: 32px;
      }
      
      .calm-spinner {
        position: relative;
        width: 64px;
        height: 64px;
      }
      
      .calm-spinner::before,
      .calm-spinner::after {
        content: '';
        position: absolute;
        border-radius: 50%;
        border: 3px solid transparent;
        border-top-color: #64748b;
        animation: calm-spin 1.5s linear infinite;
      }
      
      .calm-spinner::before {
        width: 64px;
        height: 64px;
      }
      
      .calm-spinner::after {
        width: 48px;
        height: 48px;
        top: 8px;
        left: 8px;
        border-top-color: #94a3b8;
        animation-duration: 1s;
        animation-direction: reverse;
      }
      
      @keyframes calm-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .calm-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        padding: 16px;
        animation: calm-fade-in 0.3s ease-out;
      }
      
      .calm-modal {
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(20px);
        border-radius: 24px;
        width: 100%;
        max-width: 1000px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 
          0 25px 50px -12px rgba(0, 0, 0, 0.25),
          0 0 0 1px rgba(255, 255, 255, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: calm-modal-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      @keyframes calm-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes calm-modal-in {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      .calm-action-button {
        color: #64748b;
        background: none;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
      }
      
      .calm-action-button:hover {
        background: rgba(100, 116, 139, 0.1);
        color: #475569;
        transform: translateY(-1px);
      }
      
      .calm-action-button.success {
        color: #059669;
      }
      
      .calm-action-button.success:hover {
        background: rgba(5, 150, 105, 0.1);
        color: #047857;
      }
      
      .calm-action-button.danger {
        color: #dc2626;
      }
      
      .calm-action-button.danger:hover {
        background: rgba(220, 38, 38, 0.1);
        color: #b91c1c;
      }
      
      .calm-stats {
        background: linear-gradient(135deg, 
          rgba(100, 116, 139, 0.05) 0%, 
          rgba(71, 85, 105, 0.03) 100%);
        padding: 16px 20px;
        border-radius: 16px;
        border: 1px solid rgba(100, 116, 139, 0.1);
      }
      
      .calm-payment-selector {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      
      .calm-payment-option {
        position: relative;
        cursor: pointer;
      }
      
      .calm-payment-card {
        padding: 20px;
        border: 2px solid rgba(148, 163, 184, 0.2);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: center;
      }
      
      .calm-payment-card:hover {
        border-color: rgba(100, 116, 139, 0.3);
        background: rgba(255, 255, 255, 0.95);
        transform: translateY(-2px);
      }
      
      .calm-payment-card.selected {
        border-color: #64748b;
        background: rgba(100, 116, 139, 0.05);
        box-shadow: 0 0 0 4px rgba(100, 116, 139, 0.1);
      }
    `;
    
    if (!document.head.querySelector('#calm-sales-styles')) {
      styleElement.id = 'calm-sales-styles';
      document.head.appendChild(styleElement);
    }

    return () => {
      const existingStyles = document.head.querySelector('#calm-sales-styles');
      if (existingStyles) {
        existingStyles.remove();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="calm-container">
        <div className="calm-loading">
          <div className="calm-spinner"></div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#64748b' }}>
            Loading sales data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calm-container">
        <div className="calm-loading">
          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#dc2626', textAlign: 'center' }}>
            {error}
          </div>
          <button 
            onClick={() => fetchData()}
            className="calm-button"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="calm-container">
      <div style={{ padding: '40px' }}>
        {/* Check Reminders Alert */}
        {checkReminders.length > 0 && (
          <div className="calm-reminder">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f59e0b', marginBottom: '16px' }}>
              Check Payment Reminders
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {checkReminders.map((reminder, index) => (
                <div key={index} style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: reminder.status === 'overdue' ? '#fef2f2' :
                    reminder.status === 'due-soon' ? '#fffbeb' : '#eff6ff',
                  color: reminder.status === 'overdue' ? '#991b1b' :
                    reminder.status === 'due-soon' ? '#92400e' : '#1e40af',
                  border: `1px solid ${reminder.status === 'overdue' ? '#fecaca' :
                    reminder.status === 'due-soon' ? '#fed7aa' : '#bfdbfe'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600' }}>{reminder.message}</span>
                    <span style={{ fontSize: '0.875rem', opacity: '0.8' }}>
                      Customer: {reminder.sale.customer?.name} - Amount: {formatCurrency(reminder.sale.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 className="calm-title">Sales Management</h1>
            <p className="calm-subtitle">Manage sales transactions and track payments</p>
          </div>
          <button
            onClick={handleCreateSale}
            className="calm-button"
          >
            Create New Sale
          </button>
        </div>

        {/* Filters */}
        <div className="calm-card" style={{ padding: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Search
              </label>
              <input
                type="text"
                placeholder="Customer, Sale ID, Check #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="calm-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Payment Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="calm-input"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Payment Method
              </label>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="calm-input"
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CHECK">Check</option>
              </select>
            </div>
            <div className="calm-stats">
              <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.875rem' }}>
                Total Sales: {filteredSales.length}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>
                Revenue: {formatCurrency(filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0))}
              </div>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="calm-card">
          <div style={{ overflowX: 'auto' }}>
            <table className="calm-table">
              <thead className="calm-table-header">
                <tr>
                  <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sale ID
                  </th>
                  <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Customer
                  </th>
                  <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Date
                  </th>
                  <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Amount
                  </th>
                  <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Payment
                  </th>
                  <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status
                  </th>
                  <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <tr key={sale.id || `sale-${Math.random()}`} className="calm-table-row">
                      <td className="calm-table-cell">
                        <span style={{ fontWeight: '700', color: '#64748b', fontSize: '0.875rem' }}>
                          #{sale.id || 'N/A'}
                        </span>
                      </td>
                      <td className="calm-table-cell">
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>
                            {sale.customer?.name || 'Unknown Customer'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                            {sale.customer?.email || 'No email'}
                          </div>
                        </div>
                      </td>
                      <td className="calm-table-cell">
                        <span style={{ color: '#374151', fontSize: '0.875rem' }}>
                          {formatDate(sale.saleDate)}
                        </span>
                      </td>
                      <td className="calm-table-cell">
                        <span style={{ fontWeight: '700', color: '#059669', fontSize: '1rem' }}>
                          {formatCurrency(sale.totalAmount)}
                        </span>
                      </td>
                      <td className="calm-table-cell">
                        <span className={`calm-badge ${getPaymentMethodColor(sale.paymentMethod)}`}>
                          {sale.paymentMethod?.replace('_', ' ') || 'Unknown'}
                        </span>
                        {sale.paymentMethod === 'CREDIT_CHECK' && sale.checkNumber && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                            Check #{sale.checkNumber}
                          </div>
                        )}
                        {sale.paymentMethod === 'CREDIT_CHECK' && sale.checkDate && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Due: {formatDate(sale.checkDate)}
                          </div>
                        )}
                      </td>
                      <td className="calm-table-cell">
                        <span className={`calm-badge ${getPaymentStatusColor(sale.isPaid)}`}>
                          {sale.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="calm-table-cell">
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleViewSale(sale)}
                            className="calm-action-button"
                          >
                            View
                          </button>
                          {!sale.isPaid && (
                            <button
                              onClick={() => handleMarkAsPaid(sale.id)}
                              className="calm-action-button success"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            className="calm-action-button danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '64px 32px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#6b7280' }}>
                          No sales found
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                          {searchTerm || filterStatus !== 'ALL' || filterPaymentMethod !== 'ALL' 
                            ? 'Try adjusting your filters' 
                            : 'Create your first sale to get started'}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sale Modal */}
        {showModal && (
          <SaleModal
            sale={selectedSale}
            customers={customers}
            products={products}
            onSave={handleSaveSale}
            onClose={() => {
              setShowModal(false);
              setSelectedSale(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Enhanced Sale Modal Component with Calm Premium Styling
const SaleModal = ({ sale, customers, products, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    customerId: sale?.customer?.id || '',
    saleDate: sale?.saleDate || new Date().toISOString().split('T')[0],
    paymentMethod: sale?.paymentMethod || 'CASH',
    checkNumber: sale?.checkNumber || '',
    checkDate: sale?.checkDate || '',
    notes: sale?.notes || '',
    saleItems: sale?.saleItems || [{ productId: '', quantity: 1, unitPrice: 0 }]
  });

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const paymentMethods = [
    { value: 'CASH', label: 'Cash Payment', icon: '💵' },
    { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
    { value: 'DEBIT_CARD', label: 'Debit Card', icon: '💳' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
    { value: 'CREDIT_CHECK', label: 'Check Payment', icon: '📄' }
  ];

  const validateForm = () => {
    const errors = {};
    
    if (!formData.customerId) {
      errors.customerId = 'Please select a customer';
    }
    
    if (!formData.saleDate) {
      errors.saleDate = 'Sale date is required';
    }
    
    if (formData.paymentMethod === 'CREDIT_CHECK') {
      if (!formData.checkNumber) {
        errors.checkNumber = 'Check number is required for check payments';
      }
      if (!formData.checkDate) {
        errors.checkDate = 'Check date is required for check payments';
      }
    }
    
    if (formData.saleItems.length === 0) {
      errors.saleItems = 'At least one item is required';
    } else {
      formData.saleItems.forEach((item, index) => {
        if (!item.productId) {
          errors[`saleItems_${index}_productId`] = 'Product is required';
        }
        if (!item.quantity || item.quantity <= 0) {
          errors[`saleItems_${index}_quantity`] = 'Valid quantity is required';
        }
        if (!item.unitPrice || item.unitPrice <= 0) {
          errors[`saleItems_${index}_unitPrice`] = 'Valid price is required';
        }
      });
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      const saleData = {
        ...formData,
        customerId: parseInt(formData.customerId),
        totalAmount: calculateTotal(),
        saleItems: formData.saleItems.map(item => ({
          ...item,
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          lineTotal: parseInt(item.quantity) * parseFloat(item.unitPrice)
        }))
      };
      
      await onSave(saleData);
    } catch (error) {
      console.error('Error saving sale:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.saleItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].unitPrice = product.fixedPrice || 0;
      }
    }
    
    setFormData(prev => ({ ...prev, saleItems: newItems }));
    
    const errorKey = `saleItems_${index}_${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => ({
        ...prev,
        [errorKey]: undefined
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      saleItems: [...prev.saleItems, { productId: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.saleItems.length > 1) {
      const newItems = formData.saleItems.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, saleItems: newItems }));
    }
  };

  const calculateTotal = () => {
    return formData.saleItems.reduce((total, item) => {
      return total + (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0));
    }, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="calm-modal-overlay" onClick={onClose}>
      <div className="calm-modal" style={{ maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '40px' }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: '800', 
            background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            {sale ? `Sale #${sale.id} Details` : 'Create New Sale'}
          </h2>
          
          {sale ? (
            // View Mode
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div className="calm-card" style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
                      Customer
                    </label>
                    <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                      {sale.customerName || 'Unknown'}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Customer ID: {sale.customerId || 'No ID'}
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
                      Sale Date
                    </label>
                    <p style={{ fontSize: '1rem', color: '#374151' }}>
                      {formatDate(sale.saleDate)}
                    </p>
                  </div>
                </div>
                
                <div className="calm-card" style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
                      Payment Method
                    </label>
                    <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                      {sale.paymentMethod?.replace('_', ' ') || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
                      Status
                    </label>
                    <span style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      backgroundColor: sale.isPaid ? '#dcfce7' : '#fef2f2',
                      color: sale.isPaid ? '#166534' : '#dc2626',
                      border: `1px solid ${sale.isPaid ? '#bbf7d0' : '#fecaca'}`
                    }}>
                      {sale.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>
              
              {sale.paymentMethod === 'CREDIT_CHECK' && (
                <div className="calm-card" style={{ 
                  padding: '24px', 
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '1px solid #fed7aa'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#92400e', marginBottom: '16px' }}>
                    Check Payment Details
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                        Check Number
                      </label>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#451a03' }}>
                        {sale.checkNumber || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                        Check Date
                      </label>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#451a03' }}>
                        {sale.checkDate ? formatDate(sale.checkDate) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="calm-card" style={{ 
                padding: '32px', 
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1px solid #bbf7d0',
                textAlign: 'center'
              }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
                  Total Amount
                </label>
                <p style={{ fontSize: '3rem', fontWeight: '800', color: '#15803d' }}>
                  {formatCurrency(sale.totalAmount)}
                </p>
              </div>
              
              {sale.notes && (
                <div className="calm-card" style={{ padding: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                    Notes
                  </label>
                  <p style={{ fontSize: '1rem', color: '#374151', lineHeight: '1.6', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                    {sale.notes}
                  </p>
                </div>
              )}
              
              {Array.isArray(sale.saleItems) && sale.saleItems.length > 0 && (
                <div className="calm-card" style={{ padding: '24px' }}>
                  <label style={{ display: 'block', fontSize: '1.125rem', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>
                    Sale Items
                  </label>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderRadius: '12px 0 0 12px' }}>
                            Product
                          </th>
                          <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                            Quantity
                          </th>
                          <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                            Unit Price
                          </th>
                          <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderRadius: '0 12px 12px 0' }}>
                            Line Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sale.saleItems.map((item, index) => (
                          <tr key={item.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '16px', color: '#1f2937', fontWeight: '500' }}>
                              {item.product?.name || 'Unknown Product'}
                            </td>
                            <td style={{ padding: '16px', color: '#374151' }}>
                              {item.quantity || 0}
                            </td>
                            <td style={{ padding: '16px', color: '#374151' }}>
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td style={{ padding: '16px', fontWeight: '700', color: '#059669' }}>
                              {formatCurrency(item.lineTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
                <button
                  onClick={onClose}
                  className="calm-button"
                  style={{ background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            // Create/Edit Mode
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Customer and Date */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Customer *
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleInputChange('customerId', e.target.value)}
                    className="calm-input"
                    style={{ borderColor: validationErrors.customerId ? '#dc2626' : undefined }}
                    disabled={saving}
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name || customer.customerName} - {customer.email || `ID: ${customer.id}`}
                      </option>
                    ))}
                  </select>
                  {validationErrors.customerId && (
                    <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px' }}>
                      {validationErrors.customerId}
                    </p>
                  )}
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Sale Date *
                  </label>
                  <input
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => handleInputChange('saleDate', e.target.value)}
                    className="calm-input"
                    style={{ borderColor: validationErrors.saleDate ? '#dc2626' : undefined }}
                    disabled={saving}
                  />
                  {validationErrors.saleDate && (
                    <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px' }}>
                      {validationErrors.saleDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                  Payment Method *
                </label>
                <div className="calm-payment-selector">
                  {paymentMethods.map(method => (
                    <div key={method.value} className="calm-payment-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={formData.paymentMethod === method.value}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        style={{ display: 'none' }}
                        disabled={saving}
                      />
                      <div className={`calm-payment-card ${formData.paymentMethod === method.value ? 'selected' : ''}`}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{method.icon}</div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{method.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Check Payment Details */}
              {formData.paymentMethod === 'CREDIT_CHECK' && (
                <div className="calm-card" style={{ 
                  padding: '24px', 
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '1px solid #fed7aa'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#92400e', marginBottom: '16px' }}>
                    Check Payment Details
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
                        Check Number *
                      </label>
                      <input
                        type="text"
                        value={formData.checkNumber}
                        onChange={(e) => handleInputChange('checkNumber', e.target.value)}
                        className="calm-input"
                        style={{ borderColor: validationErrors.checkNumber ? '#dc2626' : undefined }}
                        placeholder="Enter check number"
                        disabled={saving}
                      />
                      {validationErrors.checkNumber && (
                        <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px' }}>
                          {validationErrors.checkNumber}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
                        Check Date (Due Date) *
                      </label>
                      <input
                        type="date"
                        value={formData.checkDate}
                        onChange={(e) => handleInputChange('checkDate', e.target.value)}
                        className="calm-input"
                        style={{ borderColor: validationErrors.checkDate ? '#dc2626' : undefined }}
                        disabled={saving}
                      />
                      {validationErrors.checkDate && (
                        <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px' }}>
                          {validationErrors.checkDate}
                        </p>
                      )}
                      <p style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '4px' }}>
                        Set future date for reminder alerts
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sale Items */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    Sale Items *
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="calm-button"
                    style={{ padding: '12px 20px', fontSize: '0.875rem' }}
                    disabled={saving}
                  >
                    Add Item
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {formData.saleItems.map((item, index) => (
                    <div key={index} className="calm-card" style={{ padding: '24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                            Product *
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            className="calm-input"
                            style={{ borderColor: validationErrors[`saleItems_${index}_productId`] ? '#dc2626' : undefined }}
                            disabled={saving}
                          >
                            <option value="">Select a product</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - {formatCurrency(product.fixedPrice)}
                              </option>
                            ))}
                          </select>
                          {validationErrors[`saleItems_${index}_productId`] && (
                            <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px' }}>
                              {validationErrors[`saleItems_${index}_productId`]}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                            Quantity *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="calm-input"
                            style={{ borderColor: validationErrors[`saleItems_${index}_quantity`] ? '#dc2626' : undefined }}
                            disabled={saving}
                          />
                          {validationErrors[`saleItems_${index}_quantity`] && (
                            <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px' }}>
                              {validationErrors[`saleItems_${index}_quantity`]}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                            Unit Price *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            className="calm-input"
                            style={{ borderColor: validationErrors[`saleItems_${index}_unitPrice`] ? '#dc2626' : undefined }}
                            disabled={saving}
                          />
                          {validationErrors[`saleItems_${index}_unitPrice`] && (
                            <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px' }}>
                              {validationErrors[`saleItems_${index}_unitPrice`]}
                            </p>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'end', gap: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                              Line Total
                            </label>
                            <div style={{ 
                              padding: '16px 20px',
                              border: '2px solid rgba(148, 163, 184, 0.2)',
                              borderRadius: '16px',
                              background: 'rgba(248, 250, 252, 0.8)',
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#059669'
                            }}>
                              {formatCurrency(parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0))}
                            </div>
                          </div>
                          
                          {formData.saleItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="calm-action-button danger"
                              style={{ padding: '16px', marginBottom: '0' }}
                              disabled={saving}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="calm-input"
                  placeholder="Any additional notes..."
                  rows="4"
                  disabled={saving}
                />
              </div>

              {/* Total */}
              <div className="calm-card" style={{ 
                padding: '32px', 
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1px solid #bbf7d0',
                textAlign: 'center'
              }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
                  Total Amount
                </label>
                <p style={{ fontSize: '3rem', fontWeight: '800', color: '#15803d' }}>
                  {formatCurrency(calculateTotal())}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="calm-button"
                  style={{ 
                    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100())',
                    opacity: saving ? 0.6 : 1 
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="calm-button"
                  style={{ 
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    opacity: saving ? 0.6 : 1 
                  }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (sale ? 'Update Sale' : 'Create Sale')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesPage;