import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import VendorLoginPage from './features/auth/LoginPage';
import VendorRegisterPage from './features/auth/RegisterPage';
import VendorLayout from './app/layouts/VendorLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import ProductListPage from './features/products/ProductListPage';
import ProductCreatePage from './features/products/ProductCreatePage';
import DraftsPage from './features/products/DraftsPage';
import SettingsPage from './features/settings/SettingsPage';
import ProtectedRoute from './app/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css';

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <VendorLoginPage />,
    },
    {
      path: '/register',
      element: <VendorRegisterPage />,
    },
    {
      path: '/',
      element: <ProtectedRoute />,
      children: [
        {
          element: <VendorLayout />,
          children: [
            {
              index: true,
              element: <Navigate to="/dashboard" replace />,
            },
            {
              path: 'dashboard',
              element: <DashboardPage />,
            },
            {
              path: 'products',
              element: <ProductListPage />,
            },
            {
              path: 'products/create',
              element: <ProductCreatePage />,
            },
            {
              path: 'products/edit/:id',
              element: <ProductCreatePage />,
            },
            {
              path: 'products/drafts',
              element: <DraftsPage />,
            },
            {
              path: 'orders',
              element: <div className="font-black text-4xl italic uppercase">Orders Coming Soon</div>,
            },
            {
              path: 'settings',
              element: <SettingsPage />,
            },
          ],
        },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/login" replace />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);

function App() {
  return (
    <>
      <RouterProvider router={router} />
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
    </>
  );
}

export default App;
