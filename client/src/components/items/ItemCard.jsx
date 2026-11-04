import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Eye,
  CheckCircle,
  Clock,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Tag
} from 'lucide-react';

const ItemCard = ({ item }) => {
  if (!item) return null;

  const isLost = item.type === 'lost';
  const isReturned = item.status === 'returned';
  const isClaimPending = item.status === 'claim_pending';
  const isClaimed = item.status === 'claimed';

  const defaultPhoto = isLost
    ? 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500'
    : 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500';

  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : defaultPhoto;

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-900 transition-all duration-300 flex flex-col">
      {/* Thumbnail Container */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={imageUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultPhoto;
          }}
        />

        {/* Type Badge (Lost vs Found) */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          <span
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider shadow-sm backdrop-blur-md ${
              isLost
                ? 'bg-rose-500/90 text-white'
                : 'bg-emerald-500/90 text-white'
            }`}
          >
            {isLost ? 'Lost' : 'Found'}
          </span>

          {item.isEmergencyId && (
            <span className="px-2 py-1 text-[10px] font-bold bg-amber-500 text-white rounded-lg flex items-center gap-1 shadow-sm">
              <CreditCard className="w-3 h-3" />
              ID Card
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {isReturned ? (
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-600 text-white flex items-center gap-1 shadow-sm">
              <CheckCircle className="w-3 h-3" />
              Returned
            </span>
          ) : isClaimPending ? (
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500 text-white flex items-center gap-1 shadow-sm">
              <Clock className="w-3 h-3" />
              Pending
            </span>
          ) : isClaimed ? (
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 text-white flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3 h-3" />
              Claimed
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-900/70 text-slate-200 backdrop-blur-md">
              Active
            </span>
          )}
        </div>

        {/* Category Pill at bottom of image */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-900/80 text-white rounded-md backdrop-blur-sm flex items-center gap-1">
            <Tag className="w-3 h-3 text-indigo-400" />
            {item.category}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-base">
            {item.title}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {/* Location & Building */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 truncate">
            <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate font-medium">{item.locationName}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400 truncate">{item.campusBuilding}</span>
          </div>

          {/* Date & Views */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(item.dateTime || item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {item.viewsCount || 0} views
            </span>
          </div>

          {/* Action Links */}
          <div className="pt-2">
            <Link
              to={`/items/${item._id}`}
              className="w-full inline-flex items-center justify-center py-2 px-3 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all duration-200"
            >
              View Full Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
