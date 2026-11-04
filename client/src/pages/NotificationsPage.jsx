import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  QrCode,
  ShieldCheck,
  Check,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Send,
  Layers
} from 'lucide-react';
import api from '../services/api';

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'dispatch_log'
  const [notifications, setNotifications] = useState([]);
  const [dispatchLogs, setDispatchLogs] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [notifRes, logRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/dispatch-log').catch(() => ({ data: { logs: [] } }))
      ]);

      if (notifRes.data.success) {
        setNotifications(notifRes.data.notifications || []);
      }
      if (logRes.data?.logs) {
        setDispatchLogs(logRes.data.logs);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      // ignore
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'claim_approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'match_found':
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      case 'claim_received':
        return <ShieldCheck className="w-5 h-5 text-indigo-500" />;
      case 'reward_earned':
      case 'item_returned':
        return <CheckCircle2 className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Notifications Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time updates on claims, AI visual matches, and multi-channel Email & WhatsApp alerts.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'inbox'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            My Inbox ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('dispatch_log')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'dispatch_log'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Send className="w-3 h-3 text-emerald-500" />
            <span>Email & WhatsApp Log</span>
          </button>
        </div>
      </div>

      {/* SUB-HEADER / ACTIONS FOR INBOX */}
      {activeTab === 'inbox' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                filter === 'unread'
                  ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-400 text-indigo-600'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {filter === 'unread' ? 'Showing Unread' : 'Filter: All'}
            </button>
          </div>

          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      )}

      {/* TAB 1: NOTIFICATIONS INBOX */}
      {activeTab === 'inbox' && (
        <>
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
              Loading notifications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">All caught up!</h3>
              <p className="text-xs text-slate-400">You have no new notifications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((n) => (
                <div
                  key={n._id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                    !n.isRead
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {n.title}
                        </h4>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                        )}
                        {/* Channel Badges */}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" />
                            <span>Email Dispatched</span>
                          </span>
                          {n.whatsappUrl && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              <span>WhatsApp</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                        {n.whatsappUrl && (
                          <a
                            href={n.whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Open in WhatsApp</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {n.relatedItem && (
                      <Link
                        to={`/items/${n.relatedItem._id || n.relatedItem}`}
                        className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl flex items-center gap-1"
                        title="View Item"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(n._id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: REAL-TIME EMAIL & WHATSAPP DISPATCH LOG */}
      {activeTab === 'dispatch_log' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Multi-Channel Outbox Log</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Live Service
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Audit log of all automated Email and WhatsApp alerts sent for matching items, claim updates, and pickup passes.
              </p>
            </div>
            <button
              onClick={fetchNotifications}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Refresh Log
            </button>
          </div>

          {dispatchLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No recent dispatches in log. When items match or claims are approved, automated alerts will appear here in real time.
            </div>
          ) : (
            <div className="space-y-3">
              {dispatchLogs.map((log, index) => (
                <div
                  key={index}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{log.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                        {log.type}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-mono text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {log.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>👤 {log.recipientName}</span>
                      <span>📧 {log.recipientEmail}</span>
                      <span>📱 {log.recipientPhone}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {log.whatsappUrl && (
                        <a
                          href={log.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Open in WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
