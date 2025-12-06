import React, { useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

declare global {
  interface Window {
    L: any;
  }
}

export const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect, initialLat, initialLng }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  // Default to New Delhi if no location provided
  const defaultLat = 28.6139;
  const defaultLng = 77.2090;

  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;
    if (mapInstanceRef.current) return; // Prevent double init

    // Fix Leaflet's default icon path issues in some build environments
    delete (window.L.Icon.Default.prototype as any)._getIconUrl;
    window.L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const lat = initialLat || defaultLat;
    const lng = initialLng || defaultLng;

    // Initialize Map
    const map = window.L.map(mapContainerRef.current).setView([lat, lng], 15);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Initialize Marker
    const marker = window.L.marker([lat, lng], { draggable: true }).addTo(map);
    
    markerRef.current = marker;
    mapInstanceRef.current = map;

    // Drag End Event
    marker.on('dragend', async function(e: any) {
        const position = marker.getLatLng();
        await fetchAddress(position.lat, position.lng);
    });

    // Map Click Event
    map.on('click', async function(e: any) {
        marker.setLatLng(e.latlng);
        await fetchAddress(e.latlng.lat, e.latlng.lng);
    });

    // Clean up
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  // Handle props update
  useEffect(() => {
      if (mapInstanceRef.current && markerRef.current && initialLat && initialLng) {
          const cur = markerRef.current.getLatLng();
          // Only update if significantly different to avoid infinite loops
          if (Math.abs(cur.lat - initialLat) > 0.0001 || Math.abs(cur.lng - initialLng) > 0.0001) {
              const newLatLng = [initialLat, initialLng];
              markerRef.current.setLatLng(newLatLng);
              mapInstanceRef.current.setView(newLatLng, 15);
          }
      }
  }, [initialLat, initialLng]);

  const fetchAddress = async (lat: number, lng: number) => {
      try {
          // Use OpenStreetMap Nominatim API for Reverse Geocoding (Free)
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          const address = data.display_name;
          onLocationSelect(lat, lng, address);
      } catch (error) {
          console.error("Geocoding error:", error);
          // Fallback: just send coords if address lookup fails
          onLocationSelect(lat, lng);
      }
  };

  const handleLocateMe = () => {
      if (!navigator.geolocation) {
          alert("Geolocation not supported by this browser.");
          return;
      }
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
          async (pos) => {
              const { latitude, longitude } = pos.coords;
              if (mapInstanceRef.current && markerRef.current) {
                  const latLng = [latitude, longitude];
                  markerRef.current.setLatLng(latLng);
                  mapInstanceRef.current.setView(latLng, 17);
                  await fetchAddress(latitude, longitude);
              }
              setLoading(false);
          },
          (err) => {
              console.error(err);
              let msg = "Could not access location.";
              if (err.code === 1) msg = "Location permission denied.";
              alert(msg);
              setLoading(false);
          },
          { enableHighAccuracy: true }
      );
  };

  return (
      <div className="relative h-72 w-full rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 shadow-inner z-0">
          <div ref={mapContainerRef} className="w-full h-full z-0 bg-gray-100 dark:bg-gray-800" />
          
          <button 
            type="button"
            onClick={handleLocateMe}
            className="absolute bottom-4 right-4 z-[500] bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 hover:scale-105 transition border border-gray-200 dark:border-gray-700"
          >
              {loading ? (
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                  <Navigation className="w-4 h-4"/>
              )}
              Use My Location
          </button>
          
          <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs font-semibold text-gray-600 dark:text-gray-300 z-[500] pointer-events-none">
              Drag marker to set exact location
          </div>
      </div>
  );
};