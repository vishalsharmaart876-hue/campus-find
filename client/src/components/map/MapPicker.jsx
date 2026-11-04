import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Crosshair, CheckCircle2, AlertCircle } from 'lucide-react';

const markerIcon = L.divIcon({
  className: 'custom-picker-icon',
  html: `
    <div style="
      background-color: #4f46e5;
      width: 34px;
      height: 34px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.45);
      border: 2.5px solid #ffffff;
    ">
      <span style="
        transform: rotate(45deg);
        color: #ffffff;
        font-size: 15px;
        font-weight: bold;
      ">📍</span>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34]
});

// Helper component to center map on new location
const FlyToPickerPosition = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.flyTo(position, 17, { animate: true, duration: 1.2 });
    }
  }, [position, map]);
  return null;
};

const LocationMarker = ({ position, onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });

  return position ? <Marker position={position} icon={markerIcon} /> : null;
};

const MapPicker = ({ lat, lng, onLocationSelect, height = '250px' }) => {
  const currentPos = lat && lng ? [lat, lng] : [28.545, 77.1926];
  const [isLocating, setIsLocating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [hasCurrentLocation, setHasCurrentLocation] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatusMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setStatusMsg('Accessing GPS location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onLocationSelect(latitude, longitude);
        setIsLocating(false);
        setHasCurrentLocation(true);
        setStatusMsg('Pinned to your current location!');
        setTimeout(() => setStatusMsg(''), 4000);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setStatusMsg('Location permission denied. Please click on the map manually to pin.');
        } else {
          setStatusMsg('Unable to retrieve GPS coordinates.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-indigo-500" />
          Click on map to pin spot or use GPS
        </span>

        {/* Use My Current Location Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm transition-all"
        >
          <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Detecting...' : 'Use My Current Location'}</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[11px] font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
          {hasCurrentLocation ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner relative" style={{ height }}>
        <MapContainer
          center={currentPos}
          zoom={16}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <FlyToPickerPosition position={currentPos} />
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={currentPos}
            onLocationSelect={onLocationSelect}
          />
        </MapContainer>

        <div className="absolute bottom-2 right-2 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
          📍 {lat?.toFixed(5)}, {lng?.toFixed(5)}
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
