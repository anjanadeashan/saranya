import React, { useState, useEffect } from 'react';

// API configuration
const API_BASE_URL = 'http://localhost:8080/api';

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

  const getMovementTypeStyle = (type) => {
    if (type === 'IN') {
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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}
        </style>
        <div style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '24px',
          padding: '50px 70px',
          textAlign: 'center',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '5px solid rgba(255, 255, 255, 0.3)',
            borderTop: '5px solid #ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 25px'
          }} />
          <div style={{
            fontSize: '20px',
            color: '#ffffff',
            fontWeight: '600',
            animation: 'pulse 2s ease-in-out infinite'
          }}>Loading inventory...</div>
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
        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '24px',
          padding: '50px 70px',
          textAlign: 'center',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>⚠️</div>
          <div style={{
            color: '#ffffff',
            fontSize: '20px',
            marginBottom: '25px',
            fontWeight: '600'
          }}>{error}</div>
          <button 
            onClick={fetchData}
            style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #ffffff, #f1f5f9)',
              color: '#ff6b35',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(255, 255, 255, 0.3)'
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
      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '40px 20px'
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}
      </style>
      
      <div style={{
        maxWidth: '1600px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              fontSize: '3rem',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '15px',
              backdropFilter: 'blur(10px)'
            }}>📦</div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: '#ffffff',
              margin: '0',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              background: 'linear-gradient(135deg, #ffffff, #f1f5f9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Inventory Management
            </h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              color: '#ff6b35',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span style={{fontSize: '20px'}}>➕</span>
            Add Movement
          </button>
        </div>

        {/* Debug Info */}
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          color: '#ffffff',
          fontSize: '14px',
          fontFamily: 'monospace'
        }}>
          <div><strong>Debug Info:</strong></div>
          <div>Inventory items count: {inventory.length}</div>
          <div>Filtered items count: {filteredInventory.length}</div>
          <div>Products count: {products.length}</div>
          <div>Suppliers count: {suppliers.length}</div>
          <div>Search term: "{searchTerm}"</div>
          <div>Filter type: {filterType}</div>
          <div>API Base URL: {API_BASE_URL}</div>
          {inventory.length > 0 && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer' }}>First inventory item structure</summary>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontSize: '12px',
                marginTop: '10px',
                background: 'rgba(0,0,0,0.2)',
                padding: '10px',
                borderRadius: '8px'
              }}>
                {JSON.stringify(inventory[0], null, 2)}
              </pre>
            </details>
          )}
          {products.length > 0 && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer' }}>First product structure</summary>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontSize: '12px',
                marginTop: '10px',
                background: 'rgba(0,0,0,0.2)',
                padding: '10px',
                borderRadius: '8px'
              }}>
                {JSON.stringify(products[0], null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Filters */}
        <div style={{
          marginBottom: '40px',
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          animation: 'slideIn 1s ease-out'
        }}>
          <div style={{
            flex: '1',
            minWidth: '300px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '18px',
            padding: '8px'
          }}>
            <input
              type="text"
              placeholder="Search by product, code, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '18px 24px',
                border: 'none',
                borderRadius: '14px',
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
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '18px',
            padding: '8px'
          }}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '18px 24px',
                border: 'none',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '16px',
                fontWeight: '500',
                color: '#1f2937',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              <option value="ALL">All Movements</option>
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.2)'
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
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  {['Date', 'Product', 'Type', 'Quantity', 'Reference', 'Supplier', 'Actions'].map((header, index) => (
                    <th key={index} style={{
                      padding: '24px 28px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item, index) => (
                    <tr key={item.id || index} style={{
                      background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                      transition: 'all 0.3s ease',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <td style={{
                        padding: '28px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{
                          fontSize: '15px',
                          color: '#ffffff',
                          fontWeight: '600'
                        }}>
                          {formatDate(item.date)}
                        </div>
                      </td>
                      <td style={{
                        padding: '28px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#ffffff',
                            marginBottom: '4px'
                          }}>
                            {item.product?.name || 'Unknown Product'}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontWeight: '500'
                          }}>
                            {item.product?.code || 'N/A'}
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
                            Product ID: {item.productId || item.product?.id || 'None'}
                          </div>
                        </div>
                      </td>
                      <td style={{
                        padding: '28px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '700',
                          borderRadius: '20px',
                          alignItems: 'center',
                          gap: '6px',
                          ...getMovementTypeStyle(item.movementType)
                        }}>
                          {item.movementType === 'IN' ? 'Stock In' : 'Stock Out'}
                        </span>
                      </td>
                      <td style={{
                        padding: '28px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{
                          fontSize: '16px',
                          color: '#ffffff',
                          fontWeight: '700',
                          background: 'rgba(255, 255, 255, 0.1)',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          display: 'inline-block'
                        }}>
                          {item.quantity?.toLocaleString() || '0'}
                        </div>
                      </td>
                      <td style={{
                        padding: '28px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{
                          fontSize: '15px',
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: '500',
                          fontFamily: 'Monaco, monospace'
                        }}>
                          {item.reference || 'N/A'}
                        </div>
                      </td>
                      <td style={{
                        padding: '28px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '15px',
                            color: '#ffffff',
                            fontWeight: '600'
                          }}>
                            {item.supplier?.name || 'N/A'}
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
                            Supplier ID: {item.supplierId || item.supplier?.id || 'None'}
                          </div>
                        </div>
                      </td>
                      <td style={{
                        padding: '28px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '700',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{
                      padding: '80px 28px',
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
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

  const getSelectedSupplier = () => {
    return suppliers.find(s => s.id === parseInt(formData.supplierId));
  };

  return (
    <div style={{
      position: 'fixed',
      inset: '0',
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000',
      padding: '20px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(25px)',
        border: '2px solid rgba(255, 107, 53, 0.3)',
        borderRadius: '28px',
        padding: '50px',
        width: '100%',
        maxWidth: '650px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 50px 100px rgba(255, 107, 53, 0.3)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '15px'
          }}>📦</div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#1f2937',
            background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0'
          }}>
            Add Inventory Movement
          </h2>
        </div>

        {/* Debug section for form data */}
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          background: '#f8fafc',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <strong>Form Debug Info:</strong>
          <div>Selected Product ID: {formData.productId}</div>
          <div>Selected Product: {getSelectedProduct()?.name || 'None'}</div>
          <div>Selected Supplier ID: {formData.supplierId}</div>
          <div>Selected Supplier: {getSelectedSupplier()?.name || 'None'}</div>
          <div>Available Products: {products.length}</div>
          <div>Available Suppliers: {suppliers.length}</div>
        </div>
        
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '28px'}}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: '700',
              marginBottom: '10px',
              color: '#374151'
            }}>Product *</label>
            <select
              value={formData.productId}
              onChange={(e) => handleChange('productId', e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: `2px solid ${validationErrors.productId ? '#dc2626' : 'rgba(255, 107, 53, 0.2)'}`,
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                background: '#ffffff',
                transition: 'all 0.3s ease',
                outline: 'none',
                cursor: 'pointer'
              }}
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
              <div style={{ color: '#dc2626', fontSize: '14px', marginTop: '5px' }}>
                {validationErrors.productId}
              </div>
            )}
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px'}}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '15px',
                fontWeight: '700',
                marginBottom: '10px',
                color: '#374151'
              }}>Movement Type *</label>
              <select
                value={formData.movementType}
                onChange={(e) => handleChange('movementType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid rgba(255, 107, 53, 0.2)',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                required
                disabled={saving}
              >
                <option value="IN">Stock In</option>
                <option value="OUT">Stock Out</option>
              </select>
              {formData.movementType === 'OUT' && getSelectedProduct() && (
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#856404'
                }}>
                  Warning: Current stock is {getSelectedProduct().currentStock || 0}. 
                  Ensure sufficient stock is available.
                </div>
              )}
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '15px',
                fontWeight: '700',
                marginBottom: '10px',
                color: '#374151'
              }}>Quantity *</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: `2px solid ${validationErrors.quantity ? '#dc2626' : 'rgba(255, 107, 53, 0.2)'}`,
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                required
                disabled={saving}
              />
              {validationErrors.quantity && (
                <div style={{ color: '#dc2626', fontSize: '14px', marginTop: '5px' }}>
                  {validationErrors.quantity}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: '700',
              marginBottom: '10px',
              color: '#374151'
            }}>Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: `2px solid ${validationErrors.date ? '#dc2626' : 'rgba(255, 107, 53, 0.2)'}`,
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                background: '#ffffff',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              required
              disabled={saving}
            />
            {validationErrors.date && (
              <div style={{ color: '#dc2626', fontSize: '14px', marginTop: '5px' }}>
                {validationErrors.date}
              </div>
            )}
          </div>
          
          {formData.movementType === 'IN' && (
            <div style={{
              background: 'rgba(255, 107, 53, 0.05)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 107, 53, 0.1)'
            }}>
              <label style={{
                display: 'block',
                fontSize: '15px',
                fontWeight: '700',
                marginBottom: '10px',
                color: '#374151'
              }}>Supplier *</label>
              <select
                value={formData.supplierId}
                onChange={(e) => handleChange('supplierId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: `2px solid ${validationErrors.supplierId ? '#dc2626' : 'rgba(255, 107, 53, 0.2)'}`,
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  cursor: 'pointer'
                }}
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
                <div style={{ color: '#dc2626', fontSize: '14px', marginTop: '5px' }}>
                  {validationErrors.supplierId}
                </div>
              )}
            </div>
          )}
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: '700',
              marginBottom: '10px',
              color: '#374151'
            }}>Reference</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => handleChange('reference', e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid rgba(255, 107, 53, 0.2)',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                background: '#ffffff',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              placeholder="PO number, invoice, SO number, etc."
              disabled={saving}
            />
          </div>
          
          <div style={{
            display: 'flex',
            gap: '20px',
            paddingTop: '30px',
            borderTop: '2px solid rgba(255, 107, 53, 0.1)'
          }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: '1',
                padding: '18px 28px',
                background: saving ? 'linear-gradient(135deg, #9ca3af, #6b7280)' : 'linear-gradient(135deg, #ff6b35, #f7931e)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: '800',
                fontSize: '17px',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(255, 107, 53, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {saving ? 'Adding Movement...' : 'Add Movement'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                flex: '1',
                padding: '18px 28px',
                background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: '800',
                fontSize: '17px',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(107, 114, 128, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
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