import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Upload,
  MapPin,
  Calendar,
  Lock,
  HelpCircle,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Copy,
  Check
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

const ReportLostPage = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [campusBuilding, setCampusBuilding] = useState('Central Library');
  const [locationName, setLocationName] = useState('');
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [contactPreference, setContactPreference] = useState('in_app_chat');

  // Map coordinates
  const [lat, setLat] = useState(28.5458);
  const [lng, setLng] = useState(77.1926);

  // Images
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Sensitive & Verification Questions
  const [isSensitive, setIsSensitive] = useState(false);
  const [sensitiveDetailsHidden, setSensitiveDetailsHidden] = useState('');
  const [questions, setQuestions] = useState(['']);

  // Emergency ID Card
  const [isEmergencyId, setIsEmergencyId] = useState(false);
  const [idCardRollNo, setIdCardRollNo] = useState('');

  // Duplicate warning
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdItemData, setCreatedItemData] = useState(null);
  const [copied, setCopied] = useState(false);

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

  // Duplicate Check Debounce
  const checkDuplicate = async (itemTitle) => {
    if (!itemTitle || itemTitle.length < 4) return;
    try {
      const res = await api.post('/items/check-duplicate', {
        title: itemTitle,
        category,
        type: 'lost',
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

  const handleTitleBlur = () => {
    checkDuplicate(title);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !locationName) {
      setError('Please fill in title, description, and location.');
      return;
    }

    setLoading(true);
    setError('');

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
      formData.append('isEmergencyId', isEmergencyId);
      formData.append('idCardRollNo', idCardRollNo);

      files.forEach((f) => {
        formData.append('images', f);
      });

      const res = await api.post('/items/lost', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setCreatedItemData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold mb-2">
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Lost Item Report</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Report a Lost Belonging
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Provide accurate details and photos. Our OpenCV AI service will automatically look for matching found items.
        </p>
      </div>

      {/* Duplicate Warning Banner */}
      {duplicateWarning && duplicateWarning.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Possible Similar Report Already Exists!</span>
          </div>
          <p className="text-[11px]">
            We found {duplicateWarning.length} active report(s) matching your title:
          </p>
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

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Item Basic Details */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            1. Item Details
          </h3>

          {/* Quick Emergency ID Card Toggle */}
          <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-rose-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Is this a Lost College ID Card?
                </span>
                <span className="text-[11px] text-slate-500">
                  Enables rapid emergency broadcast on the campus notice board.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isEmergencyId}
              onChange={(e) => {
                setIsEmergencyId(e.target.checked);
                if (e.target.checked) setCategory('ID & Cards');
              }}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </div>

          {isEmergencyId && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Student Roll Number or Faculty ID on the Card
              </label>
              <input
                type="text"
                value={idCardRollNo}
                onChange={(e) => setIdCardRollNo(e.target.value)}
                placeholder="e.g. CS2024-042"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Item Name / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="e.g. HP Pavilion Laptop in Navy Blue Sleeve"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description & Identifying Features <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item (color, make, model, contents, marks). Do not include secret passwords or personal codes."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Upload Photographs (Used for AI Visual Matching)
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
              <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <label className="cursor-pointer text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Click to browse images
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
            </div>

            {previewUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                    <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Location & Time */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            2. Last Seen Campus Location & Time
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Campus Building / Zone
              </label>
              <select
                value={campusBuilding}
                onChange={(e) => setCampusBuilding(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
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
                Date & Approximate Time Lost <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Specific Spot Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. 2nd Floor Quiet Study Area, Desk 14 near the window"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Leaflet Map Pin Picker */}
          <MapPicker
            lat={lat}
            lng={lng}
            onLocationSelect={(selectedLat, selectedLng) => {
              setLat(selectedLat);
              setLng(selectedLng);
            }}
          />
        </div>

        {/* Section 3: Verification Questions & Sensitivity */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            3. Ownership Proof & Security
          </h3>

          {/* Sensitive Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Protect Sensitive Identifying Detail
                </span>
              </div>
              <input
                type="checkbox"
                checked={isSensitive}
                onChange={(e) => setIsSensitive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </div>
            {isSensitive && (
              <input
                type="text"
                value={sensitiveDetailsHidden}
                onChange={(e) => setSensitiveDetailsHidden(e.target.value)}
                placeholder="Secret identifier (e.g. 'Has sticker on bottom lid', only revealed upon verification)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          {/* Verification Questions Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Verification Questions (To authenticate finder / true ownership)
              </label>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                + Add Question
              </button>
            </div>

            {questions.map((q, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={q}
                  onChange={(e) => handleQuestionChange(idx, e.target.value)}
                  placeholder={`Question ${idx + 1} (e.g. What color is the inner lining?)`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Submitting & Running AI Matcher...' : 'Publish Lost Item Report'}
        </button>
      </form>

      {/* Auto-Generated Item ID Success Modal */}
      {createdItemData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Report Submitted Successfully
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                Your Unique Complaint ID is Ready!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Automatically generated and saved in MongoDB for verification:
              </p>
            </div>

            {/* Glowing Unique Complaint ID Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border-2 border-dashed border-indigo-300 dark:border-indigo-700 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Official Complaint ID
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-black text-indigo-700 dark:text-indigo-300 tracking-wider">
                  {createdItemData.complaintId || createdItemData.item?.complaintId || createdItemData.itemCode || createdItemData.item?.itemCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const code = createdItemData.complaintId || createdItemData.item?.complaintId || createdItemData.itemCode || createdItemData.item?.itemCode;
                    navigator.clipboard.writeText(code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-700 shadow-sm transition-all"
                  title="Copy Complaint ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block animate-in fade-in">
                  ✓ Copied to clipboard!
                </span>
              )}
            </div>

            {/* Verification Notice */}
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 text-left flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Found Verification Workflow:</span> When someone finds your item, they will enter this <strong>Complaint ID</strong> to submit a Found Item Request. You will review and approve the request before handover.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const targetId = createdItemData.item?._id || createdItemData.item?.id || createdItemData.item;
                  if (targetId) {
                    navigate(`/items/${targetId}`);
                  } else {
                    navigate('/browse');
                  }
                }}
                className="w-full py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Item Details →</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/browse')}
                className="w-full py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition-colors cursor-pointer"
              >
                Browse All Items
              </button>
              <button
                type="button"
                onClick={() => navigate('/my-reports')}
                className="w-full py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Go to My Reports
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportLostPage;
