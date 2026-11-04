import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShieldCheck, X, Sparkles, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const VerifyPickupModal = ({ isOpen, onClose, onVerifiedSuccess }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/claims/verify-pickup', {
        qrCodeToken: tokenInput.trim()
      });

      if (res.data.success) {
        setSuccessData(res.data);
        // Trigger celebratory confetti!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        if (onVerifiedSuccess) {
          onVerifiedSuccess(res.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the pickup token.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setTokenInput('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {successData ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Item Returned Successfully!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Handover confirmed for "{successData.itemTitle}"
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center gap-2 text-amber-800 dark:text-amber-200">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold">+50 Campus Karma Points Granted!</span>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-1">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Verify Item Return
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter or scan the Lost Item ID or Pickup QR Token to finalize the return.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Item ID or Pickup QR Token String
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder="e.g. CF-LOST-100234 or CF-PICKUP-DEMO-9942"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Accepts generated <strong className="text-slate-600 dark:text-slate-300">CF-LOST-XXXXXX</strong> or QR tokens.
              </span>
            </div>

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
                disabled={loading || !tokenInput.trim()}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
              >
                {loading ? 'Verifying...' : 'Confirm Return'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerifyPickupModal;
