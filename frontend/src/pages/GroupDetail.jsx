import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './GroupDetail.css';

const groupTypeLabel = (t) => {
  const map = {
    faculty: 'Faculty Forum',
    program: 'Program Forum',
    interest: 'Interest / Topic Forum',
  };
  return map[t] || t || '-';
};

const groupTypeEmoji = (t) => {
  const map = {
    faculty: '🏛️',
    program: '🎓',
    interest: '💡',
  };
  return map[t] || '👥';
};

export default function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const myId = useMemo(
    () => Number(user?.id ?? user?.userId ?? 0) || null,
    [user]
  );

  const [group, setGroup] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(true);

  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [postSearch, setPostSearch] = useState('');
  const [postPage, setPostPage] = useState(1);
  const postPageSize = 10;

  const [joining, setJoining] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
  });

  const totalPostPages = Math.max(1, Math.ceil(totalPosts / postPageSize));
  const isMember = !!myRole;

  const fetchGroup = async () => {
    setLoadingGroup(true);
    try {
      const { data } = await api.get(`/groups/${groupId}`);
      setGroup(data?.group || null);
      setMyRole(data?.myRole || null);
    } catch (e) {
      console.error('Group detail error:', e?.response?.data || e.message);
    } finally {
      setLoadingGroup(false);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data } = await api.get(`/groups/${groupId}/posts`, {
        params: { q: postSearch, page: postPage, pageSize: postPageSize },
      });
      setPosts(data?.items || []);
      setTotalPosts(data?.total || 0);
    } catch (e) {
      console.error('Group posts error:', e?.response?.data || e.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, postSearch, postPage]);

  const handleJoin = async () => {
    if (!myId) {
      alert('Harus login untuk join group.');
      return;
    }
    setJoining(true);
    try {
      await api.post(`/groups/${groupId}/join`);
      await fetchGroup();
      await fetchPosts();
    } catch (e) {
      console.error('Join group error:', e?.response?.data || e.message);
      alert(e?.response?.data?.error || 'Gagal join group.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    setJoining(true);
    try {
      await api.post(`/groups/${groupId}/leave`);
      await fetchGroup();
    } catch (e) {
      console.error('Leave group error:', e?.response?.data || e.message);
      alert(e?.response?.data?.error || 'Gagal leave group.');
    } finally {
      setJoining(false);
    }
  };

  const onChangePostForm = (e) => {
    const { name, value } = e.target;
    setPostForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmitPost = async (e) => {
    e.preventDefault();
    if (!isMember) {
      alert('Anda harus menjadi member group untuk membuat post.');
      return;
    }
    if (!postForm.title.trim() || !postForm.content.trim()) {
      alert('Judul dan konten wajib diisi.');
      return;
    }
    try {
      const payload = {
        title: postForm.title.trim(),
        content: postForm.content.trim(),
      };
      await api.post(`/groups/${groupId}/posts`, payload);
      alert('Post berhasil dibuat.');
      setPostForm({ title: '', content: '' });
      setCreatingPost(false);
      setPostPage(1);
      await fetchPosts();
    } catch (e2) {
      console.error('Create post error:', e2?.response?.data || e2.message);
      alert(e2?.response?.data?.error || 'Gagal membuat post.');
    }
  };

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      particles.push(
        <div
          key={i}
          className="group-detail-particle"
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

  if (loadingGroup) {
    return (
      <div className="group-detail-container">
        {renderParticles()}
        <div className="min-h-screen flex items-center justify-center">
          <div className="group-detail-loading"></div>
          <span className="ml-4 text-white text-lg">Memuat group...</span>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-detail-container">
        {renderParticles()}
        <div className="min-h-screen flex items-center justify-center">
          <div className="group-detail-empty-state">
            <div className="text-6xl mb-4 opacity-60">❌</div>
            <h3 className="text-xl font-semibold text-white mb-2">Group Tidak Ditemukan</h3>
            <p className="text-gray-400 mb-6">
              Group yang Anda cari tidak ditemukan atau mungkin telah dihapus.
            </p>
            <Link
              to="/groups"
              className="group-detail-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-block"
            >
              ← Kembali ke Groups
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const EmptyPostsState = () => (
    <div className="group-detail-empty-state">
      <div className="text-6xl mb-4 opacity-60">📝</div>
      <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Postingan</h3>
      <p className="text-gray-400 mb-6">
        {isMember 
          ? 'Jadilah yang pertama membuat postingan di group ini!'
          : 'Bergabunglah dengan group untuk melihat dan membuat postingan.'
        }
      </p>
      {!isMember && (
        <button
          onClick={handleJoin}
          className="group-detail-gradient-btn green px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
        >
          🚀 Bergabung Sekarang
        </button>
      )}
    </div>
  );

  return (
    <div className="group-detail-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-yellow-500 rounded-full opacity-20 group-detail-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-blue-500 rounded-full opacity-20 group-detail-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-22 h-22 bg-blue-400 rounded-full opacity-20 group-detail-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/groups"
              className="group-detail-action-btn blue px-4 py-2 flex items-center gap-2"
            >
              <span>←</span>
              <span>Kembali ke Groups</span>
            </Link>
            
            <div className="flex items-center gap-3">
              {isMember && (
                <Link
                  to={`/groups/${groupId}/members`}
                  className="group-detail-action-btn green px-4 py-2 flex items-center gap-2"
                >
                  <span>👥</span>
                  <span>Lihat Anggota</span>
                </Link>
              )}
            </div>
          </div>

          {/* Group Header */}
          <div className="group-detail-section-card">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {group.name}
                  </h1>
                  <span className={`group-detail-type-badge ${group.group_type} flex items-center gap-2`}>
                    <span>{groupTypeEmoji(group.group_type)}</span>
                    <span>{groupTypeLabel(group.group_type)}</span>
                  </span>
                </div>

                <div className="space-y-3 text-gray-300">
                  {group.faculty && (
                    <div className="flex items-center gap-3">
                      <span className="text-yellow-400">🏫</span>
                      <span>{group.faculty}</span>
                    </div>
                  )}
                  
                  {group.group_type === 'interest' && group.interest_field && (
                    <div className="flex items-center gap-3">
                      <span className="text-purple-400">📌</span>
                      <span>Topik: {group.interest_field}</span>
                    </div>
                  )}

                  {group.description && (
                    <div className="mt-4 p-4 bg-black bg-opacity-30 rounded-xl">
                      <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {group.description}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-400 pt-4">
                    <span className="flex items-center gap-2">
                      <span>👤</span>
                      <span>Dibuat oleh: {group.creator_name}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span>📅</span>
                      <span>
                        {group.created_at
                          ? new Date(group.created_at).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : ''}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Group Actions */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="group-detail-stats-card">
                    <div className="text-2xl font-bold text-white mb-1">
                      {group.member_count ?? 0}
                    </div>
                    <div className="text-gray-400 text-sm">Anggota</div>
                  </div>
                  <div className="group-detail-stats-card">
                    <div className="text-2xl font-bold text-white mb-1">
                      {totalPosts}
                    </div>
                    <div className="text-gray-400 text-sm">Postingan</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {isMember ? (
                    <>
                      {myRole && (
                        <div className={`group-detail-role-badge ${myRole} text-center`}>
                          Role: {myRole}
                        </div>
                      )}
                      {myRole !== 'owner' && (
                        <button
                          onClick={handleLeave}
                          disabled={joining}
                          className="group-detail-gradient-btn red px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 justify-center disabled:opacity-50"
                        >
                          {joining ? (
                            <>
                              <div className="group-detail-loading"></div>
                              <span>Keluar...</span>
                            </>
                          ) : (
                            <>
                              <span>🚪</span>
                              <span>Keluar Group</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={joining}
                      className="group-detail-gradient-btn green px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 justify-center disabled:opacity-50"
                    >
                      {joining ? (
                        <>
                          <div className="group-detail-loading"></div>
                          <span>Bergabung...</span>
                        </>
                      ) : (
                        <>
                          <span>🤝</span>
                          <span>Bergabung Group</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="group-detail-section-card">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                <span>📝</span>
                Diskusi Group
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  className="group-detail-form-input px-4 py-3 rounded-xl focus:outline-none"
                  placeholder="🔍 Cari postingan..."
                  value={postSearch}
                  onChange={(e) => {
                    setPostSearch(e.target.value);
                    setPostPage(1);
                  }}
                />
                
                {isMember && (
                  <button
                    onClick={() => setCreatingPost((v) => !v)}
                    className="group-detail-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>{creatingPost ? '✕' : '✏️'}</span>
                    <span>{creatingPost ? 'Batal' : 'Post Baru'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* New Post Form */}
            {creatingPost && isMember && (
              <div className="group-detail-card dark p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>✨</span>
                  Buat Postingan Baru
                </h3>
                
                <form onSubmit={onSubmitPost} className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Judul Postingan
                    </label>
                    <input
                      name="title"
                      className="group-detail-form-input w-full px-4 py-3 rounded-xl"
                      placeholder="Masukkan judul yang menarik..."
                      value={postForm.title}
                      onChange={onChangePostForm}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Konten
                    </label>
                    <textarea
                      name="content"
                      className="group-detail-form-textarea w-full px-4 py-3 rounded-xl"
                      rows={6}
                      placeholder="Tulis isi postingan Anda di sini..."
                      value={postForm.content}
                      onChange={onChangePostForm}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-sm text-gray-400">
                      Postingan akan visible untuk semua anggota group
                    </span>
                    <button
                      type="submit"
                      className="group-detail-gradient-btn blue px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <span>🚀</span>
                      <span>Publikasikan</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Posts List */}
            {loadingPosts ? (
              <div className="flex justify-center items-center py-12">
                <div className="group-detail-loading"></div>
                <span className="ml-4 text-white text-lg">Memuat postingan...</span>
              </div>
            ) : posts.length === 0 ? (
              <EmptyPostsState />
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Link
                    key={post.post_id}
                    to={`/groups/${groupId}/posts/${post.post_id}`}
                    className={`group-detail-post-card block hover:no-underline ${post.is_pinned ? 'pinned' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-white pr-4">
                        {post.title}
                      </h3>
                      {post.is_pinned && (
                        <span className="group-detail-badge yellow flex items-center gap-1">
                          <span>📌</span>
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400 pt-3 border-t border-gray-600">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <span>👤</span>
                          <span>{post.author_name}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>💬</span>
                          <span>{post.reply_count ?? 0} balasan</span>
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <span>📅</span>
                        <span>
                          {post.created_at
                            ? new Date(post.created_at).toLocaleDateString('id-ID')
                            : ''}
                        </span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPostPages > 1 && (
              <div className="group-detail-pagination">
                <button
                  disabled={postPage <= 1}
                  onClick={() => setPostPage((pp) => pp - 1)}
                  className="group-detail-pagination-btn flex items-center gap-2"
                >
                  <span>←</span>
                  <span>Sebelumnya</span>
                </button>
                
                <span className="group-detail-pagination-info">
                  Halaman {postPage} dari {totalPostPages}
                </span>
                
                <button
                  disabled={postPage >= totalPostPages}
                  onClick={() => setPostPage((pp) => pp + 1)}
                  className="group-detail-pagination-btn flex items-center gap-2"
                >
                  <span>Berikutnya</span>
                  <span>→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}