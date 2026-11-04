import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const AdminCampusLocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // New location form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Academic');
  const [lat, setLat] = useState('28.545');
  const [lng, setLng] = useState('77.1926');
  const [description, setDescription] = useState('');
  const [safekeepingDeskAvailable, setSafekeepingDeskAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campus/locations');
      if (res.data.success) {
        setLocations(res.data.locations || []);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!name || !lat || !lng) return;

    setSubmitting(true);
    try {
      const res = await api.post('/campus/locations', {
        name,
        code,
        category,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        description,
        safekeepingDeskAvailable
      });
      if (res.data.success) {
        setName('');
        setCode('');
        setDescription('');
        fetchLocations();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating campus landmark');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campus landmark?')) return;
    try {
      await api.delete(`/campus/locations/${id}`);
      setLocations(locations.filter((l) => l._id !== id));
    } catch (err) {
      alert('Error deleting landmark');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Campus Map Landmarks & Safekeeping Desks
        </h2>
        <p className="text-xs text-slate-500">
          Configure physical buildings and official safe exchange points displayed on the Leaflet map.
        </p>
      </div>

      {/* Add New Location Form */}
      <form onSubmit={handleAddLocation} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-indigo-600" />
          <span>Add New Campus Landmark</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Building Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Technology Tower B"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Building Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. TT-B"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            >
              <option value="Academic">Academic</option>
              <option value="Library">Library</option>
              <option value="Hostel">Hostel</option>
              <option value="Sports">Sports</option>
              <option value="Food & Dining">Food & Dining</option>
              <option value="Gate/Security">Gate/Security</option>
              <option value="Administration">Administration</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              required
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              required
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={safekeepingDeskAvailable}
                onChange={(e) => setSafekeepingDeskAvailable(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>Has 24/7 Safekeeping Desk</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-colors"
        >
          {submitting ? 'Adding...' : 'Save Campus Landmark'}
        </button>
      </form>

      {/* Locations List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Existing Landmarks ({locations.length})
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {locations.map((loc) => (
            <div
              key={loc._id}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-start justify-between gap-3 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {loc.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {loc.category} • [{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}]
                </p>
                {loc.safekeepingDeskAvailable && (
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded">
                    Safekeeping Desk Active
                  </span>
                )}
              </div>

              <button
                onClick={() => handleDelete(loc._id)}
                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"
                title="Delete landmark"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminCampusLocationsPage;
