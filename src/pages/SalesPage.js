import React, { useState, useEffect, useCallback } from 'react';
import './SalesPage.css';

// ===== CONFIGURATION =====
<<<<<<< HEAD
const API_BASE_URL = 'http://localhost:8080/api';
=======
const API_BASE_URL = 'http://107.173.40.112/api/api';
>>>>>>> master

// ===== UTILITY FUNCTIONS =====
const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return 'Rs. 0.00';
  return `Rs. ${parseFloat(amount).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    return 'Invalid Date';
  }
};

<<<<<<< HEAD
=======
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString();
  } catch (error) {
    return 'Invalid Date';
  }
};

>>>>>>> master
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

// FIXED: Customer name helper functions
const getCustomerName = (sale) => {
  return sale.customerName || 
         sale.customer?.name || 
         sale.customer?.customerName || 
         'Unknown Customer';
};

const getCustomerEmail = (sale) => {
  return sale.customer?.email || 
         sale.customerEmail || 
         'No email';
};

// FIXED: Enhanced number parsing utilities
const parsePositiveInteger = (value) => {
  if (!value && value !== 0) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
};

const parsePositiveFloat = (value) => {
  if (!value && value !== 0) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) || parsed < 0 ? null : parsed;
};

const parseNonNegativeFloat = (value) => {
  if (!value && value !== 0) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
};

const api = {
  getAuthHeaders: () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  },

  get: async (url) => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers: api.getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized access - please login');
          throw new Error('Authentication required. Please login.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return { data: result.success ? result.data : result };
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  },
  
  post: async (url, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: api.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login.');
        }
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
        headers: api.getAuthHeaders(),
        body: data ? JSON.stringify(data) : null
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login.');
        }
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
        headers: api.getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login.');
        }
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

// ===== HELPER COMPONENTS =====

// Stock Availability Checker Component
const StockAvailabilityChecker = ({ products, saleItems, onStockWarning }) => {
  const [stockStatus, setStockStatus] = useState({});
  const [checking, setChecking] = useState(false);

  const checkStockAvailability = useCallback(async () => {
    if (!saleItems || saleItems.length === 0) return;
    
    setChecking(true);
    const status = {};
    
    try {
      for (const item of saleItems) {
        if (item.productId && item.quantity) {
          try {
            const response = await api.get(`/inventory/check-availability/${item.productId}/${item.quantity}`);
            const isAvailable = response.data;
            
            const stockResponse = await api.get(`/inventory/total-available/${item.productId}`);
            const totalAvailable = stockResponse.data || 0;
            
            status[item.productId] = {
              isAvailable,
              totalAvailable,
              requested: item.quantity
            };
          } catch (error) {
            console.error(`Error checking stock for product ${item.productId}:`, error);
            status[item.productId] = {
              isAvailable: false,
              totalAvailable: 0,
              requested: item.quantity,
              error: true
            };
          }
        }
      }
      
      setStockStatus(status);
      
      const warnings = Object.entries(status).filter(([_, info]) => !info.isAvailable);
      if (warnings.length > 0 && onStockWarning) {
        onStockWarning(warnings);
      }
      
    } catch (error) {
      console.error('Error checking stock availability:', error);
    } finally {
      setChecking(false);
    }
  }, [saleItems, onStockWarning]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkStockAvailability();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [checkStockAvailability]);

  if (checking) {
    return <div className="stock-checker-loading">Checking stock availability...</div>;
  }

  const hasStockIssues = Object.values(stockStatus).some(status => !status.isAvailable);
  if (!hasStockIssues) return null;

  return (
    <div className="stock-availability-alert">
      <h4>Stock Availability Issues</h4>
      {Object.entries(stockStatus).map(([productId, status]) => {
        if (status.isAvailable) return null;
        
        const product = products.find(p => p.id === parseInt(productId));
        return (
          <div key={productId} className="stock-warning-item">
            <strong>{product?.code || `Product ${productId}`}</strong>: 
            Requested {status.requested}, Available {status.totalAvailable}
          </div>
        );
      })}
    </div>
  );
};

<<<<<<< HEAD
// FIFO Batch Information Component
const FIFOBatchInfo = ({ productId, requestedQuantity }) => {
  const [batchInfo, setBatchInfo] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId || !requestedQuantity) return;
    
    const fetchBatchInfo = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/inventory/available-stock/${productId}`);
        const batches = response.data || [];
        
        let remaining = requestedQuantity;
        const usedBatches = [];
        
        for (const batch of batches) {
          if (remaining <= 0) break;
          
          const quantityFromBatch = Math.min(remaining, batch.quantity);
          usedBatches.push({
            ...batch,
            quantityUsed: quantityFromBatch
          });
          remaining -= quantityFromBatch;
        }
        
        setBatchInfo(usedBatches);
      } catch (error) {
        console.warn('Error fetching batch info:', error.message);
        setBatchInfo([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBatchInfo();
  }, [productId, requestedQuantity]);

  if (loading) return <div className="batch-info-loading">Loading batch info...</div>;
  if (batchInfo.length === 0) return null;

  return (
    <div className="fifo-batch-info">
      <h5>FIFO Batches (Oldest First)</h5>
      <div className="batch-list">
        {batchInfo.map((batch, index) => (
          <div key={batch.id || index} className="batch-item">
            <div className="batch-date">
              {formatDate(batch.date)}
            </div>
            <div className="batch-details">
              Cost: {formatCurrency(batch.unitPrice)} × {batch.quantityUsed}
            </div>
            <div className="batch-available">
              Available: {batch.quantity}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
=======
// FIFO Batch Information Component - REMOVED
// Simplified bill creation without FIFO batch view
>>>>>>> master

// FIXED: Enhanced Product Dropdown Component
const SearchableProductDropdown = ({ 
  products, 
  value, 
  onChange, 
  disabled, 
  className, 
  placeholder = "Search by product code...",
  showStockInfo = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products || []);
  const [stockInfo, setStockInfo] = useState({});
  const [selectedProductDisplay, setSelectedProductDisplay] = useState('');

<<<<<<< HEAD
  // Initialize filtered products when products prop changes
=======
>>>>>>> master
  useEffect(() => {
    setFilteredProducts(products || []);
  }, [products]);

<<<<<<< HEAD
  // Update display when value or products change
=======
>>>>>>> master
  useEffect(() => {
    if (value && products && products.length > 0) {
      const numericValue = typeof value === 'string' ? parseInt(value) : value;
      const selectedProduct = products.find(p => p.id === numericValue);
      if (selectedProduct) {
        setSelectedProductDisplay(`${selectedProduct.code} - ${selectedProduct.name || ''}`);
      } else {
        setSelectedProductDisplay('');
      }
    } else {
      setSelectedProductDisplay('');
    }
  }, [value, products]);

  useEffect(() => {
    if (searchTerm && products) {
      const filtered = products.filter(product => 
        product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products || []);
    }
  }, [searchTerm, products]);

  useEffect(() => {
    if (isOpen && showStockInfo && filteredProducts.length > 0) {
      const fetchStockInfo = async () => {
        const info = {};
        for (const product of filteredProducts.slice(0, 10)) {
          try {
            const response = await api.get(`/inventory/total-available/${product.id}`);
            info[product.id] = response.data || 0;
          } catch (error) {
            info[product.id] = 'N/A';
          }
        }
        setStockInfo(info);
      };
      fetchStockInfo();
    }
  }, [isOpen, filteredProducts, showStockInfo]);

  const handleSelect = (product) => {
<<<<<<< HEAD
    console.log('Product selected:', product);
    if (product && product.id) {
      const productIdString = product.id.toString();
      console.log('Calling onChange with productId:', productIdString);
      
      try {
        onChange(productIdString);
        console.log('onChange called successfully');
      } catch (error) {
        console.error('Error calling onChange:', error);
      }
      
      setSelectedProductDisplay(`${product.code} - ${product.name || ''}`);
      setIsOpen(false);
      setSearchTerm('');
    } else {
      console.log('Invalid product selection:', product);
=======
    if (product && product.id) {
      const productIdString = product.id.toString();
      onChange(productIdString);
      setSelectedProductDisplay(`${product.code} - ${product.name || ''}`);
      setIsOpen(false);
      setSearchTerm('');
>>>>>>> master
    }
  };

  const handleInputClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
<<<<<<< HEAD
    console.log('Product option clicked:', product.code, product.id);
=======
>>>>>>> master
    handleSelect(product);
  };

  const handleSearchChange = (e) => {
    e.stopPropagation();
    setSearchTerm(e.target.value);
  };

  const handleSearchClick = (e) => {
    e.stopPropagation();
  };

  const handleClearSelection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    setSelectedProductDisplay('');
    setSearchTerm('');
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
          alignItems: 'center',
          minHeight: '40px'
        }}
      >
        <span style={{ color: selectedProductDisplay ? '#333' : '#999', flex: 1 }}>
          {selectedProductDisplay || placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {selectedProductDisplay && (
            <button
              type="button"
              onClick={handleClearSelection}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                padding: '2px',
                fontSize: '14px'
              }}
              title="Clear selection"
            >
              ✕
            </button>
          )}
          <span style={{ fontSize: '12px', color: '#666' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '300px',
            overflow: 'hidden'
          }}
        >
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onClick={handleSearchClick}
            placeholder="Type to search product codes..."
            autoFocus
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              borderBottom: '1px solid #eee',
              outline: 'none',
              fontSize: '14px'
            }}
          />
          
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => {
                const numericValue = typeof value === 'string' ? parseInt(value) : value;
                const isSelected = numericValue === product.id;
                
                return (
                  <div
                    key={product.id}
                    onClick={(e) => handleOptionClick(e, product)}
                    className="product-option"
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: isSelected ? '#e3f2fd' : 'white',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = '#f8f9fa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = 'white';
                      } else {
                        e.target.style.backgroundColor = '#e3f2fd';
                      }
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                      {product.code} {product.name && `- ${product.name}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      Price: {formatCurrency(product.fixedPrice || product.price || 0)}
                      {showStockInfo && (
                        <span style={{ marginLeft: '10px' }}>
                          Stock: {stockInfo[product.id] !== undefined ? stockInfo[product.id] : '...'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ 
                padding: '16px 12px', 
                color: '#999', 
                textAlign: 'center',
                fontSize: '14px'
              }}>
                {searchTerm ? 'No products found' : 'No products available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

<<<<<<< HEAD
// ===== MODAL COMPONENT =====

// COMPLETELY FIXED: Sale Modal Component
=======
// NEW: Bounced Check Modal Component
const BouncedCheckModal = ({ sale, onClose, onMarkBounced, onClearBounced }) => {
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleMarkBounced = async () => {
    if (!window.confirm('Are you sure you want to mark this check as bounced/returned?')) {
      return;
    }

    setProcessing(true);
    try {
      await onMarkBounced(sale.id, notes);
      onClose();
    } catch (error) {
      alert('Failed to mark check as bounced: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleClearBounced = async () => {
    if (!window.confirm('Clear the bounced status for this check?')) {
      return;
    }

    setProcessing(true);
    try {
      await onClearBounced(sale.id);
      onClose();
    } catch (error) {
      alert('Failed to clear bounced status: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="sales-modal-overlay" onClick={onClose}>
      <div className="sales-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div>
          <h2 className="sales-modal-title">
            {sale.checkBounced ? 'Bounced Check Details' : 'Mark Check as Bounced'}
          </h2>

          <div className="sales-modal-view-grid">
            <div className="sales-modal-field">
              <label className="sales-modal-label">Check Number</label>
              <p className="sales-modal-value">{sale.checkNumber}</p>
            </div>

            <div className="sales-modal-field">
              <label className="sales-modal-label">Customer</label>
              <p className="sales-modal-value">{getCustomerName(sale)}</p>
            </div>

            <div className="sales-modal-field">
              <label className="sales-modal-label">Amount</label>
              <p className="sales-modal-value">{formatCurrency(sale.totalAmount)}</p>
            </div>

            <div className="sales-modal-field">
              <label className="sales-modal-label">Check Date</label>
              <p className="sales-modal-value">{formatDate(sale.checkDate)}</p>
            </div>

            {sale.checkBounced && (
              <>
                <div className="sales-modal-field">
                  <label className="sales-modal-label">Bounced Date</label>
                  <p className="sales-modal-value">{formatDateTime(sale.checkBouncedDate)}</p>
                </div>

                {sale.checkBouncedNotes && (
                  <div className="sales-modal-field">
                    <label className="sales-modal-label">Bounced Notes</label>
                    <p className="sales-modal-value">{sale.checkBouncedNotes}</p>
                  </div>
                )}
              </>
            )}

            {!sale.checkBounced && (
              <div className="sales-form-field">
                <label className="sales-form-label">Reason / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter reason for bounced check (optional)"
                  rows="4"
                  disabled={processing}
                  className="sales-form-textarea"
                />
              </div>
            )}
          </div>

          <div className="sales-modal-actions">
            <button 
              onClick={onClose} 
              className="sales-modal-close-button"
              disabled={processing}
            >
              Close
            </button>
            
            {sale.checkBounced ? (
              <button 
                onClick={handleClearBounced}
                className="sales-form-submit-button"
                disabled={processing}
              >
                {processing ? 'Clearing...' : 'Clear Bounced Status'}
              </button>
            ) : (
              <button 
                onClick={handleMarkBounced}
                className="sales-delete-button"
                disabled={processing}
                style={{ marginLeft: '10px' }}
              >
                {processing ? 'Processing...' : 'Mark as Bounced'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== MODAL COMPONENT =====

// Sale Modal Component
>>>>>>> master
const SaleModal = ({ sale, customers, products, onSave, onClose, printInvoice, downloadInvoice }) => {
  const [formData, setFormData] = useState({
    customerId: sale?.customer?.id || sale?.customerId || '',
    paymentMethod: sale?.paymentMethod || 'CASH',
    checkNumber: sale?.checkNumber || '',
    bankName: sale?.bankName || '',
    checkDate: sale?.checkDate || '',
    notes: sale?.notes || '',
    saleItems: sale?.saleItems?.map(item => ({
      productId: (item.product?.id || item.productId || '').toString(),
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      discount: item.discount || 0,
      inventoryId: item.inventoryId
    })) || [{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }]
  });

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [stockWarnings, setStockWarnings] = useState([]);
<<<<<<< HEAD
  const [showBatchInfo, setShowBatchInfo] = useState(false);

  // Auto-clear validation errors when form data changes
=======

>>>>>>> master
  useEffect(() => {
    if (formData.saleItems && formData.saleItems.length > 0) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        let hasChanges = false;
        
        formData.saleItems.forEach((item, index) => {
<<<<<<< HEAD
          // Clear product error if product is selected
=======
>>>>>>> master
          if (item.productId && item.productId !== '' && item.productId !== '0') {
            const errorKey = `saleItems_${index}_productId`;
            if (newErrors[errorKey]) {
              delete newErrors[errorKey];
              hasChanges = true;
<<<<<<< HEAD
              console.log(`Auto-cleared product error for item ${index}`);
            }
          }
          
          // Clear quantity error if quantity is valid
=======
            }
          }
          
>>>>>>> master
          if (item.quantity && parseInt(item.quantity) > 0) {
            const errorKey = `saleItems_${index}_quantity`;
            if (newErrors[errorKey]) {
              delete newErrors[errorKey];
              hasChanges = true;
            }
          }
          
<<<<<<< HEAD
          // Clear price error if price is valid
=======
>>>>>>> master
          if (item.unitPrice && parseFloat(item.unitPrice) > 0) {
            const errorKey = `saleItems_${index}_unitPrice`;
            if (newErrors[errorKey]) {
              delete newErrors[errorKey];
              hasChanges = true;
            }
          }
        });
        
        return hasChanges ? newErrors : prev;
      });
    }
  }, [formData.saleItems]);

  const handleStockWarning = useCallback((warnings) => {
    setStockWarnings(warnings);
  }, []);

<<<<<<< HEAD
  // FIXED: Enhanced validation function with consistent number parsing
  const validateForm = () => {
    const errors = {};
    
    console.log('Validating form data:', formData);
    
=======
  const validateForm = () => {
    const errors = {};
    
>>>>>>> master
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
      let hasValidItems = false;
      let totalAmount = 0;
      
      formData.saleItems.forEach((item, index) => {
<<<<<<< HEAD
        console.log(`Validating item ${index}:`, item);
        
        // FIXED: Product ID validation - consistent with backend expectations
        const productId = parsePositiveInteger(item.productId);
        if (!productId) {
          console.log(`Product validation failed for item ${index}:`, { productId: item.productId, parsed: productId });
          errors[`saleItems_${index}_productId`] = 'Product is required';
        }
        
        // FIXED: Quantity validation - consistent integer parsing
=======
        const productId = parsePositiveInteger(item.productId);
        if (!productId) {
          errors[`saleItems_${index}_productId`] = 'Product is required';
        }
        
>>>>>>> master
        const quantity = parsePositiveInteger(item.quantity);
        if (!quantity) {
          errors[`saleItems_${index}_quantity`] = 'Quantity must be a positive whole number';
        }
        
<<<<<<< HEAD
        // FIXED: Price validation - consistent float parsing
=======
>>>>>>> master
        const unitPrice = parsePositiveFloat(item.unitPrice);
        if (!unitPrice) {
          errors[`saleItems_${index}_unitPrice`] = 'Unit price must be greater than 0';
        }
        
<<<<<<< HEAD
        // FIXED: Discount validation - consistent non-negative parsing
=======
>>>>>>> master
        const discount = parseNonNegativeFloat(item.discount);
        if (discount === null || discount < 0) {
          errors[`saleItems_${index}_discount`] = 'Discount cannot be negative';
        }
        
<<<<<<< HEAD
        // Line total validation with proper number handling
=======
>>>>>>> master
        if (productId && quantity && unitPrice && discount !== null) {
          const lineTotal = (quantity * unitPrice) - discount;
          if (lineTotal <= 0) {
            errors[`saleItems_${index}_lineTotal`] = 'Line total cannot be 0 or negative. Discount may be too high.';
          } else {
            hasValidItems = true;
            totalAmount += lineTotal;
          }
        }
      });
      
<<<<<<< HEAD
      // Overall total validation
=======
>>>>>>> master
      if (hasValidItems && totalAmount <= 0) {
        errors.totalAmount = 'Total sale amount must be greater than 0';
      }
      
      if (!hasValidItems) {
        errors.saleItems = 'At least one valid item with positive total is required';
      }
    }
    
<<<<<<< HEAD
    console.log('Validation errors:', errors);
=======
>>>>>>> master
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

<<<<<<< HEAD
  // COMPLETELY FIXED: Simplified and robust handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Form data before processing:', formData);
    
    // Add detailed form state logging
    console.log('=== FORM STATE DEBUG ===');
    formData.saleItems.forEach((item, index) => {
      console.log(`Form item ${index}:`, {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount
      });
    });
    
    if (!validateForm()) {
      console.log('Form validation failed');
=======
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
>>>>>>> master
      return;
    }

    if (stockWarnings.length > 0) {
      const confirmMessage = `Stock availability issues detected:\n\n${
        stockWarnings.map(([productId, info]) => {
          const product = products.find(p => p.id === parseInt(productId));
          return `${product?.code || productId}: Requested ${info.requested}, Available ${info.totalAvailable}`;
        }).join('\n')
      }\n\nDo you want to proceed anyway?`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    
    setSaving(true);
    
    try {
<<<<<<< HEAD
      // SIMPLIFIED: Direct processing without complex filtering
      const saleItems = formData.saleItems.map((item, index) => {
        // Ensure all values are properly formatted
=======
      const saleItems = formData.saleItems.map((item) => {
>>>>>>> master
        const productId = parseInt(item.productId, 10);
        const quantity = parseInt(item.quantity, 10) || 1;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const discount = parseFloat(item.discount) || 0;

<<<<<<< HEAD
        console.log(`Processing item ${index}:`, {
          original: item,
          processed: { productId, quantity, unitPrice, discount }
        });

=======
>>>>>>> master
        return {
          productId,
          quantity, 
          unitPrice,
          discount
        };
      });

<<<<<<< HEAD
      // Calculate total
=======
>>>>>>> master
      const totalAmount = saleItems.reduce((total, item) => {
        const lineTotal = (item.quantity * item.unitPrice) - item.discount;
        return total + Math.max(0, lineTotal);
      }, 0);

<<<<<<< HEAD
      // FIXED: Final sale data structure
=======
>>>>>>> master
      const saleData = {
        customerId: parseInt(formData.customerId, 10),
        paymentMethod: formData.paymentMethod,
        checkNumber: formData.checkNumber || null,
        bankName: formData.bankName || null,
        checkDate: formData.checkDate || null,
        notes: formData.notes || null,
        totalAmount: totalAmount,
        saleItems: saleItems
      };
      
<<<<<<< HEAD
      console.log('=== FINAL SALE DATA TO SEND ===');
      console.log('Complete sale data:', JSON.stringify(saleData, null, 2));
      console.log('Sale items breakdown:');
      saleData.saleItems.forEach((item, index) => {
        console.log(`  Item ${index}:`, {
          productId: item.productId,
          productIdType: typeof item.productId,
          quantity: item.quantity,
          quantityType: typeof item.quantity,
          unitPrice: item.unitPrice,
          unitPriceType: typeof item.unitPrice,
          discount: item.discount,
          discountType: typeof item.discount
        });
      });
      console.log('=================================');
      
      await onSave(saleData);
      console.log('Sale saved successfully');
=======
      await onSave(saleData);
>>>>>>> master
    } catch (error) {
      console.error('Error saving sale:', error);
      alert(`Failed to save sale: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

<<<<<<< HEAD
  // FIXED: Enhanced handleProductSelect with proper type handling
  const handleProductSelect = (index, productId) => {
    console.log(`handleProductSelect called - Index: ${index}, ProductId: ${productId}`);
    
    if (!productId || productId === '') {
      console.log('Empty productId received');
      return;
    }

    // FIXED: Ensure productId is stored as string for consistency
    const stringProductId = productId.toString();
    console.log(`Converting productId to string: "${stringProductId}"`);
    
    // Update form data immediately
=======
  const handleProductSelect = (index, productId) => {
    if (!productId || productId === '') {
      return;
    }

    const stringProductId = productId.toString();
    
>>>>>>> master
    setFormData(prev => {
      const newItems = [...prev.saleItems];
      const currentItem = newItems[index];
      
<<<<<<< HEAD
      // Update product ID
      newItems[index] = { ...currentItem, productId: stringProductId };
      
      // Find product and set price
=======
      newItems[index] = { ...currentItem, productId: stringProductId };
      
>>>>>>> master
      if (stringProductId && stringProductId !== '0') {
        const numericProductId = parseInt(stringProductId);
        const product = products.find(p => p.id === numericProductId);
        
<<<<<<< HEAD
        console.log(`Found product:`, product);
        
        if (product) {
          const price = product.fixedPrice || product.price || 0;
          console.log(`Setting price: ${price}`);
          newItems[index].unitPrice = price;
          
          // Ensure quantity is at least 1
=======
        if (product) {
          const price = product.fixedPrice || product.price || 0;
          newItems[index].unitPrice = price;
          
>>>>>>> master
          if (!newItems[index].quantity || newItems[index].quantity <= 0) {
            newItems[index].quantity = 1;
          }
        }
      }
      
<<<<<<< HEAD
      console.log(`Updated item ${index}:`, newItems[index]);
      return { ...prev, saleItems: newItems };
    });
    
    // Clear validation error
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`saleItems_${index}_productId`];
      console.log(`Cleared validation error for item ${index}`);
=======
      return { ...prev, saleItems: newItems };
    });
    
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`saleItems_${index}_productId`];
>>>>>>> master
      return newErrors;
    });
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
      
<<<<<<< HEAD
      // Clear any validation errors for the removed item
=======
>>>>>>> master
      const newErrors = { ...validationErrors };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`saleItems_${index}_`)) {
          delete newErrors[key];
        }
      });
      setValidationErrors(newErrors);
    }
  };

<<<<<<< HEAD
  // FIXED: Enhanced handleItemChange with proper number handling
  const handleItemChange = (index, field, value) => {
    console.log(`handleItemChange: index=${index}, field=${field}, value="${value}"`);
    
    const newItems = [...formData.saleItems];
    
    // FIXED: Store values directly, let validation handle conversion
    newItems[index] = { ...newItems[index], [field]: value };
    
    setFormData(prev => ({ ...prev, saleItems: newItems }));
    
    // Clear validation error
=======
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.saleItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, saleItems: newItems }));
    
>>>>>>> master
    const errorKey = `saleItems_${index}_${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

<<<<<<< HEAD
  // FIXED: Enhanced calculateTotal with proper number handling
=======
>>>>>>> master
  const calculateTotal = () => {
    return formData.saleItems.reduce((total, item) => {
      const quantity = parsePositiveInteger(item.quantity) || 0;
      const unitPrice = parsePositiveFloat(item.unitPrice) || 0;
      const discount = parseNonNegativeFloat(item.discount) || 0;
      const lineTotal = Math.max(0, (quantity * unitPrice) - discount);
      return total + lineTotal;
    }, 0);
  };

  // View Mode for existing sales
  if (sale) {
    return (
      <div className="sales-modal-overlay" onClick={onClose}>
        <div className="sales-modal" onClick={(e) => e.stopPropagation()}>
          <div>
            <h2 className="sales-modal-title">Sale #{sale.id} Details</h2>
<<<<<<< HEAD
            
=======

>>>>>>> master
            <div className="sales-invoice-actions">
              <button onClick={() => printInvoice(sale)} className="sales-invoice-button">
                Print Invoice
              </button>
              <button onClick={() => downloadInvoice(sale)} className="sales-download-button">
                Download Invoice
              </button>
            </div>

            <div className="sales-modal-view-grid">
              <div>
                <div className="sales-modal-field">
                  <label className="sales-modal-label">Customer</label>
                  <p className="sales-modal-value">
                    {getCustomerName(sale)}
                  </p>
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
                          <td className="sales-items-td">
                            {item.product?.code || item.productCode || 'Unknown'}
                          </td>
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
            
            <div className="sales-modal-field">
              <label className="sales-modal-label">Total Amount</label>
              <p className="sales-total-amount">{formatCurrency(sale.totalAmount)}</p>
            </div>
            
            <div className="sales-modal-actions">
              <button onClick={onClose} className="sales-modal-close-button">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create Mode
  return (
    <div className="sales-modal-overlay" onClick={onClose}>
      <div className="sales-modal" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="sales-modal-title">Create New Sale</h2>
          
          <StockAvailabilityChecker 
            products={products}
            saleItems={formData.saleItems}
            onStockWarning={handleStockWarning}
          />
          
          <form onSubmit={handleSubmit}>
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

            <div className="sales-form-field">
              <label className="sales-form-label">Payment Method *</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="sales-form-select"
                disabled={saving}
              >
                <option value="CASH">Cash Payment</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CHECK">Check Payment</option>
              </select>
            </div>

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

            <div className="sales-form-field">
              <div className="sales-items-header">
                <label className="sales-form-label">Sale Items *</label>
                <div>
                  <button
                    type="button"
<<<<<<< HEAD
                    onClick={() => setShowBatchInfo(!showBatchInfo)}
                    className="sales-batch-info-toggle"
                  >
                    {showBatchInfo ? 'Hide' : 'Show'} Batch Info
                  </button>
                  <button
                    type="button"
=======
>>>>>>> master
                    onClick={addItem}
                    disabled={saving}
                    className="sales-add-item-button"
                  >
                    Add Item
                  </button>
                </div>
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
<<<<<<< HEAD
                          onChange={(productId) => {
                            console.log(`Product dropdown onChange triggered for item ${index} with productId:`, productId);
                            handleProductSelect(index, productId);
                          }}
=======
                          onChange={(productId) => handleProductSelect(index, productId)}
>>>>>>> master
                          disabled={saving}
                          className={validationErrors[`saleItems_${index}_productId`] ? 'sales-form-error' : ''}
                          placeholder="Search by product code..."
                          showStockInfo={true}
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
                          step="1"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className={`sales-form-input ${validationErrors[`saleItems_${index}_quantity`] ? 'sales-form-error' : ''}`}
                          disabled={saving}
                          placeholder="Enter whole number"
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
                          min="0.01"
                          value={item.unitPrice || ''}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          className={`sales-form-input ${validationErrors[`saleItems_${index}_unitPrice`] ? 'sales-form-error' : ''}`}
                          disabled={saving}
                          placeholder="Auto-filled from product"
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
                          value={item.discount || ''}
                          onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                          className="sales-form-input"
                          disabled={saving}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="sales-item-total-section">
                        <div className="sales-item-total">
                          {formatCurrency(Math.max(0, (parsePositiveInteger(item.quantity) || 0) * (parsePositiveFloat(item.unitPrice) || 0) - (parseNonNegativeFloat(item.discount) || 0)))}
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
<<<<<<< HEAD
                    
                    {showBatchInfo && item.productId && item.quantity && (
                      <FIFOBatchInfo 
                        productId={item.productId}
                        requestedQuantity={parsePositiveInteger(item.quantity) || 0}
                      />
                    )}
=======
>>>>>>> master
                  </div>
                ))}
              </div>
            </div>

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

            <div className="sales-form-total">
              <label className="sales-form-label">Total Amount</label>
              <p className="sales-form-total-amount">{formatCurrency(calculateTotal())}</p>
            </div>

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
                title={stockWarnings.length > 0 ? "Stock issues detected - proceed with caution" : ""}
              >
                {saving ? 'Saving...' : 'Create Sale'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ===== INVOICE GENERATION =====
const generateInvoiceHTML = (sale, products) => {
<<<<<<< HEAD
=======
  const getProductName = (item) => {
    if (item.product && item.product.name) {
      return item.product.name;
    }
    if (item.productId && products && products.length > 0) {
      const product = products.find(p => p.id === item.productId);
      if (product && product.name) {
        return product.name;
      }
    }
    return 'Unknown Product';
  };

>>>>>>> master
  const getProductCode = (item) => {
    if (item.product && item.product.code) {
      return item.product.code;
    }
    if (item.productId && products && products.length > 0) {
      const product = products.find(p => p.id === item.productId);
      if (product && product.code) {
        return product.code;
      }
    }
<<<<<<< HEAD
    return 'Unknown Code';
=======
    return '';
>>>>>>> master
  };

  const customerName = getCustomerName(sale);
  const customerEmail = getCustomerEmail(sale);
<<<<<<< HEAD
=======
  const customerAddress = sale.customer?.address || 'N/A';
  const customerPhone = sale.customer?.phone || 'N/A';

  // Consolidate duplicate products into single lines
  const consolidatedItems = [];
  const itemMap = new Map();

  sale.saleItems?.forEach(item => {
    const productName = getProductName(item);
    const productCode = getProductCode(item);
    const fullName = productCode ? `${productName} (${productCode})` : productName;
    const size = item.size || '';
    const unitPrice = item.unitPrice || 0;

    // Create unique key based on product name, code, size, and unit price
    const key = `${fullName}_${size}_${unitPrice}`;

    if (itemMap.has(key)) {
      // Add to existing item
      const existing = itemMap.get(key);
      existing.quantity += (item.quantity || 0);
      existing.discount += (item.discount || 0);
      existing.total = (existing.quantity * existing.unitPrice) - existing.discount;
    } else {
      // Create new consolidated item
      itemMap.set(key, {
        fullName: fullName,
        size: size,
        quantity: item.quantity || 0,
        unitPrice: unitPrice,
        discount: item.discount || 0,
        total: ((item.quantity || 0) * unitPrice) - (item.discount || 0)
      });
    }
  });

  // Convert map to array
  itemMap.forEach(item => consolidatedItems.push(item));

  // Calculate totals
  const subTotal = consolidatedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalDiscount = consolidatedItems.reduce((sum, item) => sum + item.discount, 0);
  const grandTotal = sale.totalAmount || 0;
  const totalQty = consolidatedItems.reduce((sum, item) => sum + item.quantity, 0);
>>>>>>> master

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice #${sale.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
<<<<<<< HEAD
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .invoice-container { max-width: 900px; margin: 0 auto; background: white; }
        .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
        .company-name { font-size: 28px; font-weight: bold; color: #007bff; margin-bottom: 5px; }
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
        .grand-total { font-size: 18px; font-weight: bold; color: #007bff; border-top: 2px solid #007bff; padding-top: 10px; margin-top: 10px; }
        .status-badge { padding: 5px 15px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 12px; }
        .status-paid { background: #d4edda; color: #155724; }
        .status-unpaid { background: #f8d7da; color: #721c24; }
        @media print { body { padding: 0; } .no-print { display: none; } }
=======
        body {
          font-family: 'Arial', sans-serif;
          padding: 30px;
          color: #000;
          background: #fff;
        }
        .invoice-container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          border: 2px solid #000;
          padding: 20px;
        }
        .invoice-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 2px;
          margin-bottom: 5px;
        }
        .company-tagline {
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .company-details {
          font-size: 10px;
          line-height: 1.5;
          margin-bottom: 5px;
        }
        .factory-info {
          font-size: 9px;
          line-height: 1.4;
          margin-top: 5px;
        }
        .invoice-title {
          font-size: 20px;
          font-weight: bold;
          margin: 15px 0 10px 0;
          letter-spacing: 3px;
        }
        .invoice-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 11px;
        }
        .invoice-meta-left {
          width: 60%;
        }
        .invoice-meta-right {
          width: 38%;
          text-align: right;
        }
        .meta-row {
          margin-bottom: 4px;
        }
        .meta-label {
          font-weight: bold;
          display: inline-block;
          width: 120px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0;
          font-size: 11px;
        }
        .items-table th, .items-table td {
          padding: 8px 6px;
          text-align: left;
          border: 1px solid #000;
        }
        .items-table th {
          background: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        .items-table .text-center { text-align: center; }
        .items-table .text-right { text-align: right; }
        .items-table tbody td {
          min-height: 30px;
        }
        .totals-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-top: 0;
        }
        .totals-table td {
          padding: 8px 6px;
          border: 1px solid #000;
        }
        .totals-table .total-label {
          text-align: right;
          font-weight: bold;
          width: 70%;
        }
        .totals-table .total-qty {
          text-align: center;
          width: 10%;
        }
        .totals-table .total-amount {
          text-align: right;
          width: 20%;
        }
        .grand-total-row {
          font-weight: bold;
          font-size: 12px;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
          padding: 0 30px;
        }
        .signature-block {
          text-align: center;
          width: 200px;
        }
        .signature-line {
          border-bottom: 1px solid #000;
          margin-bottom: 5px;
          height: 50px;
        }
        .signature-label {
          font-size: 11px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #000;
          font-size: 11px;
        }
        .footer-company {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 3px;
        }
        .thank-you {
          font-weight: bold;
          margin-bottom: 10px;
          font-size: 12px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
          .invoice-container { border: 1px solid #000; }
        }
>>>>>>> master
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
<<<<<<< HEAD
          <div class="company-name">Saranya International</div>
          <div class="company-details">
            No 325/7C, Kande Dewala Road, Pelenwattha, Pannipitiya, Sri Lanka<br>
            Phone: 011 274 5833 | Email: internationalsaranya@gmail.com
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
          <div style="font-size: 16px; font-weight: bold;">${customerName}</div>
          ${customerEmail !== 'No email' ? `<div>Email: ${customerEmail}</div>` : ''}
          ${sale.customer?.phone ? `<div>Phone: ${sale.customer.phone}</div>` : ''}
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
                <td class="text-right">${formatCurrencyInvoice(item.lineTotal)}</td>
              </tr>
            `).join('') || '<tr><td colspan="5">No items found</td></tr>'}
          </tbody>
        </table>
        <div class="totals-section">
          <div class="grand-total">
            <span>Grand Total:</span>
            <span>${formatCurrencyInvoice(sale.totalAmount)}</span>
          </div>
        </div>
        <div class="footer" style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; font-size: 12px;">
          <div>Thank you for your business!</div>
          <div>This is a computer generated invoice.</div>
=======
          <div class="company-name">SARANYA INTERNATIONAL</div>
          <div class="company-tagline">BEST QUALITY INTERNAARMENT FACTORIES</div>
          <div class="company-details">
            <strong>Office:</strong> 0112 745 833 / 0719 666 676 &nbsp;&nbsp; <strong>Email:</strong> internationalsaranya@gmail.com
          </div>
          <div class="factory-info">
            <strong>Factory :</strong> Hadiden kanda Road,nattugama, Badimalana - 0755 666 676<br>
            <strong>Factory :</strong> Kadaruwewa,Poipitigama,Karamegala - 0766 776 676<br>
            <strong>Factory :</strong> Millagha Junction,Horana road,Kaluthara - 078 776 676
          </div>
          <div class="invoice-title">INVOICE</div>
        </div>

        <div class="invoice-meta">
          <div class="invoice-meta-left">
            <div class="meta-row">
              <span class="meta-label">Customer Na:</span>
              <span>${sale.id || 'N/A'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Customer Name:</span>
              <span>${customerName}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Customer Address:</span>
              <span>${customerAddress}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Contact No:</span>
              <span>${customerPhone}</span>
            </div>
          </div>
          <div class="invoice-meta-right">
            <div class="meta-row">
              <span class="meta-label">Inv. No:</span>
              <span>${sale.id}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Date:</span>
              <span>${formatDateInvoice(sale.saleDate)}</span>
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 8%;">No.</th>
              <th style="width: 42%;">Product's Name</th>
              <th style="width: 12%;">Size</th>
              <th style="width: 10%;">Qty</th>
              <th style="width: 14%;">Unit Price</th>
              <th style="width: 14%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${consolidatedItems.map((item, index) => {
              return `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.fullName}</td>
                <td class="text-center">${item.size}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${item.unitPrice.toFixed(2)}</td>
                <td class="text-right">${(item.quantity * item.unitPrice).toFixed(2)}</td>
              </tr>
            `}).join('') || '<tr><td colspan="6" style="text-align: center;">No items found</td></tr>'}
            ${Array(Math.max(0, 10 - consolidatedItems.length)).fill('').map(() => `
              <tr>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td class="total-label">Sub Total</td>
            <td class="total-qty">${totalQty}</td>
            <td class="total-amount">${subTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td class="total-label">Less : Discount</td>
            <td class="total-qty"></td>
            <td class="total-amount">${totalDiscount.toFixed(2)}</td>
          </tr>
          <tr class="grand-total-row">
            <td class="total-label">Grand Total</td>
            <td class="total-qty">${totalQty}</td>
            <td class="total-amount">${grandTotal.toFixed(2)}</td>
          </tr>
        </table>

        <div class="signature-section">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Account Executive</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Purchaser</div>
          </div>
        </div>

        <div class="footer">
          <div class="thank-you">Cheques & Cash Deposits !</div>
          <div class="footer-company">"SARANYA INTERNATIONAL"</div>
          <div>0980 1002 6028 - HNB - Kottawa</div>
          <div>0082 5000 1844 - SampathBank - Nawala</div>
          <div>0112 745833 / 0719 666676</div>
>>>>>>> master
        </div>
      </div>
    </body>
    </html>
  `;
};

// ===== MAIN COMPONENT =====

// Main SalesPage Component
const SalesPage = () => {
  // State Management
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('ALL');
<<<<<<< HEAD
=======
  const [filterCheckStatus, setFilterCheckStatus] = useState('ALL');
>>>>>>> master
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [checkReminders, setCheckReminders] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);
<<<<<<< HEAD
=======
  const [bouncedCheckSummary, setBouncedCheckSummary] = useState(null);
  const [showBouncedCheckModal, setShowBouncedCheckModal] = useState(false);
  const [selectedBouncedSale, setSelectedBouncedSale] = useState(null);
>>>>>>> master

  // Invoice Functions
  const downloadInvoice = useCallback((sale) => {
    try {
      const invoiceHTML = generateInvoiceHTML(sale, products);
      const blob = new Blob([invoiceHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${sale.id}_${getCustomerName(sale).replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  }, [products]);

  const printInvoice = useCallback((sale) => {
    try {
      const invoiceHTML = generateInvoiceHTML(sale, products);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      } else {
        alert('Please allow pop-ups to print the invoice.');
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Failed to print invoice. Please try again.');
    }
  }, [products]);

  // Data Fetching
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

<<<<<<< HEAD
      const [salesRes, customersRes, productsRes, inventoryRes] = await Promise.all([
        api.get('/sales').catch(err => ({ data: [] })),
        api.get('/customers').catch(err => ({ data: [] })),
        api.get('/products').catch(err => ({ data: [] })),
        api.get('/inventory/summary').catch(err => ({ data: null }))
=======
      const [salesRes, customersRes, productsRes, inventoryRes, bouncedRes] = await Promise.all([
        api.get('/sales').catch(err => ({ data: [] })),
        api.get('/customers').catch(err => ({ data: [] })),
        api.get('/products').catch(err => ({ data: [] })),
        api.get('/inventory/summary').catch(err => ({ data: null })),
        api.get('/sales/bounced-checks/summary').catch(err => ({ data: null }))
>>>>>>> master
      ]);

      setSales(salesRes.data || []);
      setCustomers(customersRes.data || []);
      setProducts(productsRes.data || []);
      setInventorySummary(inventoryRes.data);
<<<<<<< HEAD
=======
      setBouncedCheckSummary(bouncedRes.data);
>>>>>>> master

      checkPendingReminders(salesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check Reminders
  const checkPendingReminders = (salesData) => {
    const today = new Date();
    const pendingChecks = salesData.filter(sale => 
      sale.paymentMethod === 'CREDIT_CHECK' && 
      !sale.isPaid && 
<<<<<<< HEAD
=======
      !sale.checkBounced &&
>>>>>>> master
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

      return { sale, daysDiff, status, message, checkDate };
    }).filter(reminder => reminder.status !== 'pending');

    setCheckReminders(reminders);
  };

  // Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);

<<<<<<< HEAD
  // FIXED: Filtering Logic with proper customer name handling
  const filteredSales = Array.isArray(sales) 
    ? sales.filter(sale => {
        if (!sale) return false;
        
        const searchLower = searchTerm.toLowerCase();
        const customerName = getCustomerName(sale);
        
        const matchesSearch = !searchTerm || 
=======
  // Bounced Check Handlers
  const handleMarkCheckBounced = async (saleId, notes) => {
    try {
      await api.put(`/sales/${saleId}/mark-check-bounced`, { bouncedNotes: notes });
      await fetchData();
      alert('Check marked as bounced successfully!');
    } catch (error) {
      console.error('Error marking check as bounced:', error);
      throw error;
    }
  };

  const handleClearBouncedStatus = async (saleId) => {
    try {
      await api.put(`/sales/${saleId}/mark-check-cleared`);
      await fetchData();
      alert('Bounced status cleared successfully!');
    } catch (error) {
      console.error('Error clearing bounced status:', error);
      throw error;
    }
  };

  const handleOpenBouncedModal = (sale) => {
    setSelectedBouncedSale(sale);
    setShowBouncedCheckModal(true);
  };

  // FIXED: Filtering Logic with proper customer name handling
  const filteredSales = Array.isArray(sales)
    ? sales.filter(sale => {
        if (!sale) return false;

        const searchLower = searchTerm.toLowerCase();
        const customerName = getCustomerName(sale);

        const matchesSearch = !searchTerm ||
>>>>>>> master
          (customerName && customerName.toLowerCase().includes(searchLower)) ||
          (sale.id && sale.id.toString().includes(searchTerm)) ||
          (sale.checkNumber && sale.checkNumber.toLowerCase().includes(searchLower));

<<<<<<< HEAD
        const matchesStatus = filterStatus === 'ALL' || 
          (filterStatus === 'PAID' && sale.isPaid) ||
          (filterStatus === 'UNPAID' && !sale.isPaid);

        const matchesPaymentMethod = filterPaymentMethod === 'ALL' || 
          sale.paymentMethod === filterPaymentMethod;

        return matchesSearch && matchesStatus && matchesPaymentMethod;
=======
        const matchesStatus = filterStatus === 'ALL' ||
          (filterStatus === 'PAID' && sale.isPaid) ||
          (filterStatus === 'UNPAID' && !sale.isPaid);

        const matchesPaymentMethod = filterPaymentMethod === 'ALL' ||
          sale.paymentMethod === filterPaymentMethod;

        const matchesCheckStatus = filterCheckStatus === 'ALL' ||
          (filterCheckStatus === 'BOUNCED' && sale.checkBounced) ||
          (filterCheckStatus === 'NOT_BOUNCED' && sale.paymentMethod === 'CREDIT_CHECK' && !sale.checkBounced);

        return matchesSearch && matchesStatus && matchesPaymentMethod && matchesCheckStatus;
>>>>>>> master
      })
    : [];

  // Event Handlers
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
      await api.post('/sales', saleData);
      setShowModal(false);
      setSelectedSale(null);
      await fetchData();
      alert('Sale created successfully!');
    } catch (error) {
      console.error('Error saving sale:', error);
      throw new Error(error.message || 'Failed to save sale');
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
    if (window.confirm('Are you sure you want to delete this sale? This will restore inventory.')) {
      try {
        await api.delete(`/sales/${saleId}`);
        fetchData();
        alert('Sale deleted successfully! Inventory has been restored.');
      } catch (error) {
        console.error('Error deleting sale:', error);
        alert('Failed to delete sale: ' + error.message);
      }
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="sales-loading-container">
        <div>Loading sales data...</div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="sales-error-container">
        <div className="sales-error-text">{error}</div>
        <button onClick={() => fetchData()} className="sales-retry-button">
          Retry Loading
        </button>
      </div>
    );
  }

  // Main Render
  return (
    <div className="sales-page-container">
      <div>
<<<<<<< HEAD
        {/* Inventory Summary Banner */}
        {inventorySummary && (
          <div className="inventory-summary-banner">
            <h3>Inventory Status</h3>
            <div className="inventory-summary-stats">
              <div>Products with Stock: {inventorySummary.productsWithStock}</div>
              <div>Total Inventory Value: {formatCurrency(inventorySummary.totalInventoryValue)}</div>
              <div>Low Stock Products: {inventorySummary.lowStockProducts}</div>
              <div>Total Batches: {inventorySummary.totalBatches}</div>
=======
        

        {/* Bounced Checks Alert */}
        {bouncedCheckSummary && bouncedCheckSummary.totalBouncedChecks > 0 && (
          <div className="bounced-checks-alert">
            <div className="bounced-checks-header">
              <h3>⚠️ Bounced Checks Alert</h3>
              <span className="bounced-checks-count">
                {bouncedCheckSummary.totalBouncedChecks} Bounced Check{bouncedCheckSummary.totalBouncedChecks !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="bounced-checks-summary">
              <div className="bounced-checks-stat">
                <strong>Total Amount:</strong> {formatCurrency(bouncedCheckSummary.totalBouncedAmount)}
              </div>
            </div>
            <div className="bounced-checks-list">
              {bouncedCheckSummary.bouncedChecks?.slice(0, 3).map(sale => (
                <div key={sale.id} className="bounced-check-item">
                  <div>
                    <strong>Check #{sale.checkNumber}</strong> - {getCustomerName(sale)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Amount: {formatCurrency(sale.totalAmount)} | 
                    Bounced: {formatDate(sale.checkBouncedDate)}
                  </div>
                </div>
              ))}
              {bouncedCheckSummary.bouncedChecks?.length > 3 && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  ... and {bouncedCheckSummary.bouncedChecks.length - 3} more
                </div>
              )}
>>>>>>> master
            </div>
          </div>
        )}

        {/* Check Reminders */}
        {checkReminders.length > 0 && (
          <div className="sales-check-reminders">
            <h3>Check Payment Reminders</h3>
            <div>
              {checkReminders.map((reminder, index) => (
                <div key={index} className="sales-reminder-item">
                  <div className={`sales-reminder-message ${reminder.status === 'overdue' ? 'sales-reminder-overdue' : 'sales-reminder-upcoming'}`}>
                    {reminder.message}
                  </div>
                  <div className="sales-reminder-details">
                    Customer: {getCustomerName(reminder.sale)} - Amount: {formatCurrency(reminder.sale.totalAmount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="sales-header">
          <div>
            <h1 className="sales-title">Sales Management</h1>
            <p className="sales-subtitle">Manage sales and generate invoices</p>
          </div>
          <button onClick={handleCreateSale} className="sales-create-button">
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

<<<<<<< HEAD
            <div className="sales-stats">
              <div className="sales-stats-count">
                Total Sales: {filteredSales.length}
              </div>
              <div className="sales-stats-revenue">
                Revenue: {formatCurrency(filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0))}
              </div>
            </div>
=======
            <div>
              <label className="sales-filter-label">Check Status</label>
              <select
                value={filterCheckStatus}
                onChange={(e) => setFilterCheckStatus(e.target.value)}
                className="sales-filter-select"
              >
                <option value="ALL">All Checks</option>
                <option value="BOUNCED">Returned/Bounced</option>
                <option value="NOT_BOUNCED">Active Checks</option>
              </select>
            </div>

            
>>>>>>> master
          </div>
        </div>

        {/* FIXED: Sales Table with proper customer name display */}
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
                    <tr key={sale.id} className="sales-table-row">
                      <td className="sales-table-td">#{sale.id}</td>
                      <td className="sales-table-td">
                        <div>
                          <div className="sales-customer-name">{getCustomerName(sale)}</div>
                          <div className="sales-customer-email">{getCustomerEmail(sale)}</div>
                        </div>
                      </td>
                      <td className="sales-table-td">{formatDate(sale.saleDate)}</td>
                      <td className="sales-table-td sales-amount">{formatCurrency(sale.totalAmount)}</td>
                      <td className="sales-table-td">
                        <div>{sale.paymentMethod?.replace('_', ' ') || 'Unknown'}</div>
                        {sale.paymentMethod === 'CREDIT_CHECK' && sale.checkNumber && (
<<<<<<< HEAD
                          <div className="sales-check-info">Check #{sale.checkNumber}</div>
=======
                          <div className="sales-check-info">
                            Check #{sale.checkNumber}
                            {sale.checkBounced && (
                              <span className="sales-bounced-badge" title="Check Bounced">
                                ⚠️ BOUNCED
                              </span>
                            )}
                          </div>
>>>>>>> master
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
<<<<<<< HEAD
=======
                          {sale.paymentMethod === 'CREDIT_CHECK' && !sale.isPaid && (
                            <button 
                              onClick={() => handleOpenBouncedModal(sale)}
                              className={`sales-action-button ${sale.checkBounced ? 'sales-clear-bounced-button' : 'sales-bounced-button'}`}
                              title={sale.checkBounced ? 'Clear bounced status' : 'Mark check as bounced'}
                            >
                              {sale.checkBounced ? 'Clear Bounced' : 'Mark Bounced'}
                            </button>
                          )}
>>>>>>> master
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
<<<<<<< HEAD
                          {searchTerm || filterStatus !== 'ALL' || filterPaymentMethod !== 'ALL' 
                            ? 'Try adjusting your filters' 
=======
                          {searchTerm || filterStatus !== 'ALL' || filterPaymentMethod !== 'ALL' || filterCheckStatus !== 'ALL'
                            ? 'Try adjusting your filters'
>>>>>>> master
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

<<<<<<< HEAD
        {/* Modal */}
=======
        {/* Sale Modal */}
>>>>>>> master
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
<<<<<<< HEAD
=======

        {/* Bounced Check Modal */}
        {showBouncedCheckModal && selectedBouncedSale && (
          <BouncedCheckModal
            sale={selectedBouncedSale}
            onClose={() => {
              setShowBouncedCheckModal(false);
              setSelectedBouncedSale(null);
            }}
            onMarkBounced={handleMarkCheckBounced}
            onClearBounced={handleClearBouncedStatus}
          />
        )}
>>>>>>> master
      </div>
    </div>
  );
};

export default SalesPage;