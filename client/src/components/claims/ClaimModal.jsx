import React, { useState } from 'react';
import { ShieldCheck, X, Upload, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import api from '../../services/api';

const ClaimModal = ({ isOpen, onClose, item, onClaimSubmitted }) => {
  const [answers, setAnswers] = useState({});
  const [proofDescription, setProofDescription] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !item) return null;

  const handleAnswerChange = (question, value) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofDescription.trim()) {
      setError('Please provide proof or description confirming ownership.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('itemId', item._id);
      formData.append('proofDescription', proofDescription);

      // Format answers
      const formattedAnswers = Object.keys(answers).map((q) => ({
        question: q,
        answer: answers[q]
      }));
      formData.append('answers', JSON.stringify(formattedAnswers));

      if (proofImage) {
        formData.append('proofImages', proofImage);
      }

      const res = await api.post('/claims', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        if (onClaimSubmitted) onClaimSubmitted(res.data.claim);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting claim. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Submit Ownership Claim
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Claiming: "{item.title}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Verification questions from finder */}
          {item.verificationQuestions && item.verificationQuestions.length > 0 && (
            <div className="space-y-3 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Ownership Verification Questions
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                The finder specified questions only the true owner would know:
              </p>

              {item.verificationQuestions.map((q, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {idx + 1}. {q}
                  </label>
                  <input
                    type="text"
                    required
                    value={answers[q] || ''}
                    onChange={(e) => handleAnswerChange(q, e.target.value)}
                    placeholder="Your answer..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Detailed Proof Description */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Proof Description & Distinctive Details <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              placeholder="Describe distinctive marks, serial numbers, wallpapers, contents, brand, or unique features that prove this item belongs to you."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Optional Proof Photo / Invoice */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Attach Supporting Photo or Receipt (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 font-medium transition-colors">
                <Upload className="w-4 h-4 text-indigo-500" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {previewUrl && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            ℹ️ Claims are reviewed by the finder and campus authorities. Submitting false claims is subject to college disciplinary action.
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md transition-colors"
            >
              {loading ? 'Submitting Claim...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaimModal;
