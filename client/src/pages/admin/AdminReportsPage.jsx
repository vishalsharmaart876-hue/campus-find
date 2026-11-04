import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Flag, Archive, Trash2, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (type !== 'all') params.type = type;
      if (status !== 'all') params.status = status;
      if (flaggedOnly) params.flaggedOnly = 'true';
      if (search) params.search = search;

      const res = await api.get('/admin/reports', { params });
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [type, status, flaggedOnly]);

  const handleModerate = async (itemId, action, extra = {}) => {
    if (action === 'delete' && !window.confirm('Delete this report permanently?')) return;

    try {
      const res = await api.put(`/admin/reports/${itemId}/moderate`, {
        action,
        ...extra
      });
      if (res.data.success) {
        if (action === 'delete') {
          setReports(reports.filter((r) => r._id !== itemId));
        } else {
          setReports(reports.map((r) => (r._id === itemId ? res.data.item : r)));
        }
      }
    } catch (err) {
      alert('Error moderating report');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Lost & Found Moderation
          </h2>
          <p className="text-xs text-slate-500">
            Moderate community reports, investigate suspicious flags, and resolve recovered items.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value="all">All Types</option>
            <option value="lost">Lost Only</option>
            <option value="found">Found Only</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="claim_pending">Claim Pending</option>
            <option value="returned">Returned</option>
            <option value="archived">Archived</option>
          </select>

          <button
            onClick={() => setFlaggedOnly(!flaggedOnly)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1 ${
              flaggedOnly
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'border-slate-200 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            Flagged Only
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-[10px] text-slate-400">
            <tr>
              <th className="p-3">Report Details</th>
              <th className="p-3">Location</th>
              <th className="p-3">Reported By</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Moderation Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400 animate-pulse">
                  Loading reports...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">
                  No reports found.
                </td>
              </tr>
            ) : (
              reports.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 flex items-center gap-3">
                    <img
                      src={
                        item.images?.[0] ||
                        'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=100'
                      }
                      alt={item.title}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                            item.type === 'lost' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.type}
                        </span>
                        {item.isFlagged && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Flagged
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/items/${item._id}`}
                        target="_blank"
                        className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 truncate block mt-0.5"
                      >
                        {item.title}
                      </Link>
                      <span className="text-[10px] text-slate-400">{item.category}</span>
                    </div>
                  </td>

                  <td className="p-3">
                    <span className="block font-medium">{item.locationName}</span>
                    <span className="text-[10px] text-slate-400">{item.campusBuilding}</span>
                  </td>

                  <td className="p-3">
                    <span className="block font-medium">{item.reportedBy?.name || 'Unknown'}</span>
                    <span className="text-[10px] text-slate-400">{item.reportedBy?.email}</span>
                  </td>

                  <td className="p-3">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {item.status}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() =>
                          handleModerate(item._id, item.isFlagged ? 'unflag' : 'flag', {
                            flagReason: 'Admin moderation inspection'
                          })
                        }
                        title={item.isFlagged ? 'Remove Flag' : 'Flag as Suspicious'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.isFlagged ? 'text-rose-600 bg-rose-50' : 'text-slate-400 hover:text-rose-600'
                        }`}
                      >
                        <Flag className="w-4 h-4" />
                      </button>

                      {item.status !== 'returned' && (
                        <button
                          onClick={() => handleModerate(item._id, 'resolve')}
                          title="Mark as Returned / Resolved"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleModerate(item._id, 'archive')}
                        title="Archive Post"
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                      >
                        <Archive className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleModerate(item._id, 'delete')}
                        title="Delete Permanently"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReportsPage;
