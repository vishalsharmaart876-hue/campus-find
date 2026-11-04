import React, { useState, useEffect } from 'react';
import {
  Search,
  Shield,
  Ban,
  CheckCircle,
  UserCheck,
  AlertCircle,
  Calendar,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Clock,
  Award
} from 'lucide-react';
import api from '../../services/api';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (targetPage = page) => {
    setLoading(true);
    try {
      const params = { page: targetPage, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (role !== 'all') params.role = role;
      if (status !== 'all') params.status = status;
      if (sortBy) params.sortBy = sortBy;

      const res = await api.get('/admin/users', { params });
      if (res.data.success) {
        setUsers(res.data.users || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalUsers(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchUsers(1);
  }, [role, status, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1);
  };

  const handleToggleBan = async (user) => {
    const action = user.isBanned ? 'unban' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

    try {
      const res = await api.put(`/admin/users/${user._id}`, {
        isBanned: !user.isBanned
      });
      if (res.data.success) {
        setUsers(users.map((u) => (u._id === user._id ? { ...u, isBanned: !user.isBanned } : u)));
      }
    } catch (err) {
      alert('Error updating user ban status');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await api.put(`/admin/users/${userId}`, { role: newRole });
      if (res.data.success) {
        setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      }
    } catch (err) {
      alert('Error changing user role');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Registered Campus Users</span>
            <span className="text-[10px] font-bold uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
              MongoDB Atlas: {totalUsers} Users
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View full registration details, manage role permissions, and moderate student and faculty access.
          </p>
        </div>

        <button
          onClick={() => fetchUsers(page)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Role:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="newest">Newest Registered</option>
              <option value="oldest">Oldest Registered</option>
              <option value="name">Name (A-Z)</option>
              <option value="lastLogin">Last Login</option>
              <option value="points">Karma Points</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, roll no..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-[10px] text-slate-400">
            <tr>
              <th className="p-3.5">User</th>
              <th className="p-3.5">Department & Roll</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Registration Date</th>
              <th className="p-3.5">Karma Points</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400 animate-pulse">
                  Loading registered users from MongoDB Atlas...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-12 text-center text-slate-400">
                  <UserCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  No users found matching your search or filter criteria.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const regDate = u.createdAt
                  ? new Date(u.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : 'N/A';

                return (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* User Name & Email */}
                    <td className="p-3.5 flex items-center gap-2.5">
                      <img
                        src={
                          u.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            u.name || 'User'
                          )}&background=6366f1&color=fff`
                        }
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {u.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {u.email}
                        </span>
                      </div>
                    </td>

                    {/* Department & Roll */}
                    <td className="p-3.5">
                      <span className="block font-medium text-slate-800 dark:text-slate-200">
                        {u.department || 'General Studies'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {u.rollNumber || 'No ID specified'}
                      </span>
                    </td>

                    {/* Role Dropdown */}
                    <td className="p-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u._id, e.target.value)}
                        className={`px-2 py-1 text-[11px] rounded-lg border font-semibold focus:outline-none ${
                          u.role === 'admin'
                            ? 'bg-purple-50 dark:bg-purple-950 border-purple-200 text-purple-700 dark:text-purple-300'
                            : u.role === 'faculty'
                            ? 'bg-teal-50 dark:bg-teal-950 border-teal-200 text-teal-700 dark:text-teal-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    {/* Registration Date */}
                    <td className="p-3.5">
                      <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {regDate}
                      </span>
                      {u.lastLoginAt && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Last seen: {new Date(u.lastLoginAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>

                    {/* Karma Points */}
                    <td className="p-3.5 font-bold text-amber-500 font-mono">
                      {u.rewardPoints || 0} pts
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.isBanned
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {u.isBanned ? 'Suspended' : 'Active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleToggleBan(u)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                          u.isBanned
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950 dark:border-rose-800'
                        }`}
                      >
                        {u.isBanned ? 'Unban User' : 'Suspend Access'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Page {page} of {totalPages} ({totalUsers} total registered users)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (page > 1) {
                  setPage(page - 1);
                  fetchUsers(page - 1);
                }
              }}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-semibold"
            >
              Previous
            </button>
            <button
              onClick={() => {
                if (page < totalPages) {
                  setPage(page + 1);
                  fetchUsers(page + 1);
                }
              }}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;

