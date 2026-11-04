import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingUp,
  MapPin,
  ArrowRight,
  Activity,
  LogIn,
  LogOut,
  Globe
} from 'lucide-react';
import api from '../../services/api';

const AdminOverviewPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error loading admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading analytics metrics...</div>;
  }

  const stats = data?.stats || {};
  const categoryStats = data?.categoryStats || [];
  const locationStats = data?.locationStats || [];
  const recentPendingClaims = data?.recentPendingClaims || [];
  const recentLoginLogs = data?.recentLoginLogs || [];


  return (
    <div className="space-y-6">
      {/* KPI Cards Grid with Total Users, Active Users, Logins, and Reports */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered Users */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 block">Total Registered Users</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
            {stats.totalUsers || 0}
          </span>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
              {stats.studentCount || 0} Students
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-bold">
              {stats.facultyCount || 0} Faculty
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-bold">
              {stats.adminCount || 0} Admins
            </span>
          </div>
        </div>

        {/* Currently Active Users */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 block">Currently Active Users</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {stats.activeUsers || 1}
          </span>
          <span className="text-[10px] text-slate-400 block mt-2">
            Active in last 30 minutes • {stats.todayLoginsCount || 0} logins today
          </span>
        </div>

        {/* Recovered Items & Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 block">Recovered Belongings</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
            {stats.recoveredItems || 0}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-2">
            {stats.recoveryRate || 0}% Recovery Success Rate
          </span>
        </div>

        {/* Total Reports & Pending */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 block">Total Item Reports</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
            {stats.totalReports || 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-2">
            {stats.totalLost || 0} Lost / {stats.totalFound || 0} Found ({stats.pendingClaims || 0} claims pending)
          </span>
        </div>
      </div>


      {/* Analytics Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Category Breakdown
          </h3>
          <div className="space-y-2.5">
            {categoryStats.slice(0, 6).map((cat) => (
              <div key={cat._id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{cat._id}</span>
                  <span className="text-slate-400 font-mono">{cat.count} items</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, (cat.count / (stats.totalReports || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Locations Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Top Locations by Incidents
          </h3>
          <div className="space-y-2.5">
            {locationStats.map((loc) => (
              <div key={loc._id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    {loc._id}
                  </span>
                  <span className="text-slate-400 font-mono">{loc.count} reports</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${Math.min(100, (loc.count / (stats.totalReports || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Login and Logout Activities (MongoDB login_logs) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Recent Login & Logout Activities
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live authentication logs recorded in MongoDB collection: <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">login_logs</span>
              </p>
            </div>
          </div>
          <Link
            to="/admin/logs"
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <span>View all activity logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLoginLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center border border-dashed rounded-2xl">
            No login activity recorded yet. Logins and logouts will appear here live.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {recentLoginLogs.slice(0, 6).map((log) => {
              const isLogin = log.action === 'login';
              return (
                <div key={log._id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isLogin
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                      }`}
                    >
                      {isLogin ? <LogIn className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {log.userName || 'User'}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isLogin
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono truncate block">
                        {log.email}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {log.ip || '127.0.0.1'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Claims Requiring Admin Attention */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Pending Claims Verification Queue</span>
          </h3>
          <Link to="/admin/claims" className="text-xs font-semibold text-indigo-600 hover:underline">

            View all claims →
          </Link>
        </div>

        {recentPendingClaims.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No pending claims in the queue.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentPendingClaims.map((claim) => (
              <div key={claim._id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {claim.item?.title}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Claimant: {claim.claimant?.name} ({claim.claimant?.department})
                  </p>
                </div>
                <Link
                  to="/admin/claims"
                  className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 dark:bg-purple-950/60 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  Inspect Claim →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverviewPage;
