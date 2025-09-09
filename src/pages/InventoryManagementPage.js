import React, { useState, useEffect } from 'react';
import './InventoryManagement.css'; // Import the CSS file

// API configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Currency formatter for Sri Lankan Rupees
const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return 'Rs. 0.00';
  return `Rs. ${parseFloat(amount).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// API service for backend integration
const api = {
  get: async (url) => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API GET error for ${url}:`, error);
      throw error;
    }
  },
  
  post: async (url, data) => {
    try {
      console.log(`Making POST request to ${API_BASE_URL}${url}`);
      console.log('Request payload:', JSON.stringify(data, null, 2));
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorBody = await response.text();
          console.log('Error response body:', errorBody);
          if (errorBody) {
            try {
              const errorJson = JSON.parse(errorBody);
              errorMessage = errorJson.message || errorJson.error || errorMessage;
            } catch (e) {
              errorMessage = errorBody;
            }
          }
        } catch (e) {
          console.log('Could not read error response body');
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Success response:', result);
      return result;
    } catch (error) {
      console.error(`API POST error for ${url}:`, error);
      throw error;
    }
  },
  
  delete: async (url) => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API DELETE error for ${url}:`, error);
      throw error;
    }
  }
};

const InventoryManagementPage = () => {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const extractDataFromResponse = (response, fallback = []) => {
    // Handle different response structures from your Spring Boot backend
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    } else if (response && Array.isArray(response.data)) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response;
    } else if (response && response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response && response.data) {
      return Array.isArray(response.data) ? response.data : fallback;
    }
    return fallback;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data from your backend endpoints
      const [inventoryRes, productsRes, suppliersRes] = await Promise.all([
        api.get('/inventory').catch(err => {
          console.error('Inventory API error:', err);
          return { data: [] };
        }),
        api.get('/products').catch(err => {
          console.error('Products API error:', err);
          return { data: [] };
        }),
        api.get('/suppliers').catch(err => {
          console.error('Suppliers API error:', err);
          return { data: [] };
        })
      ]);
      
      // Debug logging to see the actual response structure
      console.log('Raw API Responses:');
      console.log('Inventory Response:', inventoryRes);
      console.log('Products Response:', productsRes);
      console.log('Suppliers Response:', suppliersRes);
      
      // Extract data using improved parsing
      const inventoryData = extractDataFromResponse(inventoryRes, []);
      const productsData = extractDataFromResponse(productsRes, []);
      const suppliersData = extractDataFromResponse(suppliersRes, []);
      
      console.log('Extracted Data:');
      console.log('Inventory Data:', inventoryData);
      console.log('Products Data:', productsData);
      console.log('Suppliers Data:', suppliersData);
      
      // Create lookup maps for better performance and data relationships
      const productMap = {};
      const supplierMap = {};
      
      productsData.forEach(product => {
        if (product && product.id) {
          productMap[product.id] = product;
        }
      });
      
      suppliersData.forEach(supplier => {
        if (supplier && supplier.id) {
          supplierMap[supplier.id] = supplier;
        }
      });
      
      // Enrich inventory data with product and supplier information
      const enrichedInventory = inventoryData.map(item => {
        const enrichedItem = { ...item };
        
        // Attach product information
        if (item.productId && productMap[item.productId]) {
          enrichedItem.product = productMap[item.productId];
        } else if (item.product && item.product.id && productMap[item.product.id]) {
          enrichedItem.product = productMap[item.product.id];
        }
        
        // Attach supplier information
        if (item.supplierId && supplierMap[item.supplierId]) {
          enrichedItem.supplier = supplierMap[item.supplierId];
        } else if (item.supplier && item.supplier.id && supplierMap[item.supplier.id]) {
          enrichedItem.supplier = supplierMap[item.supplier.id];
        }
        
        return enrichedItem;
      });
      
      console.log('Enriched Inventory:', enrichedInventory);
      
      setInventory(enrichedInventory);
      setProducts(productsData);
      setSuppliers(suppliersData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Failed to load inventory data: ${error.message}`);
      setInventory([]);
      setProducts([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = Array.isArray(inventory) 
    ? inventory.filter(item => {
        const matchesSearch = !searchTerm || 
          item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.reference?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'ALL' || item.movementType === filterType;

        return matchesSearch && matchesType;
      })
    : [];

  const handleAddMovement = async (movementData) => {
    try {
      console.log('Sending movement data:', movementData);
      const response = await api.post('/inventory', movementData);
      console.log('Add movement response:', response);
      
      // Check for success in different possible response formats
      if (response.success === true || response.success === "true" || 
          (response.data && !response.error) || response.message === 'success') {
        setShowModal(false);
        fetchData(); // Refresh the data to get updated inventory
        alert('Inventory movement added successfully!');
      } else {
        const errorMessage = response.message || response.error || 'Failed to add inventory movement';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error adding inventory movement:', error);
      
      // Show more detailed error message based on error type
      let errorMessage = error.message;
      
      if (error.message.includes('Insufficient stock')) {
        errorMessage = `${error.message}\n\nThis means you're trying to remove more items than are currently available in stock. Please:\n1. Check current stock levels\n2. Reduce the quantity\n3. Or add stock first with a "Stock IN" movement`;
      } else if (error.message.includes('Product not found')) {
        errorMessage = `${error.message}\n\nThe selected product may have been deleted or doesn't exist. Please refresh the page and try again.`;
      } else if (error.message.includes('Supplier') && error.message.includes('required')) {
        errorMessage = `${error.message}\n\nPlease select a supplier for stock IN movements.`;
      } else if (error.message.includes('400')) {
        errorMessage = `Bad Request (400): The data format might be incorrect. Please check all required fields.\n\nError: ${error.message}`;
      } else if (error.message.includes('404')) {
        errorMessage = `Not Found (404): The inventory endpoint might not exist or the product/supplier ID is invalid.\n\nError: ${error.message}`;
      } else if (error.message.includes('500')) {
        errorMessage = `Server Error (500): There's an issue with the backend server.\n\nError: ${error.message}`;
      }
      
      alert(`Failed to add inventory movement:\n\n${errorMessage}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory movement?')) {
      try {
        const response = await api.delete(`/inventory/${id}`);
        console.log('Delete response:', response);
        
        if (response.success || response.message === 'success' || !response.error) {
          fetchData(); // Refresh the data
          alert('Inventory movement deleted successfully!');
        } else {
          throw new Error(response.message || 'Failed to delete inventory movement');
        }
      } catch (error) {
        console.error('Error deleting inventory movement:', error);
        alert(`Failed to delete inventory movement: ${error.message}`);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="inventory-loading-container">
        <div className="inventory-loading-card">
          <div className="inventory-loading-spinner"></div>
          <div className="inventory-loading-text">Loading inventory...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-error-container">
        <div className="inventory-error-card">
          <div className="inventory-error-icon">⚠️</div>
          <div className="inventory-error-text">{error}</div>
          <button 
            onClick={fetchData}
            className="inventory-retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-management-container">
      <div className="inventory-content-wrapper">
        {/* Header */}
        <div className="inventory-management-header">
          <div className="inventory-header-left">
            <div className="inventory-header-icon">📦</div>
            <h1 className="inventory-management-title">
              Inventory Management
            </h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inventory-add-button"
          >
            <span className="inventory-add-icon">➕</span>
            Add Movement
          </button>
        </div>

        {/* Filters */}
        <div className="inventory-filters">
          <div className="inventory-search-container">
            <input
              type="text"
              placeholder="Search by product, code, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="inventory-search-input"
            />
          </div>
          <div className="inventory-filter-container">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="inventory-filter-select"
            >
              <option value="ALL">All Movements</option>
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="inventory-table-container">
          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead className="inventory-table-header">
                <tr>
                  {['Date', 'Product', 'Type', 'Quantity', 'Unit Price', 'Total Value', 'Reference', 'Supplier', 'Actions'].map((header, index) => (
                    <th key={index} className="inventory-header-cell">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item, index) => (
                    <tr key={item.id || index} className="inventory-table-row">
                      <td className="inventory-table-cell">
                        <div className="inventory-date">
                          {formatDate(item.date)}
                        </div>
                      </td>
                      <td className="inventory-table-cell">
                        <div className="inventory-product-info">
                          <div className="inventory-product-name">
                            {item.product?.name || 'Unknown Product'}
                          </div>
                          <div className="inventory-product-code">
                            {item.product?.code || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="inventory-table-cell">
                        <span className={`inventory-movement-badge ${
                          item.movementType === 'IN' ? 'inventory-movement-in' : 'inventory-movement-out'
                        }`}>
                          {item.movementType === 'IN' ? 'Stock In' : 'Stock Out'}
                        </span>
                      </td>
                      <td className="inventory-table-cell">
                        <div className="inventory-quantity">
                          {item.quantity?.toLocaleString() || '0'}
                        </div>
                      </td>
                      <td className="inventory-table-cell">
                        <div className="inventory-unit-price">
                          {item.unitPrice ? formatCurrency(item.unitPrice) : 'N/A'}
                        </div>
                      </td>
                      <td className="inventory-table-cell">
                        <div className="inventory-total-value">
                          {item.quantity && item.unitPrice 
                            ? formatCurrency(item.quantity * item.unitPrice) 
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="inventory-table-cell">
                        <div className="inventory-reference">
                          {item.reference || 'N/A'}
                        </div>
                      </td>
                      <td className="inventory-table-cell">
                        <div className="inventory-supplier-name">
                          {item.supplier?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="inventory-table-cell">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inventory-delete-button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="inventory-empty-state">
                      <div className="inventory-empty-icon">📭</div>
                      {searchTerm || filterType !== 'ALL' 
                        ? 'No inventory movements found matching your criteria.' 
                        : 'No inventory movements available. Click "Add Movement" to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Movement Modal */}
        {showModal && (
          <InventoryMovementModal
            products={products}
            suppliers={suppliers}
            onSave={handleAddMovement}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </div>
  );
};

// Enhanced Inventory Movement Modal Component
const InventoryMovementModal = ({ products, suppliers, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    productId: '',
    movementType: 'IN',
    quantity: '',
    unitPrice: '',
    supplierId: '',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.productId) {
      errors.productId = 'Please select a product';
    }
    
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      errors.quantity = 'Please enter a valid quantity';
    }
    
    if (formData.unitPrice && parseFloat(formData.unitPrice) < 0) {
      errors.unitPrice = 'Unit price cannot be negative';
    }
    
    if (formData.movementType === 'IN' && !formData.supplierId) {
      errors.supplierId = 'Please select a supplier for stock IN movements';
    }
    
    if (!formData.date) {
      errors.date = 'Please select a date';
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
      // Format data to match backend InventoryRequest DTO
      const movementData = {
        productId: parseInt(formData.productId),
        movementType: formData.movementType,
        quantity: parseInt(formData.quantity),
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
        reference: formData.reference || null,
        date: formData.date + 'T00:00:00'
      };
      
      await onSave(movementData);
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const getSelectedProduct = () => {
    return products.find(p => p.id === parseInt(formData.productId));
  };

  const calculateTotalValue = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    return quantity * unitPrice;
  };

  return (
    <div className="inventory-modal-overlay">
      <div className="inventory-modal">
        <div className="inventory-modal-header">
          <div className="inventory-modal-icon">📦</div>
          <h2 className="inventory-modal-title">
            Add Inventory Movement
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="inventory-modal-form">
          <div className="inventory-form-group">
            <label className="inventory-form-label required">Product</label>
            <select
              value={formData.productId}
              onChange={(e) => handleChange('productId', e.target.value)}
              className={`inventory-form-select ${validationErrors.productId ? 'error' : ''}`}
              required
              disabled={saving}
            >
              <option value="">Select a product</option>
              {Array.isArray(products) && products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.code}) - Current Stock: {product.currentStock || 0}
                </option>
              ))}
            </select>
            {validationErrors.productId && (
              <div className="inventory-validation-error">
                {validationErrors.productId}
              </div>
            )}
          </div>
          
          <div className="inventory-form-row">
            <div className="inventory-form-group">
              <label className="inventory-form-label required">Movement Type</label>
              <select
                value={formData.movementType}
                onChange={(e) => handleChange('movementType', e.target.value)}
                className="inventory-form-select"
                required
                disabled={saving}
              >
                <option value="IN">Stock In</option>
                <option value="OUT">Stock Out</option>
              </select>
              {formData.movementType === 'OUT' && getSelectedProduct() && (
                <div className="inventory-stock-warning">
                  Warning: Current stock is {getSelectedProduct().currentStock || 0}. 
                  Ensure sufficient stock is available.
                </div>
              )}
            </div>
            
            <div className="inventory-form-group">
              <label className="inventory-form-label required">Quantity</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                className={`inventory-form-input ${validationErrors.quantity ? 'error' : ''}`}
                required
                disabled={saving}
              />
              {validationErrors.quantity && (
                <div className="inventory-validation-error">
                  {validationErrors.quantity}
                </div>
              )}
            </div>
          </div>

          <div className="inventory-form-row">
            <div className="inventory-form-group">
              <label className="inventory-form-label">Unit Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => handleChange('unitPrice', e.target.value)}
                className={`inventory-form-input ${validationErrors.unitPrice ? 'error' : ''}`}
                placeholder="0.00"
                disabled={saving}
              />
              {validationErrors.unitPrice && (
                <div className="inventory-validation-error">
                  {validationErrors.unitPrice}
                </div>
              )}
            </div>

            <div className="inventory-form-group">
              <label className="inventory-form-label">Total Value</label>
              <div className="inventory-total-value-display">
                {formatCurrency(calculateTotalValue())}
              </div>
            </div>
          </div>
          
          <div className="inventory-form-group">
            <label className="inventory-form-label required">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={`inventory-form-input ${validationErrors.date ? 'error' : ''}`}
              required
              disabled={saving}
            />
            {validationErrors.date && (
              <div className="inventory-validation-error">
                {validationErrors.date}
              </div>
            )}
          </div>
          
          {formData.movementType === 'IN' && (
            <div className="inventory-supplier-section">
              <label className="inventory-form-label required">Supplier</label>
              <select
                value={formData.supplierId}
                onChange={(e) => handleChange('supplierId', e.target.value)}
                className={`inventory-form-select ${validationErrors.supplierId ? 'error' : ''}`}
                required
                disabled={saving}
              >
                <option value="">Select a supplier</option>
                {Array.isArray(suppliers) && suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} {supplier.uniqueSupplierCode ? `(${supplier.uniqueSupplierCode})` : ''}
                  </option>
                ))}
              </select>
              {validationErrors.supplierId && (
                <div className="inventory-validation-error">
                  {validationErrors.supplierId}
                </div>
              )}
            </div>
          )}
          
          <div className="inventory-form-group">
            <label className="inventory-form-label">Reference</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => handleChange('reference', e.target.value)}
              className="inventory-form-input"
              placeholder="PO number, invoice, SO number, etc."
              disabled={saving}
            />
          </div>
          
          <div className="inventory-modal-buttons">
            <button
              type="submit"
              disabled={saving}
              className="inventory-modal-submit-button"
            >
              {saving ? 'Adding Movement...' : 'Add Movement'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inventory-modal-cancel-button"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryManagementPage;