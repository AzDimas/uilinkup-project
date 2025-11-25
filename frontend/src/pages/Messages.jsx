// src/pages/Messages.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './Messages.css';

const PAGE_SIZE = 30;
const POLL_MS = 5000;

function formatTime(ts) {
  try {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === d.toDateString();
    
    if (isToday) {
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Kemarin';
    } else {
      return d.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit', 
        minute: '2-digit'
      });
    }
  } catch {
    return '';
  }
}

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Sidebar (threads)
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);

  // Active conversation
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Composer
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  // Unread counts (per partner_id)
  const [unreadMap, setUnreadMap] = useState({});

  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const loadingOlderRef = useRef(false);
  const lastScrollTsRef = useRef(0);

  // DEDUP & CURSOR GUARDS
  const seenIdsRef = useRef(new Set());
  const loadedCursorsRef = useRef({});

  const wantedId = searchParams.get('userId');

  const myId = useMemo(() => {
    return Number(user?.id ?? user?.userId ?? user?.data?.id ?? user?.data?.userId ?? 0) || null;
  }, [user]);

  const activePartnerId = useMemo(() => {
    return activeUser?.user_id ? Number(activeUser.user_id) : null;
  }, [activeUser]);

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 6; i++) {
      particles.push(
        <div
          key={i}
          className="messages-particle"
          style={{
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            background: i % 2 === 0 
              ? `rgba(255, 193, 7, ${Math.random() * 0.2 + 0.1})`
              : `rgba(33, 150, 243, ${Math.random() * 0.2 + 0.1})`
          }}
        />
      );
    }
    return particles;
  };

  // ------- helpers -------
  const fetchUserBasic = useCallback(async (uid) => {
    try {
      if (!uid) return null;
      const { data } = await api.get(`/users/${uid}`);
      const u = data?.user || data;
      return {
        user_id: Number(u?.id ?? u?.user_id ?? uid),
        name: u?.name || 'User',
        email: u?.email || '',
      };
    } catch {
      return { user_id: Number(uid), name: 'User', email: '' };
    }
  }, []);

  const isNearBottom = (el, px = 120) => {
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < px;
  };

  // -------- Load threads / unread --------
  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const { data } = await api.get('/messages/threads');
      const arr = Array.isArray(data?.threads) ? data.threads : data;
      setThreads(arr || []);
    } catch (e) {
      console.error('Load threads error:', e?.response?.data || e.message);
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  const loadUnreadSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/unread-count');
      const map = {};
      (data?.summary || []).forEach((r) => {
        map[Number(r.partner_id)] = Number(r.count) || 0;
      });
      setUnreadMap(map);
    } catch {
      /* ignore */
    }
  }, []);

  // -------- DEDUP util --------
  const mergeDedupAppend = useCallback((prev, incoming) => {
    const next = [];
    for (const m of incoming) {
      const id = String(m.message_id);
      if (!seenIdsRef.current.has(id)) {
        seenIdsRef.current.add(id);
        next.push(m);
      }
    }
    return [...prev, ...next];
  }, []);

  const mergeDedupPrepend = useCallback((prev, incoming) => {
    const nextNew = [];
    for (const m of incoming) {
      const id = String(m.message_id);
      if (!seenIdsRef.current.has(id)) {
        seenIdsRef.current.add(id);
        nextNew.push(m);
      }
    }
    return [...nextNew, ...prev];
  }, []);

  const resetDedupForPartner = useCallback(() => {
    seenIdsRef.current = new Set();
  }, []);

  const markCursorLoaded = useCallback((partnerId, cursor) => {
    const key = String(partnerId);
    if (!loadedCursorsRef.current[key]) loadedCursorsRef.current[key] = new Set();
    loadedCursorsRef.current[key].add(String(cursor ?? 'null'));
  }, []);

  const hasCursorLoaded = useCallback((partnerId, cursor) => {
    const key = String(partnerId);
    const set = loadedCursorsRef.current[key];
    if (!set) return false;
    return set.has(String(cursor ?? 'null'));
  }, []);

  // -------- Load messages (one conversation) --------
  const fetchConversation = useCallback(
    async (partnerId, cursor = null, reset = false) => {
      if (!partnerId) return;
      if (loadingMessages) return;

      if (!reset && hasCursorLoaded(partnerId, cursor)) {
        loadingOlderRef.current = false;
        return;
      }

      setLoadingMessages(true);
      try {
        const params = new URLSearchParams();
        params.set('userId', partnerId);
        params.set('limit', PAGE_SIZE);
        if (cursor) params.set('cursor', cursor);

        const { data } = await api.get(`/messages/history?${params.toString()}`);
        const items = Array.isArray(data?.items) ? data.items : [];
        const next = data?.nextCursor ?? null;

        if (reset) {
          resetDedupForPartner();
          loadedCursorsRef.current[String(partnerId)] = new Set();
          const deduped = mergeDedupAppend([], items);
          setMessages(deduped);
        } else {
          const beforeCount = messages.length;
          const deduped = mergeDedupPrepend(messages, items);
          if (deduped.length === beforeCount) {
            setNextCursor(null);
            setLoadingMessages(false);
            loadingOlderRef.current = false;
            markCursorLoaded(partnerId, cursor);
            return;
          }
          setMessages(deduped);
        }

        setNextCursor(next);
        markCursorLoaded(partnerId, cursor);

        try {
          await api.post('/messages/mark-read', { userId: partnerId });
          setUnreadMap((m) => ({ ...m, [Number(partnerId)]: 0 }));
        } catch {
          /* ignore */
        }

        if (reset && bottomRef.current) {
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 20);
        }
      } catch (e) {
        console.error('Fetch conversation error:', e?.response?.data || e.message);
      } finally {
        setLoadingMessages(false);
        loadingOlderRef.current = false;
      }
    },
    [
      loadingMessages,
      hasCursorLoaded,
      markCursorLoaded,
      resetDedupForPartner,
      mergeDedupAppend,
      mergeDedupPrepend,
      messages,
    ]
  );

  // -------- Open a conversation from a thread object --------
  const openConversation = useCallback(
    async (threadLike) => {
      if (!threadLike) return;
      setActiveUser({
        user_id: Number(threadLike.user_id),
        name: threadLike.name || 'User',
        email: threadLike.email || '',
      });
      setMessages([]);
      setNextCursor(null);
      await fetchConversation(Number(threadLike.user_id), null, true);
    },
    [fetchConversation]
  );

  // -------- Send message (optimistic) --------
  const sendMessage = useCallback(
    async (e) => {
      e?.preventDefault?.();
      if (!activePartnerId || !text.trim() || sending) return;
      const msgText = text.trim();
      setSending(true);

      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        message_id: tempId,
        sender_id: myId,
        receiver_id: activePartnerId,
        content: msgText,
        message_type: 'text',
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => mergeDedupAppend(prev, [optimistic]));
      setText('');

      try {
        const payload = { receiverId: activePartnerId, content: msgText, messageType: 'text' };
        const { data } = await api.post('/messages/send', payload);
        const saved = data?.message;

        if (saved && saved.message_id) {
          seenIdsRef.current.delete(String(tempId));
          setMessages((prev) => {
            const withoutTemp = prev.filter((m) => String(m.message_id) !== String(tempId));
            return mergeDedupAppend(withoutTemp, [saved]);
          });
        } else {
          await fetchConversation(activePartnerId, null, true);
        }

        const el = listRef.current;
        if (isNearBottom(el, 200)) {
          setTimeout(() => {
            fetchConversation(activePartnerId, null, true);
            loadThreads();
          }, 150);
        } else {
          loadThreads();
        }
      } catch (e2) {
        console.error('Send message error:', e2?.response?.data || e2.message);
        seenIdsRef.current.delete(String(tempId));
        setMessages((prev) => prev.filter((m) => String(m.message_id) !== String(tempId)));
        alert(e2?.response?.data?.error || 'Gagal mengirim pesan');
      } finally {
        setSending(false);
      }
    },
    [activePartnerId, text, sending, myId, mergeDedupAppend, fetchConversation, loadThreads]
  );

  // -------- Infinite scroll (load older on top) + throttle --------
  const onScroll = useCallback(() => {
    const now = Date.now();
    if (now - lastScrollTsRef.current < 150) return;
    lastScrollTsRef.current = now;

    if (!listRef.current || loadingOlderRef.current || !nextCursor || loadingMessages) return;
    const el = listRef.current;

    if (el.scrollTop <= 80) {
      loadingOlderRef.current = true;
      const prevHeight = el.scrollHeight;
      fetchConversation(activePartnerId, nextCursor, false).then(() => {
        setTimeout(() => {
          const newHeight = el.scrollHeight;
          el.scrollTop = newHeight - prevHeight;
        }, 20);
      });
    }
  }, [nextCursor, loadingMessages, activePartnerId, fetchConversation]);

  // -------- Effects --------
  useEffect(() => {
    loadThreads();
    loadUnreadSummary();
  }, [loadThreads, loadUnreadSummary]);

  useEffect(() => {
    const openByQuery = async () => {
      if (!wantedId) return;
      if (loadingThreads) return;

      const found = threads.find((th) => String(th.user_id) === String(wantedId));
      if (found) {
        await openConversation(found);
        return;
      }

      const basic = await fetchUserBasic(Number(wantedId));
      setActiveUser(basic);
      setMessages([]);
      setNextCursor(null);
      await fetchConversation(Number(wantedId), null, true);
    };
    openByQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantedId, loadingThreads, threads]);

  useEffect(() => {
    if (!activePartnerId || threads.length === 0) return;
    const th = threads.find((t) => Number(t.user_id) === Number(activePartnerId));
    if (th && (th.name || th.email)) {
      setActiveUser((prev) => ({
        user_id: prev?.user_id ?? th.user_id,
        name: th.name || prev?.name || 'User',
        email: th.email || prev?.email || '',
      }));
    }
  }, [threads, activePartnerId]);

  useEffect(() => {
    const id = setInterval(async () => {
      await loadThreads();
      await loadUnreadSummary();
      if (activePartnerId) {
        const el = listRef.current;
        if (isNearBottom(el, 200) && !loadingMessages) {
          await fetchConversation(activePartnerId, null, true);
        }
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [activePartnerId, fetchConversation, loadThreads, loadUnreadSummary, loadingMessages]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  const isOwn = (m) => Number(m.sender_id) === Number(myId);

  const EmptyThreadsState = () => (
    <div className="messages-empty-state">
      <div className="text-6xl mb-4 opacity-60">💬</div>
      <h3 className="text-xl font-semibold text-white mb-2">Belum ada percakapan</h3>
      <p className="text-gray-400 mb-6">Mulai percakapan dengan terhubung ke user lain</p>
      <button
        onClick={() => navigate('/users')}
        className="messages-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
      >
        Jelajahi User
      </button>
    </div>
  );

  const EmptyMessagesState = () => (
    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
      <div className="text-6xl mb-4 opacity-60">👋</div>
      <h3 className="text-xl font-semibold text-white mb-2">Mulai Percakapan</h3>
      <p className="text-center text-gray-400 mb-4">
        Kirim pesan pertama Anda untuk memulai percakapan dengan {activeUser?.name || 'user ini'}
      </p>
    </div>
  );

  return (
    <div className="messages-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-yellow-500 rounded-full opacity-20 messages-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-blue-500 rounded-full opacity-20 messages-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-18 h-18 bg-blue-400 rounded-full opacity-20 messages-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto h-[80vh] min-h-0 grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar: Threads */}
          <div className="messages-sidebar md:col-span-1 flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white messages-gradient-text-blue">
                  Pesan
                </h2>
                {loadingThreads && (
                  <div className="messages-loading"></div>
                )}
              </div>
            </div>

            {/* Threads List */}
            <div className="flex-1 min-h-0 overflow-y-auto messages-scrollable p-4">
              {threads.length === 0 && !loadingThreads ? (
                <EmptyThreadsState />
              ) : (
                <div className="space-y-3">
                  {threads.map((t) => {
                    const isActive = Number(activePartnerId) === Number(t.user_id);
                    const unread = unreadMap[Number(t.user_id)] || Number(t.unread_count) || 0;
                    return (
                      <div
                        key={t.user_id}
                        onClick={() => openConversation(t)}
                        className={`messages-thread-item p-4 cursor-pointer ${
                          isActive ? 'active' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="messages-avatar">
                              {String(t.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="messages-status-indicator online"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-white truncate">
                                {t.name || 'User'}
                              </h3>
                              {t.last_at && (
                                <div className="text-xs text-gray-400 whitespace-nowrap">
                                  {formatTime(t.last_at)}
                                </div>
                              )}
                            </div>
                            {t.last_message && (
                              <p className="text-sm text-gray-400 line-clamp-1 mb-2">
                                {t.last_message}
                              </p>
                            )}
                            {unread > 0 && (
                              <div className="flex justify-end">
                                <span className="messages-badge yellow">
                                  {unread}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Conversation */}
          <div className="messages-conversation md:col-span-3 flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              {activeUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="messages-avatar">
                      {String(activeUser.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-semibold text-white text-lg">
                        {activeUser.name || 'User'}
                      </h2>
                      <p className="text-sm text-gray-400">{activeUser.email || ''}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {messages.length} pesan
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-white messages-gradient-text-yellow">
                    Pilih Percakapan
                  </h2>
                  <p className="text-gray-400 mt-1">Pilih percakapan dari daftar di sebelah kiri</p>
                </div>
              )}
            </div>

            {/* Messages list */}
            <div 
              ref={listRef} 
              className="flex-1 min-h-0 overflow-y-auto messages-scrollable p-6 space-y-4"
            >
              {activeUser && (
                <>
                  {nextCursor && (
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          if (!loadingOlderRef.current && nextCursor) {
                            loadingOlderRef.current = true;
                            const el = listRef.current;
                            const prevHeight = el.scrollHeight;
                            fetchConversation(activePartnerId, nextCursor, false).then(() => {
                              setTimeout(() => {
                                const newHeight = el.scrollHeight;
                                el.scrollTop = newHeight - prevHeight;
                              }, 20);
                            });
                          }
                        }}
                        className="messages-gradient-btn px-4 py-2 rounded-lg text-sm font-semibold"
                      >
                        📜 Muat Pesan Lama
                      </button>
                    </div>
                  )}

                  {messages.length === 0 && !loadingMessages ? (
                    <EmptyMessagesState />
                  ) : (
                    <>
                      {messages.map((m) => (
                        <div
                          key={m.message_id}
                          className={`flex ${isOwn(m) ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`message-bubble ${
                              isOwn(m) ? 'own' : 'other'
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">
                              {m.content}
                            </div>
                            <div className="message-time">
                              {formatTime(m.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </>
                  )}
                </>
              )}
            </div>

            {/* Composer */}
            {activeUser && (
              <form onSubmit={sendMessage} className="p-6 border-t border-gray-700">
                <div className="flex items-end gap-3 messages-input-container">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Tulis pesan..."
                    disabled={sending}
                    className="flex-1 messages-input px-4 py-3 resize-none"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    className="messages-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="messages-loading"></div>
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <span>Kirim</span>
                        <span>✈️</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;