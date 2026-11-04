import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Shield,
  ShieldAlert,
  User,
  ExternalLink,
  Ban,
  Clock,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const MessagingPage = () => {
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation, incomingMessage } = useSocket();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load user's conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations || []);

        // If navigated with specific conversationId in state
        const targetId = location.state?.conversationId;
        if (targetId) {
          const target = res.data.conversations.find((c) => c._id === targetId);
          if (target) {
            setActiveConversation(target);
          } else if (res.data.conversations.length > 0) {
            setActiveConversation(res.data.conversations[0]);
          }
        } else if (res.data.conversations.length > 0 && !activeConversation) {
          setActiveConversation(res.data.conversations[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chat/conversations/${activeConversation._id}/messages`);
        if (res.data.success) {
          setMessages(res.data.messages || []);
          scrollToBottom();
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };

    fetchMessages();
    joinConversation(activeConversation._id);

    return () => {
      leaveConversation(activeConversation._id);
    };
  }, [activeConversation]);

  // Listen for real-time messages
  useEffect(() => {
    if (
      incomingMessage &&
      activeConversation &&
      incomingMessage.conversationId === activeConversation._id
    ) {
      setMessages((prev) => [...prev, incomingMessage]);
      scrollToBottom();
    }
  }, [incomingMessage, activeConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConversation) return;

    const msgToSend = text.trim();
    setText('');

    try {
      const res = await api.post(`/chat/conversations/${activeConversation._id}/messages`, {
        text: msgToSend
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
        scrollToBottom();

        // Update conversation list preview
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id
              ? { ...c, lastMessage: msgToSend, lastMessageAt: new Date() }
              : c
          )
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending message.');
    }
  };

  const handleToggleBlock = async () => {
    if (!activeConversation) return;
    if (!window.confirm('Toggle block on this conversation?')) return;

    try {
      const res = await api.put(`/chat/conversations/${activeConversation._id}/block`);
      if (res.data.success) {
        alert(res.data.message);
        fetchConversations();
      }
    } catch (err) {
      alert('Error updating block status.');
    }
  };

  const getPartner = (conv) => {
    return conv.participants.find((p) => p._id !== user.id && p._id !== user._id) || {};
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden h-[75vh] flex flex-col md:flex-row">
        {/* Left Sidebar: Conversations List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Campus Messages</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Private chat between finders and claimants
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active conversations. Click "Send Message" on any item page to reach out.
              </div>
            ) : (
              conversations.map((conv) => {
                const partner = getPartner(conv);
                const isSelected = activeConversation?._id === conv._id;

                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full text-left p-4 transition-colors flex items-center gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <img
                      src={
                        partner.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name || 'User')}&background=6366f1&color=fff`
                      }
                      alt={partner.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {partner.name || 'Campus Member'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(conv.lastMessageAt || conv.updatedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {conv.lastMessage || 'Conversation opened'}
                      </p>
                      {conv.item && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate block">
                          Ref: {conv.item.title}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Chat Stream */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col h-full bg-slate-50/40 dark:bg-slate-950/40">
            {/* Chat Header */}
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={
                    getPartner(activeConversation).avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(getPartner(activeConversation).name || 'User')}&background=6366f1&color=fff`
                  }
                  alt="Partner"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {getPartner(activeConversation).name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {getPartner(activeConversation).department} • {getPartner(activeConversation).role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeConversation.item && (
                  <Link
                    to={`/items/${activeConversation.item._id || activeConversation.item}`}
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 rounded-xl hover:bg-indigo-100 flex items-center gap-1"
                  >
                    <span>Item</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
                <button
                  onClick={handleToggleBlock}
                  title="Block / Safety Options"
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950"
                >
                  <Ban className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Safety Guidance Callout */}
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-200 flex items-center gap-1.5 shrink-0">
              <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Safety reminder: Hand off items at public campus points (Library Reception or Security Post).
              </span>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, idx) => {
                const isMe = m.sender?._id === user.id || m.sender?._id === user._id || m.sender === user.id;

                return (
                  <div
                    key={m._id || idx}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-md p-3 rounded-2xl text-xs space-y-1 ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                      <span
                        className={`text-[9px] block text-right ${
                          isMe ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-md transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400 p-8">
            Select a conversation on the left to start chatting.
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;
