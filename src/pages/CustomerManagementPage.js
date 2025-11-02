import React, { useState, useEffect } from 'react';
import './CustomerManagement.css'


// API configuration - update these values for your backend
const API_BASE_URL = 'http://localhost:8080/api'; // Update this to your backend URL

// Authentication helper functions (same as in Dashboard)
const authUtils = {
  getToken: () => {
    // Try multiple storage locations for the token
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
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() > exp;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }
};

// API service to connect with your Spring Boot backend
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
    
    // Safely parse JSON (handle empty responses)
    if (response.status === 204) return null;
    return await response.json();
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
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (response.status === 401) {
      authUtils.removeToken();
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    if (response.status === 204) return null;
    return await response.json();
  },
  
  put: async (url, data) => {
    const token = authUtils.getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }
    
    if (authUtils.isTokenExpired(token)) {
      authUtils.removeToken();
      throw new Error('Authentication token has expired. Please log in again.');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    
    if (response.status === 401) {
      authUtils.removeToken();
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) return null;
    return await response.json();
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
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 401) {
      authUtils.removeToken();
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) return null;
    return await response.json();
  },
  
  // Add login method for consistency
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

const CustomerManagementPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Currency formatting function
  const formatCurrency = (amount) => {
    return `Rs. ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)}`;
  };

  useEffect(() => {
    // Load customers from backend (no authentication required)
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call your backend API endpoint
      const response = await api.get('/customers');
      console.log('API Response:', response);
      
      // Handle the ApiResponse structure from your backend
      let customersData = [];
      
      if (response && response.success && Array.isArray(response.data)) {
        customersData = response.data;
      } else if (response && Array.isArray(response.data)) {
        customersData = response.data;
      } else if (response && Array.isArray(response)) {
        customersData = response;
      } else {
        console.warn('Unexpected response structure:', response);
        customersData = [];
      }
      
      // Map backend response to frontend structure
      const normalizedData = customersData.map(item => ({
        id: item.id,
        name: item.name || item.companyName || 'Unknown',
        email: item.email || item.contactEmail || '',
        phone: item.phone || item.contactPhone || item.phoneNumber || '',
        address: item.address || '',
        city: item.city || '',
        country: item.country || '',
        creditLimit: item.creditLimit || 0,
        outstandingBalance: item.outstandingBalance || 0,
        isActive: item.isActive !== undefined ? item.isActive : item.status === 'active' || true,
        // Additional fields that might come from backend
        uniqueSupplierCode: item.uniqueSupplierCode || item.customerCode,
        contactPerson: item.contactPerson
      }));
      
      console.log('Normalized Data:', normalizedData);
      setCustomers(normalizedData);
      
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError(`Failed to load customers: ${error.message}`);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = Array.isArray(customers) 
    ? customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        customer.uniqueSupplierCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        fetchCustomers(); // Refresh the list
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert(`Failed to delete customer: ${error.message}`);
      }
    }
  };

  const handleSave = async (customerData) => {
    try {
      // Transform frontend data to match backend DTO structure
      const backendData = {
        name: customerData.name,
        email: customerData.email || null,
        phone: customerData.phone || null,
        address: customerData.address || null,
        city: customerData.city || null,
        country: customerData.country || null,
        creditLimit: customerData.creditLimit ? parseFloat(customerData.creditLimit) : 0,
        outstandingBalance: customerData.outstandingBalance ? parseFloat(customerData.outstandingBalance) : 0,
        isActive: customerData.isActive,
        // Map additional fields if your backend supports them
        uniqueSupplierCode: customerData.uniqueSupplierCode || null,
        contactPerson: customerData.contactPerson || null
      };

      if (selectedCustomer) {
        // Update existing customer
        await api.put(`/customers/${selectedCustomer.id}`, backendData);
      } else {
        // Create new customer
        await api.post('/customers', backendData);
      }
      
      setShowModal(false);
      setSelectedCustomer(null);
      fetchCustomers(); // Refresh the list
    } catch (error) {
      console.error('Error saving customer:', error);
      alert(`Failed to save customer: ${error.message}`);
    }
  };

  const getCreditStatusClass = (outstandingBalance, creditLimit) => {
    if (!outstandingBalance || !creditLimit) {
      return 'credit-default';
    }
    const percentage = (outstandingBalance / creditLimit) * 100;
    if (percentage >= 90) {
      return 'credit-danger';
    }
    if (percentage >= 70) {
      return 'credit-warning';
    }
    return 'credit-normal';
  };

  if (loading) {
    return (
      <div className="customer-loading-container">
        <div className="customer-loading-card">
          <div className="customer-loading-spinner"></div>
          <div className="customer-loading-text">Loading customers...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-error-container">
        <div className="customer-error-card">
          <div className="customer-error-text">{error}</div>
          <button 
            onClick={fetchCustomers}
            className="customer-retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-management-container">
      <div className="customer-content-wrapper">
        {/* Header */}
        <div className="customer-management-header">
          <h1 className="customer-management-title">
            Customer Management
          </h1>
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setShowModal(true);
            }}
            className="customer-add-button"
          >
            <span className="customer-add-icon">+</span>
            Add New Customer
          </button>
        </div>

        {/* Search */}
        <div className="customer-search-container">
          <div className="customer-search-wrapper">
            <input
              type="text"
              placeholder="🔍 Search by name, email, phone, code, or contact person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="customer-search-input"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="customer-table-container">
          <div className="customer-table-wrapper">
            <table className="customer-table">
              <thead className="customer-table-header">
                <tr>
                  {['Customer', 'Contact', 'Location', 'Credit Info', 'Status', 'Actions'].map((header, index) => (
                    <th key={index} className="customer-header-cell">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer, index) => (
                    <tr key={customer.id || customer.email || index} className="customer-table-row">
                      <td className="customer-table-cell">
                        <div className="customer-info">
                          <div className="customer-name">
                            {customer.name}
                          </div>
                          <div className="customer-email">
                            {customer.email}
                          </div>
                          {customer.uniqueSupplierCode && (
                            <div className="customer-code">
                              Code: {customer.uniqueSupplierCode}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="customer-table-cell">
                        <div className="customer-contact">
                          {customer.phone || 'N/A'}
                        </div>
                        {customer.contactPerson && (
                          <div className="customer-contact-person">
                            Contact: {customer.contactPerson}
                          </div>
                        )}
                      </td>
                      <td className="customer-table-cell">
                        <div className="customer-location">
                          {(() => {
                            const locationParts = [customer.city, customer.country].filter(Boolean);
                            return locationParts.length > 0 ? locationParts.join(', ') : 'N/A';
                          })()}
                        </div>
                        <div className="customer-address">
                          {customer.address || 'No address'}
                        </div>
                      </td>
                      <td className="customer-table-cell">
                        <div className="customer-credit-limit">
                          Limit: {formatCurrency(customer.creditLimit)}
                        </div>
                        <div className={`customer-outstanding ${getCreditStatusClass(customer.outstandingBalance, customer.creditLimit)}`}>
                          Outstanding: {formatCurrency(customer.outstandingBalance)}
                        </div>
                      </td>
                      <td className="customer-table-cell">
                        <span className={`customer-status-badge ${
                          customer.isActive ? 'customer-status-active' : 'customer-status-inactive'
                        }`}>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="customer-table-cell">
                        <div className="customer-actions">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="customer-edit-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="customer-delete-button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="customer-empty-state">
                      {searchTerm ? '🔍 No customers found matching your search.' : '📋 No customers available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Modal */}
        {showModal && (
          <CustomerModal
            customer={selectedCustomer}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setSelectedCustomer(null);
            }}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </div>
  );
};

// Customer Modal Component
const CustomerModal = ({ customer, onSave, onClose, formatCurrency }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    country: customer?.country || '',
    creditLimit: customer?.creditLimit || '',
    // use empty string so the controlled number input stays consistent with other fields
    outstandingBalance: customer?.outstandingBalance ?? '',
    isActive: customer?.isActive ?? true,
    uniqueSupplierCode: customer?.uniqueSupplierCode || '',
    contactPerson: customer?.contactPerson || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="customer-modal-overlay">
      <div className="customer-modal">
        <h2 className="customer-modal-title">
          {customer ? 'Edit Customer' : 'Add New Customer'}
        </h2>
        
        <form onSubmit={handleSubmit} className="customer-modal-form">
          <div className="customer-form-group">
            <label className="customer-form-label required">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="customer-form-input"
              required
            />
          </div>
          
          <div className="customer-form-row">
            <div className="customer-form-group">
              <label className="customer-form-label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="customer-form-input"
              />
            </div>
            
            <div className="customer-form-group">
              <label className="customer-form-label">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="customer-form-input"
              />
            </div>
          </div>

          <div className="customer-form-row">
            <div className="customer-form-group">
              <label className="customer-form-label">Customer Code</label>
              <input
                type="text"
                value={formData.uniqueSupplierCode}
                onChange={(e) => handleChange('uniqueSupplierCode', e.target.value)}
                className="customer-form-input"
              />
            </div>
            
            <div className="customer-form-group">
              <label className="customer-form-label">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                className="customer-form-input"
              />
            </div>
          </div>
          
          <div className="customer-form-group">
            <label className="customer-form-label">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="customer-form-textarea"
              rows="2"
            />
          </div>
          
          <div className="customer-form-row">
            <div className="customer-form-group">
              <label className="customer-form-label">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="customer-form-input"
              />
            </div>
            
            <div className="customer-form-group">
              <label className="customer-form-label">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="customer-form-input"
              />
            </div>
          </div>
          
          <div className="customer-form-row">
            <div className="customer-form-group">
              <label className="customer-form-label">Credit Limit (Rs.)</label>
              <input
                type="number"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) => handleChange('creditLimit', e.target.value)}
                className="customer-form-input"
                placeholder="0.00"
              />
              {formData.creditLimit && (
                <div className="customer-currency-preview">
                  Preview: {formatCurrency(formData.creditLimit)}
                </div>
              )}
            </div>
            
            <div className="customer-form-group">
              <label className="customer-form-label">Outstanding Balance (Rs.)</label>
              <input
                type="number"
                step="0.01"
                value={formData.outstandingBalance}
                onChange={(e) => handleChange('outstandingBalance', e.target.value)}
                className="customer-form-input"
                placeholder="0.00"
              />
              {formData.outstandingBalance && (
                <div className="customer-currency-preview">
                  Preview: {formatCurrency(formData.outstandingBalance)}
                </div>
              )}
            </div>
          </div>
          
          <div className="customer-checkbox-group">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="customer-checkbox"
            />
            <label htmlFor="isActive" className="customer-checkbox-label">
              Active Customer
            </label>
          </div>
          
          <div className="customer-modal-buttons">
            <button
              type="submit"
              className="customer-modal-submit-button"
            >
              {customer ? 'Update Customer' : 'Create Customer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="customer-modal-cancel-button"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerManagementPage;