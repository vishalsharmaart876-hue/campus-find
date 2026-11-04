import React, { useState, useEffect } from 'react';
import {
  LogIn,
  LogOut,
  Search,
  RefreshCw,
  Shield,
  Activity,
  Clock,
  Globe,
  Filter,
  CheckCircle2,
  Calendar,
  UserCheck
} from 'lucide-react';
import api from '../../services/api';

const AdminLoginLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalLogins, setTotalLogins] = useState(0);
  const [totalLogouts, setTotalLogouts] = useState(0);

  const fetchLogs = async (targetPage = page) => {
    setLoading(true);
    try {
      const params = { page: targetPage, limit: 15 };
      if (actionFilter !== 'all') params.action = actionFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/admin/login-logs', { params });
      if (res.data.success) {
        setLogs(res.data.logs || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalRecords(res.data.total || 0);
        setTotalLogins(res.data.totalLogins || 0);
        setTotalLogouts(res.data.totalLogouts || 0);
      }
    } catch (err) {
      console.error('Error fetching login logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchLogs(newPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Login & Logout Activity Tracking</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  MongoDB login_logs
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit trail of all student, faculty, and administrative session events recorded in database.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchLogs(page)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* KPI Cards for Login/Logout Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Total Logins Recorded
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalLogins}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Total Logouts Recorded
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalLogouts}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Total Activity Records
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalRecords}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Action Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Action:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActionFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                actionFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Events ({totalRecords})
            </button>
            <button
              onClick={() => setActionFilter('login')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                actionFilter === 'login'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Logins
            </button>
            <button
              onClick={() => setActionFilter('logout')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                actionFilter === 'logout'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              Logouts
            </button>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name, IP..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-[10px] text-slate-400">
              <tr>
                <th className="p-3.5">User Details</th>
                <th className="p-3.5">Event Type</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5">Device / Browser</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 animate-pulse">
                    Loading login & logout activity from MongoDB Atlas...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    No login or logout records found matching your query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isLogin = log.action === 'login';
                  const dateStr = log.timestamp
                    ? new Date(log.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      })
                    : 'Unknown time';

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* User Info */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              log.userName || log.email || 'User'
                            )}&background=${isLogin ? '10b981' : '64748b'}&color=fff`}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {log.userName || 'Campus User'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {log.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Event Type */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isLogin
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {isLogin ? (
                            <LogIn className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <LogOut className="w-3 h-3 text-amber-500" />
                          )}
                          {log.action}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.role === 'admin'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                              : log.role === 'faculty'
                              ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {log.role || 'student'}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="p-3.5">
                        <span className="font-medium text-slate-900 dark:text-white block">
                          {dateStr}
                        </span>
                      </td>

                      {/* IP Address */}
                      <td className="p-3.5">
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {log.ip || '127.0.0.1'}
                        </span>
                      </td>

                      {/* Device / User Agent */}
                      <td className="p-3.5 max-w-[200px]">
                        <span
                          className="text-[11px] text-slate-500 dark:text-slate-400 truncate block"
                          title={log.userAgent || log.device}
                        >
                          {log.device || log.userAgent || 'Web Browser'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Success
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing page {page} of {totalPages} ({totalRecords} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-semibold"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLoginLogsPage;
