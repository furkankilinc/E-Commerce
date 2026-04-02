import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './styles/globals.css';

import OfflineDetector from './shared/components/OfflineDetector';
import AdminLoginPage from './features/auth/AdminLoginPage';
import AdminLayout from './layout/AdminLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import OrdersPage from './features/orders/OrdersPage';
import CategoriesPage from './features/categories/pages/CategoriesPage';
import AttributesPage from './features/attributes/AttributesPage';
import ProductsPage from './features/products/ProductsPage';
import SellersPage from './features/sellers/pages/SellersPage';
import UsersPage from './features/users/UsersPage';
import AnalyticsPage from './features/analytics/AnalyticsPage';
import OrderDetailPage from './features/orders/OrderDetailPage';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="admin-app">
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<AdminLoginPage />} />

          {/* Main Panel */}
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/attributes" element={<AttributesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/sellers" element={<SellersPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

          {/* Default */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <OfflineDetector />
      </div>
    </Router>
  );
}

export default App;
