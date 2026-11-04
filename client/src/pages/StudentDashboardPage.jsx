import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  Clock,
  CheckCircle2,
  Award,
  Sparkles,
  QrCode,
  MapPin,
  Search,
  MessageSquare,
  AlertCircle,
  CreditCard,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import QRCodeModal from '../components/claims/QRCodeModal';
import api from '../services/api';

const StudentDashboardPage = () => {
  const { user } = useAuth();

  const [myReports, setMyReports] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  // QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [reportsRes, claimsRes] = await Promise.all([
          api.get('/items/my-reports'),
          api.get('/claims/my-claims')
        ]);

        if (reportsRes.data.success) {
          setMyReports(reportsRes.data.items || []);
        }

        if (claimsRes.data.success) {
          setMyClaims(claimsRes.data.claims || []);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const activeReportsCount = myReports.filter((r) => r.status === 'active' || r.status === 'claim_pending').length;
  const returnedCount = myReports.filter((r) => r.status === 'returned' || r.status === 'resolved').length;
  const approvedClaims = myClaims.filter((c) => c.status === 'approved');

  const pendingVerificationRequests = myReports.filter(
    (r) => r.status === 'verification_pending' && r.foundRequest?.status === 'pending_approval'
  );
  const pendingHandoverRequests = myReports.filter(
    (r) => r.status === 'handover_pending'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-700/60 px-3 py-1 rounded-full inline-block border border-indigo-500/30">
              Campus Member Portal • {user?.role?.toUpperCase()}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xs text-indigo-200 max-w-xl">
              {user?.department} • Roll No: {user?.rollNumber || 'Active'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shrink-0">
            <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-indigo-200 block">
                Campus Karma
              </span>
              <span className="text-2xl font-extrabold text-amber-300">
                {user?.rewardPoints || 0} Pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              My Active Reports
            </span>
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {activeReportsCount}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Claims Submitted
            </span>
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {myClaims.length}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Items Returned
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {returnedCount}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Approved Claims
            </span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <QrCode className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {approvedClaims.length}
          </span>
        </div>
      </div>

      {/* Approved Pickup QR Pass Ready Banner */}
      {approvedClaims.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-amber-100/50 to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-300 dark:border-amber-800 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500 text-white animate-bounce">
                <QrCode className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pickup QR Code Ready for Collection!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Your claim for "{approvedClaims[0].item?.title}" was approved. Present your pass to collect it.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedClaim(approvedClaims[0]);
                setQrModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors shrink-0 flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              <span>View Pickup Pass</span>
            </button>
          </div>
        </div>
      )}

      {/* Found Item Request Received Banner */}
      {pendingVerificationRequests.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-purple-100/40 to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 border border-purple-300 dark:border-purple-800 space-y-3 shadow-md animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-purple-600 text-white animate-pulse">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Action Required: {pendingVerificationRequests.length} Found Item Request Awaiting Your Approval!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Someone reported finding your lost item "{pendingVerificationRequests[0].title}" (Complaint ID: {pendingVerificationRequests[0].complaintId || pendingVerificationRequests[0].itemCode}).
                </p>
              </div>
            </div>
            <Link
              to="/my-reports"
              className="px-4 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>Review & Approve</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Handover in Progress Banner */}
      {pendingHandoverRequests.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-amber-100/40 to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-300 dark:border-amber-800 space-y-3 shadow-md animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-amber-500 text-white">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Handover in Progress: {pendingHandoverRequests.length} Item(s)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Have you received "{pendingHandoverRequests[0].title}"? Confirm receipt to resolve the complaint and award Karma points.
                </p>
              </div>
            </div>
            <Link
              to="/my-reports"
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>Confirm Receipt</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          to="/report-lost"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-400 transition-colors flex items-center gap-3 shadow-sm group"
        >
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Report Lost</h4>
            <p className="text-[10px] text-slate-400">Post missing item</p>
          </div>
        </Link>

        <Link
          to="/report-found"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 transition-colors flex items-center gap-3 shadow-sm group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Report Found</h4>
            <p className="text-[10px] text-slate-400">Earn +50 Karma</p>
          </div>
        </Link>

        <Link
          to="/emergency-id"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 transition-colors flex items-center gap-3 shadow-sm group"
        >
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Lost ID Card</h4>
            <p className="text-[10px] text-slate-400">Instant alert</p>
          </div>
        </Link>

        <Link
          to="/map"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-colors flex items-center gap-3 shadow-sm group"
        >
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 group-hover:scale-105 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Campus Map</h4>
            <p className="text-[10px] text-slate-400">View pins</p>
          </div>
        </Link>
      </div>

      {/* My Reports & Claims Summary Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reports */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>My Reported Items</span>
              <span className="text-xs text-slate-400 font-normal">({myReports.length})</span>
            </h3>
            <Link to="/my-reports" className="text-xs font-semibold text-indigo-600 hover:underline">
              View all →
            </Link>
          </div>

          {myReports.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              You haven't reported any lost or found belongings yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
              {myReports.slice(0, 4).map((item) => (
                <div key={item._id} className="pt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100'}
                      alt={item.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <Link
                        to={`/items/${item._id}`}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 truncate block"
                      >
                        {item.title}
                      </Link>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.category} • {item.locationName}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                      item.type === 'lost' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Submitted Claims */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>My Claims & Status</span>
              <span className="text-xs text-slate-400 font-normal">({myClaims.length})</span>
            </h3>
            <Link to="/my-reports" className="text-xs font-semibold text-indigo-600 hover:underline">
              Manage claims →
            </Link>
          </div>

          {myClaims.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              You haven't filed any claims yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
              {myClaims.slice(0, 4).map((claim) => (
                <div key={claim._id} className="pt-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/items/${claim.item?._id}`}
                      className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 truncate block"
                    >
                      {claim.item?.title || 'Claimed Belonging'}
                    </Link>
                    <p className="text-[11px] text-slate-400 truncate">
                      Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        claim.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : claim.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {claim.status}
                    </span>

                    {claim.status === 'approved' && (
                      <button
                        onClick={() => {
                          setSelectedClaim(claim);
                          setQrModalOpen(true);
                        }}
                        className="p-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        title="View QR Code Pass"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Pass Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        claim={selectedClaim}
        item={selectedClaim?.item}
      />
    </div>
  );
};

export default StudentDashboardPage;
