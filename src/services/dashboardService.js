import api from './api';

export const dashboardService = {
  // Get dashboard summary
  getSummary: () => api.get('/dashboard/summary'),
  
  // Get low stock alerts
  getLowStockAlerts: () => api.get('/dashboard/low-stock-alerts'),
  
  // Get check date reminders
  getCheckReminders: () => api.get('/dashboard/check-reminders'),
  
  // Get top selling products
  getTopProducts: () => api.get('/dashboard/top-products'),
  
  // Get sales vs purchases data
  getSalesVsPurchases: () => api.get('/dashboard/sales-vs-purchases'),
  
  // Get complete dashboard data
  getCompleteData: async () => {
    const [
      summary,
      lowStock,
      checkReminders,
      topProducts,
      salesVsPurchases
    ] = await Promise.all([
      dashboardService.getSummary(),
      dashboardService.getLowStockAlerts(),
      dashboardService.getCheckReminders(),
      dashboardService.getTopProducts(),
      dashboardService.getSalesVsPurchases()
    ]);
    
    return {
      ...summary.data,
      lowStockAlerts: lowStock.data,
      checkDateReminders: checkReminders.data,
      topSellingProducts: topProducts.data,
      salesVsPurchases: salesVsPurchases.data
    };
  }
};

export default dashboardService;