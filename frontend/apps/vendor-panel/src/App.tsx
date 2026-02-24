import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import VendorLoginPage from './features/auth/LoginPage';
import VendorRegisterPage from './features/auth/RegisterPage';
import VendorLayout from './app/layouts/VendorLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import ProductListPage from './features/products/ProductListPage';
import ProductCreatePage from './features/products/ProductCreatePage';
import ProtectedRoute from './app/ProtectedRoute';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<VendorLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/create" element={<ProductCreatePage />} />
            <Route path="/orders" element={<div className="font-black text-4xl italic uppercase">Orders Coming Soon</div>} />
            <Route path="/settings" element={<div className="font-black text-4xl italic uppercase">Settings Coming Soon</div>} />
          </Route>
        </Route>
        <Route path="/register" element={<VendorRegisterPage />} />
        <Route path="/login" element={<VendorLoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
