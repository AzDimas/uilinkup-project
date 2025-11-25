import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './GroupPostDetail.css';

const getInitials = (name) => {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function GroupPostPage() {
  const { groupId, postId } = useParams();
  const { user } = useAuth();
  const myId = useMemo(
    () => Number(user?.id ?? user?.userId ?? 0) || null,
    [user]
  );

  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState(true);

  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [myRole, setMyRole] = useState(null);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/groups/${groupId}/posts/${postId}`);
      setPost(data?.post || null);
    } catch (e) {
      console.error('Post detail error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    setLoadingReplies(true);
    try {
      const { data } = await api.get(
        `/groups/${groupId}/posts/${postId}/replies`
      );
      setReplies(data?.items || []);
    } catch (e) {
      console.error('Replies error:', e?.response?.data || e.message);
    } finally {
      setLoadingReplies(false);
    }
  };

  const fetchMyRole = async () => {
    try {
      const { data } = await api.get(`/groups/${groupId}`);
      setMyRole(data?.myRole || null);
    } catch {
      setMyRole(null);
    }
  };

  useEffect(() => {
    fetchPost();
    fetchReplies();
    if (myId) fetchMyRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, postId, myId]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      alert('Isi reply terlebih dahulu.');
      return;
    }
    if (!myId) {
      alert('Harus login untuk mengirim reply.');
      return;
    }
    setSendingReply(true);
    try {
      await api.post(`/groups/${groupId}/posts/${postId}/replies`, {
        content: replyContent.trim(),
      });
      setReplyContent('');
      await fetchReplies();
      await fetchPost(); // update reply_count
    } catch (e2) {
      console.error('Add reply error:', e2?.response?.data || e2.message);
      alert(e2?.response?.data?.error || 'Gagal menambah reply.');
    } finally {
      setSendingReply(false);
    }
  };

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      particles.push(
        <div
          key={i}
          className="group-post-detail-particle"
          style={{
            width: `${Math.random() * 10 + 4}px`,
            height: `${Math.random() * 10 + 4}px`,
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

  if (loading) {
    return (
      <div className="group-post-detail-container">
        {renderParticles()}
        <div className="min-h-screen flex items-center justify-center">
          <div className="group-post-detail-loading"></div>
          <span className="ml-4 text-white text-lg">Memuat postingan...</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="group-post-detail-container">
        {renderParticles()}
        <div className="min-h-screen flex items-center justify-center">
          <div className="group-post-detail-empty-state">
            <div className="text-6xl mb-4 opacity-60">❌</div>
            <h3 className="text-xl font-semibold text-white mb-2">Postingan Tidak Ditemukan</h3>
            <p className="text-gray-400 mb-6">
              Postingan yang Anda cari tidak ditemukan atau mungkin telah dihapus.
            </p>
            <Link
              to={`/groups/${groupId}`}
              className="group-post-detail-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-block"
            >
              ← Kembali ke Group
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const EmptyRepliesState = () => (
    <div className="group-post-detail-empty-state">
      <div className="text-6xl mb-4 opacity-60">💬</div>
      <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Balasan</h3>
      <p className="text-gray-400 mb-6">
        Jadilah yang pertama membalas postingan ini dan mulai diskusi!
      </p>
    </div>
  );

  return (
    <div className="group-post-detail-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-yellow-500 rounded-full opacity-20 group-post-detail-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-blue-500 rounded-full opacity-20 group-post-detail-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-22 h-22 bg-blue-400 rounded-full opacity-20 group-post-detail-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Link
                to="/groups"
                className="group-post-detail-action-btn blue px-4 py-2 flex items-center gap-2"
              >
                <span>←</span>
                <span>Groups</span>
              </Link>
              
              <Link
                to={`/groups/${groupId}`}
                className="group-post-detail-action-btn green px-4 py-2 flex items-center gap-2"
              >
                <span>📋</span>
                <span>{post.group_name || 'Group'}</span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <span className="group-post-detail-badge blue flex items-center gap-1">
                <span>💬</span>
                <span>{post.reply_count ?? 0} Balasan</span>
              </span>
              {post.is_pinned && (
                <span className="group-post-detail-badge yellow flex items-center gap-1">
                  <span>📌</span>
                  <span>Pinned</span>
                </span>
              )}
            </div>
          </div>

          {/* Main Post Card */}
          <div className="group-post-detail-section-card">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-4 group-post-detail-gradient-text-blue-yellow">
                  {post.title}
                </h1>
                
                <div className="flex items-center gap-4 text-gray-300 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="group-post-detail-avatar text-sm">
                      {getInitials(post.author_name)}
                    </div>
                    <div>
                      <Link
                        to={`/profile/${post.author_id}`}
                        className="font-semibold text-white hover:text-blue-400 transition-colors"
                      >
                        {post.author_name}
                      </Link>
                      <div className="text-sm text-gray-400">
                        {post.created_at ? formatDate(post.created_at) : ''}
                      </div>
                    </div>
                  </div>
                  
                  {post.faculty && (
                    <span className="group-post-detail-badge purple">
                      🏫 {post.faculty}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="group-post-detail-post-card">
              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                {post.content}
              </div>
            </div>

            {/* Post Stats */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-600">
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <span>💬</span>
                  <span>{post.reply_count || 0} balasan</span>
                </span>
                <span className="flex items-center gap-2">
                  <span>📅</span>
                  <span>
                    {post.created_at 
                      ? new Date(post.created_at).toLocaleDateString('id-ID')
                      : ''
                    }
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Reply Form */}
          <div className="group-post-detail-section-card">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
              <span>✍️</span>
              Tambah Balasan
            </h2>
            
            <div className="group-post-detail-reply-form">
              <form onSubmit={handleSendReply} className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Isi Balasan Anda
                  </label>
                  <textarea
                    className="group-post-detail-form-textarea w-full px-4 py-3 rounded-xl"
                    rows={6}
                    placeholder="Tulis jawaban atau pendapat Anda mengenai postingan ini..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sendingReply || !replyContent.trim()}
                    className="group-post-detail-gradient-btn green px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingReply ? (
                      <>
                        <div className="group-post-detail-loading"></div>
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Kirim Balasan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Replies Section */}
          <div className="group-post-detail-section-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                <span>💬</span>
                Diskusi ({replies.length} Balasan)
              </h2>
              
              <div className="group-post-detail-stats-card">
                <div className="text-2xl font-bold text-white">{replies.length}</div>
                <div className="text-gray-400 text-sm">Total Balasan</div>
              </div>
            </div>

            {loadingReplies ? (
              <div className="flex justify-center items-center py-12">
                <div className="group-post-detail-loading"></div>
                <span className="ml-4 text-white text-lg">Memuat balasan...</span>
              </div>
            ) : replies.length === 0 ? (
              <EmptyRepliesState />
            ) : (
              <div className="space-y-4">
                {replies.map((reply, index) => (
                  <div key={reply.reply_id} className="group-post-detail-reply-card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="group-post-detail-avatar text-sm">
                          {getInitials(reply.author_name)}
                        </div>
                        <div>
                          <Link
                            to={`/profile/${reply.author_id}`}
                            className="font-semibold text-white hover:text-blue-400 transition-colors"
                          >
                            {reply.author_name}
                          </Link>
                          <div className="text-sm text-gray-400">
                            Balasan #{index + 1} • {reply.created_at ? formatDate(reply.created_at) : ''}
                          </div>
                        </div>
                      </div>
                      
                      {myRole === 'owner' || myRole === 'admin' ? (
                        <span className="group-post-detail-badge blue flex items-center gap-1">
                          <span>⭐</span>
                          <span className="capitalize">{myRole}</span>
                        </span>
                      ) : reply.author_id === myId && (
                        <span className="group-post-detail-badge green flex items-center gap-1">
                          <span>👤</span>
                          <span>Anda</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {reply.content}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-600 text-sm text-gray-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <span>#</span>
                          <span>Balasan {index + 1}</span>
                        </span>
                      </div>
                      
                      <Link
                        to={`/profile/${reply.author_id}`}
                        className="group-post-detail-action-btn blue px-3 py-1 flex items-center gap-1 text-sm"
                      >
                        <span>👀</span>
                        <span>Profil</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="group-post-detail-section-card text-center">
            <h3 className="text-lg font-semibold text-white mb-3">🚀 Aksi Cepat</h3>
            <p className="text-gray-400 mb-4">
              Lanjutkan diskusi atau jelajahi konten lainnya
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={`/groups/${groupId}`}
                className="group-post-detail-action-btn green px-6 py-3 flex items-center gap-2 justify-center"
              >
                <span>📋</span>
                <span>Lihat Group Lainnya</span>
              </Link>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="group-post-detail-action-btn blue px-6 py-3 flex items-center gap-2 justify-center"
              >
                <span>⬆️</span>
                <span>Ke Atas</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}