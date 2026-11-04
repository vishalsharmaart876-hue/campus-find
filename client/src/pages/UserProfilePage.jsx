import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  Globe,
  Activity,
  Lock,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const UserProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || 'Computer Science & Engineering',
    rollNumber: user?.rollNumber || '',
    phone: user?.phone || '',
    avatar: user?.avatar || ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [loginInfo, setLoginInfo] = useState(null);

  // Password Hashing & Security State
  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        const res = await api.get('/auth/login-history');
        if (res.data.success) {
          setLoginInfo(res.data);
        }
      } catch (err) {
        // Fallback to user object values if available
        if (user) {
          setLoginInfo({
            lastLoginAt: user.lastLoginAt || new Date(),
            loginCount: user.loginCount || 1,
            lastLoginIp: user.lastLoginIp || '127.0.0.1',
            loginHistory: user.loginHistory || []
          });
        }
      }
    };

    fetchLoginHistory();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await updateProfile(formData);
      setSuccessMsg('Profile details updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwdData.newPassword !== pwdData.confirmNewPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (pwdData.newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    setPwdLoading(true);
    setPwdError('');
    setPwdSuccess('');
    try {
      const res = await changePassword(pwdData.currentPassword, pwdData.newPassword);
      setPwdSuccess(res.message || 'Password changed and encrypted with bcrypt successfully!');
      setPwdData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to update password. Check current password.');
    } finally {
      setPwdLoading(false);
    }
  };


  const points = user?.rewardPoints || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          My Account & Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your campus identity, contact preferences, and view your Karma achievements.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Karma Points & Badges */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff&size=128`
              }
              alt={user?.name}
              className="w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-indigo-500/20"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {user?.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.email}
              </p>
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {user?.role}
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-amber-600">
              <Award className="w-5 h-5" />
              <span className="text-xl font-extrabold">{points} Karma Points</span>
            </div>
          </div>

          {/* Badges Box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Campus Badges
            </h4>

            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Verified Campus Identity</span>
                  <span className="text-[10px] text-slate-400">College email confirmed</span>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                points >= 50
                  ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 text-amber-900 dark:text-amber-200'
                  : 'opacity-50 border-slate-200 dark:border-slate-800'
              }`}>
                <Award className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-xs font-bold block">Good Samaritan</span>
                  <span className="text-[10px] text-slate-400">Successfully returned an item</span>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                points >= 150
                  ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 text-purple-900 dark:text-purple-200'
                  : 'opacity-50 border-slate-200 dark:border-slate-800'
              }`}>
                <Award className="w-4 h-4 text-purple-500" />
                <div>
                  <span className="text-xs font-bold block">Campus Hero</span>
                  <span className="text-[10px] text-slate-400">150+ Karma Points earned</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Personal Information
            </h3>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Student Roll No. / Faculty ID
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Phone Number (Protected from public display)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Avatar Image URL (Optional)
              </label>
              <input
                type="url"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md transition-colors flex items-center gap-1.5 mt-4"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>

          {/* Change Password with Bcrypt Hashing */}
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Password Security
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Encrypted with bcrypt (10 salt rounds) before database storage
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                Bcrypt Hashed
              </span>
            </div>

            {pwdSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            {pwdError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={pwdData.currentPassword}
                  onChange={(e) => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={pwdData.newPassword}
                    onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={pwdData.confirmNewPassword}
                    onChange={(e) => setPwdData({ ...pwdData, confirmNewPassword: e.target.value })}
                    placeholder="Repeat new password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="py-2.5 px-6 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md transition-colors flex items-center gap-1.5 mt-2"
            >
              <KeyRound className="w-4 h-4" />
              {pwdLoading ? 'Encrypting & Updating...' : 'Update Password'}
            </button>
          </form>

          {/* MongoDB Security & Login Activity Section */}

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    MongoDB Login Activity & Security
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Authentication sessions and login records stored in database
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                MongoDB Active
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  Last Login
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {loginInfo?.lastLoginAt ? new Date(loginInfo.lastLoginAt).toLocaleString() : 'Just now'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Total Logins
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {loginInfo?.loginCount || 1} Sessions Recorded
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-amber-500" />
                  Last IP Address
                </span>
                <p className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                  {loginInfo?.lastLoginIp || '127.0.0.1'}
                </p>
              </div>
            </div>

            {/* Login History Log Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Recent Authentication History
              </h4>
              {loginInfo?.loginHistory && loginInfo.loginHistory.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {loginInfo.loginHistory.slice(0, 5).map((log, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs bg-white dark:bg-slate-900/50">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {new Date(log.loginAt).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs block">
                            {log.device || log.userAgent || 'Web Browser'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block">
                          {log.ip || '127.0.0.1'}
                        </span>
                        <span className={`text-[10px] font-bold uppercase ${log.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {log.status === 'success' ? 'Authorized' : 'Failed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 p-4 text-center border border-dashed rounded-2xl">
                  Initial login session saved to MongoDB.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
