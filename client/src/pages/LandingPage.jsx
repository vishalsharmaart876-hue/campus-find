import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  PlusCircle,
  MapPin,
  ShieldCheck,
  Cpu,
  QrCode,
  Award,
  ArrowRight,
  Sparkles,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ItemCard from '../components/items/ItemCard';
import api from '../services/api';

const LandingPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [recentFound, setRecentFound] = useState([]);
  const [emergencyLost, setEmergencyLost] = useState([]);
  const [stats, setStats] = useState({
    activeReports: 14,
    recoveredItems: 28,
    recoveryRate: 67,
    totalUsers: 140
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNoticeBoard = async () => {
      try {
        const res = await api.get('/items/notice-board');
        if (res.data.success) {
          setRecentFound(res.data.recentFound || []);
          setEmergencyLost(res.data.emergencyLost || []);
        }

        // Fetch public stats if available
        const itemsRes = await api.get('/items?limit=1');
        if (itemsRes.data.success) {
          setStats((prev) => ({
            ...prev,
            activeReports: itemsRes.data.total || prev.activeReports
          }));
        }
      } catch (err) {
        console.warn('Notice board load error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadNoticeBoard();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/80 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
            <span>AI-Assisted Computer Vision & Campus Geo-Location</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15]">
            Lost Something? <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600">Find It.</span><br />
            Found Something? <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Return It.</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            CampusFind is the official college Lost & Found platform. Secure ownership verification,
            visual AI similarity matching, and QR-code handoffs for a safe university community.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 max-w-2xl mx-auto relative flex items-center bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl shadow-indigo-500/5 border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500 transition-all"
          >
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item name (e.g. HP Laptop, Titan Watch, ID card, keys)..."
              className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/report-lost"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 transition-all duration-200 hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              Report Lost Item
            </Link>

            <Link
              to="/report-found"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              Report Found Item
            </Link>

            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
            >
              <MapPin className="w-4 h-4 text-indigo-500" />
              Explore Campus Map
            </Link>
          </div>
        </div>
      </section>

      {/* Emergency Lost ID Card Broadcast Bar */}
      {emergencyLost.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900 rounded-3xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-rose-600 text-white animate-pulse">
                  <CreditCard className="w-6 h-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                      Emergency Alert
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Active Lost Student / Faculty ID Cards
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    ID cards are crucial for campus entry and exam attendance. If found, please return immediately to Library Reception.
                  </p>
                </div>
              </div>

              <Link
                to="/emergency-id"
                className="px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-200 bg-white dark:bg-rose-900/40 hover:bg-rose-100 rounded-xl border border-rose-300 dark:border-rose-800 transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>Report Lost ID Card</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Emergency items mini grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-4 border-t border-rose-200/60 dark:border-rose-900/60">
              {emergencyLost.map((item) => (
                <Link
                  key={item._id}
                  to={`/items/${item._id}`}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 hover:border-rose-400 transition-colors flex items-center gap-3"
                >
                  <img
                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=150'}
                    alt={item.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Roll No: {item.idCardRollNo || 'On Card'} • {item.locationName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Live Campus Recovery Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 block">
              {stats.activeReports}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 block">
              Active Reports on Campus
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 block">
              {stats.recoveredItems}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 block">
              Items Returned to Owners
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-purple-600 dark:text-purple-400 block">
              {stats.recoveryRate}%
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 block">
              Successful Recovery Rate
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-500 block">
              {stats.totalUsers}+
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 block">
              Active Campus Members
            </span>
          </div>
        </div>
      </section>

      {/* Digital Notice Board (Recently Found Items) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Digital Notice Board
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Recently found items reported across campus waiting to be claimed.
            </p>
          </div>
          <Link
            to="/browse?type=found"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View all found items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentFound.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No recently found items reported.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentFound.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full">
            Seamless Workflow
          </span>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-3">
            How CampusFind Works
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Built with security, honesty, and privacy at its core.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
            <span className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm flex items-center justify-center mb-4">
              01
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              Report Belonging
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload photos, select category, pin campus location on OpenStreetMap, and set verification questions.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
            <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-extrabold text-sm flex items-center justify-center mb-4">
              02
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              AI Vision Matching
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              OpenCV algorithms extract HSV color distributions and ORB feature descriptors to suggest visual matches.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
            <span className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-extrabold text-sm flex items-center justify-center mb-4">
              03
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              Verify Ownership
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Claimant submits answers to hidden verification questions and proof description without revealing sensitive data publicly.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm flex items-center justify-center mb-4">
              04
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              QR Pickup & Rewards
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Approved claims generate a one-time Pickup QR pass. Scanning verifies return and awards +50 Karma Points!
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-white to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border border-indigo-100 dark:border-indigo-950">
            <div className="p-3 w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-md">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Modular AI Visual Matching
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Powered by Python and OpenCV. Computes image histograms and ORB feature descriptors to suggest matching lost and found reports automatically.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-100 dark:border-emerald-950">
            <div className="p-3 w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Secure Anonymous Messaging
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Communicate safely through in-app Socket.IO real-time chat. Phone numbers and personal emails are never exposed publicly.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-100 dark:border-amber-950">
            <div className="p-3 w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-4 shadow-md">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Good Samaritan Rewards
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every successfully returned item awards +50 Karma Points. Top students and faculty are recognized on the campus leaderboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
