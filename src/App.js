import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
<<<<<<< HEAD
=======
import ProtectedRoute from './components/ProtectedRoute';
>>>>>>> master
import DashboardPage from './pages/DashboardPage';
import ProductManagementPage from './pages/ProductManagementPage';
import SupplierManagementPage from './pages/SupplierManagementPage';
import CustomerManagementPage from './pages/CustomerManagementPage';
import InventoryManagementPage from './pages/InventoryManagementPage';
import SalesPage from './pages/SalesPage';
<<<<<<< HEAD
import ProtectedRoute from './components/ProtectedRoute';
=======
import AccountingReportsPage from './pages/AccountingReportsSystem'
>>>>>>> master

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
<<<<<<< HEAD
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
=======
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
>>>>>>> master
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products" element={<ProductManagementPage />} />
              <Route path="suppliers" element={<SupplierManagementPage />} />
              <Route path="customers" element={<CustomerManagementPage />} />
              <Route path="inventory" element={<InventoryManagementPage />} />
              <Route path="sales" element={<SalesPage />} />
<<<<<<< HEAD
=======
              <Route path="reports" element={<AccountingReportsPage />} />
>>>>>>> master
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