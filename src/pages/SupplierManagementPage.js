import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './SupplierManagement.css'; // Import the CSS file

const SupplierManagementPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('testing');

  // Currency formatting function
  const formatCurrency = (amount) => {
    return `Rs. ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)}`;
  };

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

  // Test connection function
  const testConnection = async () => {
    try {
      const response = await api.get('/suppliers', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  };

  React.useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchSuppliers();
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

  if (loading) {
    return (
      <div className="supplier-management-container">
        <div className="supplier-loading-container">
          <div className="supplier-loading-spinner"></div>
          <div className="supplier-loading-text">Loading suppliers...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="supplier-management-container">
        <div className="supplier-error-container">
          <div className="supplier-error-text">{error}</div>
          <button
            className="supplier-retry-button"
            onClick={() => fetchSuppliers()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="supplier-management-container">
      {/* Connection Status */}
      <div className={`supplier-connection-status ${
        connectionStatus === 'connected' ? 'supplier-status-connected' : 'supplier-status-disconnected'
      }`}>
        {connectionStatus === 'connected' ? '🟢 Connected to server' : 
         connectionStatus === 'disconnected' ? '🔴 Server connection failed' : 
         '🟡 Testing connection...'}
      </div>

      {/* Header */}
      <div className="supplier-management-header">
        <h1 className="supplier-management-title">Supplier Management</h1>
        <button
          className="supplier-add-button"
          onClick={() => {
            setSelectedSupplier(null);
            setShowModal(true);
          }}
        >
          Add New Supplier
        </button>
      </div>

      {/* Search */}
      <div className="supplier-search-container">
        <input
          type="text"
          placeholder="Search suppliers by name, code, or contact person..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="supplier-search-input"
        />
      </div>

      {/* Suppliers Table */}
      <div className="supplier-table-container">
        <table className="supplier-table">
          <thead className="supplier-table-header">
            <tr>
              <th className="supplier-header-cell">Supplier</th>
              <th className="supplier-header-cell">Code</th>
              <th className="supplier-header-cell">Contact</th>
              <th className="supplier-header-cell">Location</th>
              <th className="supplier-header-cell">Status</th>
              <th className="supplier-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => {
                return (
                  <tr 
                    key={supplier.id || supplier.uniqueSupplierCode} 
                    className="supplier-table-row"
                  >
                    <td className="supplier-table-cell">
                      <div className="supplier-info">
                        <div className="supplier-name">
                          {supplier.name || 'N/A'}
                        </div>
                        <div className="supplier-email">
                          {supplier.email || 'No email'}
                        </div>
                        {/* Display credit limit or outstanding amount if available */}
                        {supplier.creditLimit && (
                          <div className="supplier-credit-info">
                            Credit Limit: {formatCurrency(supplier.creditLimit)}
                          </div>
                        )}
                        {supplier.outstandingAmount && (
                          <div className="supplier-outstanding-info">
                            Outstanding: {formatCurrency(supplier.outstandingAmount)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="supplier-table-cell">
                      <span className="supplier-code">
                        {supplier.uniqueSupplierCode || 'N/A'}
                      </span>
                    </td>
                    <td className="supplier-table-cell">
                      <div className="supplier-contact-info">
                        <div className="supplier-contact-name">
                          {supplier.contactPerson || 'N/A'}
                        </div>
                        <div className="supplier-contact-phone">
                          {supplier.phone || 'No phone'}
                        </div>
                      </div>
                    </td>
                    <td className="supplier-table-cell">
                      <div className="supplier-location-info">
                        <div className="supplier-location-city">
                          {(supplier.city && supplier.country) 
                            ? `${supplier.city}, ${supplier.country}`
                            : (supplier.city || supplier.country || 'N/A')}
                        </div>
                        <div className="supplier-location-address">
                          {supplier.address || 'No address'}
                        </div>
                      </div>
                    </td>
                    <td className="supplier-table-cell">
                      <span className={`supplier-status-badge ${
                        supplier.isActive ? 'supplier-status-active' : 'supplier-status-inactive'
                      }`}>
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="supplier-table-cell">
                      <button
                        className="supplier-action-button"
                        onClick={() => handleEdit(supplier)}
                      >
                        Edit
                      </button>
                      <button
                        className="supplier-delete-button"
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
                <td colSpan="6" className="supplier-empty-state">
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
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

// Enhanced Supplier Modal Component with loading state
const SupplierModal = ({ supplier, onSave, onClose, saving, formatCurrency }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    uniqueSupplierCode: supplier?.uniqueSupplierCode || '',
    contactPerson: supplier?.contactPerson || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    city: supplier?.city || '',
    country: supplier?.country || '',
    creditLimit: supplier?.creditLimit || '',
    paymentTerms: supplier?.paymentTerms || '',
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

    if (formData.creditLimit && isNaN(parseFloat(formData.creditLimit))) {
      errors.creditLimit = 'Credit limit must be a valid number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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
      paymentTerms: formData.paymentTerms.trim(),
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
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

  return (
    <div className="supplier-modal-overlay" onClick={onClose}>
      <div className="supplier-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="supplier-modal-title">
          {supplier ? 'Edit Supplier' : 'Add New Supplier'}
        </h2>
        
        <form onSubmit={handleSubmit} className="supplier-modal-form">
          <div className="supplier-input-row">
            <div className="supplier-input-group">
              <label className="supplier-modal-label">Supplier Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`supplier-modal-input ${validationErrors.name ? 'supplier-input-error' : ''}`}
                required
                placeholder="Enter supplier name"
                disabled={saving}
              />
              {validationErrors.name && (
                <span className="supplier-error-text">{validationErrors.name}</span>
              )}
            </div>

            <div className="supplier-input-group">
              <label className="supplier-modal-label">Supplier Code *</label>
              <input
                type="text"
                value={formData.uniqueSupplierCode}
                onChange={(e) => handleChange('uniqueSupplierCode', e.target.value)}
                className={`supplier-modal-input ${validationErrors.uniqueSupplierCode ? 'supplier-input-error' : ''}`}
                required
                placeholder="SUP001"
                disabled={saving}
              />
              {validationErrors.uniqueSupplierCode && (
                <span className="supplier-error-text">{validationErrors.uniqueSupplierCode}</span>
              )}
            </div>
          </div>

          <div className="supplier-input-row">
            <div className="supplier-input-group">
              <label className="supplier-modal-label">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                className="supplier-modal-input"
                placeholder="Enter contact person"
                disabled={saving}
              />
            </div>

            <div className="supplier-input-group">
              <label className="supplier-modal-label">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="supplier-modal-input"
                placeholder="+1 (555) 123-4567"
                disabled={saving}
              />
            </div>
          </div>

          <div className="supplier-input-group">
            <label className="supplier-modal-label">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`supplier-modal-input ${validationErrors.email ? 'supplier-input-error' : ''}`}
              placeholder="supplier@company.com"
              disabled={saving}
            />
            {validationErrors.email && (
              <span className="supplier-error-text">{validationErrors.email}</span>
            )}
          </div>

          <div className="supplier-input-group">
            <label className="supplier-modal-label">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="supplier-modal-textarea"
              placeholder="Enter full address"
              disabled={saving}
            />
          </div>

          <div className="supplier-input-row">
            <div className="supplier-input-group">
              <label className="supplier-modal-label">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="supplier-modal-input"
                placeholder="Enter city"
                disabled={saving}
              />
            </div>

            <div className="supplier-input-group">
              <label className="supplier-modal-label">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="supplier-modal-input"
                placeholder="Enter country"
                disabled={saving}
              />
            </div>
          </div>

          <div className="supplier-input-row">
            <div className="supplier-input-group">
              <label className="supplier-modal-label">Credit Limit (Rs.)</label>
              <input
                type="number"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) => handleChange('creditLimit', e.target.value)}
                className={`supplier-modal-input ${validationErrors.creditLimit ? 'supplier-input-error' : ''}`}
                placeholder="0.00"
                disabled={saving}
              />
              {validationErrors.creditLimit && (
                <span className="supplier-error-text">{validationErrors.creditLimit}</span>
              )}
              {formData.creditLimit && (
                <div className="supplier-currency-preview">
                  Preview: {formatCurrency(formData.creditLimit)}
                </div>
              )}
            </div>

            <div className="supplier-input-group">
              <label className="supplier-modal-label">Payment Terms</label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => handleChange('paymentTerms', e.target.value)}
                className="supplier-modal-input"
                placeholder="Net 30 days"
                disabled={saving}
              />
            </div>
          </div>

          <div className="supplier-checkbox-group">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="supplier-checkbox"
              disabled={saving}
            />
            <label className="supplier-checkbox-label">
              Active Supplier
            </label>
          </div>

          <div className="supplier-modal-button-group">
            <button
              type="submit"
              className="supplier-modal-save-button"
              disabled={saving}
            >
              {saving && <div className="supplier-modal-loading-spinner"></div>}
              {saving 
                ? (supplier ? 'Updating...' : 'Creating...') 
                : (supplier ? 'Update Supplier' : 'Create Supplier')
              }
            </button>
            <button
              type="button"
              className="supplier-modal-cancel-button"
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