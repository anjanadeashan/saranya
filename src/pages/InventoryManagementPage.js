import React, { useState, useEffect } from 'react';
import './InventoryManagement.css'; // Import the CSS file

// API configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Authentication helper functions
const authUtils = {
  getToken: () => {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           localStorage.getItem('jwt') ||
           sessionStorage.getItem('token') ||
           sessionStorage.getItem('authToken') ||
           sessionStorage.getItem('jwt');
  },
  
  setToken: (token) => {
    localStorage.setItem('token', token);
  },
  
  removeToken: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('jwt');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('jwt');
  },
  
  isTokenExpired: (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() > exp;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }
};

// Currency formatter for Sri Lankan Rupees
const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return 'Rs. 0.00';
  return `Rs. ${parseFloat(amount).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// API service for backend integration with authentication
const api = {
  get: async (url) => {
    const token = authUtils.getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }
    
    if (authUtils.isTokenExpired(token)) {
      authUtils.removeToken();
      throw new Error('Authentication token has expired. Please log in again.');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.status === 401) {
        authUtils.removeToken();
        throw new Error('Authentication failed. Please log in again.');
      }
      
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
    const token = authUtils.getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }
    
    if (authUtils.isTokenExpired(token)) {
      authUtils.removeToken();
      throw new Error('Authentication token has expired. Please log in again.');
    }
    
    try {
      console.log(`Making POST request to ${API_BASE_URL}${url}`);
      console.log('Request payload:', JSON.stringify(data, null, 2));
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (response.status === 401) {
        authUtils.removeToken();
        throw new Error('Authentication failed. Please log in again.');
      }
      
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
    const token = authUtils.getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }
    
    if (authUtils.isTokenExpired(token)) {
      authUtils.removeToken();
      throw new Error('Authentication token has expired. Please log in again.');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.status === 401) {
        authUtils.removeToken();
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API DELETE error for ${url}:`, error);
      throw error;
    }
  },
  
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        throw new Error(`Login failed! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.token || result.accessToken || result.jwt) {
        const token = result.token || result.accessToken || result.jwt;
        authUtils.setToken(token);
        return { success: true, token };
      } else {
        throw new Error('No token received from login response');
      }
    } catch (error) {
      console.error('Login Error:', error);
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
  const [authError, setAuthError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  
  // Login state
  const [showLogin, setShowLogin] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });

  useEffect(() => {
    const token = authUtils.getToken();
    if (!token || authUtils.isTokenExpired(token)) {
      setAuthError(true);
      setLoading(false);
    } else {
      fetchData();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      await api.login(loginCredentials.username, loginCredentials.password);
      setAuthError(false);
      setShowLogin(false);
      await fetchData();
    } catch (error) {
      setError(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const extractDataFromResponse = (response, fallback = []) => {
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
      setAuthError(false);
      
      const [inventoryRes, productsRes, suppliersRes] = await Promise.all([
        api.get('/inventory').catch(err => {
          console.error('Inventory API error:', err);
          if (err.message.includes('Authentication')) {
            setAuthError(true);
          }
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
      
      if (authError) return;
      
      const inventoryData = extractDataFromResponse(inventoryRes, []);
      const productsData = extractDataFromResponse(productsRes, []);
      const suppliersData = extractDataFromResponse(suppliersRes, []);
      
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
      
      const enrichedInventory = inventoryData.map(item => {
        const enrichedItem = { ...item };
        
        if (item.productId && productMap[item.productId]) {
          enrichedItem.product = productMap[item.productId];
        } else if (item.product && item.product.id && productMap[item.product.id]) {
          enrichedItem.product = productMap[item.product.id];
        }
        
        if (item.supplierId && supplierMap[item.supplierId]) {
          enrichedItem.supplier = supplierMap[item.supplierId];
        } else if (item.supplier && item.supplier.id && supplierMap[item.supplier.id]) {
          enrichedItem.supplier = supplierMap[item.supplier.id];
        }
        
        return enrichedItem;
      });
      
      setInventory(enrichedInventory);
      setProducts(productsData);
      setSuppliers(suppliersData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.message.includes('Authentication') || error.message.includes('log in')) {
        setAuthError(true);
      } else {
        setError(`Failed to load inventory data: ${error.message}`);
        setInventory([]);
        setProducts([]);
        setSuppliers([]);
      }
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
      
      if (response.success === true || response.success === "true" || 
          (response.data && !response.error) || response.message === 'success') {
        setShowModal(false);
        fetchData();
        alert('Inventory movement added successfully!');
      } else {
        const errorMessage = response.message || response.error || 'Failed to add inventory movement';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error adding inventory movement:', error);
      
      if (error.message.includes('Authentication')) {
        setAuthError(true);
        return;
      }
      
      let errorMessage = error.message;
      
      if (error.message.includes('Insufficient stock')) {
        errorMessage = `${error.message}\n\nThis means you're trying to remove more items than are currently available in stock.`;
      } else if (error.message.includes('Product not found')) {
        errorMessage = `${error.message}\n\nThe selected product may have been deleted or doesn't exist.`;
      }
      
      alert(`Failed to add inventory movement:\n\n${errorMessage}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory movement?')) {
      try {
        const response = await api.delete(`/inventory/${id}`);
        
        if (response.success || response.message === 'success' || !response.error) {
          fetchData();
          alert('Inventory movement deleted successfully!');
        } else {
          throw new Error(response.message || 'Failed to delete inventory movement');
        }
      } catch (error) {
        console.error('Error deleting inventory movement:', error);
        if (error.message.includes('Authentication')) {
          setAuthError(true);
        } else {
          alert(`Failed to delete inventory movement: ${error.message}`);
        }
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

  // Authentication Error Screen
  if (authError) {
    return (
      <div className="inventory-loading-container">
        <div className="inventory-loading-card">
          <div className="inventory-error-text">
            Authentication Required
            <p style={{fontSize: '14px', marginTop: '10px', color: '#666'}}>
              Please log in to access inventory management
            </p>
          </div>
          
          {!showLogin && (
            <button 
              onClick={() => setShowLogin(true)}
              className="inventory-retry-button"
            >
              Login
            </button>
          )}
          
          {showLogin && (
            <form onSubmit={handleLogin} style={{marginTop: '20px', maxWidth: '300px'}}>
              <div style={{marginBottom: '15px'}}>
                <input
                  type="text"
                  placeholder="Username"
                  value={loginCredentials.username}
                  onChange={(e) => setLoginCredentials({...loginCredentials, username: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div style={{marginBottom: '15px'}}>
                <input
                  type="password"
                  placeholder="Password"
                  value={loginCredentials.password}
                  onChange={(e) => setLoginCredentials({...loginCredentials, password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div style={{display: 'flex', gap: '10px'}}>
                <button 
                  type="submit" 
                  className="inventory-retry-button"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowLogin(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ddd',
                    background: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          {error && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

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

// Simple Inventory Movement Modal Component with Searchable Select Dropdowns
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
  const [productSearch, setProductSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);
  const [showSupplierList, setShowSupplierList] = useState(false);

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    !productSearch || 
    product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.code?.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(supplier =>
    !supplierSearch || 
    supplier.name?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    supplier.uniqueSupplierCode?.toLowerCase().includes(supplierSearch.toLowerCase())
  );

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
      // Get selected supplier to include supplier code
      const selectedSupplier = suppliers.find(s => s.id === parseInt(formData.supplierId));
      
      const movementData = {
        productId: parseInt(formData.productId),
        movementType: formData.movementType,
        quantity: parseInt(formData.quantity),
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
        supplierCode: selectedSupplier?.uniqueSupplierCode || selectedSupplier?.code || null,
        reference: formData.reference || null,
        date: formData.date + 'T00:00:00'
      };
      
      console.log('Sending movement data with supplier code:', movementData);
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
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleProductSelect = (product) => {
    // Log the complete product object to see its structure
    console.log('Complete product object:', JSON.stringify(product, null, 2));
    
    // Try different possible price field names from your backend
    const possiblePriceFields = [
      'unitPrice', 'price', 'sellingPrice', 'salePrice', 
      'retailPrice', 'listPrice', 'basePrice', 'cost',
      'purchasePrice', 'costPrice', 'standardPrice'
    ];
    
    let foundPrice = '';
    for (const field of possiblePriceFields) {
      if (product[field] !== undefined && product[field] !== null && product[field] !== '') {
        foundPrice = product[field];
        console.log(`Found price in field '${field}':`, foundPrice);
        break;
      }
    }
    
    if (!foundPrice) {
      console.log('No price found in product data. Available fields:', Object.keys(product));
    }
    
    setFormData(prev => ({ 
      ...prev, 
      productId: product.id,
      unitPrice: foundPrice || ''
    }));
    setProductSearch(`${product.name} (${product.code})`);
    setShowProductList(false);
  };

  const handleSupplierSelect = (supplier) => {
    setFormData(prev => ({ ...prev, supplierId: supplier.id }));
    setSupplierSearch(`${supplier.name}${supplier.uniqueSupplierCode ? ` (${supplier.uniqueSupplierCode})` : ''}`);
    setShowSupplierList(false);
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
          <h2 className="inventory-modal-title">Add Inventory Movement</h2>
        </div>
        
        <style>{`
          .searchable-select {
            position: relative;
            width: 100%;
          }
          
          .searchable-input {
            width: 100%;
            padding: 8px 30px 8px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            background: white;
            cursor: text;
          }
          
          .searchable-input:focus {
            outline: none;
            border-color: #4F46E5;
            box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
          }
          
          .searchable-arrow {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            color: #666;
            font-size: 12px;
          }
          
          .searchable-options {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 4px 4px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          
          .searchable-option {
            padding: 10px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            background: white;
          }
          
          .searchable-option:hover {
            background-color: #f8f9fa;
          }
          
          .searchable-option:last-child {
            border-bottom: none;
          }
          
          .option-main {
            font-weight: 500;
            color: #333;
          }
          
          .option-sub {
            font-size: 12px;
            color: #666;
            margin-top: 2px;
          }
          
          .no-results {
            padding: 10px;
            color: #666;
            font-style: italic;
            text-align: center;
            background: white;
          }
          
          .error { border-color: #dc2626; }
          .validation-error {
            color: #dc2626;
            font-size: 12px;
            margin-top: 4px;
          }
          .stock-warning {
            font-size: 12px;
            color: #f59e0b;
            margin-top: 4px;
            font-weight: 500;
          }
          .total-value-display {
            padding: 8px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            font-weight: 500;
            color: #374151;
          }
        `}</style>

        <form onSubmit={handleSubmit} className="inventory-modal-form">
          {/* Product Selection - Single Searchable Dropdown */}
          <div className="inventory-form-group">
            <label className="inventory-form-label required">Product</label>
            <div className="searchable-select">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductList(true);
                  if (!e.target.value) {
                    setFormData(prev => ({ ...prev, productId: '' }));
                  }
                }}
                onFocus={() => setShowProductList(true)}
                onBlur={() => setTimeout(() => setShowProductList(false), 200)}
                placeholder="Search and select product..."
                className={`searchable-input ${validationErrors.productId ? 'error' : ''}`}
                disabled={saving}
                autoComplete="off"
              />
              <div className="searchable-arrow">▼</div>
              
              {showProductList && (
                <div className="searchable-options">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.slice(0, 10).map(product => (
                      <div
                        key={product.id}
                        className="searchable-option"
                        onMouseDown={() => handleProductSelect(product)}
                      >
                        <div className="option-main">
                          {product.name} ({product.code})
                        </div>
                        <div className="option-sub">
                          Stock: {product.currentStock || 0}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-results">
                      {productSearch ? `No products found for "${productSearch}"` : 'Type to search products...'}
                    </div>
                  )}
                </div>
              )}
            </div>
            {validationErrors.productId && (
              <div className="validation-error">{validationErrors.productId}</div>
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
                <div className="stock-warning">
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
                <div className="validation-error">{validationErrors.quantity}</div>
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
                <div className="validation-error">{validationErrors.unitPrice}</div>
              )}
            </div>

            <div className="inventory-form-group">
              <label className="inventory-form-label">Total Value</label>
              <div className="total-value-display">
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
              <div className="validation-error">{validationErrors.date}</div>
            )}
          </div>
          
          {/* Supplier Selection - Single Searchable Dropdown (only for Stock IN) */}
          {formData.movementType === 'IN' && (
            <div className="inventory-supplier-section">
              <label className="inventory-form-label required">Supplier</label>
              <div className="searchable-select">
                <input
                  type="text"
                  value={supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value);
                    setShowSupplierList(true);
                    if (!e.target.value) {
                      setFormData(prev => ({ ...prev, supplierId: '' }));
                    }
                  }}
                  onFocus={() => setShowSupplierList(true)}
                  onBlur={() => setTimeout(() => setShowSupplierList(false), 200)}
                  placeholder="Search and select supplier..."
                  className={`searchable-input ${validationErrors.supplierId ? 'error' : ''}`}
                  disabled={saving}
                  autoComplete="off"
                />
                <div className="searchable-arrow">▼</div>
                
                {showSupplierList && (
                  <div className="searchable-options">
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.slice(0, 10).map(supplier => (
                        <div
                          key={supplier.id}
                          className="searchable-option"
                          onMouseDown={() => handleSupplierSelect(supplier)}
                        >
                          <div className="option-main">
                            {supplier.name}
                          </div>
                          {supplier.uniqueSupplierCode && (
                            <div className="option-sub">
                              Code: {supplier.uniqueSupplierCode}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="no-results">
                        {supplierSearch ? `No suppliers found for "${supplierSearch}"` : 'Type to search suppliers...'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {validationErrors.supplierId && (
                <div className="validation-error">{validationErrors.supplierId}</div>
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