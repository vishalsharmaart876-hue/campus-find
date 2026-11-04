import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MapPin, X, ArrowRight } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const CampusLiveToast = () => {
  const { campusBroadcastItem, clearBroadcastItem } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (campusBroadcastItem) {
      const timer = setTimeout(() => {
        clearBroadcastItem();
      }, 9000); // Auto-dismiss after 9 seconds
      return () => clearTimeout(timer);
    }
  }, [campusBroadcastItem, clearBroadcastItem]);

  if (!campusBroadcastItem) return null;

  const isLost = campusBroadcastItem.type === 'lost';

  return (
    <div className="fixed top-20 right-4 z-[9999] max-w-sm w-full animate-in slide-in-from-top-4 duration-300">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-indigo-500/30 dark:border-indigo-500/40 p-4 space-y-3 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                isLost
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {isLost ? '🚨 Campus Lost Alert' : '🎁 Campus Found Alert'}
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          </div>

          <button
            onClick={clearBroadcastItem}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex gap-3 items-start">
          {campusBroadcastItem.images && campusBroadcastItem.images.length > 0 ? (
            <img
              src={campusBroadcastItem.images[0]}
              alt={campusBroadcastItem.title}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {campusBroadcastItem.title}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
              <span className="truncate">{campusBroadcastItem.locationName}</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Reported by {campusBroadcastItem.reportedByName || 'Campus Member'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            clearBroadcastItem();
            navigate(`/items/${campusBroadcastItem.id}`);
          }}
          className={`w-full py-2 text-xs font-bold text-white rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            isLost
              ? 'bg-rose-600 hover:bg-rose-500'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          <span>View Belonging Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default CampusLiveToast;
