import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import {
  Layers,
  MapPin,
  Eye,
  Compass,
  ShieldCheck,
  Navigation,
  Crosshair,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

// Custom Map Auto-center and smooth flying controller
const MapFlyController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 16, {
        animate: true,
        duration: 1.5
      });
    }
  }, [center, zoom, map]);
  return null;
};

// Custom SVG HTML marker icons
const createCustomMarker = (color, label) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid #ffffff;
      ">
        <span style="
          transform: rotate(45deg);
          color: #ffffff;
          font-size: 11px;
          font-weight: bold;
        ">${label || '•'}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Pulsing User Live Location Icon
const userLiveLocationIcon = L.divIcon({
  className: 'user-live-location-icon',
  html: `
    <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 24px; height: 24px; background: rgba(59, 130, 246, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 14px; height: 14px; background: #2563eb; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 0 8px rgba(37, 99, 235, 0.8); z-index: 2;"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14]
});

const lostIcon = createCustomMarker('#f43f5e', 'L');
const foundIcon = createCustomMarker('#10b981', 'F');
const landmarkIcon = createCustomMarker('#6366f1', '★');

// Haversine formula to compute distance in meters between user and item
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = Math.round(R * c);

  if (distance < 1000) {
    return `${distance} meters away`;
  }
  return `${(distance / 1000).toFixed(1)} km away`;
};

const CampusMap = ({
  items = [],
  landmarks = [],
  height = '500px',
  selectedItem = null,
  showControls = true,
  autoPromptLocation = true
}) => {
  const defaultCenter = [28.545, 77.1926];
  const [filterType, setFilterType] = useState('all'); // 'all', 'lost', 'found'
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(
    selectedItem?.coordinates?.lat
      ? [selectedItem.coordinates.lat, selectedItem.coordinates.lng]
      : defaultCenter
  );
  const [mapZoom, setMapZoom] = useState(selectedItem ? 17 : 16);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(''); // 'prompt', 'enabled', 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [showLocationBanner, setShowLocationBanner] = useState(false);

  // Check if we should prompt for location on initial load
  useEffect(() => {
    if (autoPromptLocation && !userLocation && navigator.geolocation) {
      setShowLocationBanner(true);
    }
  }, [autoPromptLocation]);

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setStatusMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setStatusMessage('Accessing campus GPS location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const newLocation = { lat: latitude, lng: longitude, accuracy: accuracy || 25 };
        setUserLocation(newLocation);
        setMapCenter([latitude, longitude]);
        setMapZoom(17);
        setIsLocating(false);
        setLocationStatus('enabled');
        setStatusMessage('Current campus location enabled!');
        setShowLocationBanner(false);

        // Clear success message after 4s
        setTimeout(() => setStatusMessage(''), 4000);
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus('error');
        if (err.code === err.PERMISSION_DENIED) {
          setStatusMessage('Location access was denied in browser permissions. You can still browse campus pins manually.');
        } else {
          setStatusMessage('Unable to retrieve current GPS position. Try moving closer to open areas.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000
      }
    );
  };

  const filteredItems = items.filter((item) => {
    if (!item.coordinates || !item.coordinates.lat) return false;
    if (filterType === 'lost') return item.type === 'lost';
    if (filterType === 'found') return item.type === 'found';
    return true;
  });

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl" style={{ height }}>
      {/* Location Request Banner Modal / Overlay if prompted */}
      {showLocationBanner && !userLocation && (
        <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/80 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              <Navigation className="w-4 h-4 animate-bounce" />
              <span>Enable Current Campus Location?</span>
            </div>
            <button
              onClick={() => setShowLocationBanner(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Turn on location to center the map on your exact spot and see lost or found belongings nearest to you on campus.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={requestCurrentLocation}
              disabled={isLocating}
              className="flex-1 py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Crosshair className="w-3.5 h-3.5" />
              {isLocating ? 'Locating...' : 'Turn On Location'}
            </button>
            <button
              onClick={() => setShowLocationBanner(false)}
              className="py-2 px-3 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Floating Status Notification */}
      {statusMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in">
          {locationStatus === 'enabled' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Map Filter Controls Overlay (Top Right) */}
      {showControls && (
        <div className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg flex items-center gap-1 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilterType('lost')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1 ${
              filterType === 'lost'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
            Lost
          </button>
          <button
            onClick={() => setFilterType('found')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1 ${
              filterType === 'found'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            Found
          </button>
        </div>
      )}

      {/* Locate Me / GPS Quick Action Button (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <button
          onClick={requestCurrentLocation}
          disabled={isLocating}
          title="Turn on current location / Center on me"
          className={`px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg backdrop-blur-md transition-all ${
            userLocation
              ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/30'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin text-blue-500' : userLocation ? 'text-white' : 'text-indigo-600'}`} />
          <span>
            {isLocating
              ? 'Locating...'
              : userLocation
              ? 'Live Location Active'
              : 'Turn On Location'}
          </span>
        </button>
      </div>

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hidden sm:flex items-center gap-3 text-[11px] font-medium text-slate-700 dark:text-slate-300">
        {userLocation && (
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            You Are Here
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          Lost Pin
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          Found Pin
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          Campus Safe Zone
        </span>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <MapFlyController center={mapCenter} zoom={mapZoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Current Location Marker & Accuracy Halo Circle */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={userLocation.accuracy || 25}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#60a5fa',
                fillOpacity: 0.15,
                weight: 1.5
              }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLiveLocationIcon}
            >
              <Popup>
                <div className="p-3 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-blue-600 font-bold text-xs">
                    <Crosshair className="w-4 h-4" />
                    <span>Your Current Location</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Live GPS position on campus
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Accurate to ~{Math.round(userLocation.accuracy)}m
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Campus Landmark Markers */}
        {(filterType === 'all' || filterType === 'landmarks') &&
          landmarks.map((loc) => {
            const distanceText = userLocation
              ? calculateDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng)
              : null;

            return (
              <Marker
                key={loc._id || loc.name}
                position={[loc.lat, loc.lng]}
                icon={landmarkIcon}
              >
                <Popup>
                  <div className="p-3 w-56 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-600 dark:text-indigo-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Campus Landmark</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {loc.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                      {loc.description || 'Designated college safe exchange point.'}
                    </p>
                    {loc.safekeepingDeskAvailable && (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded">
                        24/7 Safekeeping Desk
                      </span>
                    )}
                    {distanceText && (
                      <div className="pt-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        <span>{distanceText}</span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Item Markers */}
        {filteredItems.map((item) => {
          const distanceText = userLocation
            ? calculateDistance(
                userLocation.lat,
                userLocation.lng,
                item.coordinates.lat,
                item.coordinates.lng
              )
            : null;

          return (
            <Marker
              key={item._id}
              position={[item.coordinates.lat, item.coordinates.lng]}
              icon={item.type === 'lost' ? lostIcon : foundIcon}
            >
              <Popup>
                <div className="w-60 overflow-hidden">
                  {item.images && item.images.length > 0 && (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-28 object-cover"
                    />
                  )}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          item.type === 'lost'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.category}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span className="truncate">{item.locationName}</span>
                    </p>

                    {distanceText && (
                      <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        <span>{distanceText}</span>
                      </div>
                    )}

                    <Link
                      to={`/items/${item._id}`}
                      className="block text-center py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors mt-2"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default CampusMap;
