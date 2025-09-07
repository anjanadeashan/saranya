import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState({
    summary: null,
    lowStockAlerts: [],
    topProducts: [],
    salesVsPurchases: null,
    checkReminders: []
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

      // Fetch all dashboard data concurrently
      const [summaryRes, lowStockRes, topProductsRes, salesVsPurchasesRes, checkRemindersRes] = await Promise.all([
        api.get('/dashboard/summary').catch(err => ({ data: null, error: err })),
        api.get('/dashboard/low-stock-alerts').catch(err => ({ data: [], error: err })),
        api.get('/dashboard/top-products').catch(err => ({ data: [], error: err })),
        api.get('/dashboard/sales-vs-purchases').catch(err => ({ data: null, error: err })),
        api.get('/dashboard/check-reminders').catch(err => ({ data: [], error: err }))
      ]);

      // Log responses for debugging
      console.log('Dashboard API responses:', {
        summary: summaryRes.data,
        lowStock: lowStockRes.data,
        topProducts: topProductsRes.data,
        salesVsPurchases: salesVsPurchasesRes.data,
        checkReminders: checkRemindersRes.data
      });

      setDashboardData({
        summary: summaryRes.data,
        lowStockAlerts: Array.isArray(lowStockRes.data) ? lowStockRes.data : [],
        topProducts: Array.isArray(topProductsRes.data) ? topProductsRes.data : [],
        salesVsPurchases: salesVsPurchasesRes.data,
        checkReminders: Array.isArray(checkRemindersRes.data) ? checkRemindersRes.data : []
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const dashboardStyles = {
    container: {
      padding: '2rem',
      background: 'transparent',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: '2rem',
      textAlign: 'left',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2.5rem',
    },
    statsCard: {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '2rem',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
    },
    statsCardHover: {
      transform: 'translateY(-8px)',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    contentGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '2rem',
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
    widgetIcon: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.2rem',
      color: 'white',
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
    },
    itemRowHover: {
      transform: 'translateX(4px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
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
      border: '4px solid rgba(102, 126, 234, 0.2)',
      borderTopColor: '#667eea',
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
      color: '#ef4444',
      fontSize: '1.25rem',
      fontWeight: '600',
    },
    emptyState: {
      textAlign: 'center',
      color: '#64748b',
      fontSize: '1rem',
      padding: '2rem',
      fontStyle: 'italic',
    },
    fullWidthCard: {
      gridColumn: '1 / -1',
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

  const getStatsCardStyle = (color) => ({
    ...dashboardStyles.statsCard,
    background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
  });

  const getWidgetCardStyle = (bgColor) => ({
    ...dashboardStyles.itemRow,
    background: `linear-gradient(135deg, ${bgColor}10 0%, ${bgColor}05 100%)`,
  });

  if (loading) {
    return (
      <div style={dashboardStyles.container}>
        <div style={dashboardStyles.loadingContainer}>
          <div style={dashboardStyles.loadingSpinner}></div>
          <div style={{ fontSize: '1.125rem', color: '#64748b' }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={dashboardStyles.container}>
        <div style={dashboardStyles.errorContainer}>
          <div style={dashboardStyles.errorText}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={dashboardStyles.container}>
      <h1 style={dashboardStyles.title}>Dashboard</h1>
      
      {/* Summary Cards */}
      {dashboardData.summary && (
        <div style={dashboardStyles.statsGrid}>
          <div 
            style={getStatsCardStyle('#3b82f6')}
            onMouseEnter={(e) => Object.assign(e.target.style, dashboardStyles.statsCardHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, { transform: 'translateY(0)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' })}
          >
            <div style={dashboardStyles.statsCardTitle}>Total Products</div>
            <div style={{...dashboardStyles.statsCardValue, color: '#3b82f6'}}>
              {dashboardData.summary.totalProducts || 0}
            </div>
          </div>
          
          <div 
            style={getStatsCardStyle('#10b981')}
            onMouseEnter={(e) => Object.assign(e.target.style, dashboardStyles.statsCardHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, { transform: 'translateY(0)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' })}
          >
            <div style={dashboardStyles.statsCardTitle}>Total Sales</div>
            <div style={{...dashboardStyles.statsCardValue, color: '#10b981'}}>
              ${dashboardData.summary.totalSales || 0}
            </div>
          </div>
          
          <div 
            style={getStatsCardStyle('#f59e0b')}
            onMouseEnter={(e) => Object.assign(e.target.style, dashboardStyles.statsCardHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, { transform: 'translateY(0)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' })}
          >
            <div style={dashboardStyles.statsCardTitle}>Low Stock Items</div>
            <div style={{...dashboardStyles.statsCardValue, color: '#f59e0b'}}>
              {dashboardData.summary.lowStockCount || 0}
            </div>
          </div>
          
          <div 
            style={getStatsCardStyle('#ef4444')}
            onMouseEnter={(e) => Object.assign(e.target.style, dashboardStyles.statsCardHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, { transform: 'translateY(0)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' })}
          >
            <div style={dashboardStyles.statsCardTitle}>Pending Checks</div>
            <div style={{...dashboardStyles.statsCardValue, color: '#ef4444'}}>
              {dashboardData.summary.pendingChecks || 0}
            </div>
          </div>
        </div>
      )}

      <div style={dashboardStyles.contentGrid}>
        {/* Low Stock Alerts */}
        <div style={dashboardStyles.widgetCard}>
          <h2 style={dashboardStyles.widgetTitle}>
            <div style={{...dashboardStyles.widgetIcon, background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>⚠️</div>
            Low Stock Alerts
          </h2>
          {dashboardData.lowStockAlerts.length > 0 ? (
            <div>
              {dashboardData.lowStockAlerts.map((item, index) => (
                <div 
                  key={item.id || index} 
                  style={getWidgetCardStyle('#f59e0b')}
                  onMouseEnter={(e) => Object.assign(e.target.style, dashboardStyles.itemRowHover)}
                  onMouseLeave={(e) => Object.assign(e.target.style, { transform: 'translateX(0)', boxShadow: 'none' })}
                >
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
          <h2 style={dashboardStyles.widgetTitle}>
            <div style={{...dashboardStyles.widgetIcon, background: 'linear-gradient(135deg, #10b981, #059669)'}}>🏆</div>
            Top Products
          </h2>
          {dashboardData.topProducts.length > 0 ? (
            <div>
              {dashboardData.topProducts.map((product, index) => (
                <div 
                  key={product.id || index} 
                  style={getWidgetCardStyle('#10b981')}
                  onMouseEnter={(e) => Object.assign(e.target.style, dashboardStyles.itemRowHover)}
                  onMouseLeave={(e) => Object.assign(e.target.style, { transform: 'translateX(0)', boxShadow: 'none' })}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{product.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{product.code}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#10b981' }}>{product.salesCount} sold</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>${product.revenue}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={dashboardStyles.emptyState}>No sales data available</div>
          )}
        </div>

        {/* Check Reminders */}
        <div style={{...dashboardStyles.widgetCard, ...dashboardStyles.fullWidthCard}}>
          <h2 style={dashboardStyles.widgetTitle}>
            <div style={{...dashboardStyles.widgetIcon, background: 'linear-gradient(135deg, #ef4444, #dc2626)'}}>💳</div>
            Check Payment Reminders
          </h2>
          {dashboardData.checkReminders.length > 0 ? (
            <div>
              {dashboardData.checkReminders.map((check, index) => (
                <div 
                  key={check.id || index} 
                  style={getWidgetCardStyle('#ef4444')}
                  onMouseEnter={(e) => Object.assign(e.target.style, dashboardStyles.itemRowHover)}
                  onMouseLeave={(e) => Object.assign(e.target.style, { transform: 'translateX(0)', boxShadow: 'none' })}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{check.customerName}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Check #{check.checkNumber}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#ef4444' }}>${check.amount}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Due: {check.checkDate}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={dashboardStyles.emptyState}>No pending check payments</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;