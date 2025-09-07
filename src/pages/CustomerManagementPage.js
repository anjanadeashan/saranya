import React, { useState, useEffect } from 'react';

// Mock API service for demo - replace with your actual API
const api = {
  get: async (url) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Return mock data - replace this with your actual API call
    return {
      success: true,
      message: "Success",
      data: [
        {
          id: 1,
          name: "Acme Corporation",
          email: "contact@acme.com",
          phone: "+1 (555) 123-4567",
          address: "123 Business Ave, Suite 100",
          city: "New York",
          country: "USA",
          creditLimit: 50000,
          outstandingBalance: 12500,
          isActive: true
        },
        {
          id: 2,
          name: "TechStart Inc",
          email: "hello@techstart.com",
          phone: "+1 (555) 987-6543",
          address: "456 Innovation Drive",
          city: "San Francisco",
          country: "USA",
          creditLimit: 25000,
          outstandingBalance: 22000,
          isActive: true
        },
        {
          id: 3,
          name: "Global Enterprises",
          email: "info@global.com",
          phone: "+1 (555) 456-7890",
          address: "789 Corporate Blvd",
          city: "Chicago",
          country: "USA",
          creditLimit: 75000,
          outstandingBalance: 5000,
          isActive: false
        }
      ]
    };
  },
  post: async (url, data) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: { ...data, id: Date.now() } };
  },
  put: async (url, data) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data };
  },
  delete: async (url) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: {} };
  }
};

const CustomerManagementPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/customers');
      console.log('API Response:', response);
      
      // Handle different response structures
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
      
      // Normalize data structure to handle both customer and supplier data
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
        uniqueSupplierCode: item.uniqueSupplierCode,
        contactPerson: item.contactPerson
      }));
      
      console.log('Normalized Data:', normalizedData);
      setCustomers(normalizedData);
      
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers');
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
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer');
      }
    }
  };

  const handleSave = async (customerData) => {
    try {
      if (selectedCustomer) {
        await api.put(`/customers/${selectedCustomer.id}`, customerData);
      } else {
        await api.post('/customers', customerData);
      }
      setShowModal(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer');
    }
  };

  const getStatusStyle = (isActive) => {
    if (isActive) {
      return {
        color: '#059669',
        background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(5, 150, 105, 0.2))',
        border: '1px solid rgba(5, 150, 105, 0.3)'
      };
    } else {
      return {
        color: '#dc2626',
        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(220, 38, 38, 0.2))',
        border: '1px solid rgba(220, 38, 38, 0.3)'
      };
    }
  };

  const getCreditStyle = (outstandingBalance, creditLimit) => {
    if (!outstandingBalance || !creditLimit) {
      return { color: '#6b7280' };
    }
    const percentage = (outstandingBalance / creditLimit) * 100;
    if (percentage >= 90) {
      return { color: '#dc2626', fontWeight: '600' };
    }
    if (percentage >= 70) {
      return { color: '#f59e0b', fontWeight: '600' };
    }
    return { color: '#059669', fontWeight: '600' };
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '40px 60px',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid #ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <div style={{
            fontSize: '18px',
            color: '#ffffff',
            fontWeight: '500'
          }}>Loading customers...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '40px 60px',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            color: '#fee2e2',
            fontSize: '18px',
            marginBottom: '20px',
            fontWeight: '500'
          }}>{error}</div>
          <button 
            onClick={fetchCustomers}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '40px 20px'
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        animation: 'fadeIn 0.8s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#ffffff',
            margin: '0',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Customer Management
          </h1>
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setShowModal(true);
            }}
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{fontSize: '18px'}}>+</span>
            Add New Customer
          </button>
        </div>

        {/* Search */}
        <div style={{
          marginBottom: '40px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '8px'
          }}>
            <input
              type="text"
              placeholder="🔍 Search by name, email, phone, code, or contact person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: 'none',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '16px',
                fontWeight: '500',
                color: '#1f2937',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
              }}
            />
          </div>
        </div>

        {/* Debug Info */}
        <div style={{
          marginBottom: '20px',
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '14px'
        }}>
          Found {filteredCustomers.length} customers | Total: {customers.length}
        </div>

        {/* Customers Table */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}>
                  {['Customer', 'Contact', 'Location', 'Credit Info', 'Status', 'Actions'].map((header, index) => (
                    <th key={index} style={{
                      padding: '20px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer, index) => (
                    <tr key={customer.id || customer.email || index} style={{
                      background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      transition: 'all 0.3s ease'
                    }}>
                      <td style={{
                        padding: '24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#ffffff',
                            marginBottom: '4px'
                          }}>
                            {customer.name}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}>
                            {customer.email}
                          </div>
                          {customer.uniqueSupplierCode && (
                            <div style={{
                              fontSize: '12px',
                              color: 'rgba(255, 255, 255, 0.6)',
                              marginTop: '2px'
                            }}>
                              Code: {customer.uniqueSupplierCode}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{
                        padding: '24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#ffffff',
                          fontWeight: '500',
                          marginBottom: '4px'
                        }}>
                          {customer.phone || 'N/A'}
                        </div>
                        {customer.contactPerson && (
                          <div style={{
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}>
                            Contact: {customer.contactPerson}
                          </div>
                        )}
                      </td>
                      <td style={{
                        padding: '24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#ffffff',
                          fontWeight: '500',
                          marginBottom: '4px'
                        }}>
                          {customer.city && customer.country ? `${customer.city}, ${customer.country}` : 'N/A'}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}>
                          {customer.address || 'No address'}
                        </div>
                      </td>
                      <td style={{
                        padding: '24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#ffffff',
                          fontWeight: '500',
                          marginBottom: '4px'
                        }}>
                          Limit: ${customer.creditLimit?.toLocaleString() || '0'}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          ...getCreditStyle(customer.outstandingBalance, customer.creditLimit)
                        }}>
                          Outstanding: ${customer.outstandingBalance?.toLocaleString() || '0'}
                        </div>
                      </td>
                      <td style={{
                        padding: '24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          borderRadius: '20px',
                          ...getStatusStyle(customer.isActive)
                        }}>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{
                        padding: '24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <div style={{display: 'flex', gap: '12px'}}>
                          <button
                            onClick={() => handleEdit(customer)}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{
                      padding: '60px 24px',
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
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
          />
        )}
      </div>
    </div>
  );
};

// Customer Modal Component
const CustomerModal = ({ customer, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    country: customer?.country || '',
    creditLimit: customer?.creditLimit || '',
    outstandingBalance: customer?.outstandingBalance || 0,
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
    <div style={{
      position: 'fixed',
      inset: '0',
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000',
      padding: '20px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 50px 100px rgba(0, 0, 0, 0.3)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          marginBottom: '30px',
          color: '#1f2937',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {customer ? '✏️ Edit Customer' : '➕ Add New Customer'}
        </h2>
        
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#374151'
            }}>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid rgba(107, 114, 128, 0.2)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#1f2937',
                background: '#ffffff',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              required
            />
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>📧 Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(107, 114, 128, 0.2)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1f2937',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>📞 Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(107, 114, 128, 0.2)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1f2937',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>🏷️ Supplier Code</label>
              <input
                type="text"
                value={formData.uniqueSupplierCode}
                onChange={(e) => handleChange('uniqueSupplierCode', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(107, 114, 128, 0.2)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1f2937',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>👤 Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(107, 114, 128, 0.2)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1f2937',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#374151'
            }}>🏠 Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid rgba(107, 114, 128, 0.2)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#1f2937',
                background: '#ffffff',
                transition: 'all 0.3s ease',
                outline: 'none',
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              rows="2"
            />
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>🏙️ City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(107, 114, 128, 0.2)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1f2937',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>🌍 Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(107, 114, 128, 0.2)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1f2937',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>💳 Credit Limit</label>
              <input
                type="number"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) => handleChange('creditLimit', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(107, 114, 128, 0.2)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1f2937',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>💰 Outstanding Balance</label>
              <input
                type="number"
                step="0.01"
                value={formData.outstandingBalance}
                onChange={(e) => handleChange('outstandingBalance', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid rgba(107, 114, 128, 0.2)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1f2937',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}>
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: '#667eea',
                cursor: 'pointer'
              }}
            />
            <label htmlFor="isActive" style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              cursor: 'pointer'
            }}>
              ✅ Active Customer
            </label>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(107, 114, 128, 0.1)'
          }}>
            <button
              type="submit"
              style={{
                flex: '1',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
              }}
            >
              {customer ? '💾 Update Customer' : '✨ Create Customer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: '1',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 25px rgba(107, 114, 128, 0.3)'
              }}
            >
              ❌ Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerManagementPage;