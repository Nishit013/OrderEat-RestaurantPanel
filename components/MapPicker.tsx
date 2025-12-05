import React, { useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect, initialLat, initialLng }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  // Default to New Delhi
  const defaultLat = 28.6139;
  const defaultLng = 77.2090;

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Check if Leaflet is loaded
    const L = (window as any).L;
    if (!L) {
        console.error("Leaflet not loaded");
        return;
    }

    const lat = initialLat || defaultLat;
    const lng = initialLng || defaultLng;

    // Initialize Map
    const map = L.map(mapContainerRef.current).setView([lat, lng], 15);
    
    // Add OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Initialize Marker
    // Fix marker icon path issue in some build environments/CDNs
    const defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const marker = L.marker([lat, lng], { draggable: true, icon: defaultIcon }).addTo(map);

    // Event: Drag End
    marker.on('dragend', function(event: any) {
        const position = event.target.getLatLng();
        onLocationSelect(position.lat, position.lng);
        map.panTo(position);
    });

    // Event: Map Click
    map.on('click', function(e: any) {
        marker.setLatLng(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
        map.panTo(e.latlng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Fix for map not rendering correctly in some flex containers initially
    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  // Update marker position if props change externally
  useEffect(() => {
      if (mapInstanceRef.current && markerRef.current && initialLat && initialLng) {
          const L = (window as any).L;
          const newLatLng = new L.LatLng(initialLat, initialLng);
          markerRef.current.setLatLng(newLatLng);
          mapInstanceRef.current.panTo(newLatLng);
      }
  }, [initialLat, initialLng]);

  const handleLocateMe = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            
            if (mapInstanceRef.current && markerRef.current) {
                const L = (window as any).L;
                const newLatLng = new L.LatLng(lat, lng);
                markerRef.current.setLatLng(newLatLng);
                mapInstanceRef.current.setView(newLatLng, 17);
                onLocationSelect(lat, lng);
            }
            setLoading(false);
        },
        () => {
            alert("Could not access location");
            setLoading(false);
        },
        { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative h-72 w-full rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 shadow-inner group z-0">
        <div ref={mapContainerRef} className="w-full h-full bg-gray-100 dark:bg-gray-800 z-0" />
        
        <button 
            onClick={handleLocateMe}
            className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 z-[400] transition-transform active:scale-95"
            type="button"
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400"/> 
            )}
            Detect My Location
        </button>
        
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs font-semibold text-gray-600 dark:text-gray-300 z-[400] pointer-events-none">
            Drag marker to pinpoint exact entrance
        </div>
    </div>
  );
};
