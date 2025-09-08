import React, { useState, useEffect } from 'react';

// API configuration to match your Spring Boot backend
const API_BASE_URL = 'http://localhost:8080/api';

const api = {
  get: async (url) => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data from your existing endpoints
      const [salesRes, customersRes, productsRes, suppliersRes, inventoryRes] = await Promise.all([
        api.get('/sales').catch(err => ({ data: [] })),
        api.get('/customers').catch(err => ({ data: [] })),
        api.get('/products').catch(err => ({ data: [] })),
        api.get('/suppliers').catch(err => ({ data: [] })),
        api.get('/inventory').catch(err => ({ data: [] }))
      ]);

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
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
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
    if (!data || data.length === 0) return <div>No data available</div>;

    const maxValue = Math.max(...data.map(item => item[yKey]));
    
    return (
      <div style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'end', gap: '8px', height: '200px' }}>
          {data.map((item, index) => {
            const height = maxValue > 0 ? (item[yKey] / maxValue) * 160 : 0;
            return (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {yKey === 'revenue' ? formatCurrency(item[yKey]) : item[yKey]}
                </div>
                <div 
                  style={{ 
                    width: '100%', 
                    backgroundColor: color, 
                    height: `${height}px`,
                    borderRadius: '4px 4px 0 0',
                    minHeight: '2px',
                    transition: 'all 0.3s ease'
                  }}
                />
                <div style={{ 
                  fontSize: '10px', 
                  marginTop: '5px', 
                  textAlign: 'center',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'center'
                }}>
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
    if (!data || data.length === 0) return <div>No data available</div>;

    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
      <div style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* Simple representation with bars instead of actual pie */}
          <div style={{ flex: 1 }}>
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={index} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '14px' }}>{item.method}</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{percentage.toFixed(1)}%</span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    backgroundColor: '#f1f5f9', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${percentage}%`, 
                      height: '100%', 
                      backgroundColor: colors[index % colors.length],
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const dashboardStyles = {
    container: {
      padding: '2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '2rem',
      textAlign: 'center',
      textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2.5rem',
    },
    statsCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '2rem',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
    },
    statsCardTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#64748b',
      marginBottom: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    statsCardValue: {
      fontSize: '2.5rem',
      fontWeight: '800',
      lineHeight: '1',
      color: '#1e293b',
    },
    contentGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '2rem',
      marginBottom: '2rem',
    },
    widgetCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '2rem',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
    },
    widgetTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    itemRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      borderRadius: '16px',
      marginBottom: '0.75rem',
      transition: 'all 0.3s ease',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      background: 'rgba(255, 255, 255, 0.5)',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      flexDirection: 'column',
      gap: '1rem',
    },
    loadingSpinner: {
      width: '48px',
      height: '48px',
      border: '4px solid rgba(255, 255, 255, 0.3)',
      borderTopColor: '#ffffff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    errorContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      flexDirection: 'column',
      gap: '1rem',
    },
    errorText: {
      color: '#ffffff',
      fontSize: '1.25rem',
      fontWeight: '600',
      textAlign: 'center',
    },
    emptyState: {
      textAlign: 'center',
      color: '#64748b',
      fontSize: '1rem',
      padding: '2rem',
      fontStyle: 'italic',
    },
    chartContainer: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    }
  };

  // Add keyframes for loading animation
  React.useEffect(() => {
    const styleSheet = document.styleSheets[0];
    if (styleSheet && !window.spinAnimationAdded) {
      try {
        styleSheet.insertRule(`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `, styleSheet.cssRules.length);
        window.spinAnimationAdded = true;
      } catch (e) {
        // Handle cases where CSS insertion fails
      }
    }
  }, []);

  if (loading) {
    return (
      <div style={dashboardStyles.container}>
        <div style={dashboardStyles.loadingContainer}>
          <div style={dashboardStyles.loadingSpinner}></div>
          <div style={{ fontSize: '1.125rem', color: '#ffffff' }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={dashboardStyles.container}>
        <div style={dashboardStyles.errorContainer}>
          <div style={dashboardStyles.errorText}>{error}</div>
          <button 
            onClick={fetchDashboardData}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              color: '#ffffff', 
              border: '1px solid rgba(255, 255, 255, 0.3)', 
              borderRadius: '8px', 
              cursor: 'pointer',
              backdropFilter: 'blur(10px)'
            }}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={dashboardStyles.container}>
      <h1 style={dashboardStyles.title}>Business Dashboard</h1>
      
      {/* Summary Cards */}
      <div style={dashboardStyles.statsGrid}>
        <div style={dashboardStyles.statsCard}>
          <div style={dashboardStyles.statsCardTitle}>Total Products</div>
          <div style={dashboardStyles.statsCardValue}>
            {dashboardData.summary.totalProducts}
          </div>
        </div>
        
        <div style={dashboardStyles.statsCard}>
          <div style={dashboardStyles.statsCardTitle}>Total Sales</div>
          <div style={dashboardStyles.statsCardValue}>
            {dashboardData.summary.totalSales}
          </div>
        </div>
        
        <div style={dashboardStyles.statsCard}>
          <div style={dashboardStyles.statsCardTitle}>Total Revenue</div>
          <div style={dashboardStyles.statsCardValue}>
            {formatCurrency(dashboardData.summary.totalRevenue)}
          </div>
        </div>
        
        <div style={dashboardStyles.statsCard}>
          <div style={dashboardStyles.statsCardTitle}>Low Stock Items</div>
          <div style={dashboardStyles.statsCardValue}>
            {dashboardData.summary.lowStockCount}
          </div>
        </div>
        
        <div style={dashboardStyles.statsCard}>
          <div style={dashboardStyles.statsCardTitle}>Pending Checks</div>
          <div style={dashboardStyles.statsCardValue}>
            {dashboardData.summary.pendingChecks}
          </div>
        </div>
        
        <div style={dashboardStyles.statsCard}>
          <div style={dashboardStyles.statsCardTitle}>Total Customers</div>
          <div style={dashboardStyles.statsCardValue}>
            {dashboardData.summary.totalCustomers}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={dashboardStyles.contentGrid}>
        <div style={dashboardStyles.chartContainer}>
          <BarChart 
            data={dashboardData.salesAnalytics.monthlySales}
            title="Monthly Sales Trend"
            xKey="month"
            yKey="revenue"
            color="#667eea"
          />
        </div>
        
        <div style={dashboardStyles.chartContainer}>
          <PieChart 
            data={dashboardData.salesAnalytics.salesByPaymentMethod}
            title="Sales by Payment Method"
          />
        </div>
      </div>

      {/* Analytics Section */}
      <div style={dashboardStyles.contentGrid}>
        {/* Low Stock Alerts */}
        <div style={dashboardStyles.widgetCard}>
          <h2 style={dashboardStyles.widgetTitle}>⚠️ Low Stock Alerts</h2>
          {dashboardData.lowStockAlerts.length > 0 ? (
            <div>
              {dashboardData.lowStockAlerts.map((item, index) => (
                <div key={item.id || index} style={dashboardStyles.itemRow}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Code: {item.code}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#f59e0b' }}>{item.currentStock} left</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Min: {item.lowStockThreshold}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={dashboardStyles.emptyState}>No low stock alerts</div>
          )}
        </div>

        {/* Top Products */}
        <div style={dashboardStyles.widgetCard}>
          <h2 style={dashboardStyles.widgetTitle}>🏆 Top Selling Products</h2>
          {dashboardData.topProducts.length > 0 ? (
            <div>
              {dashboardData.topProducts.map((product, index) => (
                <div key={product.id || index} style={dashboardStyles.itemRow}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{product.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{product.code}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#10b981' }}>{product.totalQuantity} sold</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatCurrency(product.totalRevenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={dashboardStyles.emptyState}>No sales data available</div>
          )}
        </div>

        {/* Check Reminders */}
        <div style={dashboardStyles.widgetCard}>
          <h2 style={dashboardStyles.widgetTitle}>💳 Check Payment Reminders</h2>
          {dashboardData.checkReminders.length > 0 ? (
            <div>
              {dashboardData.checkReminders.slice(0, 5).map((check, index) => (
                <div key={check.id || index} style={dashboardStyles.itemRow}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{check.customerName}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Check #{check.checkNumber}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: check.status === 'overdue' ? '#ef4444' : '#f59e0b' }}>
                      {formatCurrency(check.amount)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {check.status === 'overdue' ? `${Math.abs(check.daysDiff)} days overdue` : 
                       check.status === 'due-soon' ? `Due in ${check.daysDiff} days` : 
                       formatDate(check.checkDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={dashboardStyles.emptyState}>No pending check payments</div>
          )}
        </div>

        {/* Recent Sales */}
        <div style={dashboardStyles.widgetCard}>
          <h2 style={dashboardStyles.widgetTitle}>📊 Recent Sales</h2>
          {dashboardData.recentSales.length > 0 ? (
            <div>
              {dashboardData.recentSales.slice(0, 5).map((sale, index) => (
                <div key={sale.id || index} style={dashboardStyles.itemRow}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>
                      Sale #{sale.id} - {sale.customerDisplayName}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {formatDate(sale.saleDate)} • {sale.paymentMethod?.replace('_', ' ')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#10b981' }}>{formatCurrency(sale.totalAmount)}</div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: sale.isPaid ? '#10b981' : '#ef4444',
                      fontWeight: '500'
                    }}>
                      {sale.isPaid ? 'Paid' : 'Unpaid'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={dashboardStyles.emptyState}>No recent sales</div>
          )}
        </div>
      </div>

      {/* Additional Analytics */}
      <div style={dashboardStyles.widgetCard}>
        <h2 style={dashboardStyles.widgetTitle}>📈 Business Insights</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              {formatCurrency(dashboardData.summary.totalRevenue / (dashboardData.summary.totalSales || 1))}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Average Sale Value</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
              {dashboardData.summary.unpaidSales}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Unpaid Sales</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              {dashboardData.summary.totalSuppliers}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Active Suppliers</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'rgba(147, 51, 234, 0.1)', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9333ea' }}>
              {dashboardData.salesAnalytics.monthlySales.length > 1 
                ? ((dashboardData.salesAnalytics.monthlySales[dashboardData.salesAnalytics.monthlySales.length - 1]?.revenue || 0) - 
                   (dashboardData.salesAnalytics.monthlySales[dashboardData.salesAnalytics.monthlySales.length - 2]?.revenue || 0) > 0 ? '+' : '') +
                  (((dashboardData.salesAnalytics.monthlySales[dashboardData.salesAnalytics.monthlySales.length - 1]?.revenue || 0) - 
                    (dashboardData.salesAnalytics.monthlySales[dashboardData.salesAnalytics.monthlySales.length - 2]?.revenue || 0)) / 
                   (dashboardData.salesAnalytics.monthlySales[dashboardData.salesAnalytics.monthlySales.length - 2]?.revenue || 1) * 100).toFixed(1) + '%'
                : 'N/A'}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Monthly Growth</div>
          </div>
        </div>
      </div>

      {/* Additional Charts */}
      <div style={dashboardStyles.contentGrid}>
        <div style={dashboardStyles.chartContainer}>
          <BarChart 
            data={dashboardData.salesAnalytics.monthlySales}
            title="Monthly Sales Volume"
            xKey="month"
            yKey="sales"
            color="#10b981"
          />
        </div>
        
        <div style={dashboardStyles.widgetCard}>
          <h2 style={dashboardStyles.widgetTitle}>🎯 Performance Metrics</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
              <span style={{ fontWeight: '600' }}>Inventory Turnover</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
                {dashboardData.summary.totalProducts > 0 ? (dashboardData.summary.totalSales / dashboardData.summary.totalProducts * 12).toFixed(1) : '0'}x
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
              <span style={{ fontWeight: '600' }}>Payment Success Rate</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                {dashboardData.summary.totalSales > 0 ? 
                  ((dashboardData.summary.totalSales - dashboardData.summary.unpaidSales) / dashboardData.summary.totalSales * 100).toFixed(1) + '%' 
                  : '0%'}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
              <span style={{ fontWeight: '600' }}>Customer Engagement</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                {dashboardData.summary.totalCustomers > 0 ? (dashboardData.summary.totalSales / dashboardData.summary.totalCustomers).toFixed(1) : '0'} sales/customer
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
              <span style={{ fontWeight: '600' }}>Stock Health Score</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: dashboardData.summary.totalProducts > 0 ? 
                ((dashboardData.summary.totalProducts - dashboardData.summary.lowStockCount) / dashboardData.summary.totalProducts * 100 >= 80 ? '#10b981' : 
                 (dashboardData.summary.totalProducts - dashboardData.summary.lowStockCount) / dashboardData.summary.totalProducts * 100 >= 60 ? '#f59e0b' : '#ef4444') : '#6b7280' }}>
                {dashboardData.summary.totalProducts > 0 ? 
                  ((dashboardData.summary.totalProducts - dashboardData.summary.lowStockCount) / dashboardData.summary.totalProducts * 100).toFixed(0) + '%' 
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={dashboardStyles.widgetCard}>
        <h2 style={dashboardStyles.widgetTitle}>⚡ Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <button style={{ 
            padding: '15px 20px', 
            backgroundColor: '#667eea', 
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}>
            Create New Sale
          </button>
          
          <button style={{ 
            padding: '15px 20px', 
            backgroundColor: '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}>
            Add Product
          </button>
          
          <button style={{ 
            padding: '15px 20px', 
            backgroundColor: '#f59e0b', 
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}>
            Update Inventory
          </button>
          
          <button style={{ 
            padding: '15px 20px', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}>
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;