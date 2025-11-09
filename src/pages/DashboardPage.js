import React, { useState, useEffect } from 'react';
import './Dashboard.css'; // Import the CSS file

// API configuration to match your Spring Boot backend
<<<<<<< HEAD
const API_BASE_URL = 'http://localhost:8080/api';
=======
const API_BASE_URL = 'http://107.173.40.112/api/api';
>>>>>>> master

// Authentication helper functions
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

const api = {
  get: async (url) => {
    try {
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
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}` // Add JWT token to Authorization header
        }
      });
      
      if (response.status === 401) {
        // Token might be invalid or expired
        authUtils.removeToken();
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Handle your ApiResponse wrapper
      if (result.success && result.data) {
        return { data: result.data };
      } else if (result.data) {
        return { data: result.data };
      } else {
        return { data: result };
      }
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  },
  
  // Add a login method for testing
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
      
      // Assuming your login endpoint returns a token
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

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalProducts: 0,
      totalSales: 0,
      lowStockCount: 0,
      pendingChecks: 0,
      totalCustomers: 0,
      totalSuppliers: 0,
      totalRevenue: 0,
      unpaidSales: 0
    },
    lowStockAlerts: [],
    topProducts: [],
    checkReminders: [],
    recentSales: [],
    salesAnalytics: {
      monthlySales: [],
      salesByPaymentMethod: [],
      salesTrends: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
<<<<<<< HEAD
  const [authError, setAuthError] = useState(false);
  
  // Login state for quick testing
  const [showLogin, setShowLogin] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });

  useEffect(() => {
    const token = authUtils.getToken();
    if (!token || authUtils.isTokenExpired(token)) {
      setAuthError(true);
      setLoading(false);
    } else {
      fetchDashboardData();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      await api.login(loginCredentials.username, loginCredentials.password);
      setAuthError(false);
      setShowLogin(false);
      await fetchDashboardData();
    } catch (error) {
      setError(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

=======

  useEffect(() => {
    // Load data from backend (no authentication required)
    fetchDashboardData();
  }, []);

>>>>>>> master
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
<<<<<<< HEAD
      setAuthError(false);

      // Fetch all data from your existing endpoints
      const [salesRes, customersRes, productsRes, suppliersRes, inventoryRes] = await Promise.all([
        api.get('/sales').catch(err => {
          if (err.message.includes('Authentication')) {
            setAuthError(true);
          }
          return { data: [] };
        }),
        api.get('/customers').catch(err => ({ data: [] })),
        api.get('/products').catch(err => ({ data: [] })),
        api.get('/suppliers').catch(err => ({ data: [] })),
        api.get('/inventory').catch(err => ({ data: [] }))
      ]);

      // If we got an auth error, stop processing
      if (authError) {
        return;
      }

=======

      // Fetch all data from backend endpoints (no authentication required)
      const [salesRes, customersRes, productsRes, suppliersRes, inventoryRes] = await Promise.all([
        api.get('/sales').catch(err => {
          console.error('Error fetching sales:', err);
          return { data: [] };
        }),
        api.get('/customers').catch(err => {
          console.error('Error fetching customers:', err);
          return { data: [] };
        }),
        api.get('/products').catch(err => {
          console.error('Error fetching products:', err);
          return { data: [] };
        }),
        api.get('/suppliers').catch(err => {
          console.error('Error fetching suppliers:', err);
          return { data: [] };
        }),
        api.get('/inventory').catch(err => {
          console.error('Error fetching inventory:', err);
          return { data: [] };
        })
      ]);

>>>>>>> master
      const salesData = Array.isArray(salesRes.data) ? salesRes.data : [];
      const customersData = Array.isArray(customersRes.data) ? customersRes.data : [];
      const productsData = Array.isArray(productsRes.data) ? productsRes.data : [];
      const suppliersData = Array.isArray(suppliersRes.data) ? suppliersRes.data : [];
      const inventoryData = Array.isArray(inventoryRes.data) ? inventoryRes.data : [];

      // Process and analyze the data
      const processedData = processAllData(salesData, customersData, productsData, suppliersData, inventoryData);
      setDashboardData(processedData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
<<<<<<< HEAD
      if (error.message.includes('Authentication') || error.message.includes('log in')) {
        setAuthError(true);
      } else {
        setError('Failed to load dashboard data');
      }
=======
      setError('Failed to load dashboard data');
>>>>>>> master
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const handleLogout = () => {
    authUtils.removeToken();
    setAuthError(true);
    setDashboardData({
      summary: {
        totalProducts: 0,
        totalSales: 0,
        lowStockCount: 0,
        pendingChecks: 0,
        totalCustomers: 0,
        totalSuppliers: 0,
        totalRevenue: 0,
        unpaidSales: 0
      },
      lowStockAlerts: [],
      topProducts: [],
      checkReminders: [],
      recentSales: [],
      salesAnalytics: {
        monthlySales: [],
        salesByPaymentMethod: [],
        salesTrends: []
      }
    });
  };

=======
>>>>>>> master
  // Helper function to create lookup maps
  const createLookupMaps = (customers, products) => {
    const customerMap = {};
    const productMap = {};

    customers.forEach(customer => {
      customerMap[customer.id] = customer;
    });

    products.forEach(product => {
      productMap[product.id] = product;
    });

    return { customerMap, productMap };
  };

  // Helper function to get customer name
  const getCustomerName = (sale, customerMap) => {
    // Try different ways to get customer name
    if (sale.customer?.name) return sale.customer.name;
    if (sale.customerName) return sale.customerName;
    if (sale.customerId && customerMap[sale.customerId]) {
      return customerMap[sale.customerId].name;
    }
    return 'Walk-in Customer'; // Better default than "Unknown Customer"
  };

  // Helper function to get product name
  const getProductName = (item, productMap) => {
    // Try different ways to get product name
    if (item.product?.name) return item.product.name;
    if (item.productName) return item.productName;
    if (item.productId && productMap[item.productId]) {
      return productMap[item.productId].name;
    }
    return `Product #${item.productId || 'Unknown'}`;
  };

  // Helper function to get product code
  const getProductCode = (item, productMap) => {
    if (item.product?.code) return item.product.code;
    if (item.productCode) return item.productCode;
    if (item.productId && productMap[item.productId]) {
      return productMap[item.productId].code;
    }
    return `CODE-${item.productId || 'N/A'}`;
  };

  const processAllData = (sales, customers, products, suppliers, inventory) => {
    // Create lookup maps for efficient data retrieval
    const { customerMap, productMap } = createLookupMaps(customers, products);

    // Calculate summary metrics
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const unpaidSales = sales.filter(sale => !sale.isPaid);
    const lowStockProducts = products.filter(product => 
      product.currentStock <= (product.lowStockThreshold || 10)
    );
    const pendingChecks = sales.filter(sale => 
      sale.paymentMethod === 'CREDIT_CHECK' && !sale.isPaid
    );

    // Process sales analytics
    const salesAnalytics = processSalesAnalytics(sales);
    
    // Get top products by sales volume
    const topProducts = getTopProductsBySales(sales, products, productMap);
    
    // Get check payment reminders
    const checkReminders = getCheckReminders(sales, customerMap);
    
    // Get recent sales (last 10) with proper customer names
    const recentSales = sales
      .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
      .slice(0, 10)
      .map(sale => ({
        ...sale,
        customerDisplayName: getCustomerName(sale, customerMap)
      }));

    return {
      summary: {
        totalProducts: products.length,
        totalSales: sales.length,
        totalRevenue: totalRevenue,
        lowStockCount: lowStockProducts.length,
        pendingChecks: pendingChecks.length,
        totalCustomers: customers.length,
        totalSuppliers: suppliers.length,
        unpaidSales: unpaidSales.length
      },
      lowStockAlerts: lowStockProducts.slice(0, 5), // Top 5 low stock items
      topProducts: topProducts,
      checkReminders: checkReminders,
      recentSales: recentSales,
      salesAnalytics: salesAnalytics
    };
  };

  const processSalesAnalytics = (sales) => {
    // Monthly sales data for the last 6 months
    const monthlySales = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate.getMonth() === month.getMonth() && 
               saleDate.getFullYear() === month.getFullYear();
      });
      
      const monthRevenue = monthSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      
      monthlySales.push({
        month: monthStr,
        sales: monthSales.length,
        revenue: monthRevenue
      });
    }

    // Sales by payment method
    const paymentMethods = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CREDIT_CHECK'];
    const salesByPaymentMethod = paymentMethods.map(method => {
      const methodSales = sales.filter(sale => sale.paymentMethod === method);
      const methodRevenue = methodSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      
      return {
        method: method.replace('_', ' '),
        count: methodSales.length,
        revenue: methodRevenue,
        percentage: sales.length > 0 ? (methodSales.length / sales.length) * 100 : 0
      };
    }).filter(item => item.count > 0);

    return {
      monthlySales,
      salesByPaymentMethod
    };
  };

  const getTopProductsBySales = (sales, products, productMap) => {
    const productSales = {};
    
    sales.forEach(sale => {
      if (sale.saleItems && Array.isArray(sale.saleItems)) {
        sale.saleItems.forEach(item => {
          const productId = item.product?.id || item.productId;
          if (productId) {
            if (!productSales[productId]) {
              productSales[productId] = {
                id: productId,
                name: getProductName(item, productMap),
                code: getProductCode(item, productMap),
                totalQuantity: 0,
                totalRevenue: 0,
                salesCount: 0
              };
            }
            productSales[productId].totalQuantity += item.quantity || 0;
            productSales[productId].totalRevenue += item.lineTotal || (item.quantity * item.unitPrice) || 0;
            productSales[productId].salesCount += 1;
          }
        });
      }
    });

    return Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
  };

  const getCheckReminders = (sales, customerMap) => {
    const today = new Date();
    const pendingChecks = sales.filter(sale => 
      sale.paymentMethod === 'CREDIT_CHECK' && 
      !sale.isPaid && 
      sale.checkDate
    );

    return pendingChecks.map(sale => {
      const checkDate = new Date(sale.checkDate);
      const daysDiff = Math.ceil((checkDate - today) / (1000 * 60 * 60 * 24));
      
      let status = 'upcoming';
      if (daysDiff < 0) status = 'overdue';
      else if (daysDiff <= 3) status = 'due-soon';

      return {
        id: sale.id,
        customerName: getCustomerName(sale, customerMap),
        checkNumber: sale.checkNumber || `CHK-${sale.id}`,
        amount: sale.totalAmount,
        checkDate: sale.checkDate,
        daysDiff,
        status
      };
    }).sort((a, b) => a.daysDiff - b.daysDiff);
  };

  const formatCurrency = (amount) => {
    return `Rs. ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Simple Bar Chart Component
  const BarChart = ({ data, title, xKey, yKey, color = '#667eea' }) => {
    if (!data || data.length === 0) return <div className="chart-no-data">No data available</div>;

    const maxValue = Math.max(...data.map(item => item[yKey]));
    
    return (
      <div className="chart-content">
        <h3 className="chart-title">{title}</h3>
        <div className="bar-chart-container">
          {data.map((item, index) => {
            const height = maxValue > 0 ? (item[yKey] / maxValue) * 160 : 0;
            return (
              <div key={index} className="bar-chart-item">
                <div className="bar-chart-value">
                  {yKey === 'revenue' ? formatCurrency(item[yKey]) : item[yKey]}
                </div>
                <div 
                  className="bar-chart-bar"
                  style={{ height: `${height}px` }}
                />
                <div className="bar-chart-label">
                  {item[xKey]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Pie Chart Component (simplified)
  const PieChart = ({ data, title }) => {
    if (!data || data.length === 0) return <div className="chart-no-data">No data available</div>;

    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="chart-content">
        <h3 className="chart-title">{title}</h3>
        <div className="pie-chart-container">
          <div className="pie-chart-legend">
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={index} className="pie-chart-item">
                  <div className="pie-chart-item-header">
                    <span className="pie-chart-method">{item.method}</span>
                    <span className="pie-chart-percentage">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="pie-chart-bar-bg">
                    <div 
                      className="pie-chart-bar-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

<<<<<<< HEAD
  // Authentication Error Screen
  if (authError) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error-container">
          <div className="dashboard-error-text">
            Authentication Required
            <p style={{fontSize: '14px', marginTop: '10px', color: '#666'}}>
              Please log in to access the dashboard
            </p>
          </div>
          
          {!showLogin && (
            <button 
              onClick={() => setShowLogin(true)}
              className="dashboard-retry-button"
            >
              Login
            </button>
          )}
          
          {showLogin && (
            <form onSubmit={handleLogin} style={{marginTop: '20px', maxWidth: '300px'}}>
              <div style={{marginBottom: '15px'}}>
                <input
                  type="text"
                  placeholder="Username"
                  value={loginCredentials.username}
                  onChange={(e) => setLoginCredentials({...loginCredentials, username: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div style={{marginBottom: '15px'}}>
                <input
                  type="password"
                  placeholder="Password"
                  value={loginCredentials.password}
                  onChange={(e) => setLoginCredentials({...loginCredentials, password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div style={{display: 'flex', gap: '10px'}}>
                <button 
                  type="submit" 
                  className="dashboard-retry-button"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowLogin(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ddd',
                    background: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          {error && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

=======
>>>>>>> master
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading-container">
          <div className="dashboard-loading-spinner"></div>
          <div className="dashboard-loading-text">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error-container">
          <div className="dashboard-error-text">{error}</div>
          <button 
            onClick={fetchDashboardData}
            className="dashboard-retry-button"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Business Dashboard</h1>
      
      {/* Rest of your existing dashboard components... */}
      {/* Summary Cards */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stats-card">
          <div className="dashboard-stats-card-title">Total Products</div>
          <div className="dashboard-stats-card-value">
            {dashboardData.summary.totalProducts}
          </div>
        </div>
        
        <div className="dashboard-stats-card">
          <div className="dashboard-stats-card-title">Total Sales</div>
          <div className="dashboard-stats-card-value">
            {dashboardData.summary.totalSales}
          </div>
        </div>
        
        <div className="dashboard-stats-card">
          <div className="dashboard-stats-card-title">Total Revenue</div>
          <div className="dashboard-stats-card-value">
            {formatCurrency(dashboardData.summary.totalRevenue)}
          </div>
        </div>
        
        <div className="dashboard-stats-card">
          <div className="dashboard-stats-card-title">Low Stock Items</div>
          <div className="dashboard-stats-card-value">
            {dashboardData.summary.lowStockCount}
          </div>
        </div>
        
        <div className="dashboard-stats-card">
          <div className="dashboard-stats-card-title">Pending Checks</div>
          <div className="dashboard-stats-card-value">
            {dashboardData.summary.pendingChecks}
          </div>
        </div>
        
        <div className="dashboard-stats-card">
          <div className="dashboard-stats-card-title">Total Customers</div>
          <div className="dashboard-stats-card-value">
            {dashboardData.summary.totalCustomers}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard-content-grid">
        <div className="dashboard-chart-container">
          <BarChart 
            data={dashboardData.salesAnalytics.monthlySales}
            title="Monthly Sales Trend"
            xKey="month"
            yKey="revenue"
            color="#667eea"
          />
        </div>
        
        <div className="dashboard-chart-container">
          <PieChart 
            data={dashboardData.salesAnalytics.salesByPaymentMethod}
            title="Sales by Payment Method"
          />
        </div>
      </div>

      {/* Analytics Section */}
      <div className="dashboard-content-grid">
        {/* Low Stock Alerts */}
        <div className="dashboard-widget-card">
          <h2 className="dashboard-widget-title">⚠️ Low Stock Alerts</h2>
          {dashboardData.lowStockAlerts.length > 0 ? (
            <div>
              {dashboardData.lowStockAlerts.map((item, index) => (
                <div key={item.id || index} className="dashboard-item-row">
                  <div className="item-details">
                    <div className="item-name">{item.name}</div>
                    <div className="item-code">Code: {item.code}</div>
                  </div>
                  <div className="item-meta">
                    <div className="item-primary-value status-warning">{item.currentStock} left</div>
                    <div className="item-secondary-value">Min: {item.lowStockThreshold}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">No low stock alerts</div>
          )}
        </div>

        {/* Top Products */}
        <div className="dashboard-widget-card">
          <h2 className="dashboard-widget-title">🏆 Top Selling Products</h2>
          {dashboardData.topProducts.length > 0 ? (
            <div>
              {dashboardData.topProducts.map((product, index) => (
                <div key={product.id || index} className="dashboard-item-row">
                  <div className="item-details">
                    <div className="item-name">{product.name}</div>
                    <div className="item-code">{product.code}</div>
                  </div>
                  <div className="item-meta">
                    <div className="item-primary-value status-success">{product.totalQuantity} sold</div>
                    <div className="item-secondary-value">{formatCurrency(product.totalRevenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">No sales data available</div>
          )}
        </div>

        {/* Check Reminders */}
        <div className="dashboard-widget-card">
          <h2 className="dashboard-widget-title">💳 Check Payment Reminders</h2>
          {dashboardData.checkReminders.length > 0 ? (
            <div>
              {dashboardData.checkReminders.slice(0, 5).map((check, index) => (
                <div key={check.id || index} className="dashboard-item-row">
                  <div className="item-details">
                    <div className="item-name">{check.customerName}</div>
                    <div className="item-code">Check #{check.checkNumber}</div>
                  </div>
                  <div className="item-meta">
                    <div className={`item-primary-value ${check.status === 'overdue' ? 'status-error' : 'status-warning'}`}>
                      {formatCurrency(check.amount)}
                    </div>
                    <div className="item-secondary-value">
                      {check.status === 'overdue' ? `${Math.abs(check.daysDiff)} days overdue` : 
                       check.status === 'due-soon' ? `Due in ${check.daysDiff} days` : 
                       formatDate(check.checkDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">No pending check payments</div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="dashboard-widget-card">
          <h2 className="dashboard-widget-title">📊 Recent Sales</h2>
          {dashboardData.recentSales.length > 0 ? (
            <div>
              {dashboardData.recentSales.slice(0, 5).map((sale, index) => (
                <div key={sale.id || index} className="dashboard-item-row">
                  <div className="item-details">
                    <div className="item-name">
                      Sale #{sale.id} - {sale.customerDisplayName}
                    </div>
                    <div className="item-code">
                      {formatDate(sale.saleDate)} • {sale.paymentMethod?.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="item-meta">
                    <div className="item-primary-value status-success">{formatCurrency(sale.totalAmount)}</div>
                    <div className={`item-secondary-value ${sale.isPaid ? 'status-success' : 'status-error'}`}>
                      {sale.isPaid ? 'Paid' : 'Unpaid'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">No recent sales</div>
          )}
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="dashboard-widget-card">
        <h2 className="dashboard-widget-title">📈 Business Insights</h2>
        <div className="business-insights-grid">
          <div className="insight-card success">
            <div className="insight-value success">
              {formatCurrency(dashboardData.summary.totalRevenue / (dashboardData.summary.totalSales || 1))}
            </div>
            <div className="insight-label">Average Sale Value</div>
          </div>
          
          <div className="insight-card error">
            <div className="insight-value error">
              {dashboardData.summary.unpaidSales}
            </div>
            <div className="insight-label">Unpaid Sales</div>
          </div>
          
          <div className="insight-card info">
            <div className="insight-value info">
              {dashboardData.summary.totalSuppliers}
            </div>
            <div className="insight-label">Active Suppliers</div>
          </div>
          
          <div className="insight-card warning">
            <div className="insight-value warning">
              {dashboardData.salesAnalytics.monthlySales.length > 1 
                ? ((dashboardData.salesAnalytics.monthlySales[dashboardData.salesAnalytics.monthlySales.length - 1]?.revenue || 0) - 
                   (dashboardData.salesAnalytics.monthlySales[dashboardData.salesAnalytics.monthlySales.length - 2]?.revenue || 0) > 0 ? '+' : '') +
                  (((dashboardData.salesAnalytics.monthlySales[dashboardData.salesAnalytics.monthlySales.length - 1]?.revenue || 0) - 
                    (dashboardData.salesAnalytics.monthlySales[dashboardData.salesAnalytics.monthlySales.length - 2]?.revenue || 0)) / 
                   (dashboardData.salesAnalytics.monthlySales[dashboardData.salesAnalytics.monthlySales.length - 2]?.revenue || 1) * 100).toFixed(1) + '%'
                : 'N/A'}
            </div>
            <div className="insight-label">Monthly Growth</div>
          </div>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="dashboard-content-grid">
        <div className="dashboard-chart-container">
          <BarChart 
            data={dashboardData.salesAnalytics.monthlySales}
            title="Monthly Sales Volume"
            xKey="month"
            yKey="sales"
            color="#10b981"
          />
        </div>
        
        <div className="dashboard-widget-card">
          <h2 className="dashboard-widget-title">🎯 Performance Metrics</h2>
          <div className="performance-metrics">
            <div className="metric-item warning">
              <span className="metric-label">Inventory Turnover</span>
              <span className="metric-value warning">
                {dashboardData.summary.totalProducts > 0 ? (dashboardData.summary.totalSales / dashboardData.summary.totalProducts * 12).toFixed(1) : '0'}x
              </span>
            </div>
            
            <div className="metric-item success">
              <span className="metric-label">Payment Success Rate</span>
              <span className="metric-value success">
                {dashboardData.summary.totalSales > 0 ? 
                  ((dashboardData.summary.totalSales - dashboardData.summary.unpaidSales) / dashboardData.summary.totalSales * 100).toFixed(1) + '%' 
                  : '0%'}
              </span>
            </div>
            
            <div className="metric-item info">
              <span className="metric-label">Customer Engagement</span>
              <span className="metric-value info">
                {dashboardData.summary.totalCustomers > 0 ? (dashboardData.summary.totalSales / dashboardData.summary.totalCustomers).toFixed(1) : '0'} sales/customer
              </span>
            </div>
            
            <div className="metric-item error">
              <span className="metric-label">Stock Health Score</span>
              <span className={`metric-value ${dashboardData.summary.totalProducts > 0 ? 
                ((dashboardData.summary.totalProducts - dashboardData.summary.lowStockCount) / dashboardData.summary.totalProducts * 100 >= 80 ? 'success' : 
                 (dashboardData.summary.totalProducts - dashboardData.summary.lowStockCount) / dashboardData.summary.totalProducts * 100 >= 60 ? 'warning' : 'error') : 'info' }`}>
                {dashboardData.summary.totalProducts > 0 ? 
                  ((dashboardData.summary.totalProducts - dashboardData.summary.lowStockCount) / dashboardData.summary.totalProducts * 100).toFixed(0) + '%' 
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* Quick Actions */}
      <div className="dashboard-widget-card">
        <h2 className="dashboard-widget-title">⚡ Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="quick-action-btn primary">
            Create New Sale
          </button>
          
          <button className="quick-action-btn success">
            Add Product
          </button>
          
          <button className="quick-action-btn warning">
            Update Inventory
          </button>
          
          <button className="quick-action-btn info">
            View Reports
          </button>
        </div>
      </div>
=======
      
>>>>>>> master
    </div>
  );
};

export default DashboardPage;