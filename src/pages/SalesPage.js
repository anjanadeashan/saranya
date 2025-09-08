import React, { useState, useEffect, useCallback } from 'react';

// API configuration to match your Spring Boot backend
const API_BASE_URL = 'http://localhost:8080/api';

const api = {
  defaults: { timeout: 30000 },
  interceptors: {
    request: { use: () => {}, eject: () => {} },
    response: { use: () => {}, eject: () => {} }
  },
  
  get: async (url) => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Handle your ApiResponse wrapper
      if (result.success && result.data) {
        return { data: result.data };
      } else if (result.data) {
        return { data: result.data };
      } else {
        return { data: result };
      }
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  },
  
  post: async (url, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return { data: result.data || result };
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  },
  
  put: async (url, data = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: data ? JSON.stringify(data) : null
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return { data: result.data || result };
    } catch (error) {
      console.error('API PUT Error:', error);
      throw error;
    }
  },
  
  delete: async (url) => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return { data: result.data || result };
    } catch (error) {
      console.error('API DELETE Error:', error);
      throw error;
    }
  }
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
    if (response && response.data) {
      return Array.isArray(response.data) ? response.data : fallback;
    }
    return fallback;
  };

  const fetchData = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      const [salesRes, customersRes, productsRes] = await Promise.all([
        api.get('/sales').catch(err => {
          console.error('Sales fetch error:', err);
          return { data: [] };
        }),
        api.get('/customers').catch(err => {
          console.error('Customers fetch error:', err);
          return { data: [] };
        }),
        api.get('/products').catch(err => {
          console.error('Products fetch error:', err);
          return { data: [] };
        })
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
      setError(`Failed to load sales data: ${error.message}`);
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
      alert('Failed to save sale: ' + error.message);
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
        alert('Failed to mark sale as paid: ' + error.message);
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
        alert('Failed to delete sale: ' + error.message);
      }
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

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading sales data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
        <button 
          onClick={() => fetchData()}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div>
        {/* Check Reminders Alert */}
        {checkReminders.length > 0 && (
          <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', padding: '15px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>Check Payment Reminders</h3>
            <div>
              {checkReminders.map((reminder, index) => (
                <div key={index} style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold', color: reminder.status === 'overdue' ? '#dc3545' : '#856404' }}>
                    {reminder.message}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Customer: {reminder.sale.customer?.name} - Amount: {formatCurrency(reminder.sale.totalAmount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0' }}>Sales Management</h1>
            <p style={{ margin: 0, color: '#666' }}>Manage sales transactions and track payments</p>
          </div>
          <button
            onClick={handleCreateSale}
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Create New Sale
          </button>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '4px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Search</label>
              <input
                type="text"
                placeholder="Customer, Sale ID, Check #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Payment Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Payment Method</label>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CHECK">Check</option>
              </select>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Total Sales: {filteredSales.length}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                Revenue: {formatCurrency(filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0))}
              </div>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '4px', overflow: 'hidden', border: '1px solid #ddd' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Sale ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Customer</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Payment</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <tr key={sale.id || `sale-${Math.random()}`} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>#{sale.id || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{sale.customer?.name || sale.customerName || 'Unknown Customer'}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{sale.customer?.email || 'No email'}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>{formatDate(sale.saleDate)}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{formatCurrency(sale.totalAmount)}</td>
                      <td style={{ padding: '12px' }}>
                        <div>{sale.paymentMethod?.replace('_', ' ') || 'Unknown'}</div>
                        {sale.paymentMethod === 'CREDIT_CHECK' && sale.checkNumber && (
                          <div style={{ fontSize: '12px', color: '#666' }}>Check #{sale.checkNumber}</div>
                        )}
                        {sale.paymentMethod === 'CREDIT_CHECK' && sale.checkDate && (
                          <div style={{ fontSize: '12px', color: '#666' }}>Due: {formatDate(sale.checkDate)}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          backgroundColor: sale.isPaid ? '#d4edda' : '#f8d7da',
                          color: sale.isPaid ? '#155724' : '#721c24'
                        }}>
                          {sale.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => handleViewSale(sale)}
                            style={{ padding: '4px 8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            View
                          </button>
                          {!sale.isPaid && (
                            <button 
                              onClick={() => handleMarkAsPaid(sale.id)}
                              style={{ padding: '4px 8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              Mark Paid
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteSale(sale.id)}
                            style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>No sales found</div>
                        <div style={{ color: '#666' }}>
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

// Sale Modal Component
const SaleModal = ({ sale, customers, products, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    customerId: sale?.customer?.id || '',
    paymentMethod: sale?.paymentMethod || 'CASH',
    checkNumber: sale?.checkNumber || '',
    bankName: sale?.bankName || '',
    checkDate: sale?.checkDate || '',
    notes: sale?.notes || '',
    saleItems: sale?.saleItems?.map(item => ({
      productId: item.product?.id || item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0
    })) || [{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }]
  });

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const paymentMethods = [
    { value: 'CASH', label: 'Cash Payment' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'DEBIT_CARD', label: 'Debit Card' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CREDIT_CHECK', label: 'Check Payment' }
  ];

  const validateForm = () => {
    const errors = {};
    
    if (!formData.customerId) {
      errors.customerId = 'Please select a customer';
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
        customerId: parseInt(formData.customerId),
        paymentMethod: formData.paymentMethod,
        checkNumber: formData.checkNumber || null,
        bankName: formData.bankName || null,
        checkDate: formData.checkDate || null,
        notes: formData.notes || null,
        saleItems: formData.saleItems.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          discount: parseFloat(item.discount || 0)
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
        newItems[index].unitPrice = product.fixedPrice || product.price || 0;
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
      saleItems: [...prev.saleItems, { productId: '', quantity: 1, unitPrice: 0, discount: 0 }]
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
      const lineTotal = (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)) - parseFloat(item.discount || 0);
      return total + lineTotal;
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
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 1000 
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '20px', 
          maxWidth: '800px', 
          width: '90%', 
          maxHeight: '90%', 
          overflow: 'auto' 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 style={{ marginTop: 0 }}>{sale ? `Sale #${sale.id} Details` : 'Create New Sale'}</h2>
          
          {sale ? (
            // View Mode
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Customer</label>
                    <p style={{ margin: 0 }}>{sale.customer?.name || 'Unknown'}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Customer ID: {sale.customer?.id || 'No ID'}</p>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Sale Date</label>
                    <p style={{ margin: 0 }}>{formatDate(sale.saleDate)}</p>
                  </div>
                </div>
                
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Payment Method</label>
                    <p style={{ margin: 0 }}>{sale.paymentMethod?.replace('_', ' ') || 'Unknown'}</p>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Status</label>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: sale.isPaid ? '#d4edda' : '#f8d7da',
                      color: sale.isPaid ? '#155724' : '#721c24'
                    }}>
                      {sale.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>
              
              {sale.paymentMethod === 'CREDIT_CHECK' && (
                <div style={{ marginBottom: '20px', backgroundColor: '#fff3cd', padding: '15px', borderRadius: '4px' }}>
                  <h3 style={{ marginTop: 0 }}>Check Payment Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Check Number</label>
                      <p style={{ margin: 0 }}>{sale.checkNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Check Date</label>
                      <p style={{ margin: 0 }}>{sale.checkDate ? formatDate(sale.checkDate) : 'N/A'}</p>
                    </div>
                  </div>
                  {sale.bankName && (
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Bank Name</label>
                      <p style={{ margin: 0 }}>{sale.bankName}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Total Amount</label>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{formatCurrency(sale.totalAmount)}</p>
              </div>
              
              {sale.notes && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Notes</label>
                  <p style={{ margin: 0, padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>{sale.notes}</p>
                </div>
              )}
              
              {Array.isArray(sale.saleItems) && sale.saleItems.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>Sale Items</label>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                      <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Product</th>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Quantity</th>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Unit Price</th>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Discount</th>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sale.saleItems.map((item, index) => (
                          <tr key={item.id || index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{item.product?.name || 'Unknown Product'}</td>
                            <td style={{ padding: '10px' }}>{item.quantity || 0}</td>
                            <td style={{ padding: '10px' }}>{formatCurrency(item.unitPrice)}</td>
                            <td style={{ padding: '10px' }}>{formatCurrency(item.discount || 0)}</td>
                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{formatCurrency(item.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={onClose}
                  style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            // Create/Edit Mode
            <form onSubmit={handleSubmit}>
              {/* Customer Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Customer *</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleInputChange('customerId', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: `1px solid ${validationErrors.customerId ? '#dc2626' : '#ddd'}`, 
                    borderRadius: '4px' 
                  }}
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
                  <p style={{ margin: '5px 0 0 0', color: '#dc2626', fontSize: '14px' }}>{validationErrors.customerId}</p>
                )}
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>Payment Method *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  {paymentMethods.map(method => (
                    <div key={method.value}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={formData.paymentMethod === method.value}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        style={{ display: 'none' }}
                        disabled={saving}
                      />
                      <div 
                        style={{ 
                          padding: '10px', 
                          border: `2px solid ${formData.paymentMethod === method.value ? '#007bff' : '#ddd'}`, 
                          borderRadius: '4px', 
                          cursor: 'pointer', 
                          textAlign: 'center',
                          backgroundColor: formData.paymentMethod === method.value ? '#e7f3ff' : 'white'
                        }}
                        onClick={() => handleInputChange('paymentMethod', method.value)}
                      >
                        <div style={{ fontWeight: 'bold' }}>{method.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Check Payment Details */}
              {formData.paymentMethod === 'CREDIT_CHECK' && (
                <div style={{ marginBottom: '20px', backgroundColor: '#fff3cd', padding: '15px', borderRadius: '4px' }}>
                  <h3 style={{ marginTop: 0 }}>Check Payment Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Check Number *</label>
                      <input
                        type="text"
                        value={formData.checkNumber}
                        onChange={(e) => handleInputChange('checkNumber', e.target.value)}
                        style={{ 
                          width: '100%', 
                          padding: '8px', 
                          border: `1px solid ${validationErrors.checkNumber ? '#dc2626' : '#ddd'}`, 
                          borderRadius: '4px' 
                        }}
                        placeholder="Enter check number"
                        disabled={saving}
                      />
                      {validationErrors.checkNumber && (
                        <p style={{ margin: '5px 0 0 0', color: '#dc2626', fontSize: '14px' }}>{validationErrors.checkNumber}</p>
                      )}
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Check Date (Due Date) *</label>
                      <input
                        type="date"
                        value={formData.checkDate}
                        onChange={(e) => handleInputChange('checkDate', e.target.value)}
                        style={{ 
                          width: '100%', 
                          padding: '8px', 
                          border: `1px solid ${validationErrors.checkDate ? '#dc2626' : '#ddd'}`, 
                          borderRadius: '4px' 
                        }}
                        disabled={saving}
                      />
                      {validationErrors.checkDate && (
                        <p style={{ margin: '5px 0 0 0', color: '#dc2626', fontSize: '14px' }}>{validationErrors.checkDate}</p>
                      )}
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>Set future date for reminder alerts</p>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      placeholder="Enter bank name (optional)"
                      disabled={saving}
                    />
                  </div>
                </div>
              )}

              {/* Sale Items */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: 'bold' }}>Sale Items *</label>
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={saving}
                    style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Add Item
                  </button>
                </div>
                
                <div>
                  {formData.saleItems.map((item, index) => (
                    <div key={index} style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px', marginBottom: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Product *</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            style={{ 
                              width: '100%', 
                              padding: '8px', 
                              border: `1px solid ${validationErrors[`saleItems_${index}_productId`] ? '#dc2626' : '#ddd'}`, 
                              borderRadius: '4px' 
                            }}
                            disabled={saving}
                          >
                            <option value="">Select a product</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - {formatCurrency(product.fixedPrice || product.price)}
                              </option>
                            ))}
                          </select>
                          {validationErrors[`saleItems_${index}_productId`] && (
                            <p style={{ margin: '5px 0 0 0', color: '#dc2626', fontSize: '12px' }}>{validationErrors[`saleItems_${index}_productId`]}</p>
                          )}
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Quantity *</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            style={{ 
                              width: '100%', 
                              padding: '8px', 
                              border: `1px solid ${validationErrors[`saleItems_${index}_quantity`] ? '#dc2626' : '#ddd'}`, 
                              borderRadius: '4px' 
                            }}
                            disabled={saving}
                          />
                          {validationErrors[`saleItems_${index}_quantity`] && (
                            <p style={{ margin: '5px 0 0 0', color: '#dc2626', fontSize: '12px' }}>{validationErrors[`saleItems_${index}_quantity`]}</p>
                          )}
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Unit Price *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            style={{ 
                              width: '100%', 
                              padding: '8px', 
                              border: `1px solid ${validationErrors[`saleItems_${index}_unitPrice`] ? '#dc2626' : '#ddd'}`, 
                              borderRadius: '4px' 
                            }}
                            disabled={saving}
                          />
                          {validationErrors[`saleItems_${index}_unitPrice`] && (
                            <p style={{ margin: '5px 0 0 0', color: '#dc2626', fontSize: '12px' }}>{validationErrors[`saleItems_${index}_unitPrice`]}</p>
                          )}
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Discount</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            disabled={saving}
                          />
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            {formatCurrency((parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)) - parseFloat(item.discount || 0))}
                          </div>
                          
                          {formData.saleItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              disabled={saving}
                              style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
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
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional notes..."
                  rows="4"
                  disabled={saving}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                />
              </div>

              {/* Total */}
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Total Amount</label>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{formatCurrency(calculateTotal())}</p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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