import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  User,
  Mail,
  Lock,
  Phone,
  GraduationCap,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: 'Computer Science & Engineering',
    rollNumber: '',
    phone: ''
  });

  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Duplicate Email Live Verification State
  const [emailStatus, setEmailStatus] = useState({
    checking: false,
    available: null,
    message: '',
    duplicate: false
  });

  const departments = [
    'Computer Science & Engineering',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical & Electronics',
    'Business Administration & MBA',
    'Physics & Applied Sciences',
    'School of Humanities & Law'
  ];

  // Debounced real-time duplicate email check
  useEffect(() => {
    const rawEmail = formData.email.trim();
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

    if (!rawEmail || !emailRegex.test(rawEmail)) {
      setEmailStatus({ checking: false, available: null, message: '', duplicate: false });
      return;
    }

    setEmailStatus({ checking: true, available: null, message: 'Checking email availability...', duplicate: false });

    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/auth/check-email', { email: rawEmail });
        if (res.data) {
          setEmailStatus({
            checking: false,
            available: res.data.available,
            duplicate: !res.data.available,
            message: res.data.message
          });
        }
      } catch (err) {
        setEmailStatus({
          checking: false,
          available: null,
          duplicate: false,
          message: ''
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Password Strength Calculation
  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-200 dark:bg-slate-700' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-blue-500', text: 'text-blue-500' };
      case 4:
        return { score: 4, label: 'Strong & Secure', color: 'bg-emerald-500', text: 'text-emerald-500' };
      default:
        return { score: 0, label: 'Too short', color: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-400' };
    }
  };

  const pwdStrength = calculatePasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (emailStatus.duplicate) {
      setError('This college email is already registered. Please sign in or use another email.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signup(formData, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Signup failed. Please try again or check your college email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Create CampusFind Account
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Join your university community to recover lost items and earn karma points.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selector (Student or Faculty) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Campus Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  formData.role === 'student'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={formData.role === 'student'}
                  onChange={handleChange}
                  className="hidden"
                />
                <GraduationCap className="w-4 h-4" />
                Student
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  formData.role === 'faculty'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="faculty"
                  checked={formData.role === 'faculty'}
                  onChange={handleChange}
                  className="hidden"
                />
                <User className="w-4 h-4" />
                Faculty / Staff
              </label>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Aravind Sharma"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* College Email with Real-time Duplicate Check */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                College Email Address
              </label>
              {emailStatus.checking && (
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Verifying uniqueness...
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. yourname@campus.edu"
                className={`w-full pl-9 pr-9 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                  emailStatus.duplicate
                    ? 'border-rose-400 focus:ring-rose-400'
                    : emailStatus.available
                    ? 'border-emerald-400 focus:ring-emerald-400'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                }`}
              />
              {/* Visual status icon on input */}
              <div className="absolute right-3 top-3">
                {emailStatus.checking && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                {!emailStatus.checking && emailStatus.available === true && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                {!emailStatus.checking && emailStatus.duplicate && (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                )}
              </div>
            </div>

            {/* Duplicate Email Alert Banner or Success Badge */}
            {emailStatus.duplicate && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-700 dark:text-rose-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  This email is already in use.
                </span>
                <Link
                  to="/login"
                  className="font-bold underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                >
                  Log in here →
                </Link>
              </div>
            )}
            {emailStatus.available === true && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold px-1">
                <Check className="w-3.5 h-3.5" />
                Email address is available for registration
              </div>
            )}
          </div>

          {/* Department & Roll Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {formData.role === 'student' ? 'Student Roll / PRN No.' : 'Faculty ID'}
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                placeholder="e.g. CS2024-042"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Phone (Kept Private) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Phone Number <span className="text-slate-400 font-normal">(Never shown publicly)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9811223344"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Passwords with Bcrypt Hashing Protection & Live Strength Meter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Password Security & Bcrypt Hashing Feedback */}
          {formData.password && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  Bcrypt Hashed Security:
                </span>
                <span className={`font-bold ${pwdStrength.text}`}>{pwdStrength.label}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full rounded-full transition-all duration-300 ${
                      pwdStrength.score >= step
                        ? pwdStrength.color
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                Passwords are automatically encrypted with 10 salt rounds of bcrypt before being stored in MongoDB.
              </p>
            </div>
          )}

          {/* Persistent Login Checkbox */}
          <div className="flex items-center justify-between py-1 px-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                id="signupRememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Keep me signed in on this computer
              </span>
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${rememberMe ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              {rememberMe ? 'Persistent session' : 'Session only'}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || emailStatus.duplicate}
            className="w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Registering Account...' : 'Create CampusFind Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

