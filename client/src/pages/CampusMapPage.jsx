import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Layers,
  Compass,
  Filter,
  ArrowRight,
  Navigation,
  ShieldCheck,
  Box,
  Map as MapIcon
} from 'lucide-react';
import CampusMap3D from '../components/map/CampusMap3D';
import CampusMap from '../components/map/CampusMap';
import api from '../services/api';

const CampusMapPage = () => {
  const [items, setItems] = useState([]);
  const [landmarks, setLandmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapEngine, setMapEngine] = useState('3d'); // '3d' | '2d'

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const [itemsRes, landmarksRes] = await Promise.all([
          api.get('/items?limit=50'),
          api.get('/campus/locations')
        ]);

        if (itemsRes.data.success) {
          setItems(itemsRes.data.items || []);
        }

        if (landmarksRes.data.success) {
          setLandmarks(landmarksRes.data.locations || []);
        }
      } catch (err) {
        console.error('Error loading map data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2">
            <Box className="w-3.5 h-3.5 text-purple-600 animate-spin-slow" />
            <span>Interactive 3D WebGL Campus Environment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Campus 3D Lost & Found Map
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explore 3D extruded campus buildings, rotate 360°, and turn on your live location to find belongings near you.
          </p>
        </div>

        {/* Engine Switcher (3D WebGL vs 2D Classic) */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setMapEngine('3d')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                mapEngine === '3d'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D WebGL Map</span>
            </button>
            <button
              onClick={() => setMapEngine('2d')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                mapEngine === '2d'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>2D Classic Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Selected Map Engine */}
      {loading ? (
        <div className="h-[640px] bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse"></div>
      ) : mapEngine === '3d' ? (
        <CampusMap3D
          items={items}
          landmarks={landmarks}
          height="640px"
          showControls={true}
          autoPromptLocation={true}
        />
      ) : (
        <CampusMap
          items={items}
          landmarks={landmarks}
          height="640px"
          showControls={true}
          autoPromptLocation={true}
        />
      )}
    </div>
  );
};

export default CampusMapPage;
