import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Eye,
  ShieldCheck,
  Tag,
  CreditCard,
  MessageSquare,
  Sparkles,
  HelpCircle,
  Share2,
  CheckCircle2,
  Clock,
  ArrowLeft,
  AlertTriangle,
  Lock,
  QrCode,
  AlertCircle,
  PackageCheck,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CampusMap from '../components/map/CampusMap';
import ClaimModal from '../components/claims/ClaimModal';
import VerifyPickupModal from '../components/claims/VerifyPickupModal';
import ReturnItemModal from '../components/claims/ReturnItemModal';
import QRCodeModal from '../components/claims/QRCodeModal';
import api from '../services/api';

const ItemDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [verifyPickupOpen, setVerifyPickupOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeClaim, setActiveClaim] = useState(null);

  // AI Matching state
  const [aiMatches, setAiMatches] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRan, setAiRan] = useState(false);

  const fetchItem = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/items/${id}`);
      if (res.data.success) {
        setItem(res.data.item);
        if (res.data.item.images && res.data.item.images.length > 0) {
          setSelectedPhoto(res.data.item.images[0]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading item details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/items/${id}` } } });
      return;
    }

    try {
      const recipientId = item.reportedBy?._id || item.reportedBy?.id;
      const res = await api.post('/chat/conversations', {
        recipientId,
        itemId: item._id
      });
      if (res.data.success) {
        navigate('/messages', { state: { conversationId: res.data.conversation._id } });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not initiate conversation.');
    }
  };

  const handleOwnerDecision = async (action) => {
    let rejectionReason = '';
    if (action === 'reject') {
      rejectionReason = window.prompt('Please provide a reason for rejecting this found request:') || 'Not matching my lost item';
    }

    try {
      const res = await api.post(`/items/${item._id}/owner-decision`, { action, rejectionReason });
      if (res.data.success) {
        alert(res.data.message);
        fetchItem();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing request');
    }
  };

  const handleConfirmReceived = async () => {
    const handoverNotes = window.prompt('Add handover confirmation notes (e.g. Received safely from finder at Central Library):') || 'Handover confirmed by owner';
    try {
      const res = await api.post(`/items/${item._id}/confirm-received`, { handoverNotes });
      if (res.data.success) {
        alert('🎉 Item received! Handover confirmed and complaint is now marked as RESOLVED.');
        fetchItem();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error confirming receipt');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mx-auto"></div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl max-w-4xl mx-auto"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Item Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error || 'This report may have been deleted.'}</p>
        <Link to="/browse" className="inline-block px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl">
          Browse Other Items
        </Link>
      </div>
    );
  }

  const isOwner = user && (user.id === item.reportedBy?._id || user._id === item.reportedBy?._id);
  const isLost = item.type === 'lost';
  const defaultPhoto = isLost
    ? 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800'
    : 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Results
        </button>

        <span className="text-xs font-mono text-slate-400">
          Ref ID: {item._id.slice(-8).toUpperCase()}
        </span>
      </div>

      {/* Main Grid: Left Photos, Right Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 cols): Photo Gallery & Map Mini Preview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Photo Card */}
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-md">
            <img
              src={selectedPhoto || defaultPhoto}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultPhoto;
              }}
            />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span
                className={`px-3 py-1 text-xs font-bold rounded-xl uppercase tracking-wider text-white shadow-md backdrop-blur-md ${
                  isLost ? 'bg-rose-600' : 'bg-emerald-600'
                }`}
              >
                {isLost ? 'Lost Item' : 'Found Item'}
              </span>

              {item.isEmergencyId && (
                <span className="px-3 py-1 text-xs font-bold rounded-xl bg-amber-500 text-white flex items-center gap-1 shadow-md">
                  <CreditCard className="w-3.5 h-3.5" />
                  College ID Card
                </span>
              )}
            </div>

            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 text-xs font-bold rounded-xl bg-slate-900/80 text-white backdrop-blur-md">
                Status: {item.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Multiple Thumbnails if available */}
          {item.images && item.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {item.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPhoto(img)}
                  className={`w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedPhoto === img
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Location Interactive Mini-Map */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-500" />
                Reported Location on Campus
              </h4>
              <Link to="/map" className="text-[11px] font-semibold text-indigo-600 hover:underline">
                View Full Map →
              </Link>
            </div>

            <CampusMap
              items={[item]}
              height="200px"
              selectedItem={item}
              showControls={false}
            />

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              📍 {item.locationName} ({item.campusBuilding})
            </p>
          </div>
        </div>

        {/* Right Column (7 cols): Information, Verification, Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Title & Category Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {item.category}
                </span>
                {(item.complaintId || item.itemCode) && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    <span>Complaint ID: {item.complaintId || item.itemCode}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const cid = item.complaintId || item.itemCode;
                        navigator.clipboard.writeText(cid);
                        setCopiedId(true);
                        setTimeout(() => setCopiedId(false), 2000);
                      }}
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Copy Complaint ID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Reported on {new Date(item.dateTime || item.createdAt).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {item.title}
              </h1>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Item Description
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>

            {/* Status 1: Returned / Resolved Status Banner for Lost Items */}
            {isLost && ['resolved', 'returned'].includes(item.status) && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Complaint Resolved & Item Recovered 🎉
                  </h4>
                  <p className="text-xs">
                    This lost complaint was verified and handed over safely on {new Date(item.recoveredAt || item.updatedAt).toLocaleDateString()}
                    {item.returnedBy?.name ? ` with ${item.returnedBy.name}` : ''}.
                  </p>
                  {item.returnNotes && (
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                      Handover Notes: {item.returnNotes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Status 2: Verification Pending Approval */}
            {isLost && item.status === 'verification_pending' && (
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                  <span>Found Item Request Received — Pending Owner Approval</span>
                </div>
                <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
                  A campus member (<strong>{item.foundRequest?.requestedByName || 'Finder'}</strong>) submitted a found request with Complaint ID <strong>{item.complaintId || item.itemCode}</strong> at location: <em>{item.foundRequest?.foundLocation}</em>.
                  {item.foundRequest?.foundNotes && (
                    <span className="block italic mt-1 text-[11px]">"{item.foundRequest.foundNotes}"</span>
                  )}
                </p>

                {isOwner && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleOwnerDecision('accept')}
                      className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-colors"
                    >
                      Accept Request & Arrange Handover
                    </button>
                    <button
                      onClick={() => handleOwnerDecision('reject')}
                      className="py-2.5 px-4 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 hover:bg-rose-200 rounded-xl transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Status 3: Handover Pending Confirmation */}
            {isLost && item.status === 'handover_pending' && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Found Request Accepted — Handover in Progress</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  The request was accepted. Handover is currently arranged with <strong>{item.foundRequest?.requestedByName || 'Finder'}</strong>.
                  Once you have physically received your item, confirm receipt to award +50 Karma Points to the finder and resolve this complaint.
                </p>

                {isOwner && (
                  <button
                    onClick={handleConfirmReceived}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Item Received & Mark Resolved
                  </button>
                )}
              </div>
            )}

            {/* Status 4: Active Lost Complaint ID Box */}
            {isLost && item.status === 'active' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    Unique Complaint ID
                  </span>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono text-xs font-bold">
                    <span>{item.complaintId || item.itemCode}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const cid = item.complaintId || item.itemCode;
                        navigator.clipboard.writeText(cid);
                        setCopiedId(true);
                        setTimeout(() => setCopiedId(false), 2000);
                      }}
                      className="text-slate-400 hover:text-emerald-600 transition-colors"
                      title="Copy Complaint ID"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                  {isOwner
                    ? '📢 Keep this Complaint ID safe. When another user finds your item, they will enter this ID to submit a Found Item Request.'
                    : 'Found this lost item? Click "Submit Found Request" below to verify this Complaint ID and notify the owner directly.'}
                </p>
              </div>
            )}

            {/* Sensitive Information Protection Notice */}
            {item.isSensitive && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Sensitive Ownership Details Protected</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Distinctive internal identifiers (markings, specific contents) are hidden to prevent fraudulent claims.
                  Claimants will be asked ownership questions before collection.
                </p>
              </div>
            )}

            {/* Verification Questions Preview */}
            {item.verificationQuestions && item.verificationQuestions.length > 0 && (
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  Ownership Verification Questionnaire
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  {item.verificationQuestions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reporter Profile Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    item.reportedBy?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(item.reportedBy?.name || 'User')}&background=6366f1&color=fff`
                  }
                  alt={item.reportedBy?.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Reported by {item.reportedBy?.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.reportedBy?.department} • {item.reportedBy?.role?.toUpperCase()}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Phone: {item.reportedBy?.phone || '••••••••'} (Protected)
                  </p>
                </div>
              </div>

              {!isOwner && (
                <button
                  onClick={handleStartChat}
                  className="px-3.5 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {/* Submit Found Item Request for Lost Items */}
              {isLost && item.status === 'active' && !isOwner && (
                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/login', { state: { from: { pathname: `/items/${id}` } } });
                    } else {
                      setReturnModalOpen(true);
                    }
                  }}
                  className="flex-1 py-3 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <PackageCheck className="w-4 h-4" />
                  Found This Item? (Verify Complaint ID & Request Return)
                </button>
              )}

              {/* If Found item and not reported by current user, show Claim button */}
              {!isLost && !isOwner && item.status === 'active' && (
                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/login', { state: { from: { pathname: `/items/${id}` } } });
                    } else {
                      setClaimModalOpen(true);
                    }
                  }}
                  className="flex-1 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Claim This Item
                </button>
              )}

              {/* Verify return button for finder */}
              {isOwner && !isLost && (
                <button
                  onClick={() => setVerifyPickupOpen(true)}
                  className="flex-1 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Verify Return (QR Code)
                </button>
              )}

              {/* Modular AI Visual Match Trigger */}
              <button
                onClick={handleRunAiMatch}
                disabled={aiLoading}
                className="py-3 px-4 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                {aiLoading ? 'Analyzing Visuals...' : 'Run AI Vision Match'}
              </button>
            </div>
          </div>

          {/* AI Match Results Banner */}
          {aiRan && (
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-white dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-slate-900 p-6 rounded-3xl border border-purple-200 dark:border-purple-800/80 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-600 text-white">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      AI Visual Computer Vision Matches ({aiMatches.length})
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      OpenCV HSV color distribution and ORB feature similarity
                    </p>
                  </div>
                </div>
              </div>

              {aiMatches.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No visual matches found above confidence threshold. New reports will be compared automatically.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiMatches.map((m, idx) => (
                    <Link
                      key={idx}
                      to={`/items/${m.item_id}`}
                      className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-purple-800/60 hover:border-purple-400 transition-colors flex items-center gap-3 shadow-sm"
                    >
                      <img
                        src={m.image || defaultPhoto}
                        alt={m.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                            {m.title}
                          </span>
                          <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                            {m.similarity_score}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {m.category} • {m.confidence} Confidence
                        </p>
                        <span className="text-[10px] font-semibold text-indigo-600 hover:underline">
                          View Candidate →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Claim Modal */}
      <ClaimModal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        item={item}
        onClaimSubmitted={() => {
          fetchItem();
          alert('Claim submitted successfully! The finder will review your verification answers.');
        }}
      />

      {/* Verify Return Modal */}
      <VerifyPickupModal
        isOpen={verifyPickupOpen}
        onClose={() => setVerifyPickupOpen(false)}
        onVerifiedSuccess={() => {
          fetchItem();
        }}
      />

      {/* Return Item By ID Modal */}
      <ReturnItemModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        prefillItemCode={item?.itemCode || ''}
        onSuccess={() => {
          fetchItem();
        }}
      />
    </div>
  );
};

export default ItemDetailsPage;
