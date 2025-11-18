import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import config from './config';
import { AuthProvider } from './contexts/AuthContext';
import AccountingReportsPage from './pages/AccountingReportsSystem';
import CustomerManagementPage from './pages/CustomerManagementPage';
import DashboardPage from './pages/DashboardPage';
import InventoryManagementPage from './pages/InventoryManagementPage';
import LoginPage from './pages/LoginPage';
import ProductManagementPage from './pages/ProductManagementPage';
import SalesPage from './pages/SalesPage';
import SupplierManagementPage from './pages/SupplierManagementPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products" element={<ProductManagementPage />} />
              <Route path="suppliers" element={<SupplierManagementPage />} />
              <Route path="customers" element={<CustomerManagementPage />} />
              <Route path="inventory" element={<InventoryManagementPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="reports" element={<AccountingReportsPage />} />
            </Route>
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={config.ui.toastAutoClose}
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