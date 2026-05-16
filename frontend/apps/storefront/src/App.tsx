import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import MainLayout from './app/layouts/MainLayout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import OfflineDetector from './shared/components/OfflineDetector';

// Lazy load pages for Code Splitting (Reduces Main Bundle Size)
const HomePage = lazy(() => import('./features/home/HomePage'));
const ProductDetailPage = lazy(() => import('./features/product/ProductDetailPage'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));
const WishlistPage = lazy(() => import('./features/wishlist/pages/WishlistPage'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'));
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const CollectionsPage = lazy(() => import('./features/collections/pages/CollectionsPage'));
const CartPage = lazy(() => import('./features/cart/CartPage'));
const CheckoutPage = lazy(() => import('./features/checkout/CheckoutPage'));
const OrderDetailPage = lazy(() => import('./features/profile/OrderDetailPage'));

// Loading Fallback Component
const PageSuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-16 h-16 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageSuspenseFallback />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<HomePage />} />
            <Route path="/new" element={<HomePage />} />
            <Route path="/sale" element={<HomePage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/orders/:id" element={<OrderDetailPage />} />
            <Route path="/profile/:tabName" element={<ProfilePage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collections/:collectionId" element={<CollectionsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
          </Route>

          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
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
    </Router>
  );
}

export default App;
