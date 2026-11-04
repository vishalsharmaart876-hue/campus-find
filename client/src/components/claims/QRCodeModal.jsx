import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, X, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

const QRCodeModal = ({ isOpen, onClose, claim, item }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !claim) return null;

  const qrToken = claim.qrCodeToken || 'CF-PICKUP-DEMO-9942';

  const handleCopy = () => {
    navigator.clipboard.writeText(qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <QrCode className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Official Item Pickup Pass
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Present this secure QR code or pickup token to the finder or safekeeping desk.
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-white dark:bg-white rounded-2xl border-2 border-dashed border-indigo-200 inline-block shadow-inner mx-auto">
            <QRCodeSVG
              value={qrToken}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Token String Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Pickup Token
              </span>
              <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                {qrToken}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Security & Instructions Notice */}
          <div className="text-left text-xs text-slate-600 dark:text-slate-400 space-y-1.5 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300">
              <ShieldCheck className="w-4 h-4" />
              <span>Safe Pickup Security</span>
            </div>
            <p>1. Meet at a designated campus location (Library Reception or Security Post).</p>
            <p>2. The finder will verify your code to confirm the handoff.</p>
            <p>3. Finder will receive +50 Karma Points upon successful verification.</p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close Pickup Pass
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
