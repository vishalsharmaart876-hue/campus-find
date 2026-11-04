import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  PlusCircle,
  Upload,
  MapPin,
  Calendar,
  Lock,
  HelpCircle,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Award,
  Search,
  Sparkles,
  PackageCheck,
  Clock,
  User,
  ArrowRight
} from 'lucide-react';
import MapPicker from '../components/map/MapPicker';
import api from '../services/api';

const categories = [
  'Electronics',
  'ID & Cards',
  'Books & Notebooks',
  'Bags & Wallets',
  'Keys',
  'Clothing & Accessories',
  'Eyewear',
  'Documents',
  'Sports Equipment',
  'Jewelry',
  'Others'
];

const campusBuildings = [
  'Central Library',
  'Science & Technology Block',
  'Student Activity Center & Food Court',
  'Sports Complex & Gymnasium',
  'Hostel Block 3 (Vindhya)',
  'Campus Main Gate 1 & Security HQ',
  'Administrative Block',
  'Auditorium',
  'Other'
];

const ReportFoundPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialComplaintId = searchParams.get('complaintId') || '';

  // Mode: 'request_with_id' (Enter Complaint ID) vs 'unregistered' (General Report)
  const [mode, setMode] = useState('request_with_id');

  // Found Request State
  const [complaintIdInput, setComplaintIdInput] = useState(initialComplaintId);
  const [verifyingId, setVerifyingId] = useState(false);
  const [verifiedComplaint, setVerifiedComplaint] = useState(null);
  const [verifyError, setVerifyError] = useState('');
  const [foundLocationInput, setFoundLocationInput] = useState('Central Library Safekeeping Desk (Ground Floor)');
  const [foundNotesInput, setFoundNotesInput] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(null);

  // Unregistered Found Item State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [campusBuilding, setCampusBuilding] = useState('Central Library');
  const [locationName, setLocationName] = useState('');
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [contactPreference, setContactPreference] = useState('in_app_chat');

  const [lat, setLat] = useState(28.5458);
  const [lng, setLng] = useState(77.1926);

  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const [isSensitive, setIsSensitive] = useState(true);
  const [sensitiveDetailsHidden, setSensitiveDetailsHidden] = useState('');
  const [questions, setQuestions] = useState(['What brand or color is the inner casing?']);

  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (initialComplaintId) {
      setComplaintIdInput(initialComplaintId);
      handleVerifyComplaintId(initialComplaintId);
    }
  }, [initialComplaintId]);

  const handleVerifyComplaintId = async (idToVerify) => {
    const cid = (idToVerify || complaintIdInput).trim().toUpperCase();
    if (!cid) {
      setVerifyError('Please enter a Complaint ID');
      return;
    }

    setVerifyingId(true);
    setVerifyError('');
    setVerifiedComplaint(null);

    try {
      const res = await api.post('/items/verify-complaint-id', { complaintId: cid });
      if (res.data.success) {
        setVerifiedComplaint(res.data.complaint);
      }
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Invalid Complaint ID');
    } finally {
      setVerifyingId(false);
    }
  };

  const handleSubmitFoundRequest = async (e) => {
    e.preventDefault();
    if (!verifiedComplaint) {
      setVerifyError('Please verify the Complaint ID first.');
      return;
    }
    if (!foundLocationInput.trim()) {
      setVerifyError('Please enter the location where you found the item.');
      return;
    }

    setRequestSubmitting(true);
    setVerifyError('');

    try {
      const res = await api.post('/items/found-request', {
        complaintId: verifiedComplaint.complaintId || verifiedComplaint.itemCode,
        foundLocation: foundLocationInput.trim(),
        foundNotes: foundNotesInput.trim() || 'Item found and submitted for verification'
      });

      if (res.data.success) {
        setRequestSuccess(res.data);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Failed to submit found item request.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    const urls = selected.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, '']);
  };

  const handleQuestionChange = (index, value) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const checkDuplicate = async (itemTitle) => {
    if (!itemTitle || itemTitle.length < 4) return;
    try {
      const res = await api.post('/items/check-duplicate', {
        title: itemTitle,
        category,
        type: 'found',
        locationName
      });
      if (res.data.hasDuplicate) {
        setDuplicateWarning(res.data.potentialDuplicates);
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSubmitGeneralFound = async (e) => {
    e.preventDefault();
    if (!title || !description || !locationName) {
      setGeneralError('Please fill in title, description, and location.');
      return;
    }

    setLoading(true);
    setGeneralError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('campusBuilding', campusBuilding);
      formData.append('locationName', locationName);
      formData.append('dateTime', dateTime);
      formData.append('contactPreference', contactPreference);
      formData.append('lat', lat);
      formData.append('lng', lng);
      formData.append('isSensitive', isSensitive);
      formData.append('sensitiveDetailsHidden', sensitiveDetailsHidden);
      formData.append(
        'verificationQuestions',
        JSON.stringify(questions.filter((q) => q.trim()))
      );

      files.forEach((f) => {
        formData.append('images', f);
      });

      const res = await api.post('/items/found', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        navigate(`/items/${res.data.item._id}`);
      }
    } catch (err) {
      setGeneralError(err.response?.data?.message || 'Error submitting report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2">
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span>Earn +50 Karma Points upon Verified Return</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Found Item Submission & Verification
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Thank you for your honesty! If you know the original Lost Complaint ID, verify it to notify the owner directly.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setMode('request_with_id')}
          className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            mode === 'request_with_id'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-emerald-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Have Lost Complaint ID (Recommended)</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('unregistered')}
          className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            mode === 'unregistered'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-emerald-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Unregistered Found Belonging</span>
        </button>
      </div>

      {/* MODE 1: Found Item Request with Complaint ID */}
      {mode === 'request_with_id' && (
        <div className="space-y-6">
          {requestSuccess ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-6 animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Request Submitted Successfully
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                  Found Item Request Sent to Owner!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {requestSuccess.message}
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2.5 max-w-md mx-auto">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700">
                  <span className="text-slate-500">Complaint ID:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {requestSuccess.complaintId}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold text-purple-600">Pending Owner Approval</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Pending Karma Reward:</span>
                  <span className="font-bold text-amber-600">+50 Points upon Handover</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/my-reports')}
                  className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Track Status in My Reports</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setRequestSuccess(null);
                    setVerifiedComplaint(null);
                    setComplaintIdInput('');
                    setFoundNotesInput('');
                  }}
                  className="w-full sm:w-auto px-6 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Step 1: Verify Original Complaint ID
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  The complaint ID is formatted as <code className="font-mono text-emerald-600 font-bold">CF-2026-XXXXXX</code>.
                </p>
              </div>

              {verifyError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {/* ID Input Form */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enter Complaint ID <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={complaintIdInput}
                    onChange={(e) => {
                      setComplaintIdInput(e.target.value.toUpperCase());
                      setVerifiedComplaint(null);
                      setVerifyError('');
                    }}
                    placeholder="e.g. CF-2026-847291"
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:normal-case placeholder:font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyComplaintId()}
                    disabled={verifyingId || !complaintIdInput.trim()}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Search className="w-4 h-4" />
                    {verifyingId ? 'Verifying...' : 'Verify Complaint ID'}
                  </button>
                </div>
              </div>

              {/* Verified Card Preview */}
              {verifiedComplaint && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Complaint Verified in Database</span>
                  </div>

                  <div className="flex items-start gap-4">
                    <img
                      src={
                        verifiedComplaint.images?.[0] ||
                        'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400'
                      }
                      alt={verifiedComplaint.title}
                      className="w-16 h-16 rounded-xl object-cover border border-emerald-200 dark:border-emerald-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {verifiedComplaint.title}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                          {verifiedComplaint.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {verifiedComplaint.category} • Reported at {verifiedComplaint.locationName} ({verifiedComplaint.campusBuilding})
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        Owner: {verifiedComplaint.ownerPreview?.name} ({verifiedComplaint.ownerPreview?.department}) [Protected]
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Found Item Request Details */}
              {verifiedComplaint && (
                <form onSubmit={handleSubmitFoundRequest} className="space-y-5 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Step 2: Submit Found Item Request
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Provide where you found the item so the owner can verify and arrange handover.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Where did you find or place this item? <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={foundLocationInput}
                      onChange={(e) => setFoundLocationInput(e.target.value)}
                      placeholder="e.g. Central Library Safekeeping Desk (Ground Floor)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Message / Verification Details for the Owner <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      value={foundNotesInput}
                      onChange={(e) => setFoundNotesInput(e.target.value)}
                      placeholder="e.g. I found this item on Table 12 in the 2nd floor library. Handed over to the library desk or can meet on campus."
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Approval & Handover Process:</strong> Submitting this request sends a direct notification to the owner. The owner will review and accept your request. Once handover is completed and confirmed by the owner, you will be awarded <strong>+50 Campus Karma Points</strong>!
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={requestSubmitting}
                    className="w-full py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {requestSubmitting ? 'Submitting Found Request...' : 'Submit Found Request (+50 Karma)'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: Unregistered Found Belonging Form */}
      {mode === 'unregistered' && (
        <form onSubmit={handleSubmitGeneralFound} className="space-y-8">
          {duplicateWarning && duplicateWarning.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Similar Item Already Reported</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {duplicateWarning.map((d) => (
                  <a
                    key={d._id}
                    href={`/items/${d._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 text-indigo-600 font-semibold text-[11px] hover:underline"
                  >
                    {d.title} ({d.locationName}) →
                  </a>
                ))}
              </div>
            </div>
          )}

          {generalError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Section 1: Found Item Basics */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              1. Found Item Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Found Item Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => checkDuplicate(title)}
                  placeholder="e.g. Casio Scientific Calculator FX-991"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Public Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give general descriptive features without revealing secret markings or internal details."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Item Images (Up to 5)
              </label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Click or drag item pictures here
                </span>
                <span className="text-[11px] text-slate-400">
                  Photos help our OpenCV AI vision algorithm find matching lost items
                </span>
              </div>

              {previewUrls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-2">
                  {previewUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="preview"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Location and Time */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              2. Where & When was it Found?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Campus Complex / Building <span className="text-rose-500">*</span>
                </label>
                <select
                  value={campusBuilding}
                  onChange={(e) => setCampusBuilding(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {campusBuildings.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Specific Location on Campus <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Ground Floor Water Cooler, Library Stacks"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Date & Time Found <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Safekeeping / Contact Preference
                </label>
                <select
                  value={contactPreference}
                  onChange={(e) => setContactPreference(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="in_app_chat">Campus Member In-App Chat</option>
                  <option value="safekeeping_desk">Deposited at Library / Security HQ Desk</option>
                  <option value="email">Institutional Email</option>
                </select>
              </div>
            </div>

            {/* Map Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pin Location on Campus Map
              </label>
              <MapPicker
                lat={lat}
                lng={lng}
                onChange={(coords) => {
                  setLat(coords.lat);
                  setLng(coords.lng);
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Submitting Report...' : 'Publish Found Item (+50 Karma)'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReportFoundPage;
