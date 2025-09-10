import React, { useState, useEffect, useCallback } from 'react';
import './SalesPage.css'; // Import the CSS file

// API configuration to match your Spring Boot backend
const API_BASE_URL = 'http://localhost:8080/api';

// Currency formatter for Sri Lankan Rupees
const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return 'Rs. 0.00';
  return `Rs. ${parseFloat(amount).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

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

// Searchable Product Dropdown Component
const SearchableProductDropdown = ({ 
  products, 
  value, 
  onChange, 
  disabled, 
  className, 
  placeholder = "Search by product code..." 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product => 
        product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const selectedProduct = products.find(p => p.id === parseInt(value));

  const handleSelect = (product) => {
    onChange(product.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className="searchable-dropdown" style={{ position: 'relative' }}>
      <div 
        className={`searchable-dropdown-input ${className || ''}`}
        onClick={handleInputClick}
        style={{
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ color: selectedProduct ? '#333' : '#999' }}>
          {selectedProduct ? `${selectedProduct.code}` : placeholder}
        </span>
        <span style={{ marginLeft: '8px' }}>▼</span>
      </div>
      
      {isOpen && !disabled && (
        <div 
          className="searchable-dropdown-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Type to search product codes..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              borderBottom: '1px solid #eee',
              outline: 'none'
            }}
            autoFocus
          />
          
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f5f5f5',
                    ':hover': {
                      backgroundColor: '#f8f9fa'
                    }
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  <div style={{ fontWeight: 'bold' }}>{product.code}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {formatCurrency(product.fixedPrice || product.price)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '8px 12px', color: '#999', textAlign: 'center' }}>
                No products found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Sale Modal Component
const SaleModal = ({ sale, customers, products, onSave, onClose, printInvoice, downloadInvoice }) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Helper function to get product code for display
  const getProductCodeForDisplay = (item) => {
    if (item.product && item.product.code) {
      return item.product.code;
    }
    
    if (item.productId && products && products.length > 0) {
      const product = products.find(p => p.id === item.productId);
      if (product && product.code) {
        return product.code;
      }
    }
    
    return 'Unknown Code';
  };

  return (
    <div className="sales-modal-overlay" onClick={onClose}>
      <div className="sales-modal" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="sales-modal-title">{sale ? `Sale #${sale.id} Details` : 'Create New Sale'}</h2>
          
          {sale ? (
            // View Mode
            <div>
              {/* Invoice Action Buttons */}
              <div className="sales-invoice-actions" style={{marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button 
                  onClick={() => printInvoice(sale)}
                  className="sales-invoice-button"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Print Invoice
                </button>
                <button 
                  onClick={() => downloadInvoice(sale)}
                  className="sales-download-button"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Download Invoice
                </button>
              </div>

              <div className="sales-modal-view-grid">
                <div>
                  <div className="sales-modal-field">
                    <label className="sales-modal-label">Customer</label>
                    <p className="sales-modal-value">
                      {sale.customer?.name || sale.customer?.customerName || sale.customerName || 'Walk-in Customer'}
                    </p>
                    {sale.customer?.email && (
                      <p className="sales-modal-customer-email">Email: {sale.customer.email}</p>
                    )}
                    {sale.customer?.phone && (
                      <p className="sales-modal-customer-phone">Phone: {sale.customer.phone}</p>
                    )}
                    <p className="sales-modal-customer-id">Customer ID: {sale.customer?.id || sale.customerId || 'No ID'}</p>
                  </div>
                  <div className="sales-modal-field">
                    <label className="sales-modal-label">Sale Date</label>
                    <p className="sales-modal-value">{formatDate(sale.saleDate)}</p>
                  </div>
                </div>
                
                <div>
                  <div className="sales-modal-field">
                    <label className="sales-modal-label">Payment Method</label>
                    <p className="sales-modal-value">{sale.paymentMethod?.replace('_', ' ') || 'Unknown'}</p>
                  </div>
                  <div className="sales-modal-field">
                    <label className="sales-modal-label">Status</label>
                    <span className={`sales-status-badge ${sale.isPaid ? 'sales-status-paid' : 'sales-status-unpaid'}`}>
                      {sale.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>
              
              {sale.paymentMethod === 'CREDIT_CHECK' && (
                <div className="sales-check-details">
                  <h3 className="sales-check-title">Check Payment Details</h3>
                  <div className="sales-check-details-grid">
                    <div>
                      <label className="sales-modal-label">Check Number</label>
                      <p className="sales-modal-value">{sale.checkNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="sales-modal-label">Check Date</label>
                      <p className="sales-modal-value">{sale.checkDate ? formatDate(sale.checkDate) : 'N/A'}</p>
                    </div>
                  </div>
                  {sale.bankName && (
                    <div className="sales-modal-field">
                      <label className="sales-modal-label">Bank Name</label>
                      <p className="sales-modal-value">{sale.bankName}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="sales-modal-field">
                <label className="sales-modal-label">Total Amount</label>
                <p className="sales-total-amount">{formatCurrency(sale.totalAmount)}</p>
              </div>
              
              {sale.notes && (
                <div className="sales-modal-field">
                  <label className="sales-modal-label">Notes</label>
                  <p className="sales-notes-display">{sale.notes}</p>
                </div>
              )}
              
              {Array.isArray(sale.saleItems) && sale.saleItems.length > 0 && (
                <div className="sales-modal-field">
                  <label className="sales-modal-label">Sale Items</label>
                  <div className="sales-items-table-wrapper">
                    <table className="sales-items-table">
                      <thead className="sales-items-header">
                        <tr>
                          <th className="sales-items-th">Product Code</th>
                          <th className="sales-items-th">Quantity</th>
                          <th className="sales-items-th">Unit Price</th>
                          <th className="sales-items-th">Discount</th>
                          <th className="sales-items-th">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sale.saleItems.map((item, index) => (
                          <tr key={item.id || index} className="sales-items-row">
                            <td className="sales-items-td">{getProductCodeForDisplay(item)}</td>
                            <td className="sales-items-td">{item.quantity || 0}</td>
                            <td className="sales-items-td">{formatCurrency(item.unitPrice)}</td>
                            <td className="sales-items-td">{formatCurrency(item.discount || 0)}</td>
                            <td className="sales-items-td sales-line-total">{formatCurrency(item.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="sales-modal-actions">
                <button 
                  onClick={onClose}
                  className="sales-modal-close-button"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            // Create/Edit Mode
            <form onSubmit={handleSubmit}>
              {/* Customer Selection */}
              <div className="sales-form-field">
                <label className="sales-form-label">Customer *</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleInputChange('customerId', e.target.value)}
                  className={`sales-form-select ${validationErrors.customerId ? 'sales-form-error' : ''}`}
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
                  <p className="sales-form-error-text">{validationErrors.customerId}</p>
                )}
              </div>

              {/* Payment Method */}
              <div className="sales-form-field">
                <label className="sales-form-label">Payment Method *</label>
                <div className="sales-payment-methods">
                  {paymentMethods.map(method => (
                    <div key={method.value}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={formData.paymentMethod === method.value}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="sales-payment-radio"
                        disabled={saving}
                      />
                      <div 
                        className={`sales-payment-option ${formData.paymentMethod === method.value ? 'sales-payment-selected' : ''}`}
                        onClick={() => handleInputChange('paymentMethod', method.value)}
                      >
                        <div className="sales-payment-label">{method.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Check Payment Details */}
              {formData.paymentMethod === 'CREDIT_CHECK' && (
                <div className="sales-check-payment-form">
                  <h3 className="sales-check-form-title">Check Payment Details</h3>
                  <div className="sales-check-form-grid">
                    <div>
                      <label className="sales-form-label">Check Number *</label>
                      <input
                        type="text"
                        value={formData.checkNumber}
                        onChange={(e) => handleInputChange('checkNumber', e.target.value)}
                        className={`sales-form-input ${validationErrors.checkNumber ? 'sales-form-error' : ''}`}
                        placeholder="Enter check number"
                        disabled={saving}
                      />
                      {validationErrors.checkNumber && (
                        <p className="sales-form-error-text">{validationErrors.checkNumber}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="sales-form-label">Check Date (Due Date) *</label>
                      <input
                        type="date"
                        value={formData.checkDate}
                        onChange={(e) => handleInputChange('checkDate', e.target.value)}
                        className={`sales-form-input ${validationErrors.checkDate ? 'sales-form-error' : ''}`}
                        disabled={saving}
                      />
                      {validationErrors.checkDate && (
                        <p className="sales-form-error-text">{validationErrors.checkDate}</p>
                      )}
                      <p className="sales-check-date-note">Set future date for reminder alerts</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="sales-form-label">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                      className="sales-form-input"
                      placeholder="Enter bank name (optional)"
                      disabled={saving}
                    />
                  </div>
                </div>
              )}

              {/* Sale Items */}
              <div className="sales-form-field">
                <div className="sales-items-header">
                  <label className="sales-form-label">Sale Items *</label>
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={saving}
                    className="sales-add-item-button"
                  >
                    Add Item
                  </button>
                </div>
                
                <div>
                  {formData.saleItems.map((item, index) => (
                    <div key={index} className="sales-item-form">
                      <div className="sales-item-grid">
                        <div>
                          <label className="sales-form-label">Product *</label>
                          <SearchableProductDropdown
                            products={products}
                            value={item.productId}
                            onChange={(productId) => handleItemChange(index, 'productId', productId)}
                            disabled={saving}
                            className={validationErrors[`saleItems_${index}_productId`] ? 'sales-form-error' : ''}
                            placeholder="Search by product code..."
                          />
                          {validationErrors[`saleItems_${index}_productId`] && (
                            <p className="sales-form-error-text-small">{validationErrors[`saleItems_${index}_productId`]}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="sales-form-label">Quantity *</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className={`sales-form-input ${validationErrors[`saleItems_${index}_quantity`] ? 'sales-form-error' : ''}`}
                            disabled={saving}
                          />
                          {validationErrors[`saleItems_${index}_quantity`] && (
                            <p className="sales-form-error-text-small">{validationErrors[`saleItems_${index}_quantity`]}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="sales-form-label">Unit Price *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            className={`sales-form-input ${validationErrors[`saleItems_${index}_unitPrice`] ? 'sales-form-error' : ''}`}
                            disabled={saving}
                            placeholder="Enter price manually"
                          />
                          {validationErrors[`saleItems_${index}_unitPrice`] && (
                            <p className="sales-form-error-text-small">{validationErrors[`saleItems_${index}_unitPrice`]}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="sales-form-label">Discount</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                            className="sales-form-input"
                            disabled={saving}
                          />
                        </div>
                        
                        <div className="sales-item-total-section">
                          <div className="sales-item-total">
                            {formatCurrency((parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)) - parseFloat(item.discount || 0))}
                          </div>
                          
                          {formData.saleItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              disabled={saving}
                              className="sales-remove-item-button"
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
              <div className="sales-form-field">
                <label className="sales-form-label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional notes..."
                  rows="4"
                  disabled={saving}
                  className="sales-form-textarea"
                />
              </div>

              {/* Total */}
              <div className="sales-form-total">
                <label className="sales-form-label">Total Amount</label>
                <p className="sales-form-total-amount">{formatCurrency(calculateTotal())}</p>
              </div>

              {/* Action Buttons */}
              <div className="sales-form-actions">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="sales-form-cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="sales-form-submit-button"
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

// Main SalesPage Component
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

  // Invoice/Receipt generator function with proper product code lookup
  const generateInvoiceHTML = useCallback((sale) => {
    const formatDateInvoice = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString('en-GB');
      } catch (error) {
        return 'Invalid Date';
      }
    };

    const formatCurrencyInvoice = (amount) => {
      if (amount == null || isNaN(amount)) return 'Rs. 0.00';
      return `Rs. ${parseFloat(amount).toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };

    const calculateLineTotal = (item) => {
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
      return subtotal - (item.discount || 0);
    };

    // Helper function to get product code for invoice items
    const getProductCode = (item) => {
      // First try to get from item.product.code
      if (item.product && item.product.code) {
        return item.product.code;
      }
      
      // If not available, try to find product by ID from products array
      if (item.productId && products && products.length > 0) {
        const product = products.find(p => p.id === item.productId);
        if (product && product.code) {
          return product.code;
        }
      }
      
      // Fallback to 'Unknown Code'
      return 'Unknown Code';
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice #${sale.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .invoice-container { max-width: 800px; margin: 0 auto; background: white; }
          .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
          .company-name { font-size: 28px; font-weight: bold; color: #007bff; margin-bottom: 5px; }
          .company-details { font-size: 14px; color: #666; }
          .invoice-title { font-size: 24px; font-weight: bold; margin: 20px 0; }
          .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .invoice-meta div { flex: 1; }
          .meta-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
          .meta-value { font-size: 16px; margin-top: 5px; }
          .customer-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .section-title { font-weight: bold; color: #007bff; margin-bottom: 10px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
          .items-table th { background: #f8f9fa; font-weight: bold; color: #495057; }
          .items-table .text-right { text-align: right; }
          .totals-section { text-align: right; margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .total-label { font-weight: bold; }
          .grand-total { font-size: 18px; font-weight: bold; color: #007bff; border-top: 2px solid #007bff; padding-top: 10px; margin-top: 10px; }
          .payment-info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .status-badge { padding: 5px 15px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 12px; }
          .status-paid { background: #d4edda; color: #155724; }
          .status-unpaid { background: #f8d7da; color: #721c24; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; font-size: 12px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <div class="company-name">Your Company Name</div>
            <div class="company-details">
              123 Business Street, City, Province<br>
              Phone: +94 11 123 4567 | Email: info@company.lk
            </div>
            <div class="invoice-title">INVOICE</div>
          </div>

          <div class="invoice-meta">
            <div>
              <div class="meta-label">Invoice Number</div>
              <div class="meta-value">#${sale.id}</div>
            </div>
            <div>
              <div class="meta-label">Date</div>
              <div class="meta-value">${formatDateInvoice(sale.saleDate)}</div>
            </div>
            <div>
              <div class="meta-label">Status</div>
              <div class="meta-value">
                <span class="status-badge ${sale.isPaid ? 'status-paid' : 'status-unpaid'}">
                  ${sale.isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>
          </div>

          <div class="customer-section">
            <div class="section-title">Bill To:</div>
            <div style="font-size: 16px; font-weight: bold;">${sale.customer?.name || sale.customer?.customerName || sale.customerName || 'Walk-in Customer'}</div>
            ${sale.customer?.email ? `<div>Email: ${sale.customer.email}</div>` : ''}
            ${sale.customer?.phone ? `<div>Phone: ${sale.customer.phone}</div>` : ''}
            ${sale.customer?.address ? `<div>Address: ${sale.customer.address}</div>` : ''}
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 40%;">Item Code</th>
                <th style="width: 15%;" class="text-right">Qty</th>
                <th style="width: 15%;" class="text-right">Unit Price</th>
                <th style="width: 15%;" class="text-right">Discount</th>
                <th style="width: 15%;" class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${sale.saleItems?.map(item => `
                <tr>
                  <td>
                    <div style="font-weight: bold;">${getProductCode(item)}</div>
                  </td>
                  <td class="text-right">${item.quantity || 0}</td>
                  <td class="text-right">${formatCurrencyInvoice(item.unitPrice)}</td>
                  <td class="text-right">${formatCurrencyInvoice(item.discount || 0)}</td>
                  <td class="text-right">${formatCurrencyInvoice(calculateLineTotal(item))}</td>
                </tr>
              `).join('') || '<tr><td colspan="5">No items found</td></tr>'}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrencyInvoice(sale.saleItems?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0) || 0)}</span>
            </div>
            <div class="total-row">
              <span>Total Discount:</span>
              <span>${formatCurrencyInvoice(sale.saleItems?.reduce((sum, item) => sum + (item.discount || 0), 0) || 0)}</span>
            </div>
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>${formatCurrencyInvoice(sale.totalAmount)}</span>
            </div>
          </div>

          ${sale.paymentMethod ? `
            <div class="payment-info">
              <div class="section-title">Payment Information</div>
              <div><strong>Payment Method:</strong> ${sale.paymentMethod.replace('_', ' ')}</div>
              ${sale.paymentMethod === 'CREDIT_CHECK' && sale.checkNumber ? `
                <div><strong>Check Number:</strong> ${sale.checkNumber}</div>
                ${sale.checkDate ? `<div><strong>Check Date:</strong> ${formatDateInvoice(sale.checkDate)}</div>` : ''}
                ${sale.bankName ? `<div><strong>Bank:</strong> ${sale.bankName}</div>` : ''}
              ` : ''}
            </div>
          ` : ''}

          ${sale.notes ? `
            <div style="margin-top: 20px;">
              <div class="section-title">Notes</div>
              <div>${sale.notes}</div>
            </div>
          ` : ''}

          <div class="footer">
            <div>Thank you for your business!</div>
            <div>This is a computer generated invoice.</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }, [products]); // Added products as dependency

  // Function to download invoice
  const downloadInvoice = useCallback((sale) => {
    try {
      console.log('Download invoice called with sale:', sale);
      const invoiceHTML = generateInvoiceHTML(sale);
      const blob = new Blob([invoiceHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${sale.id}_${sale.customer?.name || sale.customer?.customerName || sale.customerName || 'Customer'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('Invoice download completed');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Invoice download කරන්න බැරි වුණා. කරුණාකර නැවත try කරන්න.');
    }
  }, [generateInvoiceHTML]);

  // Function to print invoice
  const printInvoice = useCallback((sale) => {
    try {
      console.log('Print invoice called with sale:', sale);
      const invoiceHTML = generateInvoiceHTML(sale);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        console.log('Invoice print completed');
      } else {
        alert('Pop-ups allow කරන්න invoice print කරන්න.');
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Invoice print කරන්න බැරි වුණා. කරුණාකර නැවත try කරන්න.');
    }
  }, [generateInvoiceHTML]);

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

  if (loading) {
    return (
      <div className="sales-loading-container">
        <div>Loading sales data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sales-error-container">
        <div className="sales-error-text">{error}</div>
        <button 
          onClick={() => fetchData()}
          className="sales-retry-button"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="sales-page-container">
      <div>
        {/* Check Reminders Alert */}
        {checkReminders.length > 0 && (
          <div className="sales-check-reminders">
            <h3 className="sales-reminders-title">Check Payment Reminders</h3>
            <div>
              {checkReminders.map((reminder, index) => (
                <div key={index} className="sales-reminder-item">
                  <div className={`sales-reminder-message ${reminder.status === 'overdue' ? 'sales-reminder-overdue' : 'sales-reminder-upcoming'}`}>
                    {reminder.message}
                  </div>
                  <div className="sales-reminder-details">
                    Customer: {reminder.sale.customer?.name} - Amount: {formatCurrency(reminder.sale.totalAmount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="sales-header">
          <div>
            <h1 className="sales-title">Sales Management</h1>
            <p className="sales-subtitle">Manage sales transactions and track payments</p>
          </div>
          <button
            onClick={handleCreateSale}
            className="sales-create-button"
          >
            Create New Sale
          </button>
        </div>

        {/* Filters */}
        <div className="sales-filters-container">
          <div className="sales-filters-grid">
            <div>
              <label className="sales-filter-label">Search</label>
              <input
                type="text"
                placeholder="Customer, Sale ID, Check #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sales-search-input"
              />
            </div>
            <div>
              <label className="sales-filter-label">Payment Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="sales-filter-select"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>
            <div>
              <label className="sales-filter-label">Payment Method</label>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="sales-filter-select"
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CHECK">Check</option>
              </select>
            </div>
            <div className="sales-stats">
              <div className="sales-stats-count">
                Total Sales: {filteredSales.length}
              </div>
              <div className="sales-stats-revenue">
                Revenue: {formatCurrency(filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0))}
              </div>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="sales-table-container">
          <div className="sales-table-wrapper">
            <table className="sales-table">
              <thead className="sales-table-header">
                <tr>
                  <th className="sales-table-th">Sale ID</th>
                  <th className="sales-table-th">Customer</th>
                  <th className="sales-table-th">Date</th>
                  <th className="sales-table-th">Amount</th>
                  <th className="sales-table-th">Payment</th>
                  <th className="sales-table-th">Status</th>
                  <th className="sales-table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <tr key={sale.id || `sale-${Math.random()}`} className="sales-table-row">
                      <td className="sales-table-td">#{sale.id || 'N/A'}</td>
                      <td className="sales-table-td">
                        <div>
                          <div className="sales-customer-name">{sale.customer?.name || sale.customerName || 'Unknown Customer'}</div>
                          <div className="sales-customer-email">{sale.customer?.email || 'No email'}</div>
                        </div>
                      </td>
                      <td className="sales-table-td">{formatDate(sale.saleDate)}</td>
                      <td className="sales-table-td sales-amount">{formatCurrency(sale.totalAmount)}</td>
                      <td className="sales-table-td">
                        <div>{sale.paymentMethod?.replace('_', ' ') || 'Unknown'}</div>
                        {sale.paymentMethod === 'CREDIT_CHECK' && sale.checkNumber && (
                          <div className="sales-check-info">Check #{sale.checkNumber}</div>
                        )}
                        {sale.paymentMethod === 'CREDIT_CHECK' && sale.checkDate && (
                          <div className="sales-check-info">Due: {formatDate(sale.checkDate)}</div>
                        )}
                      </td>
                      <td className="sales-table-td">
                        <span className={`sales-status-badge ${sale.isPaid ? 'sales-status-paid' : 'sales-status-unpaid'}`}>
                          {sale.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="sales-table-td">
                        <div className="sales-actions">
                          <button 
                            onClick={() => handleViewSale(sale)}
                            className="sales-action-button sales-view-button"
                          >
                            View
                          </button>
                          {!sale.isPaid && (
                            <button 
                              onClick={() => handleMarkAsPaid(sale.id)}
                              className="sales-action-button sales-paid-button"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteSale(sale.id)}
                            className="sales-action-button sales-delete-button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="sales-empty-state">
                      <div>
                        <div className="sales-empty-title">No sales found</div>
                        <div className="sales-empty-subtitle">
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
            printInvoice={printInvoice}
            downloadInvoice={downloadInvoice}
          />
        )}
      </div>
    </div>
  );
};

export default SalesPage;