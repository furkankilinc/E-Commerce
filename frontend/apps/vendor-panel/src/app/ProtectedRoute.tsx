import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authStore } from '../features/auth/auth.store';

const ProtectedRoute: React.FC = () => {
    if (!authStore.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
