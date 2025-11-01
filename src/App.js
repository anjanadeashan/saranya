import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductManagementPage from './pages/ProductManagementPage';
import SupplierManagementPage from './pages/SupplierManagementPage';
import CustomerManagementPage from './pages/CustomerManagementPage';
import InventoryManagementPage from './pages/InventoryManagementPage';
import SalesPage from './pages/SalesPage';
import AccountingReportsPage from './pages/AccountingReportsSystem'
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products" element={<ProductManagementPage />} />
              <Route path="suppliers" element={<SupplierManagementPage />} />
              <Route path="customers" element={<CustomerManagementPage />} />
              <Route path="inventory" element={<InventoryManagementPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="reports" element={<AccountingReportsPage />} /> {/* NEW */}
            </Route>
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;