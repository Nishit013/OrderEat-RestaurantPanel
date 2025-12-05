import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect, initialLat, initialLng }) => {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLocateMe = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            onLocationSelect(pos.coords.latitude, pos.coords.longitude);
            setLoading(false);
        },
        () => {
            alert("Could not access location");
            setLoading(false);
        }
    );
  };

  // Simulated drag end to just set dummy coordinates slightly tailored if needed
  // In a real map (Google Maps), this would use the map center.
  // Here we assume the user centers the view.
  const handleMouseUp = () => {
    setDragging(false);
    // In this simulated map, we don't actually change coordinates by dragging the image
    // because we don't have a real map engine. We rely on "Locate Me".
  };

  return (
    <div className="relative h-64 bg-gray-100 rounded-xl overflow-hidden group border border-gray-300">
        <img 
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
            alt="Map"
            className={`w-full h-full object-cover cursor-move transition-transform duration-200 ${dragging ? 'scale-110' : 'scale-100'}`}
            onMouseDown={() => setDragging(true)}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setDragging(false)}
        />
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        
        {/* Center Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
             <MapPin className="w-8 h-8 text-red-600 drop-shadow-md fill-current animate-bounce" />
             <div className="w-2 h-2 bg-black/30 rounded-full blur-[2px]"></div>
        </div>

        <button 
            onClick={handleLocateMe}
            className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 z-20"
            type="button"
        >
            {loading ? 'Locating...' : <><Navigation className="w-4 h-4 text-blue-600"/> Detect Location</>}
        </button>
    </div>
  );
};