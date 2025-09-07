import React, { useState, useEffect } from 'react';

// Mock API service for demo
const api = {
  get: async (url) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (url === '/inventory') {
      return {
        data: [
          {
            id: 1,
            date: '2024-12-15T10:30:00',
            product: { id: 1, name: 'Premium Laptop', code: 'LAP001' },
            movementType: 'IN',
            quantity: 50,
            reference: 'PO-2024-001',
            supplier: { id: 1, name: 'Tech Suppliers Inc' }
          },
          {
            id: 2,
            date: '2024-12-14T14:20:00',
            product: { id: 2, name: 'Wireless Mouse', code: 'MOU002' },
            movementType: 'OUT',
            quantity: 25,
            reference: 'SO-2024-125',
            supplier: null
          },
          {
            id: 3,
            date: '2024-12-13T09:15:00',
            product: { id: 3, name: 'USB-C Cable', code: 'CAB003' },
            movementType: 'IN',
            quantity: 200,
            reference: 'PO-2024-002',
            supplier: { id: 2, name: 'Cable Solutions Ltd' }
          },
          {
            id: 4,
            date: '2024-12-12T16:45:00',
            product: { id: 1, name: 'Premium Laptop', code: 'LAP001' },
            movementType: 'OUT',
            quantity: 15,
            reference: 'SO-2024-126',
            supplier: null
          }
        ]
      };
    } else if (url === '/products') {
      return {
        data: [
          { id: 1, name: 'Premium Laptop', code: 'LAP001' },
          { id: 2, name: 'Wireless Mouse', code: 'MOU002' },
          { id: 3, name: 'USB-C Cable', code: 'CAB003' },
          { id: 4, name: 'Bluetooth Keyboard', code: 'KEY004' },
          { id: 5, name: 'Monitor Stand', code: 'MON005' }
        ]
      };
    } else if (url === '/suppliers') {
      return {
        data: [
          { id: 1, name: 'Tech Suppliers Inc' },
          { id: 2, name: 'Cable Solutions Ltd' },
          { id: 3, name: 'Hardware Wholesale Co' },
          { id: 4, name: 'Global Electronics' }
        ]
      };
    }
    return { data: [] };
  },
  post: async (url, data) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: { ...data, id: Date.now() } };
  },
  delete: async (url) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: {} };
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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [inventoryRes, productsRes, suppliersRes] = await Promise.all([
        api.get('/inventory').catch(err => ({ data: [] })),
        api.get('/products').catch(err => ({ data: [] })),
        api.get('/suppliers').catch(err => ({ data: [] }))
      ]);
      
      setInventory(Array.isArray(inventoryRes.data) ? inventoryRes.data : []);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load inventory data');
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
      await api.post('/inventory', movementData);
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error adding inventory movement:', error);
      alert('Failed to add inventory movement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory movement?')) {
      try {
        await api.delete(`/inventory/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting inventory movement:', error);
        alert('Failed to delete inventory movement');
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          }}>📦 Loading inventory...</div>
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
            🔄 Retry
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
              placeholder="🔍 Search by product, code, or reference..."
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
              <option value="ALL">📊 All Movements</option>
              <option value="IN">📥 Stock In</option>
              <option value="OUT">📤 Stock Out</option>
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
                  {['📅 Date', '📦 Product', '🔄 Type', '📊 Quantity', '📝 Reference', '🏢 Supplier', '⚡ Actions'].map((header, index) => (
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
                    <tr key={item.id} style={{
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
                          {item.movementType === 'IN' ? '📥 Stock In' : '📤 Stock Out'}
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
                          {item.quantity?.toLocaleString()}
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
                        <div style={{
                          fontSize: '15px',
                          color: '#ffffff',
                          fontWeight: '600'
                        }}>
                          {item.supplier?.name || 'N/A'}
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
                          🗑️ Delete
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
                        ? '🔍 No inventory movements found matching your criteria.' 
                        : '📦 No inventory movements available.'}
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

// Inventory Movement Modal Component
const InventoryMovementModal = ({ products, suppliers, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    productId: '',
    movementType: 'IN',
    quantity: '',
    supplierId: '',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const movementData = {
      product: { id: formData.productId },
      movementType: formData.movementType,
      quantity: parseInt(formData.quantity),
      supplier: formData.supplierId ? { id: formData.supplierId } : null,
      reference: formData.reference,
      date: formData.date + 'T00:00:00'
    };
    
    onSave(movementData);
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
        
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '28px'}}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: '700',
              marginBottom: '10px',
              color: '#374151'
            }}>📦 Product *</label>
            <select
              value={formData.productId}
              onChange={(e) => handleChange('productId', e.target.value)}
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
            >
              <option value="">Select a product</option>
              {Array.isArray(products) && products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.code})
                </option>
              ))}
            </select>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px'}}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '15px',
                fontWeight: '700',
                marginBottom: '10px',
                color: '#374151'
              }}>🔄 Movement Type *</label>
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
              >
                <option value="IN">📥 Stock In</option>
                <option value="OUT">📤 Stock Out</option>
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '15px',
                fontWeight: '700',
                marginBottom: '10px',
                color: '#374151'
              }}>📊 Quantity *</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
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
                required
              />
            </div>
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: '700',
              marginBottom: '10px',
              color: '#374151'
            }}>📅 Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
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
              required
            />
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
              }}>🏢 Supplier</label>
              <select
                value={formData.supplierId}
                onChange={(e) => handleChange('supplierId', e.target.value)}
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
              >
                <option value="">Select a supplier</option>
                {Array.isArray(suppliers) && suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: '700',
              marginBottom: '10px',
              color: '#374151'
            }}>📝 Reference</label>
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
              style={{
                flex: '1',
                padding: '18px 28px',
                background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '17px',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(255, 107, 53, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 15px 40px rgba(255, 107, 53, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 30px rgba(255, 107, 53, 0.4)';
              }}
            >
              ✨ Add Movement
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: '1',
                padding: '18px 28px',
                background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '17px',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(107, 114, 128, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 15px 40px rgba(107, 114, 128, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 30px rgba(107, 114, 128, 0.4)';
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

export default InventoryManagementPage;