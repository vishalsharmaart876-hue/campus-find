import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  ShieldCheck,
  Package,
  Calendar,
  Phone,
  Send,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Award
} from 'lucide-react';
import api from '../../services/api';

const QRHandoverScanner = ({ isOpen, onClose, onHandoverSuccess }) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [manualToken, setManualToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [handoverComplete, setHandoverComplete] = useState(false);
  const [handoverResult, setHandoverResult] = useState(null);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const scannerRegionId = 'qr-handover-reader';

  // Stop scanner safely
  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        setIsScanning(false);
      }
    }
  };

  // Start HTML5 QR Code Webcam Scanner
  const startCamera = async () => {
    setErrorMsg('');
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setErrorMsg('No camera device detected on this system. Please use manual token input.');
        return;
      }

      const html5QrCode = new Html5Qrcode(scannerRegionId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          console.log('[QR Scanner] Detected QR:', decodedText);
          handleTokenDetected(decodedText);
          stopCamera();
        },
        (errorMessage) => {
          // ignore common scan frame misses
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.warn('Failed to start camera:', err);
      setErrorMsg('Camera permission denied or camera in use. Please enter the pickup token manually.');
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !previewData && !handoverComplete) {
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen, activeTab, previewData, handoverComplete]);

  // Lookup & Preview Pickup QR Token
  const handleTokenDetected = async (token) => {
    if (!token || !token.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/claims/preview-pickup', {
        qrCodeToken: token.trim()
      });
      if (res.data.success) {
        setPreviewData(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid or unrecognized QR pickup token.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm Physical Handover & Mark Item Recovered
  const confirmHandover = async () => {
    if (!previewData || !previewData.claim) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/claims/verify-pickup', {
        qrCodeToken: previewData.claim.qrCodeToken
      });

      if (res.data.success) {
        setHandoverResult(res.data);
        setHandoverComplete(true);

        // Confetti burst for successful recovered item
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        if (onHandoverSuccess) onHandoverSuccess(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error confirming handover.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setPreviewData(null);
    setHandoverComplete(false);
    setHandoverResult(null);
    setManualToken('');
    setErrorMsg('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Campus Handover Verification Desk</span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
                  Admin Pass
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Scan student's unique QR pickup token to authenticate ownership and mark item recovered.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* VIEW 1: SUCCESSFUL HANDOVER CONFIRMATION */}
          {handoverComplete && handoverResult ? (
            <div className="text-center py-6 space-y-5 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Item Officially Marked Recovered!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Handover completed and verified by Campus Administration.
                </p>
              </div>

              {/* Recovery Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-left border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                  <div className="text-xs text-slate-500">Item Title</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {handoverResult.itemTitle}
                  </div>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                  <div className="text-xs text-slate-500">Collected By</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {handoverResult.claimedBy} ({handoverResult.claimantRollNo || 'Student'})
                  </div>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                  <div className="text-xs text-slate-500">Finder Awarded</div>
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>+50 Campus Karma Points ({handoverResult.finderName})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">Notifications Sent</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span>📧 Email Sent</span>
                    <span>•</span>
                    <span>💬 WhatsApp Ready</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={resetState}
                  className="px-5 py-2.5 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-500 flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Scan Next Pickup QR</span>
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Close Desk
                </button>
              </div>
            </div>
          ) : previewData ? (
            /* VIEW 2: PREVIEW & VERIFY CLAIMANT DETAILS BEFORE HANDOVER */
            <div className="space-y-5 animate-in fade-in">
              {/* Status Header */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  previewData.canComplete
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>
                    {previewData.canComplete
                      ? 'VALID PICKUP PASS: Verified & Ready for Physical Handover'
                      : previewData.claim.isPickedUp
                      ? 'ALREADY COLLECTED: Item has already been marked recovered.'
                      : 'EXPIRED OR INVALID PASS'}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-1 bg-white/70 dark:bg-slate-900/70 rounded-lg">
                  {previewData.claim.qrCodeToken}
                </span>
              </div>

              {/* Two-Column Grid: Claimant & Item */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Claimant Verification Card */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>Owner / Claimant</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Verify Student ID
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={
                        previewData.claimant.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                      }
                      alt={previewData.claimant.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {previewData.claimant.name}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Roll: {previewData.claimant.rollNumber || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {previewData.claimant.department || 'Student'}
                      </div>
                    </div>
                  </div>

                  {previewData.claimant.phone && (
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>Phone:</span>
                      </span>
                      <a
                        href={`https://wa.me/91${previewData.claimant.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(
                          previewData.claimant.name
                        )},%20your%20item%20is%20ready%20at%20the%20handover%20desk.`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>+91 {previewData.claimant.phone}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Item Details Card */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      <span>Item to Hand Over</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      {previewData.item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {previewData.item.images && previewData.item.images.length > 0 ? (
                      <img
                        src={previewData.item.images[0]}
                        alt={previewData.item.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
                        {previewData.item.title}
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1">
                        📍 {previewData.item.locationName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Finder: {previewData.finder ? previewData.finder.name : 'Campus Member'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 text-xs text-slate-500">
                    Proof submitted: "{previewData.claim.proofDescription}"
                  </div>
                </div>
              </div>

              {/* Handover Action Toolbar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={resetState}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  ← Scan Another Code
                </button>

                <button
                  onClick={confirmHandover}
                  disabled={!previewData.canComplete || loading}
                  className="px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Recording Handover...' : 'Confirm Handover & Mark Recovered'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* VIEW 3: SCANNER / INPUT TABS */
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                <button
                  onClick={() => setActiveTab('camera')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'camera'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Webcam / Camera Scanner</span>
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    setActiveTab('manual');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'manual'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Manual Token Input</span>
                </button>
              </div>

              {/* CAMERA SCANNER TAB */}
              {activeTab === 'camera' && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800">
                    <div id={scannerRegionId} className="w-full h-full" />
                    {!isScanning && !loading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-white space-y-3">
                        <Camera className="w-10 h-10 text-indigo-400 animate-pulse" />
                        <p className="text-xs text-slate-300 max-w-xs">
                          Point student's phone screen showing their CampusFind Pickup QR Code towards the camera.
                        </p>
                        <button
                          onClick={startCamera}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md"
                        >
                          Start Camera
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-center text-slate-400">
                    💡 Hold the student's Pickup Pass QR code steadily in the viewfinder box.
                  </p>
                </div>
              )}

              {/* MANUAL TOKEN INPUT TAB */}
              {activeTab === 'manual' && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-4">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Enter Unique Pickup QR Code Token
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. CF-PICKUP-DEMO-9942 or CF-PICKUP-XXXX-XXXX"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-2.5 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleTokenDetected(manualToken)}
                      disabled={!manualToken.trim() || loading}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify Token'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Each verified claim has a unique crypto-random token generated upon approval.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRHandoverScanner;
