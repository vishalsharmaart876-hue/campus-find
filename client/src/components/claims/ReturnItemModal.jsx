import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  ShieldCheck,
  X,
  Sparkles,
  AlertCircle,
  PackageCheck,
  Search,
  MapPin,
  User,
  Clock
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ReturnItemModal = ({ isOpen, onClose, prefillItemCode = '', onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [itemCodeInput, setItemCodeInput] = useState(prefillItemCode);
  const [returnLocation, setReturnLocation] = useState('Central Library Safekeeping Desk (Ground Floor)');
  const [returnNotes, setReturnNotes] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (prefillItemCode) {
      setItemCodeInput(prefillItemCode);
      lookupItem(prefillItemCode);
    } else {
      setItemCodeInput('');
      setPreviewData(null);
      setError('');
      setSuccessData(null);
    }
  }, [prefillItemCode, isOpen]);

  if (!isOpen) return null;

  const lookupItem = async (codeToLookup) => {
    const code = (codeToLookup || itemCodeInput).trim().toUpperCase();
    if (!code) {
      setError('Please enter the Complaint ID');
      return;
    }

    setLoadingPreview(true);
    setError('');
    setPreviewData(null);

    try {
      const res = await api.post('/items/verify-complaint-id', { complaintId: code });
      if (res.data.success) {
        setPreviewData(res.data.complaint);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid Complaint ID'
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    const code = itemCodeInput.trim().toUpperCase();
    if (!code) {
      setError('Complaint ID is required to submit a found item request.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/items/found-request', {
        complaintId: code,
        foundLocation: returnLocation,
        foundNotes: returnNotes.trim() || 'Item found and submitted for verification'
      });

      if (res.data.success) {
        setSuccessData(res.data);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        if (onSuccess) {
          onSuccess(res.data);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Verification failed. Could not process found item request.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setItemCodeInput('');
    setPreviewData(null);
    setError('');
    setReturnNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {successData ? (
          <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Found Request Submitted
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                Verification Request Sent!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {successData.message}
              </p>
            </div>

            {/* Details Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-left text-xs space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Complaint ID:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{successData.complaintId}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Current Status:</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">Pending Owner Approval</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 dark:text-slate-400">Karma Points Reward:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">+50 Points upon Handover</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 text-left flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Next Steps:</span> The owner will review your found request. Once they approve and you complete handover, the owner will confirm receipt and you will earn +50 Karma Points!
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  handleReset();
                  navigate('/my-reports');
                }}
                className="flex-1 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors"
              >
                Track in My Reports →
              </button>
              <button
                onClick={handleReset}
                className="py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReturnSubmit} className="space-y-4">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-1">
                <PackageCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Submit Found Item Request
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Enter the original <strong className="text-slate-700 dark:text-slate-300">Complaint ID</strong> (e.g. CF-2026-847291) to verify against MongoDB and notify the owner.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Complaint ID Input with Live Search Button */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Original Lost Complaint ID <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={itemCodeInput}
                  onChange={(e) => {
                    setItemCodeInput(e.target.value.toUpperCase());
                    setPreviewData(null);
                    setError('');
                  }}
                  placeholder="e.g. CF-2026-847291"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase placeholder:normal-case placeholder:font-sans"
                  required
                />
                <button
                  type="button"
                  onClick={() => lookupItem()}
                  disabled={loadingPreview || !itemCodeInput.trim()}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Search className="w-3.5 h-3.5" />
                  {loadingPreview ? 'Verifying...' : 'Verify ID'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter the unique ID generated for this lost complaint (format: <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">CF-YYYY-XXXXXX</span>).
              </p>
            </div>

            {/* Item Preview Card */}
            {previewData && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-start gap-3">
                  <img
                    src={
                      previewData.images?.[0] ||
                      'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400'
                    }
                    alt={previewData.title}
                    className="w-14 h-14 rounded-xl object-cover border border-emerald-300 dark:border-emerald-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {previewData.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                        {previewData.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      {previewData.locationName} ({previewData.campusBuilding})
                    </p>
                    {previewData.ownerPreview && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        Owner: {previewData.ownerPreview.name} ({previewData.ownerPreview.department}) [Protected]
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Handover Location Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Where did you find / place the item? <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={returnLocation}
                onChange={(e) => setReturnLocation(e.target.value)}
                placeholder="e.g. Central Library Safekeeping Desk (Ground Floor)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Notes Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Message to Owner / Verification Details <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="e.g. Found on Table 12 in 2nd floor library. Handed over to the library desk librarian."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !itemCodeInput.trim() || !previewData}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                {submitting ? 'Submitting Request...' : 'Submit Found Request (+50 Karma)'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReturnItemModal;
