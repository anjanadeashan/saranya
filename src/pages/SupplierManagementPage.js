import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SupplierManagementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

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

  const fetchSuppliers = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/suppliers', {
        timeout: 30000 // 30 seconds timeout
      });
      
      console.log('Full API response:', response);
      console.log('Response data:', response.data);
      
      // Handle the ApiResponse structure from backend
      let suppliersData = [];
      if (response.data && response.data.data) {
        // If wrapped in ApiResponse
        suppliersData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        // If direct array
        suppliersData = response.data;
      } else {
        console.warn('Unexpected response structure:', response.data);
        suppliersData = [];
      }
      
      console.log('Processed suppliers data:', suppliersData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      
      let errorMessage = 'Failed to load suppliers';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - Server is taking too long to respond';
        // Auto retry on timeout (max 2 retries)
        if (retryCount < 2) {
          console.log(`Retrying request... Attempt ${retryCount + 1}`);
          setTimeout(() => fetchSuppliers(retryCount + 1), 2000);
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
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = Array.isArray(suppliers) 
    ? suppliers.filter(supplier => {
        if (!supplier) return false;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          (supplier.name && supplier.name.toLowerCase().includes(searchLower)) ||
          (supplier.uniqueSupplierCode && supplier.uniqueSupplierCode.toLowerCase().includes(searchLower)) ||
          (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchLower))
        );
      })
    : [];

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await api.delete(`/suppliers/${id}`, {
          timeout: 15000 // 15 seconds timeout for delete
        });
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        
        let errorMessage = 'Failed to delete supplier';
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Delete request timeout - Please try again';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        alert(errorMessage);
      }
    }
  };

  const handleSave = async (supplierData) => {
    setSaving(true);
    try {
      console.log('Saving supplier data:', supplierData);
      
      let response;
      if (selectedSupplier) {
        console.log('Updating supplier with ID:', selectedSupplier.id);
        response = await api.put(`/suppliers/${selectedSupplier.id}`, supplierData, {
          timeout: 20000, // 20 seconds timeout for save
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        console.log('Creating new supplier');
        response = await api.post('/suppliers', supplierData, {
          timeout: 20000, // 20 seconds timeout for save
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      console.log('Save response:', response);
      
      // Success - close modal and refresh data
      setShowModal(false);
      setSelectedSupplier(null);
      await fetchSuppliers();
      
      // Show success message
      const message = selectedSupplier ? 'Supplier updated successfully!' : 'Supplier created successfully!';
      alert(message);
      
    } catch (error) {
      console.error('Error saving supplier:', error);
      
      let errorMessage = 'Failed to save supplier';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Save request timeout - The server is taking too long to respond. Please check your internet connection and try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - Cannot connect to server. Please check if the server is running.';
      } else if (error.response?.status === 400) {
        errorMessage = `Validation error: ${error.response.data?.message || 'Invalid data provided'}`;
      } else if (error.response?.status === 409) {
        errorMessage = 'Supplier code already exists. Please use a different code.';
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

  const getStatusColors = (isActive) => {
    return isActive ? {
      background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
      color: '#15803d',
      border: '1px solid #86efac'
    } : {
      background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
      color: '#dc2626',
      border: '1px solid #fca5a5'
    };
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
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      margin: 0,
      letterSpacing: '-0.02em',
    },
    
    addButton: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      border: 'none',
      borderRadius: '16px',
      padding: '16px 32px',
      color: 'white',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
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
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      borderBottom: '2px solid rgba(0, 0, 0, 0.05)',
    },
    
    headerCell: {
      padding: '20px 24px',
      textAlign: 'left',
      fontSize: '13px',
      fontWeight: '700',
      color: '#166534',
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
    
    supplierInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    
    supplierName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1e293b',
      lineHeight: '1.5',
    },
    
    supplierEmail: {
      fontSize: '14px',
      color: '#64748b',
      lineHeight: '1.4',
    },
    
    supplierCode: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#475569',
      fontFamily: 'Monaco, Consolas, monospace',
      background: 'rgba(16, 185, 129, 0.1)',
      padding: '4px 8px',
      borderRadius: '6px',
      display: 'inline-block',
    },
    
    contactInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    
    contactName: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e293b',
    },
    
    contactPhone: {
      fontSize: '13px',
      color: '#64748b',
      fontFamily: 'Monaco, Consolas, monospace',
    },
    
    locationInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    
    locationCity: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#1e293b',
    },
    
    locationAddress: {
      fontSize: '13px',
      color: '#64748b',
      lineHeight: '1.4',
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
      color: '#10b981',
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
      border: '4px solid rgba(16, 185, 129, 0.2)',
      borderTop: '4px solid #10b981',
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

    connectionStatus: {
      marginBottom: '20px',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
    },

    statusConnected: {
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #bbf7d0',
    },

    statusDisconnected: {
      background: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca',
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
      
      .supplier-row:hover {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.03)) !important;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }
      
      .add-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
      }
      
      .search-input:focus {
        border-color: #10b981 !important;
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important;
      }
      
      .action-button:hover {
        background: rgba(16, 185, 129, 0.1) !important;
        color: #059669 !important;
      }
      
      .delete-button:hover {
        background: rgba(220, 38, 38, 0.1) !important;
        color: #b91c1c !important;
      }
    `;
    
    if (!document.head.querySelector('#supplier-management-styles')) {
      styleElement.id = 'supplier-management-styles';
      document.head.appendChild(styleElement);
    }

    return () => {
      const existingStyles = document.head.querySelector('#supplier-management-styles');
      if (existingStyles) {
        existingStyles.remove();
      }
    };
  }, []);

  // Test connection function
  const testConnection = async () => {
    try {
      const response = await api.get('/suppliers', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  };

  const [connectionStatus, setConnectionStatus] = useState('testing');

  React.useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={premiumStyles.container}>
        <div style={premiumStyles.loadingContainer}>
          <div style={premiumStyles.loadingSpinner}></div>
          <div style={premiumStyles.loadingText}>Loading suppliers...</div>
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
            onClick={() => fetchSuppliers()}
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
      {/* Connection Status */}
      <div style={{
        ...premiumStyles.connectionStatus,
        ...(connectionStatus === 'connected' ? premiumStyles.statusConnected : premiumStyles.statusDisconnected)
      }}>
        {connectionStatus === 'connected' ? '🟢 Connected to server' : 
         connectionStatus === 'disconnected' ? '🔴 Server connection failed' : 
         '🟡 Testing connection...'}
      </div>

      {/* Debug info - remove in production */}
      <div style={premiumStyles.debugInfo}>
        <p><strong>Debug Information:</strong></p>
        <p>API Base URL: {api.defaults.baseURL || 'Not configured'}</p>
        <p>API Timeout: {api.defaults.timeout / 1000}s</p>
        <p>Suppliers loaded: {suppliers.length}</p>
        <p>Filtered suppliers: {filteredSuppliers.length}</p>
        <p>Search term: "{searchTerm}"</p>
        <p>Connection Status: {connectionStatus}</p>
        {suppliers.length > 0 && (
          <details style={{ marginTop: '10px' }}>
            <summary>First supplier data:</summary>
            <pre style={{ fontSize: '12px', marginTop: '5px', maxHeight: '200px', overflow: 'auto' }}>
              {JSON.stringify(suppliers[0], null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* Header */}
      <div style={premiumStyles.header}>
        <h1 style={premiumStyles.title}>Supplier Management</h1>
        <button
          className="add-button"
          style={premiumStyles.addButton}
          onClick={() => {
            setSelectedSupplier(null);
            setShowModal(true);
          }}
        >
          Add New Supplier
        </button>
      </div>

      {/* Search */}
      <div style={premiumStyles.searchContainer}>
        <input
          className="search-input"
          type="text"
          placeholder="Search suppliers by name, code, or contact person..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={premiumStyles.searchInput}
        />
      </div>

      {/* Suppliers Table */}
      <div style={premiumStyles.tableContainer}>
        <table style={premiumStyles.table}>
          <thead style={premiumStyles.tableHeader}>
            <tr>
              <th style={premiumStyles.headerCell}>Supplier</th>
              <th style={premiumStyles.headerCell}>Code</th>
              <th style={premiumStyles.headerCell}>Contact</th>
              <th style={premiumStyles.headerCell}>Location</th>
              <th style={premiumStyles.headerCell}>Status</th>
              <th style={premiumStyles.headerCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => {
                const statusColors = getStatusColors(supplier.isActive);
                
                return (
                  <tr 
                    key={supplier.id || supplier.uniqueSupplierCode} 
                    className="supplier-row"
                    style={premiumStyles.tableRow}
                  >
                    <td style={premiumStyles.tableCell}>
                      <div style={premiumStyles.supplierInfo}>
                        <div style={premiumStyles.supplierName}>
                          {supplier.name || 'N/A'}
                        </div>
                        <div style={premiumStyles.supplierEmail}>
                          {supplier.email || 'No email'}
                        </div>
                      </div>
                    </td>
                    <td style={premiumStyles.tableCell}>
                      <span style={premiumStyles.supplierCode}>
                        {supplier.uniqueSupplierCode || 'N/A'}
                      </span>
                    </td>
                    <td style={premiumStyles.tableCell}>
                      <div style={premiumStyles.contactInfo}>
                        <div style={premiumStyles.contactName}>
                          {supplier.contactPerson || 'N/A'}
                        </div>
                        <div style={premiumStyles.contactPhone}>
                          {supplier.phone || 'No phone'}
                        </div>
                      </div>
                    </td>
                    <td style={premiumStyles.tableCell}>
                      <div style={premiumStyles.locationInfo}>
                        <div style={premiumStyles.locationCity}>
                          {(supplier.city && supplier.country) 
                            ? `${supplier.city}, ${supplier.country}`
                            : (supplier.city || supplier.country || 'N/A')}
                        </div>
                        <div style={premiumStyles.locationAddress}>
                          {supplier.address || 'No address'}
                        </div>
                      </div>
                    </td>
                    <td style={premiumStyles.tableCell}>
                      <span 
                        style={{
                          ...premiumStyles.statusBadge,
                          ...statusColors
                        }}
                      >
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={premiumStyles.tableCell}>
                      <button
                        className="action-button"
                        style={premiumStyles.actionButton}
                        onClick={() => handleEdit(supplier)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        style={premiumStyles.deleteButton}
                        onClick={() => handleDelete(supplier.id)}
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
                    ? 'No suppliers found matching your search.' 
                    : 'No suppliers available. Click "Add New Supplier" to get started.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Supplier Modal */}
      {showModal && (
        <SupplierModal
          supplier={selectedSupplier}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setSelectedSupplier(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
};

// Enhanced Supplier Modal Component with loading state
const SupplierModal = ({ supplier, onSave, onClose, saving }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    uniqueSupplierCode: supplier?.uniqueSupplierCode || '',
    contactPerson: supplier?.contactPerson || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    city: supplier?.city || '',
    country: supplier?.country || '',
    isActive: supplier?.isActive ?? true
  });

  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Supplier name is required';
    }
    
    if (!formData.uniqueSupplierCode.trim()) {
      errors.uniqueSupplierCode = 'Supplier code is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
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
      maxWidth: '600px',
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
    
    inputRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
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
    
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      background: 'rgba(16, 185, 129, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(16, 185, 129, 0.2)',
    },
    
    checkbox: {
      width: '20px',
      height: '20px',
      accentColor: '#10b981',
    },
    
    checkboxLabel: {
      fontSize: '16px',
      fontWeight: '500',
      color: '#1e293b',
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
    
    // Clean the data before sending
    const cleanedData = {
      ...formData,
      name: formData.name.trim(),
      uniqueSupplierCode: formData.uniqueSupplierCode.trim(),
      contactPerson: formData.contactPerson.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      country: formData.country.trim(),
    };
    
    console.log('Submitting form data:', cleanedData);
    onSave(cleanedData);
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

  // Add focus styles
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .modal-input:focus {
        border-color: #10b981 !important;
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important;
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
    
    if (!document.head.querySelector('#supplier-modal-styles')) {
      styleElement.id = 'supplier-modal-styles';
      document.head.appendChild(styleElement);
    }

    return () => {
      const existingStyles = document.head.querySelector('#supplier-modal-styles');
      if (existingStyles) {
        existingStyles.remove();
      }
    };
  }, []);

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={modalStyles.title}>
          {supplier ? 'Edit Supplier' : 'Add New Supplier'}
        </h2>
        
        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.inputRow}>
            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Supplier Name *</label>
              <input
                className="modal-input"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                style={{
                  ...modalStyles.input,
                  ...(validationErrors.name ? modalStyles.inputError : {})
                }}
                required
                placeholder="Enter supplier name"
                disabled={saving}
              />
              {validationErrors.name && (
                <span style={modalStyles.errorText}>{validationErrors.name}</span>
              )}
            </div>

            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Supplier Code *</label>
              <input
                className="modal-input"
                type="text"
                value={formData.uniqueSupplierCode}
                onChange={(e) => handleChange('uniqueSupplierCode', e.target.value)}
                style={{
                  ...modalStyles.input,
                  ...(validationErrors.uniqueSupplierCode ? modalStyles.inputError : {})
                }}
                required
                placeholder="SUP001"
                disabled={saving}
              />
              {validationErrors.uniqueSupplierCode && (
                <span style={modalStyles.errorText}>{validationErrors.uniqueSupplierCode}</span>
              )}
            </div>
          </div>

          <div style={modalStyles.inputRow}>
            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Contact Person</label>
              <input
                className="modal-input"
                type="text"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                style={modalStyles.input}
                placeholder="Enter contact person"
                disabled={saving}
              />
            </div>

            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Phone Number</label>
              <input
                className="modal-input"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                style={modalStyles.input}
                placeholder="+1 (555) 123-4567"
                disabled={saving}
              />
            </div>
          </div>

          <div style={modalStyles.inputGroup}>
            <label style={modalStyles.label}>Email Address</label>
            <input
              className="modal-input"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              style={{
                ...modalStyles.input,
                ...(validationErrors.email ? modalStyles.inputError : {})
              }}
              placeholder="supplier@company.com"
              disabled={saving}
            />
            {validationErrors.email && (
              <span style={modalStyles.errorText}>{validationErrors.email}</span>
            )}
          </div>

          <div style={modalStyles.inputGroup}>
            <label style={modalStyles.label}>Address</label>
            <textarea
              className="modal-input"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              style={modalStyles.textarea}
              placeholder="Enter full address"
              disabled={saving}
            />
          </div>

          <div style={modalStyles.inputRow}>
            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>City</label>
              <input
                className="modal-input"
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                style={modalStyles.input}
                placeholder="Enter city"
                disabled={saving}
              />
            </div>

            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Country</label>
              <input
                className="modal-input"
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                style={modalStyles.input}
                placeholder="Enter country"
                disabled={saving}
              />
            </div>
          </div>

          <div style={modalStyles.checkboxGroup}>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              style={modalStyles.checkbox}
              disabled={saving}
            />
            <label style={modalStyles.checkboxLabel}>
              Active Supplier
            </label>
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
                ? (supplier ? 'Updating...' : 'Creating...') 
                : (supplier ? 'Update Supplier' : 'Create Supplier')
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

export default SupplierManagementPage;