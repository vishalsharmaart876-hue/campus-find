import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Activity,
  FileText,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  ShieldAlert,
  Compass,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Admin Access Restricted</h3>
        <p className="text-xs text-slate-500">Only authorized campus security administrators can access this portal.</p>
        <Link to="/login" className="inline-block px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl">
          Log in as Admin (admin@campus.edu)
        </Link>
      </div>
    );
  }

  const navClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
      isActive
        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Campus Security & Administration</span>
              <span className="text-[10px] font-bold uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full">
                Admin Mode
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              User accounts, login logs, report moderation, and campus recovery.
            </p>
          </div>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Member Portal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Sidebar Navigation */}
        <div className="md:col-span-3 space-y-1">
          <NavLink to="/admin" end className={navClass}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </NavLink>
          <NavLink to="/admin/users" className={navClass}>
            <Users className="w-4 h-4" />
            <span>User Management</span>
          </NavLink>
          <NavLink to="/admin/logs" className={navClass}>
            <Activity className="w-4 h-4 text-emerald-400" />
            <div className="flex items-center justify-between w-full">
              <span>Login Activity Tracking</span>
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded">
                Logs
              </span>
            </div>
          </NavLink>
          <NavLink to="/admin/reports" className={navClass}>
            <FileText className="w-4 h-4" />
            <span>Report Moderation</span>
          </NavLink>
          <NavLink to="/admin/claims" className={navClass}>
            <QrCode className="w-4 h-4 text-emerald-400" />
            <div className="flex items-center justify-between w-full">
              <span>QR Handover & Claims</span>
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded">
                Live
              </span>
            </div>
          </NavLink>
          <NavLink to="/admin/locations" className={navClass}>
            <MapPin className="w-4 h-4" />
            <span>Campus Landmarks</span>
          </NavLink>
        </div>


        {/* Content Outlet */}
        <div className="md:col-span-9 min-h-[60vh]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
