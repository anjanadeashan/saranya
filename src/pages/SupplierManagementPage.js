import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './SupplierManagement.css';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const SupplierManagementPage = () => {
  // State variables
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('testing');

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  // Currency formatting function
  const formatCurrency = (amount) => {
    return `Rs. ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)}`;
  };

  // Enhanced supplier data extraction function
  const extractSuppliersFromResponse = (responseData) => {
    console.log('Extracting suppliers from response data:', responseData);
    
    if (!responseData) {
      console.log('No response data provided');
      return [];
    }

    let suppliersArray = [];

    // Case 1: Direct array response
    if (Array.isArray(responseData)) {
      suppliersArray = responseData;
      console.log('Case 1: Direct array response with', suppliersArray.length, 'items');
    }
    // Case 2: Response with 'data' property (common in Spring Boot with wrapper classes)
    else if (responseData.data && Array.isArray(responseData.data)) {
      suppliersArray = responseData.data;
      console.log('Case 2: Found suppliers in data property with', suppliersArray.length, 'items');
    }
    // Case 3: Response with 'content' property (Spring Boot paginated response)
    else if (responseData.content && Array.isArray(responseData.content)) {
      suppliersArray = responseData.content;
      console.log('Case 3: Found suppliers in content property with', suppliersArray.length, 'items');
    }
    // Case 4: Response with 'result' property
    else if (responseData.result && Array.isArray(responseData.result)) {
      suppliersArray = responseData.result;
      console.log('Case 4: Found suppliers in result property with', suppliersArray.length, 'items');
    }
    // Case 5: Response with 'items' property
    else if (responseData.items && Array.isArray(responseData.items)) {
      suppliersArray = responseData.items;
      console.log('Case 5: Found suppliers in items property with', suppliersArray.length, 'items');
    }
    // Case 6: Single supplier object (convert to array)
    else if (responseData.id && responseData.name) {
      suppliersArray = [responseData];
      console.log('Case 6: Single supplier object converted to array');
    }
    // Case 7: Search for any array property in the response
    else if (typeof responseData === 'object') {
      const keys = Object.keys(responseData);
      console.log('Case 7: Searching through object keys:', keys);
      
      for (const key of keys) {
        if (Array.isArray(responseData[key]) && responseData[key].length > 0) {
          // Check if the first item looks like a supplier object
          const firstItem = responseData[key][0];
          if (firstItem && (firstItem.id || firstItem.name || firstItem.uniqueSupplierCode)) {
            suppliersArray = responseData[key];
            console.log(`Case 7: Found suppliers in '${key}' property with`, suppliersArray.length, 'items');
            break;
          }
        }
      }
    }

    console.log('Final extracted suppliers array:', suppliersArray);
    return suppliersArray || [];
  };

  // Test connection function
  const testConnection = async () => {
    try {
      const response = await api.get('/suppliers', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  };

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================
  
  const fetchSuppliers = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('--- FETCHING SUPPLIERS ---');
      console.log('Attempt:', retryCount + 1);
      console.log('API Base URL:', api.defaults.baseURL);
      
      const response = await api.get('/suppliers', {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('--- API RESPONSE ANALYSIS ---');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Response Headers:', response.headers);
      console.log('Raw Response Data:', response.data);
      console.log('Response Data Type:', typeof response.data);
      console.log('Is Response Data Array?', Array.isArray(response.data));
      
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        console.log('Response Data Keys:', Object.keys(response.data));
        console.log('Full Response Structure:', JSON.stringify(response.data, null, 2));
      }

      // Extract suppliers using our enhanced function
      const suppliersData = extractSuppliersFromResponse(response.data);
      
      console.log('--- SUPPLIERS EXTRACTION RESULT ---');
      console.log('Extracted suppliers count:', suppliersData.length);
      
      if (suppliersData.length === 0) {
        console.error('ERROR: No suppliers extracted from response!');
        console.error('This could mean:');
        console.error('1. API returned empty data');
        console.error('2. Response structure is not recognized');
        console.error('3. Suppliers are nested in an unexpected property');
        console.error('Raw response for investigation:', response.data);
        
        setSuppliers([]);
        setError('No suppliers found in response. Please check server logs.');
        return;
      }

      // Log each supplier for verification
      console.log('--- INDIVIDUAL SUPPLIERS ---');
      suppliersData.forEach((supplier, index) => {
        console.log(`Supplier ${index + 1}:`, {
          id: supplier.id,
          name: supplier.name,
          code: supplier.uniqueSupplierCode,
          isActive: supplier.isActive,
          email: supplier.email,
          phone: supplier.phone,
          hasRequiredFields: !!(supplier.id && supplier.name)
        });
      });

      // Validate suppliers have required fields
      const validSuppliers = suppliersData.filter(supplier => {
        const isValid = supplier && 
                       supplier.id && 
                       supplier.name && 
                       supplier.name.trim() !== '';
        
        if (!isValid) {
          console.warn('Invalid supplier filtered out:', supplier);
          console.warn('Reason: Missing id or name');
        }
        
        return isValid;
      });

      console.log('--- VALIDATION RESULT ---');
      console.log('Original count:', suppliersData.length);
      console.log('Valid count after filtering:', validSuppliers.length);
      
      if (validSuppliers.length !== suppliersData.length) {
        console.warn('Some suppliers were filtered out due to missing required fields');
        const invalidSuppliers = suppliersData.filter(s => !validSuppliers.includes(s));
        console.warn('Invalid suppliers:', invalidSuppliers);
      }

      setSuppliers(validSuppliers);
      
      if (validSuppliers.length === 0) {
        setError('No valid suppliers found. Suppliers may be missing required fields (id, name).');
      }

      console.log('--- SUCCESS ---');
      console.log('Successfully loaded', validSuppliers.length, 'suppliers');
      
    } catch (error) {
      console.error('--- FETCH ERROR ---');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Code:', error.code);
      console.error('Full Error:', error);
      
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', error.response.data);
        console.error('Response Headers:', error.response.headers);
      }
      
      let errorMessage = 'Failed to load suppliers';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - Server is taking too long to respond';
        if (retryCount < 2) {
          console.log(`Retrying request... Attempt ${retryCount + 1}`);
          setTimeout(() => fetchSuppliers(retryCount + 1), 2000);
          return;
        }
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - Cannot connect to server. Please check if the server is running.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Suppliers endpoint not found (404). Please check the API URL.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error (500). Please check server logs.';
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

  const handleSave = async (supplierData) => {
    setSaving(true);
    try {
      console.log('--- SAVING SUPPLIER ---');
      console.log('Supplier Data:', JSON.stringify(supplierData, null, 2));
      console.log('Is Update?', !!selectedSupplier);
      console.log('Selected Supplier ID:', selectedSupplier?.id);
      
      // Validate required fields
      if (!supplierData.name || !supplierData.name.trim()) {
        throw new Error('Supplier name is required');
      }
      if (!supplierData.uniqueSupplierCode || !supplierData.uniqueSupplierCode.trim()) {
        throw new Error('Supplier code is required');
      }

      // Prepare the payload
      const payload = {
        name: supplierData.name.trim(),
        uniqueSupplierCode: supplierData.uniqueSupplierCode.trim(),
        contactPerson: supplierData.contactPerson?.trim() || null,
        email: supplierData.email?.trim() || null,
        phone: supplierData.phone?.trim() || null,
        address: supplierData.address?.trim() || null,
        city: supplierData.city?.trim() || null,
        country: supplierData.country?.trim() || null,
        paymentTerms: supplierData.paymentTerms?.trim() || null,
        creditLimit: supplierData.creditLimit ? parseFloat(supplierData.creditLimit) : null,
        isActive: Boolean(supplierData.isActive)
      };

      console.log('Final Payload:', JSON.stringify(payload, null, 2));
      
      let response;
      const config = {
        timeout: 20000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (selectedSupplier) {
        console.log('Updating supplier with ID:', selectedSupplier.id);
        response = await api.put(`/suppliers/${selectedSupplier.id}`, payload, config);
      } else {
        console.log('Creating new supplier');
        response = await api.post('/suppliers', payload, config);
      }
      
      console.log('Save Response:', response);
      
      // Success - close modal and refresh data
      setShowModal(false);
      setSelectedSupplier(null);
      await fetchSuppliers(); // Refresh the suppliers list
      
      const message = selectedSupplier ? 'Supplier updated successfully!' : 'Supplier created successfully!';
      alert(message);
      
    } catch (error) {
      console.error('--- SAVE ERROR ---');
      console.error('Full Error:', error);
      
      let errorMessage = 'Failed to save supplier';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Save request timeout - Please try again';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - Cannot connect to server';
      } else if (error.response?.status === 400) {
        const responseData = error.response.data;
        if (responseData?.message) {
          errorMessage = `Validation error: ${responseData.message}`;
        } else {
          errorMessage = 'Invalid data provided. Please check all fields.';
        }
      } else if (error.response?.status === 409) {
        errorMessage = 'Supplier code already exists. Please use a different code.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Supplier not found';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error - Please try again later';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        console.log('Deleting supplier with ID:', id);
        await api.delete(`/suppliers/${id}`, {
          timeout: 15000
        });
        console.log('Supplier deleted successfully');
        await fetchSuppliers(); // Refresh the list
        alert('Supplier deleted successfully!');
      } catch (error) {
        console.error('Error deleting supplier:', error);
        
        let errorMessage = 'Failed to delete supplier';
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Delete request timeout - Please try again';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 404) {
          errorMessage = 'Supplier not found';
        } else if (error.response?.status >= 500) {
          errorMessage = 'Server error - Please try again later';
        }
        
        alert(errorMessage);
      }
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  const handleEdit = (supplier) => {
    console.log('Editing supplier:', supplier);
    setSelectedSupplier(supplier);
    setShowModal(true);
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  // Enhanced filtering - shows all suppliers and searches across multiple fields
  const filteredSuppliers = Array.isArray(suppliers) 
    ? suppliers.filter(supplier => {
        if (!supplier) {
          return false;
        }
        
        // If no search term, show all suppliers
        if (!searchTerm || !searchTerm.trim()) {
          return true;
        }
        
        const searchLower = searchTerm.toLowerCase().trim();
        
        // Search across multiple fields
        const searchFields = [
          supplier.name,
          supplier.uniqueSupplierCode,
          supplier.contactPerson,
          supplier.email,
          supplier.phone,
          supplier.city,
          supplier.country,
          supplier.address
        ];
        
        return searchFields.some(field => 
          field && field.toString().toLowerCase().includes(searchLower)
        );
      })
    : [];

  // ============================================================================
  // EFFECTS
  // ============================================================================
  
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
          timeout: config.timeout,
          headers: config.headers
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
          data: response.data,
          headers: response.headers
        });
        return response;
      },
      (error) => {
        console.error('Response Error:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          config: {
            method: error.config?.method,
            url: error.config?.url,
            data: error.config?.data
          }
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

  // Connection status check
  React.useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // ============================================================================
  // RENDER CONDITIONS
  // ============================================================================
  
  if (loading) {
    return (
      <div className="supplier-management-container">
        <div className="supplier-loading-container">
          <div className="supplier-loading-spinner"></div>
          <div className="supplier-loading-text">Loading suppliers...</div>
          <div className="supplier-loading-subtext">Please wait while we fetch supplier data</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="supplier-management-container">
        <div className="supplier-error-container">
          <div className="supplier-error-icon">⚠️</div>
          <div className="supplier-error-title">Unable to Load Suppliers</div>
          <div className="supplier-error-text">{error}</div>
          <div className="supplier-error-actions">
            <button
              className="supplier-retry-button"
              onClick={() => fetchSuppliers()}
            >
              Retry Loading
            </button>
            <button
              className="supplier-debug-button"
              onClick={() => console.log('Current state:', { suppliers, error, connectionStatus })}
            >
              Show Debug Info
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  return (
    <div className="supplier-management-container">
      {/* Connection Status */}


      {/* Header */}
      <div className="supplier-management-header">
        <div className="supplier-header-left">
          <h1 className="supplier-management-title">Supplier Management</h1>

        </div>
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
        <div className="supplier-search-input-wrapper">
          <input
            type="text"
            placeholder="Search suppliers by name, code, contact, email, phone, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="supplier-search-input"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="supplier-clear-search"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

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
              <th className="supplier-header-cell">Financial</th>
              <th className="supplier-header-cell">Status</th>
              <th className="supplier-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier, index) => (
                <tr 
                  key={supplier.id || `supplier-${index}`} 
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
                    <div className="supplier-financial-info">
                      {supplier.creditLimit && (
                        <div className="supplier-credit-info">
                          Credit: {formatCurrency(supplier.creditLimit)}
                        </div>
                      )}
                      {supplier.paymentTerms && (
                        <div className="supplier-payment-terms">
                          Terms: {supplier.paymentTerms}
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
                    <span className={`supplier-status-badge ${
                      supplier.isActive ? 'supplier-status-active' : 'supplier-status-inactive'
                    }`}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="supplier-table-cell">
                    <div className="supplier-actions">
                      <button
                        className="supplier-action-button supplier-edit-button"
                        onClick={() => handleEdit(supplier)}
                        title="Edit supplier"
                      >
                        Edit
                      </button>
                      <button
                        className="supplier-action-button supplier-delete-button"
                        onClick={() => handleDelete(supplier.id)}
                        title="Delete supplier"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="supplier-empty-state">
                  <div className="supplier-empty-content">
                    {searchTerm ? (
                      <>
                        <div className="supplier-empty-title">No suppliers found</div>
                        <div className="supplier-empty-subtitle">
                          No suppliers match "{searchTerm}". Try adjusting your search terms.
                        </div>
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="supplier-clear-search-button"
                        >
                          Clear Search
                        </button>
                      </>
                    ) : suppliers.length === 0 ? (
                      <>
                        <div className="supplier-empty-title">No suppliers available</div>
                        <div className="supplier-empty-subtitle">
                          Get started by adding your first supplier.
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSupplier(null);
                            setShowModal(true);
                          }}
                          className="supplier-add-first-button"
                        >
                          Add First Supplier
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="supplier-empty-title">All suppliers filtered out</div>
                        <div className="supplier-empty-subtitle">
                          Try adjusting your search criteria.
                        </div>
                      </>
                    )}
                  </div>
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

// ============================================================================
// MODAL COMPONENT
// ============================================================================
const SupplierModal = ({ supplier, onSave, onClose, saving, formatCurrency }) => {
  // State
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

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    // Required field validation
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Supplier name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Supplier name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Supplier name cannot exceed 100 characters';
    }
    
    if (!formData.uniqueSupplierCode || !formData.uniqueSupplierCode.trim()) {
      errors.uniqueSupplierCode = 'Supplier code is required';
    } else if (formData.uniqueSupplierCode.trim().length < 2) {
      errors.uniqueSupplierCode = 'Supplier code must be at least 2 characters';
    } else if (formData.uniqueSupplierCode.trim().length > 20) {
      errors.uniqueSupplierCode = 'Supplier code cannot exceed 20 characters';
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.uniqueSupplierCode.trim())) {
      errors.uniqueSupplierCode = 'Supplier code can only contain letters, numbers, hyphens, and underscores';
    }
    
    // Email validation
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      } else if (formData.email.trim().length > 100) {
        errors.email = 'Email address cannot exceed 100 characters';
      }
    }

    // Phone validation
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    // Credit limit validation
    if (formData.creditLimit) {
      const creditLimit = parseFloat(formData.creditLimit);
      if (isNaN(creditLimit)) {
        errors.creditLimit = 'Credit limit must be a valid number';
      } else if (creditLimit < 0) {
        errors.creditLimit = 'Credit limit cannot be negative';
      } else if (creditLimit > 999999999.99) {
        errors.creditLimit = 'Credit limit is too large';
      }
    }

    // Contact person validation
    if (formData.contactPerson && formData.contactPerson.trim().length > 100) {
      errors.contactPerson = 'Contact person name cannot exceed 100 characters';
    }

    // Address validation
    if (formData.address && formData.address.trim().length > 500) {
      errors.address = 'Address cannot exceed 500 characters';
    }

    // City validation
    if (formData.city && formData.city.trim().length > 50) {
      errors.city = 'City name cannot exceed 50 characters';
    }

    // Country validation
    if (formData.country && formData.country.trim().length > 50) {
      errors.country = 'Country name cannot exceed 50 characters';
    }

    // Payment terms validation
    if (formData.paymentTerms && formData.paymentTerms.trim().length > 100) {
      errors.paymentTerms = 'Payment terms cannot exceed 100 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    if (!validateForm()) {
      console.log('Validation failed:', validationErrors);
      return;
    }
    
    // Clean the data before sending
    const cleanedData = {
      name: formData.name.trim(),
      uniqueSupplierCode: formData.uniqueSupplierCode.trim(),
      contactPerson: formData.contactPerson.trim() || null,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      country: formData.country.trim() || null,
      paymentTerms: formData.paymentTerms.trim() || null,
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
      isActive: Boolean(formData.isActive)
    };
    
    console.log('Submitting cleaned form data:', cleanedData);
    onSave(cleanedData);
  };

  // Input change handler
  const handleChange = (field, value) => {
    console.log(`Field ${field} changed to:`, value);
    
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

  // Modal render
  return (
    <div className="supplier-modal-overlay" onClick={onClose}>
      <div className="supplier-modal" onClick={(e) => e.stopPropagation()}>
        <div className="supplier-modal-header">
          <h2 className="supplier-modal-title">
            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>
          <button 
            className="supplier-modal-close-x"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>
        
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
                maxLength={100}
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
                maxLength={20}
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
                className={`supplier-modal-input ${validationErrors.contactPerson ? 'supplier-input-error' : ''}`}
                placeholder="Enter contact person"
                disabled={saving}
                maxLength={100}
              />
              {validationErrors.contactPerson && (
                <span className="supplier-error-text">{validationErrors.contactPerson}</span>
              )}
            </div>

            <div className="supplier-input-group">
              <label className="supplier-modal-label">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`supplier-modal-input ${validationErrors.phone ? 'supplier-input-error' : ''}`}
                placeholder="+94 11 123 4567"
                disabled={saving}
              />
              {validationErrors.phone && (
                <span className="supplier-error-text">{validationErrors.phone}</span>
              )}
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
              maxLength={100}
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
              className={`supplier-modal-textarea ${validationErrors.address ? 'supplier-input-error' : ''}`}
              placeholder="Enter full address"
              disabled={saving}
              maxLength={500}
              rows={3}
            />
            {validationErrors.address && (
              <span className="supplier-error-text">{validationErrors.address}</span>
            )}
          </div>

          <div className="supplier-input-row">
            <div className="supplier-input-group">
              <label className="supplier-modal-label">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className={`supplier-modal-input ${validationErrors.city ? 'supplier-input-error' : ''}`}
                placeholder="Enter city"
                disabled={saving}
                maxLength={50}
              />
              {validationErrors.city && (
                <span className="supplier-error-text">{validationErrors.city}</span>
              )}
            </div>

            <div className="supplier-input-group">
              <label className="supplier-modal-label">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className={`supplier-modal-input ${validationErrors.country ? 'supplier-input-error' : ''}`}
                placeholder="Enter country"
                disabled={saving}
                maxLength={50}
              />
              {validationErrors.country && (
                <span className="supplier-error-text">{validationErrors.country}</span>
              )}
            </div>
          </div>

          <div className="supplier-input-row">
            <div className="supplier-input-group">
              <label className="supplier-modal-label">Credit Limit (Rs.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="999999999.99"
                value={formData.creditLimit}
                onChange={(e) => handleChange('creditLimit', e.target.value)}
                className={`supplier-modal-input ${validationErrors.creditLimit ? 'supplier-input-error' : ''}`}
                placeholder="0.00"
                disabled={saving}
              />
              {validationErrors.creditLimit && (
                <span className="supplier-error-text">{validationErrors.creditLimit}</span>
              )}
              {formData.creditLimit && !validationErrors.creditLimit && (
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
                className={`supplier-modal-input ${validationErrors.paymentTerms ? 'supplier-input-error' : ''}`}
                placeholder="Net 30 days"
                disabled={saving}
                maxLength={100}
              />
              {validationErrors.paymentTerms && (
                <span className="supplier-error-text">{validationErrors.paymentTerms}</span>
              )}
            </div>
          </div>



          <div className="supplier-modal-button-group">
            <button
              type="button"
              className="supplier-modal-cancel-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierManagementPage;