import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { adminAuthStore } from '../features/auth/admin.store';
import { apiClient } from '../shared/api/apiClient';

const AdminLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    // Session Check & Proactive Refresh
    useEffect(() => {
        if (!adminAuthStore.isAuthenticated()) {
            navigate('/login');
            return;
        }

        const interval = setInterval(async () => {
            try {
                const rfToken = adminAuthStore.getRefreshToken();
                if (rfToken) {
                    // Try to refresh proactively
                    const res = await apiClient.post('/api/auth/admin/refresh', { refreshToken: rfToken });
                    if (!res.ok) {
                        adminAuthStore.clearAuth();
                        navigate('/login');
                    }
                }
            } catch (err) {
                console.error('Proactive refresh failed', err);
            }
        }, 10 * 60 * 1000); // 10 minutes

        return () => clearInterval(interval);
    }, [navigate]);

    return (
        <div className="flex min-h-screen bg-admin-bg">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
