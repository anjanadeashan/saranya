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
      
      if (selectedProduct) {
        console.log('Updating product with ID:', selectedProduct.id);
        await api.put(`/products/${selectedProduct.id}`, productData, {
          timeout: 20000, // 20 seconds timeout for save
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        console.log('Creating new product');
        await api.post('/products', productData, {
          timeout: 20000, // 20 seconds timeout for save
          headers: {
            'Content-Type': 'application/json'
          }
        });
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
      
      let errorMessage = 'Failed to save product';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Save request timeout - The server is taking too long to respond. Please check your internet connection and try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - Cannot connect to server. Please check if the server is running.';
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
    if (product.currentStock <= 0) return 'out-of-stock';
    if (product.currentStock <= product.lowStockThreshold) return 'low-stock';
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
              <th className="product-header-cell">Price</th>
              <th className="product-header-cell">Stock</th>
              <th className="product-header-cell">Status</th>
              <th className="product-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const status = getStockStatus(product);
                
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
                        Rs.{product.fixedPrice || 0}
                      </span>
                    </td>
                    <td className="product-table-cell">
                      <span className="product-stock">
                        {product.currentStock || 0}
                      </span>
                    </td>
                    <td className="product-table-cell">
                      <span className={`product-status-badge status-${status}`}>
                        {status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="product-table-cell">
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
    </div>
  );
};

// Enhanced Product Modal Component with loading state
const ProductModal = ({ product, onSave, onClose, saving }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    code: product?.code || '',
    description: product?.description || '',
    fixedPrice: product?.fixedPrice || '',
    currentStock: product?.currentStock || '',
    lowStockThreshold: product?.lowStockThreshold || '',
    discount: product?.discount || 0,
    isActive: product?.isActive ?? true
  });

  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!formData.code.trim()) {
      errors.code = 'Product code is required';
    }
    
    if (!formData.fixedPrice || parseFloat(formData.fixedPrice) < 0) {
      errors.fixedPrice = 'Valid price is required';
    }
    
    if (!formData.currentStock || parseInt(formData.currentStock) < 0) {
      errors.currentStock = 'Valid stock quantity is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Clean and convert the data before sending
    const cleanedData = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      description: formData.description.trim(),
      fixedPrice: parseFloat(formData.fixedPrice) || 0,
      currentStock: parseInt(formData.currentStock) || 0,
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 0,
      discount: parseFloat(formData.discount) || 0,
      isActive: formData.isActive
    };
    
    console.log('Submitting form data:', cleanedData);
    onSave(cleanedData);
  };

  const handleInputChange = (field, value) => {
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
            />
          </div>

          <div className="product-input-group-grid">
            <div className="product-input-group">
              <label className="product-modal-label">Price (Rs) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
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
              <label className="product-modal-label">Current Stock *</label>
              <input
                type="number"
                min="0"
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
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)}
                className="product-modal-input"
                placeholder="10"
                disabled={saving}
              />
            </div>

            <div className="product-input-group">
              <label className="product-modal-label">Discount (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount}
                onChange={(e) => handleInputChange('discount', e.target.value)}
                className="product-modal-input"
                placeholder="0.00"
                disabled={saving}
              />
            </div>
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

export default ProductManagementPage;