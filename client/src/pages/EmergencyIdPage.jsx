import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EmergencyIdPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState(user?.name || '');
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || '');
  const [department, setDepartment] = useState(user?.department || 'Computer Science & Engineering');
  const [locationName, setLocationName] = useState('Central Library or Cafeteria');
  const [campusBuilding, setCampusBuilding] = useState('Student Activity Center & Food Court');
  const [description, setDescription] = useState('Lost college identification card with lanyard.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rollNumber) {
      setError('Please provide the roll number or PRN on the card.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: `Lost College ID Card - ${studentName} (${rollNumber})`,
        category: 'ID & Cards',
        description: `Student ID card belonging to ${studentName} (${department}, Roll No: ${rollNumber}). ${description}`,
        locationName,
        campusBuilding,
        isEmergencyId: true,
        idCardRollNo: rollNumber,
        contactPreference: 'in_app_chat',
        dateTime: new Date()
      };

      const res = await api.post('/items/lost', payload);
      if (res.data.success) {
        navigate(`/items/${res.data.item._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error broadcasting emergency ID alert.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 animate-pulse">
          <CreditCard className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Emergency Lost ID Card Report
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Broadcast an urgent alert across the digital notice board so whoever finds your ID card can return it immediately.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Campus Security Notice</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Found ID cards turned in to security desks are held at Library Reception and Gate 1 Security Post.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Rapid Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Student / Cardholder Name
          </label>
          <input
            type="text"
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Roll Number / PRN printed on the ID Card <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="e.g. CS2024-042 or 21010304"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Department / Stream
          </label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Suspected Area Where Card Was Dropped
          </label>
          <input
            type="text"
            required
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. Near Cafeteria Billing Counter, or North Campus Bus Stand"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Additional Details (Lanyard color, card cover, etc.)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 mt-4"
        >
          {loading ? 'Broadcasting Alert...' : 'Broadcast Emergency Lost ID Card'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default EmergencyIdPage;
