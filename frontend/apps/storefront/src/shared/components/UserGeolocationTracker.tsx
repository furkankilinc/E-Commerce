import React, { useEffect } from 'react';
import { apiClient } from '../../shared/api/apiClient';
import { useAuth } from '../../features/auth/useAuth';

const UserGeolocationTracker: React.FC = () => {
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated || !("geolocation" in navigator)) {
            return;
        }

        const updateLocation = async (position: GeolocationPosition) => {
            try {
                const { latitude, longitude } = position.coords;
                await apiClient('/api/auth/user/location', {
                    method: 'PATCH',
                    body: JSON.stringify({ latitude, longitude })
                });
            } catch (err) {
                console.error("Failed to update user location:", err);
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            console.warn(`Geolocation error (${error.code}): ${error.message}`);
        };

        // Get initial position with extreme accuracy
        navigator.geolocation.getCurrentPosition(updateLocation, handleError, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        });

        // Watch position for updates
        const watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        });

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isAuthenticated]);

    return null;
};

export default UserGeolocationTracker;
