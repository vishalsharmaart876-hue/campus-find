import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  QrCode,
  AlertCircle,
  ExternalLink,
  Camera,
  Send,
  Sparkles,
  Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import QRHandoverScanner from '../../components/admin/QRHandoverScanner';

const AdminClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/claims', {
        params: { status: statusFilter }
      });
      if (res.data.success) {
        setClaims(res.data.claims || []);
      }
    } catch (err) {
      console.error('Error loading claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const handleApprove = async (claimId) => {
    try {
      const res = await api.put(`/claims/${claimId}/approve`, {
        notes: 'Admin verified and approved. Present QR code at handover desk.'
      });
      if (res.data.success) {
        alert('Claim approved! Unique Pickup QR Code generated and dispatched via Email and WhatsApp.');
        fetchClaims();
      }
    } catch (err) {
      alert('Error approving claim');
    }
  };

  const handleReject = async (claimId) => {
    const reason = window.prompt('Enter rejection reason:') || 'Ownership validation failed.';
    try {
      const res = await api.put(`/claims/${claimId}/reject`, { reason });
      if (res.data.success) {
        alert('Claim rejected.');
        fetchClaims();
      }
    } catch (err) {
      alert('Error rejecting claim');
    }
  };

  return (
    <div className="space-y-6">
      {/* Handover Banner & Live QR Scanner CTA */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-700/50">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-bold border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Campus Security Handover Protocol</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Physical QR Handover & Recovery Desk
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed">
            When a verified student arrives to collect their approved belonging, scan their unique Pickup QR Pass with the camera. The system will authenticate ownership, mark the item as recovered, and disburse karma reward points automatically.
          </p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-white text-indigo-950 hover:bg-indigo-50 shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 whitespace-nowrap"
        >
          <Camera className="w-5 h-5 text-indigo-600" />
          <span>Scan Handover QR Code</span>
        </button>
      </div>

      {/* Claims Queue Container */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Claim Verification Queue
            </h3>
            <p className="text-xs text-slate-500">
              Review ownership questionnaires, issue pickup passes, or verify handovers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
            >
              <option value="all">All Claims</option>
              <option value="pending">Pending Only</option>
              <option value="approved">Approved / Ready for Pickup</option>
              <option value="completed">Completed / Recovered</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

      {/* Claims List */}
      <div className="space-y-4">
        {loading ? (
          <p className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading claims queue...</p>
        ) : claims.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400">No claims found.</p>
        ) : (
          claims.map((claim) => (
            <div
              key={claim._id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      claim.claimant?.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(claim.claimant?.name || 'User')}`
                    }
                    alt="Claimant"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {claim.claimant?.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {claim.claimant?.department} • Roll No: {claim.claimant?.rollNumber || 'N/A'} • {claim.claimant?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      claim.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : claim.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {claim.status}
                  </span>
                  {claim.qrCodeToken && (
                    <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {claim.qrCodeToken}
                    </span>
                  )}
                </div>
              </div>

              {/* Item Details */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Target Item: </span>
                  <Link
                    to={`/items/${claim.item?._id}`}
                    target="_blank"
                    className="font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 inline-flex items-center gap-1"
                  >
                    <span>{claim.item?.title}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <span className="text-[11px] text-slate-400">
                  Submitted {new Date(claim.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Questionnaire Answers */}
              {claim.answers && claim.answers.length > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Verification Answers:
                  </span>
                  {claim.answers.map((a, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{a.question}: </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">{a.answer}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Proof Description */}
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <strong>Ownership Proof Notes: </strong>
                {claim.proofDescription}
              </div>

              {/* Admin Actions */}
              {claim.status === 'pending' && (
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleReject(claim._id)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl"
                  >
                    Reject Claim
                  </button>
                  <button
                    onClick={() => handleApprove(claim._id)}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm"
                  >
                    Approve & Issue Pickup QR
                  </button>
                </div>
              )}

              {claim.status === 'approved' && !claim.isPickedUp && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Pickup Pass:</span>
                    <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      {claim.qrCodeToken}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {claim.claimant?.phone && (
                      <a
                        href={`https://wa.me/91${claim.claimant.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(
                          claim.claimant.name
                        )},%20your%20claim%20for%20"${encodeURIComponent(
                          claim.item?.title || 'item'
                        )}"%20is%20approved!%20Your%20Pickup%20Pass%20is%20${claim.qrCodeToken}.%20Please%20collect%20at%20Security%20Desk.`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </a>
                    )}

                    <button
                      onClick={() => setIsScannerOpen(true)}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Verify Handover Desk</span>
                    </button>
                  </div>
                </div>
              )}

              {claim.isPickedUp && (
                <div className="pt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Item Handover Complete & Recovered on {new Date(claim.pickedUpAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      </div>

      {/* QR Handover Webcam Scanner Modal */}
      <QRHandoverScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onHandoverSuccess={() => fetchClaims()}
      />
    </div>
  );
};

export default AdminClaimsPage;
