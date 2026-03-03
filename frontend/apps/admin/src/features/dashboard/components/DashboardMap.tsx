import React, { useEffect, useRef } from 'react';

interface Point {
    id: string;
    lat: number;
    lng: number;
    name: string;
    type: 'user' | 'merchant';
}

interface DashboardMapProps {
    points: Point[];
}

declare global {
    interface Window {
        google: any;
    }
}

const DashboardMap: React.FC<DashboardMapProps> = ({ points }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMap = useRef<any>(null);
    const markers = useRef<Map<string, any>>(new Map());

    useEffect(() => {
        if (!mapRef.current || !window.google) return;

        if (!googleMap.current) {
            googleMap.current = new window.google.maps.Map(mapRef.current, {
                center: { lat: 39.0, lng: 35.0 },
                zoom: 6,
                styles: mapDarkStyle,
                disableDefaultUI: true,
                zoomControl: true,
            });
        }

        const newPointIds = new Set(points.map(p => p.id));

        markers.current.forEach((marker, id) => {
            if (!newPointIds.has(id)) {
                marker.setMap(null);
                markers.current.delete(id);
            }
        });

        points.forEach(point => {
            const color = point.type === 'merchant' ? '#6366f1' : '#ec4899';
            let marker = markers.current.get(point.id);

            if (marker) {
                marker.setPosition({ lat: point.lat, lng: point.lng });
            } else {
                marker = new window.google.maps.Marker({
                    position: { lat: point.lat, lng: point.lng },
                    map: googleMap.current,
                    title: point.name,
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        fillColor: color,
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#FFFFFF',
                        scale: 7,
                    }
                });

                const infoWindow = new window.google.maps.InfoWindow({
                    content: `<div style="padding: 10px; font-family: Inter, sans-serif;">
                        <b style="color: #1e293b; display: block; margin-bottom: 2px;">${point.name}</b>
                        <div style="color: ${color}; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">
                            ${point.type === 'merchant' ? 'Satıcı' : 'Aktif Kullanıcı'}
                        </div>
                        <div style="font-size: 9px; color: #94a3b8;">${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}</div>
                    </div>`
                });

                marker.addListener('click', () => {
                    infoWindow.open(googleMap.current, marker);
                    googleMap.current.setZoom(18); // Pinpoint zoom
                    googleMap.current.panTo(marker.getPosition());
                });

                markers.current.set(point.id, marker);
            }
        });

    }, [points]);

    return (
        <div className="relative w-full h-[600px] rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl bg-slate-50">
            <div ref={mapRef} className="w-full h-full z-0" />

            <div className="absolute top-8 left-8 z-[10] bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] border border-white shadow-2xl pointer-events-none">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/30 border-2 border-white"></div>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Satıcılar</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-pink-500 shadow-lg shadow-pink-500/30 border-2 border-white"></div>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Aktif Kullanıcılar</span>
                    </div>
                </div>
            </div>

            {!window.google && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm z-[20]">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Google Maps Yükleniyor...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const mapDarkStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#f8fafc" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#64748b" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e2e8f0" }] },
    { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#f1f5f9" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] }
];

export default DashboardMap;
