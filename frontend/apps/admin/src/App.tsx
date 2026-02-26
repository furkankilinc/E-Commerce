import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLoginPage from './features/auth/AdminLoginPage';
import AdminLayout from './layout/AdminLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import CategoriesPage from './features/categories/pages/CategoriesPage';
import './styles/global.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
            {/* Placeholder pages — expand as needed */}
            <Route path="/products" element={<ComingSoon title="Ürünler" />} />
            <Route path="/orders" element={<ComingSoon title="Siparişler" />} />
            <Route path="/sellers" element={<ComingSoon title="Satıcılar" />} />
            <Route path="/users" element={<ComingSoon title="Kullanıcılar" />} />
            <Route path="/analytics" element={<ComingSoon title="Analitik" />} />
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
      </div>
    </Router>
  );
}

// Placeholder component for not-yet-built pages
const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="text-5xl mb-4">🚧</div>
      <h1 className="text-2xl font-extrabold text-admin-dark mb-2">{title}</h1>
      <p className="text-slate-400 font-medium">Bu sayfa yapım aşamasında.</p>
    </div>
  </div>
);

export default App;
