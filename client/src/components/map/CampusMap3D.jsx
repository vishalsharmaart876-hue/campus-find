import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Link } from 'react-router-dom';
import {
  Box,
  Compass,
  Crosshair,
  Navigation,
  RotateCw,
  Sun,
  Layers,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Eye
} from 'lucide-react';

// Free 3D tile styles with vector 3D building extrusions (No API key needed)
const MAP_STYLES = {
  vector3d: 'https://tiles.openfreemap.org/styles/liberty',
  dark3d: 'https://tiles.openfreemap.org/styles/bright',
  satellite: {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = Math.round(R * c);

  if (distance < 1000) return `${distance}m away`;
  return `${(distance / 1000).toFixed(1)}km away`;
};

const CampusMap3D = ({
  items = [],
  landmarks = [],
  height = '620px',
  selectedItem = null,
  showControls = true,
  autoPromptLocation = true
}) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const orbitIntervalRef = useRef(null);

  const defaultCenter = [77.1926, 28.545]; // [lng, lat] for MapLibre
  const initialCenter = selectedItem?.coordinates?.lat
    ? [selectedItem.coordinates.lng, selectedItem.coordinates.lat]
    : defaultCenter;

  const [is3D, setIs3D] = useState(true);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'lost', 'found'
  const [mapStyleKey, setMapStyleKey] = useState('vector3d');
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showLocationBanner, setShowLocationBanner] = useState(autoPromptLocation);

  // Initialize MapLibre 3D WebGL instance
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[mapStyleKey] || MAP_STYLES.vector3d,
      center: initialCenter,
      zoom: selectedItem ? 17.5 : 16.2,
      pitch: 60, // 3D Tilt perspective!
      bearing: -25, // Angled 3D view
      maxPitch: 85,
      canvasContextAttributes: { antialias: true }
    });

    mapRef.current = map;

    // Add navigation controls (zoom, compass rotation)
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.on('load', () => {
      // Add 3D building extrusions layer if vector style
      add3DBuildingsLayer(map);
    });

    return () => {
      if (orbitIntervalRef.current) clearInterval(orbitIntervalRef.current);
      map.remove();
    };
  }, [mapStyleKey]);

  // Function to inject 3D extruded buildings
  const add3DBuildingsLayer = (map) => {
    try {
      const layers = map.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
      )?.id;

      // Check if 3D building layer already exists
      if (map.getLayer('3d-buildings')) return;

      // Add 3D extrusion layer if vector source contains building polygons
      map.addLayer(
        {
          id: '3d-buildings',
          source: 'openmaptiles',
          'source-layer': 'building',
          filter: ['!=', ['get', 'hide_3d'], true],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['get', 'render_height'],
              0,
              '#e0e7ff',
              20,
              '#c7d2fe',
              50,
              '#818cf8',
              100,
              '#4f46e5'
            ],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14,
              0,
              15.05,
              ['coalesce', ['get', 'render_height'], 15]
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14,
              0,
              15.05,
              ['coalesce', ['get', 'render_min_height'], 0]
            ],
            'fill-extrusion-opacity': 0.85
          }
        },
        labelLayerId
      );
    } catch (e) {
      console.log('3D buildings layer notice:', e.message);
    }
  };

  // Re-render 3D markers whenever items, landmarks, filterType, or userLocation updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filteredItems = items.filter((item) => {
      if (!item.coordinates || !item.coordinates.lat) return false;
      if (filterType === 'lost') return item.type === 'lost';
      if (filterType === 'found') return item.type === 'found';
      return true;
    });

    // 1. Add Campus Landmark 3D Beacon Markers
    landmarks.forEach((loc) => {
      const el = document.createElement('div');
      el.className = 'group cursor-pointer';
      el.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translateZ(20px);">
          <div style="
            background: linear-gradient(135deg, #6366f1, #4338ca);
            color: #ffffff;
            width: 38px;
            height: 38px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            font-weight: bold;
            box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.6), 0 0 0 2.5px #ffffff;
            transition: transform 0.2s ease;
          ">
            🏛️
          </div>
          <div style="
            width: 6px;
            height: 8px;
            background: #4338ca;
            clip-path: polygon(0 0, 100% 0, 50% 100%);
          "></div>
          <div style="
            width: 18px;
            height: 5px;
            background: rgba(0, 0, 0, 0.25);
            border-radius: 50%;
            filter: blur(1.5px);
          "></div>
        </div>
      `;

      const dist = userLocation
        ? calculateDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng)
        : null;

      const popupHTML = `
        <div style="padding: 14px; max-width: 240px; font-family: Inter, sans-serif;">
          <div style="display: flex; align-items: center; gap: 6px; color: #4f46e5; font-size: 11px; font-weight: bold; text-transform: uppercase;">
            🛡️ Campus Landmark
          </div>
          <h4 style="margin: 4px 0 2px 0; font-size: 14px; font-weight: bold; color: #0f172a;">
            ${loc.name}
          </h4>
          <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.4;">
            ${loc.description || 'Designated 24/7 college safe exchange point.'}
          </p>
          ${
            loc.safekeepingDeskAvailable
              ? '<span style="display: inline-block; margin-top: 6px; padding: 2px 8px; font-size: 10px; font-weight: bold; background: #dcfce7; color: #166534; border-radius: 6px;">24/7 Safekeeping Desk</span>'
              : ''
          }
          ${
            dist
              ? `<div style="margin-top: 6px; font-size: 11px; font-weight: bold; color: #2563eb;">📍 ${dist} from your location</div>`
              : ''
          }
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(popupHTML);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([loc.lng, loc.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // 2. Add Lost and Found 3D Floating Item Markers
    filteredItems.forEach((item) => {
      const isLost = item.type === 'lost';
      const bgColor = isLost
        ? 'linear-gradient(135deg, #f43f5e, #be123c)'
        : 'linear-gradient(135deg, #10b981, #047857)';
      const shadowColor = isLost ? 'rgba(244, 63, 94, 0.5)' : 'rgba(16, 185, 129, 0.5)';
      const label = isLost ? 'LOST' : 'FOUND';

      const el = document.createElement('div');
      el.className = 'group cursor-pointer animate-3d-float';
      el.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="
            background: ${bgColor};
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 10px 18px -4px ${shadowColor}, 0 0 0 2px #ffffff;
            white-space: nowrap;
          ">
            <span>${isLost ? '🔴' : '🟢'}</span>
            <span>${item.title.length > 18 ? item.title.substring(0, 16) + '...' : item.title}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid ${isLost ? '#be123c' : '#047857'};
          "></div>
          <div style="
            width: 22px;
            height: 6px;
            background: rgba(0, 0, 0, 0.28);
            border-radius: 50%;
            filter: blur(1.5px);
            margin-top: 1px;
          "></div>
        </div>
      `;

      const dist = userLocation
        ? calculateDistance(userLocation.lat, userLocation.lng, item.coordinates.lat, item.coordinates.lng)
        : null;

      const imgTag = item.images && item.images.length > 0
        ? `<img src="${item.images[0]}" style="width: 100%; height: 110px; object-fit: cover; border-top-left-radius: 14px; border-top-right-radius: 14px;" />`
        : '';

      const popupHTML = `
        <div style="max-width: 240px; font-family: Inter, sans-serif; overflow: hidden; border-radius: 14px;">
          ${imgTag}
          <div style="padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px; text-transform: uppercase; ${
                isLost ? 'background: #ffe4e6; color: #be123c;' : 'background: #d1fae5; color: #047857;'
              }">
                ${label}
              </span>
              <span style="font-size: 10px; color: #94a3b8;">${item.category}</span>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #0f172a; line-height: 1.3;">
              ${item.title}
            </h4>
            <p style="margin: 0; font-size: 11px; color: #64748b;">
              📍 ${item.locationName} (${item.campusBuilding})
            </p>
            ${
              dist
                ? `<div style="margin-top: 6px; font-size: 11px; font-weight: bold; color: #2563eb;">📏 ${dist} from you</div>`
                : ''
            }
            <a href="/items/${item._id}" style="
              display: block;
              margin-top: 10px;
              text-align: center;
              background: #4f46e5;
              color: #ffffff;
              padding: 6px 12px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: bold;
              text-decoration: none;
            ">
              View Item Details →
            </a>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(popupHTML);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([item.coordinates.lng, item.coordinates.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [items, landmarks, filterType, userLocation]);

  // Request & Enable Live Location
  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
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
        setIsLocating(false);
        setStatusMessage('Current campus location active!');
        setShowLocationBanner(false);

        const map = mapRef.current;
        if (map) {
          // Fly 3D camera to user's live position
          map.flyTo({
            center: [longitude, latitude],
            zoom: 17.5,
            pitch: 65, // Dramatic 3D angle
            bearing: -15,
            duration: 2000
          });

          // Add / Update User Live GPS Marker
          if (userMarkerRef.current) userMarkerRef.current.remove();

          const el = document.createElement('div');
          el.innerHTML = `
            <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 30px; height: 30px; background: rgba(59, 130, 246, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 16px; height: 16px; background: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 12px rgba(37, 99, 235, 0.9); z-index: 2;"></div>
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
            <div style="padding: 8px; text-align: center; font-family: Inter, sans-serif;">
              <strong style="color: #2563eb; font-size: 12px;">📍 Your Current Location</strong>
              <div style="font-size: 10px; color: #64748b;">Accurate to ~${Math.round(accuracy || 25)}m</div>
            </div>
          `);

          userMarkerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .setPopup(popup)
            .addTo(map);
        }

        setTimeout(() => setStatusMessage(''), 4000);
      },
      (err) => {
        setIsLocating(false);
        setStatusMessage('Location permission denied or unavailable.');
        setTimeout(() => setStatusMessage(''), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Toggle 3D perspective vs 2D flat top-down view
  const toggle3DMode = () => {
    const map = mapRef.current;
    if (!map) return;

    const next3D = !is3D;
    setIs3D(next3D);

    map.easeTo({
      pitch: next3D ? 60 : 0, // 60° tilt vs 0° top-down flat
      bearing: next3D ? -25 : 0,
      duration: 1200
    });
  };

  // 3D Auto-Rotate / Drone Orbit mode
  const toggleOrbit = () => {
    const map = mapRef.current;
    if (!map) return;

    if (isOrbiting) {
      if (orbitIntervalRef.current) clearInterval(orbitIntervalRef.current);
      setIsOrbiting(false);
    } else {
      setIsOrbiting(true);
      orbitIntervalRef.current = setInterval(() => {
        const currentBearing = map.getBearing();
        map.setBearing(currentBearing + 0.35);
      }, 50);
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl" style={{ height }}>
      {/* 3D Map Container Canvas */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Location Request Prompt Banner */}
      {showLocationBanner && !userLocation && (
        <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-3xl border border-indigo-200 dark:border-indigo-900 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              <Navigation className="w-4 h-4 animate-bounce" />
              <span>Enable 3D Campus Location?</span>
            </div>
            <button
              onClick={() => setShowLocationBanner(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Turn on location to center the 3D map on your exact coordinates and see lost belongings nearest to where you are standing right now.
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
              className="py-2 px-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Status Toast */}
      {statusMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 3D View Controls Toolbar (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
        {/* 3D Mode Toggle Button */}
        <button
          onClick={toggle3DMode}
          title={is3D ? 'Switch to 2D Top-Down View' : 'Switch to 3D Tilted View'}
          className={`px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all ${
            is3D
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-600/30'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>{is3D ? '3D View Active (60°)' : '2D Flat View'}</span>
        </button>

        {/* 3D Auto-Orbit Button */}
        <button
          onClick={toggleOrbit}
          title="Toggle 3D Drone Camera Orbit"
          className={`px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all ${
            isOrbiting
              ? 'bg-amber-500 text-white animate-pulse'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isOrbiting ? 'animate-spin' : ''}`} />
          <span>{isOrbiting ? 'Stop Orbit' : '3D Drone Orbit'}</span>
        </button>

        {/* Current Location GPS Button */}
        <button
          onClick={requestCurrentLocation}
          disabled={isLocating}
          title="Center on my current campus position"
          className={`px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all ${
            userLocation
              ? 'bg-blue-600 text-white'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : userLocation ? 'My GPS Active' : 'Turn On Location'}</span>
        </button>
      </div>

      {/* Filter Tabs (Top Right) */}
      {showControls && (
        <div className="absolute top-4 right-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg flex items-center gap-1 text-xs">
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

      {/* 3D Legend & Interaction Help (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hidden sm:flex items-center gap-3 text-[11px] font-medium text-slate-700 dark:text-slate-300">
        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
          <Box className="w-3.5 h-3.5" />
          3D Buildings
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          Lost Pin
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          Found Pin
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          💡 Right-click + drag to tilt & rotate 3D view
        </span>
      </div>
    </div>
  );
};

export default CampusMap3D;
