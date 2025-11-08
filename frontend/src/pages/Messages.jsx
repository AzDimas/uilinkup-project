// src/pages/Messages.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const PAGE_SIZE = 30;
const POLL_MS = 5000;

function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });
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
  const [activeUser, setActiveUser] = useState(null); // { user_id, name, email }
  const [messages, setMessages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Composer
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  // Unread counts (per partner_id)
  const [unreadMap, setUnreadMap] = useState({}); // { [userId]: number }

  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const loadingOlderRef = useRef(false);
  const lastScrollTsRef = useRef(0); // throttle

  // DEDUP & CURSOR GUARDS
  const seenIdsRef = useRef(new Set());                 // set of message_id (number/string)
  const loadedCursorsRef = useRef({});                  // { [partnerId]: Set<cursorString|null> }

  const wantedId = searchParams.get('userId');

  const myId = useMemo(() => {
    return Number(user?.id ?? user?.userId ?? user?.data?.id ?? user?.data?.userId ?? 0) || null;
  }, [user]);

  const activePartnerId = useMemo(() => {
    return activeUser?.user_id ? Number(activeUser.user_id) : null;
  }, [activeUser]);

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
    if (now - lastScrollTsRef.current < 150) return; // throttle 150ms
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

  // ✅ FIXED: no extra parenthesis here
  const isOwn = (m) => Number(m.sender_id) === Number(myId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Kembali
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            </div>
            <nav className="flex space-x-4">
              <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-800">
                Dashboard
              </button>
              <button onClick={() => navigate('/users')} className="text-gray-600 hover:text-gray-800">
                Users
              </button>
              <button onClick={() => navigate('/connections')} className="text-gray-600 hover:text-gray-800">
                Connections
              </button>
              <button onClick={() => navigate('/messages')} className="text-blue-600 hover:text-blue-800 font-medium">
                Messages
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border h-[78vh] min-h-0 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Sidebar: Threads */}
          <aside className="border-r overflow-y-auto min-h-0 h-full max-h-full overscroll-contain">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
                {loadingThreads && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                )}
              </div>
            </div>

            {threads.length === 0 && !loadingThreads ? (
              <div className="p-6 text-center text-gray-500">
                Belum ada percakapan.
              </div>
            ) : (
              <ul className="divide-y">
                {threads.map((t) => {
                  const isActive = Number(activePartnerId) === Number(t.user_id);
                  const unread = unreadMap[Number(t.user_id)] || Number(t.unread_count) || 0;
                  return (
                    <li
                      key={t.user_id}
                      onClick={() => openConversation(t)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${isActive ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{t.name || 'User'}</div>
                          {t.last_message && (
                            <div className="text-sm text-gray-500 line-clamp-1">{t.last_message}</div>
                          )}
                        </div>
                        <div className="text-right">
                          {t.last_at && (
                            <div className="text-xs text-gray-400">{formatTime(t.last_at)}</div>
                          )}
                          {unread > 0 && (
                            <span className="inline-flex items-center justify-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Conversation */}
          <section className="md:col-span-2 flex flex-col h-full min-h-0 overscroll-contain">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              {activeUser ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {String(activeUser.name || 'U').charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{activeUser.name || 'User'}</div>
                      <div className="text-sm text-gray-500">{activeUser.email || ''}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {messages.length} pesan
                  </div>
                </>
              ) : (
                <div className="text-gray-500">Pilih percakapan di sebelah kiri</div>
              )}
            </div>

            {/* Messages list */}
            <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
              {activeUser && (
                <>
                  {nextCursor && (
                    <div className="flex justify-center mb-3">
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
                        className="text-xs px-3 py-1 rounded-full border text-gray-600 hover:bg-gray-50"
                      >
                        Load older
                      </button>
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      Belum ada pesan. Mulai percakapan!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((m) => (
                        <div
                          key={m.message_id}
                          className={`flex ${isOwn(m) ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                              isOwn(m)
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">
                              {m.content}
                            </div>
                            <div
                              className={`mt-1 text-[10px] ${
                                isOwn(m) ? 'text-blue-100' : 'text-gray-500'
                              }`}
                            >
                              {formatTime(m.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Composer */}
            <form onSubmit={sendMessage} className="p-4 border-t bg-white">
              <div className="flex items-end space-x-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={activeUser ? 'Tulis pesan...' : 'Pilih percakapan dahulu'}
                  disabled={!activeUser || sending}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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
                  disabled={!activeUser || !text.trim() || sending}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? 'Mengirim...' : 'Kirim'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Messages;
