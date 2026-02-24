import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import VendorLoginPage from './features/auth/LoginPage';
import VendorRegisterPage from './features/auth/RegisterPage';
import VendorLayout from './app/layouts/VendorLayout';
import ProductCreatePage from './features/products/ProductCreatePage';
import ProtectedRoute from './app/ProtectedRoute';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<VendorLayout />}>
            <Route path="/dashboard" element={<div className="font-black text-4xl">DASHBOARD COMING SOON</div>} />
            <Route path="/products" element={<div className="font-black text-4xl">PRODUCT LIST COMING SOON</div>} />
            <Route path="/products/create" element={<ProductCreatePage />} />
            <Route path="/orders" element={<div className="font-black text-4xl">ORDERS COMING SOON</div>} />
            <Route path="/settings" element={<div className="font-black text-4xl">SETTINGS COMING SOON</div>} />
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
