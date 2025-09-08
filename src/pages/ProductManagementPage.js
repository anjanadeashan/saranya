import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

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

  const getStockStatusColors = (status) => {
    switch (status) {
      case 'out-of-stock': 
        return {
          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
          color: '#dc2626',
          border: '1px solid #fecaca'
        };
      case 'low-stock': 
        return {
          background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
          color: '#d97706',
          border: '1px solid #fed7aa'
        };
      case 'in-stock': 
        return {
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          color: '#16a34a',
          border: '1px solid #bbf7d0'
        };
      default: 
        return {
          background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
          color: '#6b7280',
          border: '1px solid #d1d5db'
        };
    }
  };

  const premiumStyles = {
    container: {
      padding: '32px',
      background: 'transparent',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
      padding: '0 8px',
    },
    
    title: {
      fontSize: '2.75rem',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      margin: 0,
      letterSpacing: '-0.02em',
    },
    
    addButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: '16px',
      padding: '16px 32px',
      color: 'white',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
      position: 'relative',
      overflow: 'hidden',
    },
    
    searchContainer: {
      marginBottom: '32px',
      position: 'relative',
    },
    
    searchInput: {
      width: '100%',
      padding: '20px 24px',
      fontSize: '16px',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '20px',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      outline: 'none',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    },
    
    tableContainer: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(20px)',
    },
    
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    
    tableHeader: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      borderBottom: '2px solid rgba(0, 0, 0, 0.05)',
    },
    
    headerCell: {
      padding: '20px 24px',
      textAlign: 'left',
      fontSize: '13px',
      fontWeight: '700',
      color: '#475569',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    },
    
    tableRow: {
      borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    },
    
    tableCell: {
      padding: '20px 24px',
      verticalAlign: 'middle',
    },
    
    productInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    
    productName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1e293b',
      lineHeight: '1.5',
    },
    
    productDescription: {
      fontSize: '14px',
      color: '#64748b',
      lineHeight: '1.4',
    },
    
    productCode: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#475569',
      fontFamily: 'Monaco, Consolas, monospace',
      background: 'rgba(0, 0, 0, 0.05)',
      padding: '4px 8px',
      borderRadius: '6px',
      display: 'inline-block',
    },
    
    price: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#059669',
    },
    
    stock: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1e293b',
    },
    
    statusBadge: {
      padding: '8px 16px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'capitalize',
      display: 'inline-block',
      letterSpacing: '0.05em',
    },
    
    actionButton: {
      background: 'none',
      border: 'none',
      color: '#6366f1',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      padding: '8px 16px',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      marginRight: '8px',
    },
    
    deleteButton: {
      background: 'none',
      border: 'none',
      color: '#dc2626',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      padding: '8px 16px',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
    },
    
    emptyState: {
      textAlign: 'center',
      padding: '64px 32px',
      color: '#64748b',
      fontSize: '16px',
      fontStyle: 'italic',
    },
    
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '24px',
    },
    
    loadingSpinner: {
      width: '64px',
      height: '64px',
      border: '4px solid rgba(102, 126, 234, 0.2)',
      borderTop: '4px solid #667eea',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    
    loadingText: {
      fontSize: '18px',
      fontWeight: '500',
      color: '#64748b',
    },
    
    errorContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '24px',
    },
    
    errorText: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#dc2626',
      textAlign: 'center',
      maxWidth: '600px',
    },
    
    retryButton: {
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 24px',
      color: 'white',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
    },

    debugInfo: {
      marginBottom: '20px',
      padding: '15px',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
    },
  };

  // Add animations
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .product-row:hover {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.03)) !important;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }
      
      .add-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
      }
      
      .search-input:focus {
        border-color: #667eea !important;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1) !important;
      }
      
      .action-button:hover {
        background: rgba(99, 102, 241, 0.1) !important;
        color: #4f46e5 !important;
      }
      
      .delete-button:hover {
        background: rgba(220, 38, 38, 0.1) !important;
        color: #b91c1c !important;
      }
    `;
    
    if (!document.head.querySelector('#product-management-styles')) {
      styleElement.id = 'product-management-styles';
      document.head.appendChild(styleElement);
    }

    return () => {
      const existingStyles = document.head.querySelector('#product-management-styles');
      if (existingStyles) {
        existingStyles.remove();
      }
    };
  }, []);

  if (loading) {
    return (
      <div style={premiumStyles.container}>
        <div style={premiumStyles.loadingContainer}>
          <div style={premiumStyles.loadingSpinner}></div>
          <div style={premiumStyles.loadingText}>Loading products...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={premiumStyles.container}>
        <div style={premiumStyles.errorContainer}>
          <div style={premiumStyles.errorText}>{error}</div>
          <button
            style={premiumStyles.retryButton}
            onClick={() => fetchProducts()}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.3)';
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={premiumStyles.container}>
      {/* Debug info - remove in production */}
      <div style={premiumStyles.debugInfo}>
        <p><strong>Debug Information:</strong></p>
        <p>API Base URL: {api.defaults.baseURL || 'Not configured'}</p>
        <p>API Timeout: {api.defaults.timeout / 1000}s</p>
        <p>Products loaded: {products.length}</p>
        <p>Filtered products: {filteredProducts.length}</p>
        <p>Search term: "{searchTerm}"</p>
        {products.length > 0 && (
          <details style={{ marginTop: '10px' }}>
            <summary>First product data:</summary>
            <pre style={{ fontSize: '12px', marginTop: '5px', maxHeight: '200px', overflow: 'auto' }}>
              {JSON.stringify(products[0], null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* Header */}
      <div style={premiumStyles.header}>
        <h1 style={premiumStyles.title}>Product Management</h1>
        <button
          className="add-button"
          style={premiumStyles.addButton}
          onClick={() => {
            setSelectedProduct(null);
            setShowModal(true);
          }}
        >
          Add New Product
        </button>
      </div>

      {/* Search */}
      <div style={premiumStyles.searchContainer}>
        <input
          className="search-input"
          type="text"
          placeholder="Search products by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={premiumStyles.searchInput}
        />
      </div>

      {/* Products Table */}
      <div style={premiumStyles.tableContainer}>
        <table style={premiumStyles.table}>
          <thead style={premiumStyles.tableHeader}>
            <tr>
              <th style={premiumStyles.headerCell}>Product</th>
              <th style={premiumStyles.headerCell}>Code</th>
              <th style={premiumStyles.headerCell}>Price</th>
              <th style={premiumStyles.headerCell}>Stock</th>
              <th style={premiumStyles.headerCell}>Status</th>
              <th style={premiumStyles.headerCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const status = getStockStatus(product);
                const statusColors = getStockStatusColors(status);
                
                return (
                  <tr 
                    key={product.id || product.code} 
                    className="product-row"
                    style={premiumStyles.tableRow}
                  >
                    <td style={premiumStyles.tableCell}>
                      <div style={premiumStyles.productInfo}>
                        <div style={premiumStyles.productName}>
                          {product.name || 'N/A'}
                        </div>
                        <div style={premiumStyles.productDescription}>
                          {product.description || 'No description'}
                        </div>
                      </div>
                    </td>
                    <td style={premiumStyles.tableCell}>
                      <span style={premiumStyles.productCode}>
                        {product.code || 'N/A'}
                      </span>
                    </td>
                    <td style={premiumStyles.tableCell}>
                      <span style={premiumStyles.price}>
                        Rs.{product.fixedPrice || 0}
                      </span>
                    </td>
                    <td style={premiumStyles.tableCell}>
                      <span style={premiumStyles.stock}>
                        {product.currentStock || 0}
                      </span>
                    </td>
                    <td style={premiumStyles.tableCell}>
                      <span 
                        style={{
                          ...premiumStyles.statusBadge,
                          ...statusColors
                        }}
                      >
                        {status.replace('-', ' ')}
                      </span>
                    </td>
                    <td style={premiumStyles.tableCell}>
                      <button
                        className="action-button"
                        style={premiumStyles.actionButton}
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        style={premiumStyles.deleteButton}
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
                <td colSpan="6" style={premiumStyles.emptyState}>
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

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    
    modal: {
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '32px',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      position: 'relative',
    },
    
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '24px',
      textAlign: 'center',
    },
    
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      letterSpacing: '0.025em',
    },
    
    input: {
      padding: '16px',
      fontSize: '16px',
      border: '2px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      outline: 'none',
      transition: 'all 0.3s ease',
      background: 'rgba(255, 255, 255, 0.8)',
    },
    
    inputError: {
      borderColor: '#dc2626',
      background: 'rgba(239, 68, 68, 0.05)',
    },
    
    textarea: {
      padding: '16px',
      fontSize: '16px',
      border: '2px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      outline: 'none',
      transition: 'all 0.3s ease',
      background: 'rgba(255, 255, 255, 0.8)',
      minHeight: '80px',
      resize: 'vertical',
    },
    
    errorText: {
      fontSize: '12px',
      color: '#dc2626',
      marginTop: '4px',
    },
    
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
    },
    
    saveButton: {
      flex: 1,
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      border: 'none',
      borderRadius: '12px',
      padding: '16px',
      color: 'white',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    
    saveButtonDisabled: {
      background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
      cursor: 'not-allowed',
      boxShadow: '0 4px 15px rgba(156, 163, 175, 0.3)',
    },
    
    cancelButton: {
      flex: 1,
      background: 'rgba(107, 114, 128, 0.1)',
      border: '2px solid rgba(107, 114, 128, 0.2)',
      borderRadius: '12px',
      padding: '16px',
      color: '#6b7280',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    
    loadingSpinner: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: '2px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
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

  // Add focus styles
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .modal-input:focus {
        border-color: #667eea !important;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1) !important;
      }
      
      .save-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4) !important;
      }
      
      .cancel-button:hover {
        background: rgba(107, 114, 128, 0.15) !important;
        border-color: rgba(107, 114, 128, 0.3) !important;
      }
    `;
    
    if (!document.head.querySelector('#product-modal-styles')) {
      styleElement.id = 'product-modal-styles';
      document.head.appendChild(styleElement);
    }

    return () => {
      const existingStyles = document.head.querySelector('#product-modal-styles');
      if (existingStyles) {
        existingStyles.remove();
      }
    };
  }, []);

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={modalStyles.title}>
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>
        
        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.inputGroup}>
            <label style={modalStyles.label}>Product Name *</label>
            <input
              className="modal-input"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              style={{
                ...modalStyles.input,
                ...(validationErrors.name ? modalStyles.inputError : {})
              }}
              required
              placeholder="Enter product name"
              disabled={saving}
            />
            {validationErrors.name && (
              <span style={modalStyles.errorText}>{validationErrors.name}</span>
            )}
          </div>

          <div style={modalStyles.inputGroup}>
            <label style={modalStyles.label}>Product Code *</label>
            <input
              className="modal-input"
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              style={{
                ...modalStyles.input,
                ...(validationErrors.code ? modalStyles.inputError : {})
              }}
              required
              placeholder="Enter product code"
              disabled={saving}
            />
            {validationErrors.code && (
              <span style={modalStyles.errorText}>{validationErrors.code}</span>
            )}
          </div>

          <div style={modalStyles.inputGroup}>
            <label style={modalStyles.label}>Description</label>
            <textarea
              className="modal-input"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              style={modalStyles.textarea}
              placeholder="Enter product description"
              disabled={saving}
            />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Price (Rs) *</label>
              <input
                className="modal-input"
                type="number"
                step="0.01"
                min="0"
                value={formData.fixedPrice}
                onChange={(e) => handleInputChange('fixedPrice', e.target.value)}
                style={{
                  ...modalStyles.input,
                  ...(validationErrors.fixedPrice ? modalStyles.inputError : {})
                }}
                required
                placeholder="0.00"
                disabled={saving}
              />
              {validationErrors.fixedPrice && (
                <span style={modalStyles.errorText}>{validationErrors.fixedPrice}</span>
              )}
            </div>

            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Current Stock *</label>
              <input
                className="modal-input"
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) => handleInputChange('currentStock', e.target.value)}
                style={{
                  ...modalStyles.input,
                  ...(validationErrors.currentStock ? modalStyles.inputError : {})
                }}
                required
                placeholder="0"
                disabled={saving}
              />
              {validationErrors.currentStock && (
                <span style={modalStyles.errorText}>{validationErrors.currentStock}</span>
              )}
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Low Stock Threshold</label>
              <input
                className="modal-input"
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)}
                style={modalStyles.input}
                placeholder="10"
                disabled={saving}
              />
            </div>

            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Discount (%)</label>
              <input
                className="modal-input"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount}
                onChange={(e) => handleInputChange('discount', e.target.value)}
                style={modalStyles.input}
                placeholder="0.00"
                disabled={saving}
              />
            </div>
          </div>

          <div style={modalStyles.buttonGroup}>
            <button
              type="submit"
              className="save-button"
              style={{
                ...modalStyles.saveButton,
                ...(saving ? modalStyles.saveButtonDisabled : {})
              }}
              disabled={saving}
            >
              {saving && <div style={modalStyles.loadingSpinner}></div>}
              {saving 
                ? (product ? 'Updating...' : 'Creating...') 
                : (product ? 'Update Product' : 'Create Product')
              }
            </button>
            <button
              type="button"
              className="cancel-button"
              style={modalStyles.cancelButton}
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