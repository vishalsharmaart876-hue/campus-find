import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Bell,
  MessageSquare,
  Award,
  Search,
  Sun,
  Moon,
  Globe,
  PlusCircle,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  CreditCard,
  CheckCircle,
  AlertCircle,
  PackageCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSocket } from '../../context/SocketContext';
import ReturnItemModal from '../claims/ReturnItemModal';
import api from '../../services/api';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();
  const { incomingNotification } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch unread notifications count
  const fetchNotificationCount = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setUnreadNotifications(res.data.unreadCount || 0);
        setRecentNotifications((res.data.notifications || []).slice(0, 4));
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotificationCount();
  }, [user]);

  useEffect(() => {
    if (incomingNotification) {
      setUnreadNotifications((prev) => prev + 1);
      setRecentNotifications((prev) => [incomingNotification, ...prev.slice(0, 3)]);
    }
  }, [incomingNotification]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadNotifications(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      // ignore
    }
  };

  const navLinkClass = (path) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 flex items-center gap-1.5 ${
      location.pathname === path
        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-semibold'
        : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  Campus<span className="text-indigo-600 dark:text-indigo-400">Find</span>
                </span>
                <span className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase">
                  College Lost & Found
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/browse" className={navLinkClass('/browse')}>
              <Search className="w-4 h-4" />
              {t('browseItems')}
            </Link>
            <Link to="/map" className={navLinkClass('/map')}>
              <MapPin className="w-4 h-4" />
              {t('campusMap')}
            </Link>
            <Link to="/leaderboard" className={navLinkClass('/leaderboard')}>
              <Award className="w-4 h-4" />
              {t('leaderboard')}
            </Link>

            {/* Quick Emergency ID Card button */}
            <Link
              to="/emergency-id"
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-full hover:bg-rose-100 transition-colors animate-pulse-subtle"
            >
              <CreditCard className="w-3.5 h-3.5 text-rose-600" />
              {t('emergencyId')}
            </Link>

            {/* Quick Admin Portal Access for authorized admins */}
            {isAdmin && (
              <Link
                to="/admin"
                className="ml-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded-full hover:bg-purple-100 transition-colors shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                Admin Portal
              </Link>
            )}
          </nav>


          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              title={`Switch to ${lang === 'en' ? 'Hindi' : 'English'}`}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{lang}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Dark / Light Mode"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                {/* Messages shortcut */}
                <Link
                  to="/messages"
                  title="Messages"
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
                >
                  <MessageSquare className="w-4 h-4" />
                </Link>

                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                    )}
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {t('notifications')}
                          </h4>
                          {unreadNotifications > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full">
                              {unreadNotifications} new
                            </span>
                          )}
                        </div>
                        {unreadNotifications > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                        {recentNotifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          recentNotifications.map((notif, idx) => (
                            <Link
                              key={notif._id || idx}
                              to="/notifications"
                              onClick={() => setNotificationsOpen(false)}
                              className={`block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                !notif.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="p-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 mt-0.5">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    {notif.title}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    {notif.message}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>

                      <div className="pt-2 px-4 border-t border-slate-100 dark:border-slate-800 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setNotificationsOpen(false)}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          View all notifications →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Report Action Button */}
                <div className="hidden lg:flex items-center gap-1.5">
                  <Link
                    to="/report-lost"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-lg hover:bg-amber-100 transition-colors shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                    Lost
                  </Link>
                  <Link
                    to="/report-found"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Found
                  </Link>
                  <button
                    onClick={() => setReturnModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-sm transition-all"
                    title="Return an item using its unique Item ID to earn Karma points"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    Return Item
                  </button>
                </div>

                {/* Profile Avatar Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1 pl-2 rounded-full border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-colors bg-white dark:bg-slate-900"
                  >
                    <span className="hidden sm:block text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/30"
                    />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                            {user.role}
                          </span>
                          <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            {user.rewardPoints || 0} pts
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          {t('dashboard')}
                        </Link>
                        <Link
                          to="/my-reports"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <CheckCircle className="w-4 h-4 text-slate-400" />
                          My Reports & Claims
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          Account Settings
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100"
                          >
                            <Shield className="w-4 h-4" />
                            {t('adminDashboard')}
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                            navigate('/login');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 rounded-lg transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/signup"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all"
                >
                  {t('signup')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-4 duration-200">
          <Link to="/browse" className={navLinkClass('/browse')}>
            <Search className="w-4 h-4" />
            {t('browseItems')}
          </Link>
          <Link to="/map" className={navLinkClass('/map')}>
            <MapPin className="w-4 h-4" />
            {t('campusMap')}
          </Link>
          <Link to="/leaderboard" className={navLinkClass('/leaderboard')}>
            <Award className="w-4 h-4" />
            {t('leaderboard')}
          </Link>
          <Link to="/emergency-id" className={navLinkClass('/emergency-id')}>
            <CreditCard className="w-4 h-4 text-rose-500" />
            {t('emergencyId')}
          </Link>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              to="/report-lost"
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-amber-800 bg-amber-100 dark:bg-amber-950 rounded-lg"
            >
              <PlusCircle className="w-4 h-4" />
              Report Lost
            </Link>
            <Link
              to="/report-found"
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 dark:bg-emerald-950 rounded-lg"
            >
              <PlusCircle className="w-4 h-4" />
              Report Found
            </Link>
          </div>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setReturnModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-sm"
          >
            <PackageCheck className="w-4 h-4" />
            Return Item (Submit Item ID)
          </button>
        </div>
      )}

      {/* Global Return Item Modal */}
      <ReturnItemModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
      />
    </header>
  );
};

export default Navbar;
