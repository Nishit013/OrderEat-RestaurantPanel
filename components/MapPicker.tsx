import React, { useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect, initialLat, initialLng }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  // Default to New Delhi if no location provided
  const defaultLat = 28.6139;
  const defaultLng = 77.2090;

  useEffect(() => {
    if (!mapRef.current || !(window as any).google) return;

    const lat = initialLat || defaultLat;
    const lng = initialLng || defaultLng;
    const center = { lat, lng };

    // Initialize Map
    const map = new (window as any).google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
    });

    // Initialize Marker
    const marker = new (window as any).google.maps.Marker({
      position: center,
      map,
      draggable: true,
      title: "Drag to set location",
      animation: (window as any).google.maps.Animation.DROP
    });

    // Listen for drag end
    marker.addListener("dragend", (e: any) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      onLocationSelect(newLat, newLng);
      map.panTo(e.latLng);
    });

    // Allow clicking on map to move marker
    map.addListener("click", (e: any) => {
        marker.setPosition(e.latLng);
        onLocationSelect(e.latLng.lat(), e.latLng.lng());
        map.panTo(e.latLng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
  }, []);

  // Update marker if props change (e.g. initial load)
  useEffect(() => {
      if(mapInstanceRef.current && markerRef.current && initialLat && initialLng) {
          const pos = { lat: initialLat, lng: initialLng };
          markerRef.current.setPosition(pos);
          mapInstanceRef.current.panTo(pos);
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
                const newPos = new (window as any).google.maps.LatLng(lat, lng);
                mapInstanceRef.current.panTo(newPos);
                mapInstanceRef.current.setZoom(17);
                markerRef.current.setPosition(newPos);
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
    <div className="relative h-72 w-full rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 shadow-inner group">
        <div ref={mapRef} className="w-full h-full bg-gray-100 dark:bg-gray-800" />
        
        <button 
            onClick={handleLocateMe}
            className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 z-20 transition-transform active:scale-95"
            type="button"
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400"/> 
            )}
            Detect My Location
        </button>
        
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs font-semibold text-gray-600 dark:text-gray-300 z-10 pointer-events-none">
            Drag marker to pinpoint exact entrance
        </div>
    </div>
  );
};