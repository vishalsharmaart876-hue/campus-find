import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Eye,
  Trash2,
  Edit,
  ShieldCheck,
  HelpCircle,
  Check,
  X,
  MessageSquare,
  Copy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import QRCodeModal from '../components/claims/QRCodeModal';
import api from '../services/api';

const MyReportsPage = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('lost'); // 'lost', 'found', 'claims', 'requests'
  const [items, setItems] = useState([]);
  const [claims, setMyClaims] = useState([]);
  const [submittedRequests, setSubmittedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Claims Modal state
  const [reviewItem, setReviewItem] = useState(null);
  const [itemClaims, setItemClaims] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQrClaim, setActiveQrClaim] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, claimsRes] = await Promise.all([
        api.get('/items/my-reports'),
        api.get('/claims/my-claims')
      ]);

      if (itemsRes.data.success) {
        setItems(itemsRes.data.items || []);
        setSubmittedRequests(itemsRes.data.submittedRequests || []);
      }
      if (claimsRes.data.success) {
        setMyClaims(claimsRes.data.claims || []);
      }
    } catch (err) {
      console.error('Error loading my reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const lostItems = items.filter((i) => i.type === 'lost');
  const foundItems = items.filter((i) => i.type === 'found');

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.delete(`/items/${itemId}`);
      setItems(items.filter((i) => i._id !== itemId));
    } catch (err) {
      alert('Error deleting item');
    }
  };

  const handleOwnerDecision = async (itemId, action) => {
    let rejectionReason = '';
    if (action === 'reject') {
      rejectionReason = window.prompt('Please provide a reason for rejecting this found request:') || 'Not a match for my lost item';
    }

    try {
      const res = await api.post(`/items/${itemId}/owner-decision`, { action, rejectionReason });
      if (res.data.success) {
        alert(res.data.message);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing request');
    }
  };

  const handleConfirmReceived = async (itemId) => {
    const handoverNotes = window.prompt('Add handover confirmation notes (e.g. Received at Central Library desk):') || 'Handover confirmed by owner';
    try {
      const res = await api.post(`/items/${itemId}/confirm-received`, { handoverNotes });
      if (res.data.success) {
        alert('🎉 Item received! Handover confirmed and complaint is now marked as RESOLVED.');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error confirming receipt');
    }
  };

  const handleOpenClaimsForFound = async (item) => {
    setReviewItem(item);
    setReviewLoading(true);
    try {
      const res = await api.get(`/claims/item/${item._id}`);
      if (res.data.success) {
        setItemClaims(res.data.claims || []);
      }
    } catch (err) {
      alert('Could not fetch claims for this item');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleApproveClaim = async (claimId) => {
    try {
      const res = await api.put(`/claims/${claimId}/approve`, {
        notes: 'Verification accepted. QR code generated for pickup.'
      });
      if (res.data.success) {
        alert('Claim approved! Pickup pass generated.');
        setReviewItem(null);
        fetchData();
      }
    } catch (err) {
      alert('Error approving claim');
    }
  };

  const handleRejectClaim = async (claimId) => {
    const reason = window.prompt('Please provide a reason for rejecting this claim:') || 'Ownership details could not be verified.';
    try {
      const res = await api.put(`/claims/${claimId}/reject`, { reason });
      if (res.data.success) {
        alert('Claim rejected.');
        setReviewItem(null);
        fetchData();
      }
    } catch (err) {
      alert('Error rejecting claim');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          My Reports & Ownership Claims
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Track your lost and found submissions, review claims from students, and access pickup QR passes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('lost')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'lost'
              ? 'text-rose-600 dark:text-rose-400 border-b-2 border-rose-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          My Lost Items ({lostItems.length})
        </button>

        <button
          onClick={() => setActiveTab('found')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'found'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          My Found Items ({foundItems.length})
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'claims'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          Claims I Filed ({claims.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'requests'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          Found Requests I Submitted ({submittedRequests.length})
        </button>
      </div>

      {/* Tab Content: Lost Items */}
      {activeTab === 'lost' && (
        <div className="space-y-4">
          {lostItems.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              You haven't reported any lost items.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lostItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900/80 text-white">
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900">
                          Complaint ID: {item.complaintId || item.itemCode}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            navigator.clipboard.writeText(item.complaintId || item.itemCode);
                            alert(`Copied Complaint ID: ${item.complaintId || item.itemCode}`);
                          }}
                          className="text-[10px] text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold"
                          title="Copy Complaint ID"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.category} • {item.locationName}
                      </p>

                      {/* State 1: Verification Pending Owner Approval */}
                      {item.status === 'verification_pending' && item.foundRequest?.status === 'pending_approval' && (
                        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 space-y-2 mt-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-200">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                            <span>Found Item Request Received!</span>
                          </div>
                          <p className="text-[11px] text-purple-900 dark:text-purple-300">
                            <strong>{item.foundRequest.requestedByName || 'A finder'}</strong> reported finding this item at <em>{item.foundRequest.foundLocation}</em>:
                            {item.foundRequest.foundNotes && (
                              <span className="block italic text-[10px] mt-0.5">"{item.foundRequest.foundNotes}"</span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleOwnerDecision(item._id, 'accept')}
                              className="flex-1 py-1.5 px-2.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
                            >
                              Accept Request
                            </button>
                            <button
                              onClick={() => handleOwnerDecision(item._id, 'reject')}
                              className="py-1.5 px-2.5 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 hover:bg-rose-200 rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {/* State 2: Handover Pending Confirmation */}
                      {item.status === 'handover_pending' && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 space-y-2 mt-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Handover in Progress</span>
                          </div>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300">
                            Request accepted from <strong>{item.foundRequest?.requestedByName}</strong>. Coordinate handover and confirm receipt below once you receive the item.
                          </p>
                          <button
                            onClick={() => handleConfirmReceived(item._id)}
                            className="w-full py-1.5 px-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
                          >
                            Confirm Received & Resolve
                          </button>
                        </div>
                      )}

                      {/* State 3: Resolved */}
                      {['resolved', 'returned'].includes(item.status) && (
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mt-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>RESOLVED: Item safely received.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                    <Link
                      to={`/items/${item._id}`}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </Link>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Found Items */}
      {activeTab === 'found' && (
        <div className="space-y-4">
          {foundItems.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              You haven't reported any found items.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {foundItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-600 text-white">
                        {item.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.category} • {item.locationName}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenClaimsForFound(item)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Review Claims
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Claims I Filed */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              You haven't filed any claims yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {claims.map((claim) => (
                <div
                  key={claim._id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
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
                      <span className="text-[11px] text-slate-400">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {claim.item?.title || 'Claimed Belonging'}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      Proof: {claim.proofDescription}
                    </p>

                    {claim.reviewNotes && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                        <strong>Review Note:</strong> {claim.reviewNotes}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <Link
                      to={`/items/${claim.item?._id}`}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      View Item Details →
                    </Link>

                    {claim.status === 'approved' && (
                      <button
                        onClick={() => {
                          setActiveQrClaim(claim);
                          setQrModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center gap-1.5 shadow-sm"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Pickup Pass
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Found Requests I Submitted */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {submittedRequests.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              You haven't submitted any Found Item Requests yet. Found a lost item? Submit a request using its Complaint ID!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submittedRequests.map((reqItem) => {
                const reqStatus = reqItem.foundRequest?.status || 'pending_approval';
                return (
                  <div
                    key={reqItem._id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {reqItem.complaintId || reqItem.itemCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            reqStatus === 'confirmed_received' || reqItem.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : reqStatus === 'accepted' || reqItem.status === 'handover_pending'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                              : reqStatus === 'rejected'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                          }`}
                        >
                          {reqStatus === 'confirmed_received' || reqItem.status === 'resolved'
                            ? 'Resolved (+50 Pts)'
                            : reqStatus === 'accepted' || reqItem.status === 'handover_pending'
                            ? 'Accepted (Handover)'
                            : reqStatus === 'rejected'
                            ? 'Rejected'
                            : 'Pending Owner Approval'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {reqItem.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Category: {reqItem.category} • Location: {reqItem.locationName}
                      </p>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          <strong>My Found Location:</strong> {reqItem.foundRequest?.foundLocation}
                        </p>
                        {reqItem.foundRequest?.foundNotes && (
                          <p className="text-[11px] text-slate-500 italic">
                            "{reqItem.foundRequest?.foundNotes}"
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400">
                          Submitted: {new Date(reqItem.foundRequest?.requestedAt || reqItem.updatedAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Status explanation banner */}
                      {reqStatus === 'pending_approval' && (
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Owner has been notified. Awaiting their approval.</span>
                        </div>
                      )}

                      {(reqStatus === 'accepted' || reqItem.status === 'handover_pending') && (
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Owner accepted! Arrange handover to complete return.</span>
                        </div>
                      )}

                      {(reqStatus === 'confirmed_received' || reqItem.status === 'resolved') && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Handover confirmed! +50 Campus Karma Points earned.</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <Link
                        to={`/items/${reqItem._id}`}
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Complaint Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Review Claims Modal for Found Items */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Review Claims on "{reviewItem.title}"
              </h3>
              <button onClick={() => setReviewItem(null)} className="p-1 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 flex-1">
              {reviewLoading ? (
                <p className="text-xs text-slate-400 text-center py-8">Loading claims...</p>
              ) : itemClaims.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No claims submitted yet for this item.</p>
              ) : (
                itemClaims.map((claim) => (
                  <div
                    key={claim._id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            claim.claimant?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(claim.claimant?.name || 'User')}`
                          }
                          alt="Claimant"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {claim.claimant?.name}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            {claim.claimant?.department} • Roll: {claim.claimant?.rollNumber || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {claim.status}
                      </span>
                    </div>

                    {/* Questionnaire Answers */}
                    {claim.answers && claim.answers.length > 0 && (
                      <div className="space-y-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Verification Questionnaire Answers:
                        </span>
                        {claim.answers.map((a, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Q: {a.question}</span>
                            <p className="text-indigo-600 dark:text-indigo-400 pl-2">A: {a.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      <strong>Proof Notes:</strong> {claim.proofDescription}
                    </div>

                    {/* Actions if pending */}
                    {claim.status === 'pending' && (
                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRejectClaim(claim._id)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveClaim(claim._id)}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm"
                        >
                          Approve & Generate QR
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Pass Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        claim={activeQrClaim}
        item={activeQrClaim?.item}
      />
    </div>
  );
};

export default MyReportsPage;
