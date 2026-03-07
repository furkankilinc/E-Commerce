import React, { useEffect } from 'react';
import { apiClient } from '../../shared/api/apiClient';

const GeolocationTracker: React.FC = () => {
    useEffect(() => {
        if (!("geolocation" in navigator)) {
            console.log("Geolocation is not available");
            return;
        }

        const updateLocation = async (position: GeolocationPosition) => {
            try {
                const { latitude, longitude } = position.coords;
                await apiClient.fetch('/api/auth/merchant/location', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ latitude, longitude })
                });
            } catch (err) {
                console.error("Failed to update merchant location:", err);
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            console.warn(`Geolocation error (${error.code}): ${error.message}`);
        };

        // Get initial position with extreme accuracy
        navigator.geolocation.getCurrentPosition(updateLocation, handleError, {
            enableHighAccuracy: true,
            timeout: 15000, // Wait up to 15 seconds for GPS lock
            maximumAge: 0   // Force fresh location
        });

        // Watch position for real-time updates
        const watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0 // Never used cached data
        });

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return null; // Side-effect only component
};

export default GeolocationTracker;
