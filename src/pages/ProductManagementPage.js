import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './ProductManagement.css'; // Import the CSS file

const ProductManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);
  const [saving, setSaving] = useState(false);

  // Configure API timeout and interceptors
  React.useEffect(() => {
    // Set default timeout to 30 seconds
    api.defaults.timeout = 30000;

    // Add request interceptor for debugging
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        console.log('API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          data: config.data,
          timeout: config.timeout
        });
        return config;
      },
      (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for debugging
    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        console.log('API Response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      },
      (error) => {
        console.error('Response Error:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const fetchProducts = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/products', {
        timeout: 30000 // 30 seconds timeout
      });
      
      console.log('Full API response:', response);
      console.log('Response data:', response.data);
      
      // Handle the ApiResponse structure from backend
      let productsData = [];
      if (response.data && response.data.data) {
        // If wrapped in ApiResponse
        productsData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        // If direct array
        productsData = response.data;
      } else {
        console.warn('Unexpected response structure:', response.data);
        productsData = [];
      }
      
      console.log('Processed products data:', productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      
      let errorMessage = 'Failed to load products';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - Server is taking too long to respond';
        // Auto retry on timeout (max 2 retries)
        if (retryCount < 2) {
          console.log(`Retrying request... Attempt ${retryCount + 1}`);
          setTimeout(() => fetchProducts(retryCount + 1), 2000);
          return;
        }
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - Cannot connect to server';
      } else if (error.response?.status) {
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`;
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed for this function

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = Array.isArray(products)
    ? products.filter(product => {
        if (!product) return false;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          (product.name && product.name.toLowerCase().includes(searchLower)) ||
          (product.code && product.code.toLowerCase().includes(searchLower))
        );
      })
    : [];

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleViewDetails = (product) => {
    setSelectedProductForDetails(product);
    setShowDetailsModal(true);
  };

  const handleManageStock = (product) => {
    setSelectedProductForStock(product);
    setShowStockModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`, {
          timeout: 15000 // 15 seconds timeout for delete
        });
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        
        let errorMessage = 'Failed to delete product';
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Delete request timeout - Please try again';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        alert(errorMessage);
      }
    }
  };

  const handleSave = async (productData) => {
  setSaving(true);
  try {
    console.log('Saving product data:', productData);
    
    // Ensure proper data types
    const requestData = {
      code: productData.code,
      name: productData.name,
      description: productData.description || '',
      fixedPrice: parseFloat(productData.fixedPrice) || 0,
      discount: parseFloat(productData.discount) || 0,
      currentStock: parseInt(productData.currentStock) || 0,
      lowStockThreshold: parseInt(productData.lowStockThreshold) || 0,
      isActive: Boolean(productData.isActive)
    };

    console.log('Request data with proper types:', requestData);
    
    const config = {
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    if (selectedProduct) {
      console.log('Updating product with ID:', selectedProduct.id);
      await api.put(`/products/${selectedProduct.id}`, JSON.stringify(requestData), config);
    } else {
      console.log('Creating new product');
      await api.post('/products', JSON.stringify(requestData), config);
    }
    
    console.log('Save operation completed successfully');
    
    // Success - close modal and refresh data
    setShowModal(false);
    setSelectedProduct(null);
    await fetchProducts();
    
    // Show success message
    const message = selectedProduct ? 'Product updated successfully!' : 'Product created successfully!';
    alert(message);
    
  } catch (error) {
    console.error('Error saving product:', error);
    console.error('Error response:', error.response);
    
    let errorMessage = 'Failed to save product';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Save request timeout - The server is taking too long to respond. Please check your internet connection and try again.';
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Network error - Cannot connect to server. Please check if the server is running.';
    } else if (error.response?.status === 415) {
      errorMessage = 'Content type error - Please check the request format.';
    } else if (error.response?.status === 400) {
      errorMessage = `Validation error: ${error.response.data?.message || 'Invalid data provided'}`;
    } else if (error.response?.status === 409) {
      errorMessage = 'Product code already exists. Please use a different code.';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error - Please try again later or contact support.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    alert(errorMessage);
  } finally {
    setSaving(false);
  }
};

  const getStockStatus = (product) => {
    if (!product) return 'unknown';
    const currentStock = parseInt(product.currentStock) || 0;
    const lowStockThreshold = parseInt(product.lowStockThreshold) || 0;
    
    if (currentStock <= 0) return 'out-of-stock';
    if (currentStock <= lowStockThreshold) return 'low-stock';
    return 'in-stock';
  };

  if (loading) {
    return (
      <div className="product-management-container">
        <div className="product-loading-container">
          <div className="product-loading-spinner"></div>
          <div className="product-loading-text">Loading products...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-management-container">
        <div className="product-error-container">
          <div className="product-error-text">{error}</div>
          <button
            className="product-retry-button"
            onClick={() => fetchProducts()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-management-container">
      {/* Header */}
      <div className="product-management-header">
        <h1 className="product-management-title">Product Management</h1>
        <button
          className="product-add-button"
          onClick={() => {
            setSelectedProduct(null);
            setShowModal(true);
          }}
        >
          Add New Product
        </button>
      </div>

      {/* Search */}
      <div className="product-search-container">
        <input
          type="text"
          placeholder="Search products by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="product-search-input"
        />
      </div>

      {/* Products Table */}
      <div className="product-table-container">
        <table className="product-table">
          <thead className="product-table-header">
            <tr>
              <th className="product-header-cell">Product</th>
              <th className="product-header-cell">Code</th>
              <th className="product-header-cell">Cost</th>
              <th className="product-header-cell">Stock</th>
              <th className="product-header-cell">Status</th>
              <th className="product-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const status = getStockStatus(product);
                const currentStock = parseInt(product.currentStock) || 0;
                
                return (
                  <tr 
                    key={product.id || product.code} 
                    className="product-table-row"
                  >
                    <td className="product-table-cell">
                      <div className="product-info">
                        <div className="product-name">
                          {product.name || 'N/A'}
                        </div>
                        <div className="product-description">
                          {product.description || 'No description'}
                        </div>
                      </div>
                    </td>
                    <td className="product-table-cell">
                      <span className="product-code">
                        {product.code || 'N/A'}
                      </span>
                    </td>
                    <td className="product-table-cell">
                      <span className="product-price">
                        Rs.{parseFloat(product.fixedPrice || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="product-table-cell">
                      <div className="product-stock-info">
                        <span className="product-stock">
                          {currentStock}
                        </span>
                      </div>
                    </td>
                    <td className="product-table-cell">
                      <span className={`product-status-badge status-${status}`}>
                        {status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="product-table-cell">
                      <div className="product-action-buttons">
                        
                        <button
                          className="product-action-button product-manage-stock-button"
                          onClick={() => handleManageStock(product)}
                          title="Manage FIFO Stock"
                        >
                          Manage Stock
                        </button>
                        <button
                          className="product-action-button"
                          onClick={() => handleEdit(product)}
                        >
                          Edit
                        </button>
                        <button
                          className="product-delete-button"
                          onClick={() => handleDelete(product.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="product-empty-state">
                  {searchTerm 
                    ? 'No products found matching your search.' 
                    : 'No products available. Click "Add New Product" to get started.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={selectedProduct}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setSelectedProduct(null);
          }}
          saving={saving}
        />
      )}

      {/* Product Details Modal */}
      {showDetailsModal && selectedProductForDetails && (
        <ProductDetailsModal
          product={selectedProductForDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProductForDetails(null);
          }}
        />
      )}

      {/* Enhanced Stock FIFO Modal */}
      {showStockModal && selectedProductForStock && (
        <StockFIFOModal
          product={selectedProductForStock}
          onClose={() => {
            setShowStockModal(false);
            setSelectedProductForStock(null);
          }}
          onStockUpdated={fetchProducts}
        />
      )}
    </div>
  );
};

// Product Details Modal Component
const ProductDetailsModal = ({ product, onClose }) => {
  const [productDetails, setProductDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProductDetails();
  }, [product.id]);

  const fetchProductDetails = async () => {
    try {
      const response = await api.get(`/products/${product.id}`, {
        timeout: 15000
      });
      
      let detailsData = null;
      if (response.data && response.data.data) {
        detailsData = response.data.data;
      } else if (response.data) {
        detailsData = response.data;
      }
      
      setProductDetails(detailsData);
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="product-modal-overlay" onClick={onClose}>
        <div className="product-details-modal" onClick={(e) => e.stopPropagation()}>
          <div className="product-details-loading">
            <div className="product-loading-spinner"></div>
            <div>Loading product details...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="product-details-header">
          <h2 className="product-details-title">Product Details</h2>
          <button className="product-details-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error ? (
          <div className="product-details-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <div className="product-details-content">
            {/* Basic Product Information */}
            <div className="product-details-section">
              <h3>Basic Information</h3>
              <div className="product-details-grid">
                <div className="product-detail-item">
                  <label>Product Name:</label>
                  <span>{productDetails?.name || product.name}</span>
                </div>
                <div className="product-detail-item">
                  <label>Product Code:</label>
                  <span>{productDetails?.code || product.code}</span>
                </div>
                <div className="product-detail-item">
                  <label>Description:</label>
                  <span>{productDetails?.description || product.description || 'No description'}</span>
                </div>
                <div className="product-detail-item">
                  <label>Fixed Price:</label>
                  <span>Rs.{parseFloat(productDetails?.fixedPrice || product.fixedPrice || 0).toFixed(2)}</span>
                </div>
                <div className="product-detail-item">
                  <label>Discount:</label>
                  <span>{parseFloat(productDetails?.discount || product.discount || 0).toFixed(2)}%</span>
                </div>
                <div className="product-detail-item">
                  <label>Status:</label>
                  <span className={`product-status-badge ${productDetails?.isActive !== false ? 'active' : 'inactive'}`}>
                    {productDetails?.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div className="product-details-section">
              <h3>Stock Information</h3>
              <div className="product-details-grid">
                <div className="product-detail-item">
                  <label>Current Stock:</label>
                  <span className="stock-quantity">
                    {parseInt(productDetails?.currentStock || product.currentStock || 0)} units
                  </span>
                </div>
                <div className="product-detail-item">
                  <label>Low Stock Threshold:</label>
                  <span>{parseInt(productDetails?.lowStockThreshold || product.lowStockThreshold || 0)} units</span>
                </div>
                <div className="product-detail-item">
                  <label>Stock Status:</label>
                  <span className={`product-status-badge status-${
                    (productDetails?.currentStock || product.currentStock || 0) <= 0 ? 'out-of-stock' :
                    (productDetails?.currentStock || product.currentStock || 0) <= (productDetails?.lowStockThreshold || product.lowStockThreshold || 0) ? 'low-stock' :
                    'in-stock'
                  }`}>
                    {(productDetails?.currentStock || product.currentStock || 0) <= 0 ? 'Out of Stock' :
                     (productDetails?.currentStock || product.currentStock || 0) <= (productDetails?.lowStockThreshold || product.lowStockThreshold || 0) ? 'Low Stock' :
                     'In Stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="product-details-section">
              <h3>Record Information</h3>
              <div className="product-details-grid">
                <div className="product-detail-item">
                  <label>Created At:</label>
                  <span>{formatDate(productDetails?.createdAt || product.createdAt)}</span>
                </div>
                <div className="product-detail-item">
                  <label>Last Updated:</label>
                  <span>{formatDate(productDetails?.updatedAt || product.updatedAt)}</span>
                </div>
                <div className="product-detail-item">
                  <label>Product ID:</label>
                  <span>{productDetails?.id || product.id}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Product Modal Component with FIXED stock handling
const ProductModal = ({ product, onSave, onClose, saving }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    fixedPrice: '',
    currentStock: '0',
    lowStockThreshold: '5',
    discount: '0',
    isActive: true
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Initialize form data properly when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        code: product.code || '',
        description: product.description || '',
        fixedPrice: product.fixedPrice?.toString() || '0',
        currentStock: product.currentStock?.toString() || '0',
        lowStockThreshold: product.lowStockThreshold?.toString() || '5',
        discount: product.discount?.toString() || '0',
        isActive: product.isActive !== undefined ? product.isActive : true
      });
    } else {
      // For new products, set reasonable defaults
      setFormData({
        name: '',
        code: '',
        description: '',
        fixedPrice: '0',
        currentStock: '0',
        lowStockThreshold: '5',
        discount: '0',
        isActive: true
      });
    }
  }, [product]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!formData.code.trim()) {
      errors.code = 'Product code is required';
    }
    
    const price = parseFloat(formData.fixedPrice);
    if (!formData.fixedPrice || isNaN(price) || price < 0) {
      errors.fixedPrice = 'Valid price is required (minimum 0)';
    }
    
    const stock = parseInt(formData.currentStock);
    if (formData.currentStock === '' || isNaN(stock) || stock < 0) {
      errors.currentStock = 'Valid stock quantity is required (minimum 0)';
    }
    
    const threshold = parseInt(formData.lowStockThreshold);
    if (formData.lowStockThreshold !== '' && (isNaN(threshold) || threshold < 0)) {
      errors.lowStockThreshold = 'Low stock threshold must be a valid number (minimum 0)';
    }
    
    const discount = parseFloat(formData.discount);
    if (formData.discount !== '' && (isNaN(discount) || discount < 0 || discount > 100)) {
      errors.discount = 'Discount must be between 0 and 100';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Convert and clean data properly
    const cleanedData = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim(),
      fixedPrice: parseFloat(formData.fixedPrice) || 0,
      currentStock: parseInt(formData.currentStock) || 0,
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 0,
      discount: parseFloat(formData.discount) || 0,
      isActive: Boolean(formData.isActive)
    };
    
    console.log('Submitting cleaned product data:', cleanedData);
    
    onSave(cleanedData);
  };

  const handleInputChange = (field, value) => {
    if (field === 'currentStock' || field === 'lowStockThreshold') {
      // Allow empty string for editing, but validate on submit
      if (value === '' || /^\d+$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      }
    } else if (field === 'fixedPrice' || field === 'discount') {
      // Allow decimal numbers
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="product-modal-title">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>
        
        <form onSubmit={handleSubmit} className="product-modal-form">
          <div className="product-input-group">
            <label className="product-modal-label">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`product-modal-input ${validationErrors.name ? 'product-input-error' : ''}`}
              required
              placeholder="Enter product name"
              disabled={saving}
            />
            {validationErrors.name && (
              <span className="product-error-text">{validationErrors.name}</span>
            )}
          </div>

          <div className="product-input-group">
            <label className="product-modal-label">Product Code *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              className={`product-modal-input ${validationErrors.code ? 'product-input-error' : ''}`}
              required
              placeholder="Enter product code"
              disabled={saving}
            />
            {validationErrors.code && (
              <span className="product-error-text">{validationErrors.code}</span>
            )}
          </div>

          <div className="product-input-group">
            <label className="product-modal-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="product-modal-textarea"
              placeholder="Enter product description"
              disabled={saving}
              rows="3"
            />
          </div>

          <div className="product-input-group-grid">
            <div className="product-input-group">
              <label className="product-modal-label">Price (Rs) *</label>
              <input
                type="text"
                value={formData.fixedPrice}
                onChange={(e) => handleInputChange('fixedPrice', e.target.value)}
                className={`product-modal-input ${validationErrors.fixedPrice ? 'product-input-error' : ''}`}
                required
                placeholder="0.00"
                disabled={saving}
              />
              {validationErrors.fixedPrice && (
                <span className="product-error-text">{validationErrors.fixedPrice}</span>
              )}
            </div>

            <div className="product-input-group">
              <label className="product-modal-label">Initial Stock *</label>
              <input
                type="text"
                value={formData.currentStock}
                onChange={(e) => handleInputChange('currentStock', e.target.value)}
                className={`product-modal-input ${validationErrors.currentStock ? 'product-input-error' : ''}`}
                required
                placeholder="0"
                disabled={saving}
              />
              {validationErrors.currentStock && (
                <span className="product-error-text">{validationErrors.currentStock}</span>
              )}
            </div>
          </div>

          <div className="product-input-group-grid">
            <div className="product-input-group">
              <label className="product-modal-label">Low Stock Threshold</label>
              <input
                type="text"
                value={formData.lowStockThreshold}
                onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)}
                className={`product-modal-input ${validationErrors.lowStockThreshold ? 'product-input-error' : ''}`}
                placeholder="5"
                disabled={saving}
              />
              {validationErrors.lowStockThreshold && (
                <span className="product-error-text">{validationErrors.lowStockThreshold}</span>
              )}
            </div>

            <div className="product-input-group">
              <label className="product-modal-label">Discount (%)</label>
              <input
                type="text"
                value={formData.discount}
                onChange={(e) => handleInputChange('discount', e.target.value)}
                className={`product-modal-input ${validationErrors.discount ? 'product-input-error' : ''}`}
                placeholder="0.00"
                disabled={saving}
              />
              {validationErrors.discount && (
                <span className="product-error-text">{validationErrors.discount}</span>
              )}
            </div>
          </div>

          <div className="product-input-group">
            <label className="product-modal-checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                disabled={saving}
                className="product-modal-checkbox"
              />
              Product is active
            </label>
          </div>

          <div className="product-modal-button-group">
            <button
              type="submit"
              className="product-modal-save-button"
              disabled={saving}
            >
              {saving && <div className="product-modal-loading-spinner"></div>}
              {saving 
                ? (product ? 'Updating...' : 'Creating...') 
                : (product ? 'Update Product' : 'Create Product')
              }
            </button>
            <button
              type="button"
              className="product-modal-cancel-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};





<<<<<<< HEAD
// Enhanced FIFO Stock Management Modal with Stock Information Section (No Auth Required)
=======



>>>>>>> master
const StockFIFOModal = ({ product, onClose, onStockUpdated }) => {
  const [stockEntries, setStockEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [addingStock, setAddingStock] = useState(false);
  const [productDetails, setProductDetails] = useState(product);
  const [newStockEntry, setNewStockEntry] = useState({
    quantity: '',
    purchasePrice: '',
    expiryDate: '',
    batchNumber: '',
    supplier: '',
    notes: ''
  });

<<<<<<< HEAD
  // Always try to fetch data without authentication checks
  useEffect(() => {
    fetchStockEntries();
    fetchProductDetails();
=======
  useEffect(() => {
    fetchStockEntries();
    fetchProductDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
>>>>>>> master
  }, []);

  const fetchProductDetails = async () => {
    try {
      const response = await api.get(`/products/${product.id}`, {
        timeout: 10000
      });
<<<<<<< HEAD
      
=======

>>>>>>> master
      let detailsData = null;
      if (response.data && response.data.data) {
        detailsData = response.data.data;
      } else if (response.data) {
        detailsData = response.data;
      }
<<<<<<< HEAD
      
      setProductDetails(detailsData || product);
    } catch (error) {
      console.log('Using basic product data due to:', error.message);
      setProductDetails(product); // Always fall back to basic product data
    }
  };

  const fetchStockEntries = async () => {
  try {
    setLoading(true);
    console.log(`Fetching stock entries for product ${product.id}`);
    
    const response = await api.get(`/inventory/product/${product.id}/entries`, {
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500;
      }
    });
    
    console.log('Raw response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    let entriesData = [];
    if (response.data && response.data.data) {
      entriesData = Array.isArray(response.data.data) ? response.data.data : [];
    } else if (Array.isArray(response.data)) {
      entriesData = response.data;
    }
    
    console.log('Processed stock entries:', entriesData);
    console.log('Entries count:', entriesData.length);
    
    setStockEntries(entriesData);
    
  } catch (error) {
    console.log('Error fetching stock entries:', error.message);
    setStockEntries([]);
  } finally {
    setLoading(false);
  }
};

  const handleAddStock = async (e) => {
    e.preventDefault();
    
=======

      setProductDetails(detailsData || product);
    } catch (error) {
      console.log('Using basic product data due to:', error?.message || error);
      setProductDetails(product);
    }
  };

  const normalizeEntry = (raw) => {
    // Safely parse numeric fields and fallback to sensible names
    const quantity = Number(raw.quantity ?? raw.qty ?? 0) || 0;
    const purchasePrice = Number(raw.purchasePrice ?? raw.purchase_price ?? raw.unitCost ?? 0) || 0;
    const remainingFromAPI = raw.remainingQuantity ?? raw.remaining_qty ?? raw.remaining ?? raw.remainingQuantity;
    const remainingRaw = (typeof remainingFromAPI !== 'undefined' && remainingFromAPI !== null)
      ? Number(remainingFromAPI) : null;

    const sold = Number(raw.soldQuantity ?? raw.consumedQuantity ?? raw.consumed ?? raw.sold ?? 0) || 0;

    // determine date field
    const dateAddedStr = raw.dateAdded ?? raw.createdAt ?? raw.addedAt ?? raw.date;
    const dateAdded = dateAddedStr ? new Date(dateAddedStr) : null;

    const expiryDateStr = raw.expiryDate ?? raw.expiry_date ?? raw.expireAt;
    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;

    // compute remaining: prefer API's remaining if provided, else quantity - sold (clamped to 0)
    const remaining = remainingRaw !== null
      ? Math.max(0, remainingRaw)
      : Math.max(0, quantity - (isNaN(sold) ? 0 : sold));

    return {
      ...raw,
      quantity,
      purchasePrice,
      remaining,
      sold,
      dateAdded,
      expiryDate
    };
  };

  const fetchStockEntries = async () => {
    try {
      setLoading(true);
      console.log(`Fetching stock entries for product ${product.id}`);

      const response = await api.get(`/inventory/product/${product.id}/entries`, {
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      console.log('Raw response:', response);

      let entriesData = [];
      if (response.data && response.data.data) {
        entriesData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        entriesData = response.data;
      }

      // Normalize and compute missing fields
      let normalized = entriesData.map(normalizeEntry);

      // Sort FIFO: oldest first (by dateAdded or createdAt)
      normalized.sort((a, b) => {
        const da = a.dateAdded ? a.dateAdded.getTime() : 0;
        const db = b.dateAdded ? b.dateAdded.getTime() : 0;
        return da - db;
      });

      console.log('Processed stock entries:', normalized);
      setStockEntries(normalized);
    } catch (error) {
      console.log('Error fetching stock entries:', error?.message || error);
      setStockEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();

>>>>>>> master
    if (!newStockEntry.quantity || !newStockEntry.purchasePrice) {
      alert('Quantity and purchase price are required');
      return;
    }
<<<<<<< HEAD
    
    try {
      setAddingStock(true);
      
      const stockData = {
        productId: product.id,
        quantity: parseInt(newStockEntry.quantity),
=======

    try {
      setAddingStock(true);

      const stockData = {
        productId: product.id,
        quantity: parseInt(newStockEntry.quantity, 10),
>>>>>>> master
        purchasePrice: parseFloat(newStockEntry.purchasePrice),
        expiryDate: newStockEntry.expiryDate || null,
        batchNumber: newStockEntry.batchNumber || null,
        supplier: newStockEntry.supplier || null,
        notes: newStockEntry.notes || null
      };
<<<<<<< HEAD
      
      console.log('Adding stock entry:', stockData);
      
=======

      console.log('Adding stock entry:', stockData);

>>>>>>> master
      const response = await api.post(`/inventory/product/${product.id}/entries`, stockData, {
        timeout: 20000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
<<<<<<< HEAD
      
      console.log('Stock entry added successfully:', response.data);
      
      // Reset form
=======

      console.log('Stock entry added successfully:', response.data);

>>>>>>> master
      setNewStockEntry({
        quantity: '',
        purchasePrice: '',
        expiryDate: '',
        batchNumber: '',
        supplier: '',
        notes: ''
      });
<<<<<<< HEAD
      
      setShowAddStock(false);
      
      // Refresh stock entries and product details
      await fetchStockEntries();
      await fetchProductDetails();
      
      // Update parent component
      if (onStockUpdated) {
        onStockUpdated();
      }
      
      alert('Stock entry added successfully!');
      
    } catch (error) {
      console.error('Error adding stock entry:', error);
      
      let errorMessage = 'Failed to add stock entry';
      
=======

      setShowAddStock(false);

      // Refresh stock entries and product details
      await fetchStockEntries();
      await fetchProductDetails();

      if (onStockUpdated) onStockUpdated();

      alert('Stock entry added successfully!');
    } catch (error) {
      console.error('Error adding stock entry:', error);

      let errorMessage = 'Failed to add stock entry';

>>>>>>> master
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - Please try again';
      } else if (error.response?.status === 400) {
        errorMessage = `Validation error: ${error.response.data?.message || 'Invalid data provided'}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
<<<<<<< HEAD
      
=======

>>>>>>> master
      alert(errorMessage);
    } finally {
      setAddingStock(false);
    }
  };

<<<<<<< HEAD
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
=======
  const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    // Accept Date or string
    const d = (dateObj instanceof Date) ? dateObj : new Date(dateObj);
    if (isNaN(d)) return 'N/A';
    return d.toLocaleDateString('en-US', {
>>>>>>> master
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

<<<<<<< HEAD
  const getTotalStock = () => {
    return stockEntries.reduce((sum, entry) => sum + (entry.remainingQuantity || entry.quantity || 0), 0);
=======
  // Use computed sum of remaining as the single source of truth when possible
  const computedTotalStock = () => {
    return stockEntries.reduce((sum, entry) => sum + (Number(entry.remaining) || 0), 0);
  };

  const getTotalStock = () => {
    // Prefer server productDetails.currentStock if it's a trustworthy number, else compute
    const serverStock = Number(productDetails?.currentStock ?? product?.currentStock);
    if (!isNaN(serverStock) && serverStock > 0) {
      // But double-check: if computed sum differs strongly, prefer computed sum because UI shows entries
      const computed = computedTotalStock();
      // choose computed if serverStock is 0 or much different (you can tune tolerance)
      if (computed !== 0 && Math.abs(computed - serverStock) > Math.max(1, 0.1 * serverStock)) {
        return computed;
      }
      return serverStock;
    }
    return computedTotalStock();
>>>>>>> master
  };

  const getOldestStockDate = () => {
    if (stockEntries.length === 0) return null;
<<<<<<< HEAD
    const dates = stockEntries
      .map(entry => new Date(entry.dateAdded || entry.createdAt))
      .filter(date => !isNaN(date));
    return dates.length > 0 ? new Date(Math.min(...dates)) : null;
=======
    const validDates = stockEntries.map(e => e.dateAdded).filter(d => d instanceof Date && !isNaN(d));
    return validDates.length > 0 ? new Date(Math.min(...validDates.map(d => d.getTime()))) : null;
>>>>>>> master
  };

  const getTotalValue = () => {
    return stockEntries.reduce((sum, entry) => {
<<<<<<< HEAD
      const qty = entry.remainingQuantity || entry.quantity || 0;
      const price = entry.purchasePrice || 0;
=======
      const qty = Number(entry.remaining) || 0;
      const price = Number(entry.purchasePrice) || 0;
>>>>>>> master
      return sum + (qty * price);
    }, 0);
  };

  const getStockStatus = () => {
<<<<<<< HEAD
    const currentStock = productDetails?.currentStock || product.currentStock || 0;
    const lowStockThreshold = productDetails?.lowStockThreshold || product.lowStockThreshold || 0;
    
=======
    const currentStock = getTotalStock();
    const lowStockThreshold = Number(productDetails?.lowStockThreshold ?? product?.lowStockThreshold ?? 0) || 0;

>>>>>>> master
    if (currentStock <= 0) return { status: 'out-of-stock', label: 'Out of Stock' };
    if (currentStock <= lowStockThreshold) return { status: 'low-stock', label: 'Low Stock' };
    return { status: 'in-stock', label: 'In Stock' };
  };

<<<<<<< HEAD
=======
  // Helper for expiry class
  const expiryClass = (expiryDate) => {
    if (!expiryDate) return '';
    const now = Date.now();
    const expiryTs = expiryDate instanceof Date ? expiryDate.getTime() : new Date(expiryDate).getTime();
    if (isNaN(expiryTs)) return '';
    if (expiryTs < now) return 'expired';
    if (expiryTs < now + 30 * 24 * 60 * 60 * 1000) return 'expiring-soon';
    return '';
  };

>>>>>>> master
  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="stock-fifo-modal enhanced-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stock-modal-header">
          <div className="stock-modal-title-section">
<<<<<<< HEAD
            <h2 className="stock-modal-title">
              FIFO Stock Management
            </h2>
            <div className="stock-modal-subtitle">
              {product.name} ({product.code})
            </div>
          </div>
          <button className="stock-modal-close" onClick={onClose}>
            ✕
          </button>
=======
            <h2 className="stock-modal-title">FIFO Stock Management</h2>
            <div className="stock-modal-subtitle">{product.name} ({product.code})</div>
          </div>
          <button className="stock-modal-close" onClick={onClose}>✕</button>
>>>>>>> master
        </div>

        <div className="stock-content-wrapper">
          {/* Stock Summary Overview */}
          <div className="stock-summary-section">
            <h3 className="section-title">Stock Overview</h3>
            <div className="stock-summary">
              <div className="stock-summary-item">
                <div className="summary-icon">📦</div>
                <div className="summary-content">
                  <span className="stock-summary-label">Total Available</span>
                  <span className="stock-summary-value">{getTotalStock()} units</span>
                </div>
              </div>
              <div className="stock-summary-item">
                <div className="summary-icon">💰</div>
                <div className="summary-content">
                  <span className="stock-summary-label">Total Value</span>
                  <span className="stock-summary-value">Rs.{getTotalValue().toFixed(2)}</span>
                </div>
              </div>
              <div className="stock-summary-item">
                <div className="summary-icon">📊</div>
                <div className="summary-content">
                  <span className="stock-summary-label">Total Entries</span>
                  <span className="stock-summary-value">{stockEntries.length}</span>
                </div>
              </div>
              <div className="stock-summary-item">
                <div className="summary-icon">⏰</div>
                <div className="summary-content">
                  <span className="stock-summary-label">Oldest Stock</span>
<<<<<<< HEAD
                  <span className="stock-summary-value">
                    {getOldestStockDate() ? formatDate(getOldestStockDate()) : 'N/A'}
                  </span>
=======
                  <span className="stock-summary-value">{getOldestStockDate() ? formatDate(getOldestStockDate()) : 'N/A'}</span>
>>>>>>> master
                </div>
              </div>
            </div>
          </div>

          {/* Stock Information Section */}
          <div className="stock-information-section">
            <h3 className="section-title">Current Stock Information</h3>
            <div className="stock-info-grid">
              <div className="stock-info-item">
                <div className="stock-info-icon">📦</div>
                <div className="stock-info-content">
                  <label className="stock-info-label">Current Stock</label>
<<<<<<< HEAD
                  <span className="stock-info-value highlight-value">
                    {parseInt(productDetails?.currentStock || product.currentStock || 0)} units
                  </span>
=======
                  <span className="stock-info-value highlight-value">{getTotalStock()} units</span>
>>>>>>> master
                </div>
              </div>
              <div className="stock-info-item">
                <div className="stock-info-icon">⚠️</div>
                <div className="stock-info-content">
                  <label className="stock-info-label">Low Stock Threshold</label>
<<<<<<< HEAD
                  <span className="stock-info-value">
                    {parseInt(productDetails?.lowStockThreshold || product.lowStockThreshold || 0)} units
                  </span>
=======
                  <span className="stock-info-value">{Number(productDetails?.lowStockThreshold ?? product?.lowStockThreshold ?? 0)} units</span>
>>>>>>> master
                </div>
              </div>
              <div className="stock-info-item">
                <div className="stock-info-icon">🎯</div>
                <div className="stock-info-content">
                  <label className="stock-info-label">Stock Status</label>
<<<<<<< HEAD
                  <span className={`stock-status-badge status-${getStockStatus().status}`}>
                    {getStockStatus().label}
                  </span>
=======
                  <span className={`stock-status-badge status-${getStockStatus().status}`}>{getStockStatus().label}</span>
>>>>>>> master
                </div>
              </div>
              <div className="stock-info-item">
                <div className="stock-info-icon">💵</div>
                <div className="stock-info-content">
                  <label className="stock-info-label">Fixed Price</label>
<<<<<<< HEAD
                  <span className="stock-info-value">
                    Rs.{parseFloat(productDetails?.fixedPrice || product.fixedPrice || 0).toFixed(2)}
                  </span>
=======
                  <span className="stock-info-value">Rs.{Number(productDetails?.fixedPrice ?? product?.fixedPrice ?? 0).toFixed(2)}</span>
>>>>>>> master
                </div>
              </div>
            </div>
          </div>

<<<<<<< HEAD
          

          {/* Stock Entries Table - Always show this section */}
         {/* Stock Entries Table */}
<div className="stock-entries-section">
  <h3 className="section-title">Stock Entries (FIFO Order)</h3>
  
  
  {loading ? (
    <div className="stock-loading">
      <div className="loading-spinner"></div>
      <span>Loading stock entries...</span>
    </div>
  ) : stockEntries.length > 0 ? (
    <div>
   
      <div className="stock-entries-table-wrapper">
        <table className="stock-entries-table">
          <thead>
            <tr>
              <th>Date Added</th>
              <th>Batch</th>
              <th>Original Qty</th>
              <th>Remaining Qty</th>
              <th>Purchase Price</th>
              <th>Total Value</th>
              <th>Expiry Date</th>
              <th>Supplier</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stockEntries.map((entry, index) => {
              console.log('Rendering entry:', entry);
              const remaining = entry.remainingQuantity || entry.quantity || 0;
              const total = remaining * (entry.purchasePrice || 0);
              
              return (
                <tr key={entry.id || index} className={`stock-entry-row ${remaining <= 0 ? 'depleted' : ''}`}>
                  <td>{formatDate(entry.dateAdded || entry.createdAt)}</td>
                  <td>{entry.batchNumber || '-'}</td>
                  <td>{entry.quantity || 0}</td>
                  <td className="remaining-qty">
                    <span className="qty-value">{remaining}</span>
                    {remaining <= 0 && (
                      <span className="depleted-badge">DEPLETED</span>
                    )}
                  </td>
                  <td>Rs.{parseFloat(entry.purchasePrice || 0).toFixed(2)}</td>
                  <td className="total-value">Rs.{total.toFixed(2)}</td>
                  <td>
                    {entry.expiryDate ? (
                      <span className={`expiry-date ${
                        new Date(entry.expiryDate) < new Date() ? 'expired' : 
                        new Date(entry.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'expiring-soon' : ''
                      }`}>
                        {new Date(entry.expiryDate).toLocaleDateString()}
                      </span>
                    ) : '-'}
                  </td>
                  <td>{entry.supplier || '-'}</td>
                  <td>
                    <span className={`stock-entry-status available`}>
                      Available
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  ) : (
    <div>
      
      <div className="stock-empty-state">
        <div className="empty-icon">📦</div>
        <h4>No Stock Entries Found</h4>
        <p>No stock entries found for this product.</p>
        <p>Click "Add Stock Entry" to begin tracking FIFO stock.</p>
      </div>
    </div>
  )}
</div>
=======
          {/* Stock Entries Table */}
          <div className="stock-entries-section">
            <h3 className="section-title">Stock Entries (FIFO Order)</h3>

            {loading ? (
              <div className="stock-loading">
                <div className="loading-spinner"></div>
                <span>Loading stock entries...</span>
              </div>
            ) : stockEntries.length > 0 ? (
              <div className="stock-entries-table-wrapper">
                <table className="stock-entries-table">
                  <thead>
                    <tr>
                      <th>Date Added</th>
                      <th>Batch</th>
                      <th>Original Qty</th>
                      <th>Remaining Qty</th>
                      <th>Purchase Price</th>
                      <th>Total Value</th>
                      <th>Expiry Date</th>
                      <th>Supplier</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockEntries.map((entry, index) => {
                      const remaining = Number(entry.remaining) || 0;
                      const total = remaining * (Number(entry.purchasePrice) || 0);
                      const original = Number(entry.quantity) || 0;
                      return (
                        <tr key={entry.id || index} className={`stock-entry-row ${remaining <= 0 ? 'depleted' : ''}`}>
                          <td>{formatDate(entry.dateAdded)}</td>
                          <td>{entry.batchNumber || entry.batch || '-'}</td>
                          <td>{original}</td>
                          <td className="remaining-qty">
                            <span className="qty-value">{remaining}</span>
                            {remaining <= 0 && <span className="depleted-badge">DEPLETED</span>}
                            {remaining < original && remaining > 0 && <span className="partial-badge">PARTIAL</span>}
                          </td>
                          <td>Rs.{(Number(entry.purchasePrice) || 0).toFixed(2)}</td>
                          <td className="total-value">Rs.{total.toFixed(2)}</td>
                          <td>
                            {entry.expiryDate ? (
                              <span className={`expiry-date ${expiryClass(entry.expiryDate)}`}>
                                {new Date(entry.expiryDate).toLocaleDateString()}
                              </span>
                            ) : '-'}
                          </td>
                          <td>{entry.supplier || '-'}</td>
                          <td>
                            <span className={`stock-entry-status ${remaining <= 0 ? 'depleted' : 'available'}`}>
                              {remaining <= 0 ? 'Depleted' : 'Available'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="stock-empty-state">
                <div className="empty-icon">📦</div>
                <h4>No Stock Entries Found</h4>
                <p>No stock entries found for this product.</p>
                <p>Click "Add Stock Entry" to begin tracking FIFO stock.</p>
              </div>
            )}
          </div>
>>>>>>> master
        </div>
      </div>
    </div>
  );
};
export default ProductManagementPage;