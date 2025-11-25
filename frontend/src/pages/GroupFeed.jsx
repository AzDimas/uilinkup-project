import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './GroupFeed.css';

const FACULTIES = [
  'Fakultas Ekonomi dan Bisnis',
  'Fakultas Farmasi',
  'Fakultas Hukum',
  'Fakultas Ilmu Administrasi',
  'Fakultas Ilmu Keperawatan',
  'Fakultas Ilmu Komputer',
  'Fakultas Ilmu Pengetahuan Budaya',
  'Fakultas Ilmu Sosial dan Ilmu Politik',
  'Fakultas Kesehatan Masyarakat',
  'Fakultas Kedokteran',
  'Fakultas Kedokteran Gigi',
  'Fakultas Matematika dan Ilmu Pengetahuan Alam',
  'Fakultas Psikologi',
  'Fakultas Teknik',
  'Program Pendidikan Vokasi',
];

const getInitials = (name) => {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function GroupFeed() {
  const { user } = useAuth();
  const isLoggedIn = useMemo(() => !!user, [user]);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [faculty, setFaculty] = useState('');
  const [scope, setScope] = useState('all'); // 'all' | 'my'
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/groups/posts/feed', {
        params: {
          q,
          faculty,
          scope,
          page,
          pageSize,
        },
      });
      setItems(data?.items || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error('Global feed error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, faculty, scope, page]);

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      particles.push(
        <div
          key={i}
          className="group-feed-particle"
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

  const stats = {
    total: total,
    myGroups: scope === 'my' ? items.length : null
  };

  const EmptyState = () => (
    <div className="group-feed-empty-state">
      <div className="text-6xl mb-4 opacity-60">
        {scope === 'my' ? '🤷‍♂️' : '📭'}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {scope === 'my' ? 'Tidak Ada Postingan di Group Anda' : 'Tidak Ada Postingan Ditemukan'}
      </h3>
      <p className="text-gray-400 mb-6">
        {scope === 'my' 
          ? 'Bergabunglah dengan lebih banyak group atau buat postingan pertama di group Anda!'
          : 'Coba ubah filter pencarian atau jelajahi group lainnya.'
        }
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/groups"
          className="group-feed-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2 justify-center"
        >
          <span>👥</span>
          <span>Jelajahi Groups</span>
        </Link>
        {scope === 'my' && (
          <button
            onClick={() => setScope('all')}
            className="group-feed-action-btn blue px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2 justify-center"
          >
            <span>🌐</span>
            <span>Lihat Semua Postingan</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="group-feed-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-yellow-500 rounded-full opacity-20 group-feed-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-blue-500 rounded-full opacity-20 group-feed-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-22 h-22 bg-blue-400 rounded-full opacity-20 group-feed-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3 group-feed-gradient-text-blue-yellow">
              📰 Forum Feed
            </h1>
            <p className="text-gray-300 text-lg">
              Jelajahi semua diskusi dan postingan dari berbagai group
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="group-feed-stats-card">
              <div className="text-3xl font-bold text-white mb-2">{stats.total}</div>
              <div className="text-gray-400 text-sm">Total Postingan</div>
            </div>
            <div className="group-feed-stats-card">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {scope === 'my' ? stats.myGroups : items.length}
              </div>
              <div className="text-gray-400 text-sm">
                {scope === 'my' ? 'Postingan Group Saya' : 'Postingan Ditampilkan'}
              </div>
            </div>
            <div className="group-feed-stats-card">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {items.filter(item => item.is_pinned).length}
              </div>
              <div className="text-gray-400 text-sm">Postingan Disematkan</div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="group-feed-section-card mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>🔍</span>
              Filter & Pencarian
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-white font-medium mb-2 text-sm">
                  Cari Postingan
                </label>
                <input
                  className="group-feed-form-input w-full px-4 py-3 rounded-xl focus:outline-none"
                  placeholder="🔍 Cari judul atau konten postingan..."
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* Faculty filter */}
              <div>
                <label className="block text-white font-medium mb-2 text-sm">
                  Filter Fakultas
                </label>
                <select
                  className="group-feed-form-select w-full px-4 py-3 rounded-xl focus:outline-none"
                  value={faculty}
                  onChange={(e) => {
                    setFaculty(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Semua Fakultas</option>
                  {FACULTIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Toggle */}
              <div>
                <label className="block text-white font-medium mb-2 text-sm">
                  Scope Postingan
                </label>
                <div className="group-feed-scope-toggle">
                  <div
                    className={`group-feed-scope-option ${scope === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setScope('all');
                      setPage(1);
                    }}
                  >
                    🌐 Semua
                  </div>
                  {isLoggedIn && (
                    <div
                      className={`group-feed-scope-option ${scope === 'my' ? 'active' : ''}`}
                      onClick={() => {
                        setScope('my');
                        setPage(1);
                      }}
                    >
                      👥 Group Saya
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scope Description */}
            <div className="text-sm text-gray-400 bg-black bg-opacity-30 rounded-xl p-3">
              <span className="font-medium">
                {scope === 'my' 
                  ? '👥 Menampilkan postingan dari group yang Anda ikuti'
                  : '🌐 Menampilkan semua postingan publik dari seluruh group'
                }
              </span>
              {faculty && (
                <span className="ml-2">
                  • Filter fakultas: <span className="text-yellow-400">{faculty}</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                to="/groups"
                className="group-feed-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <span>👥</span>
                <span>Jelajahi Groups</span>
              </Link>
              
              {isLoggedIn && (
                <Link
                  to="/groups/new"
                  className="group-feed-action-btn green px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>Buat Group</span>
                </Link>
              )}
            </div>

            <div className="text-sm text-gray-400">
              Menampilkan {items.length} dari {total} postingan
            </div>
          </div>

          {/* Feed Content */}
          <div className="group-feed-section-card">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="group-feed-loading"></div>
                <span className="ml-4 text-white text-lg">Memuat feed...</span>
              </div>
            ) : items.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {items.map((post) => (
                  <Link
                    key={post.post_id}
                    to={`/groups/${post.group_id}/posts/${post.post_id}`}
                    className={`group-feed-post-card block hover:no-underline ${post.is_pinned ? 'pinned' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {post.title}
                        </h3>
                        
                        <div className="flex items-center gap-3 text-sm text-gray-300 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-yellow-400 flex items-center justify-center text-xs font-bold">
                              {getInitials(post.author_name)}
                            </div>
                            <Link
                              to={`/profile/${post.author_id}`}
                              className="hover:text-blue-400 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {post.author_name}
                            </Link>
                          </div>
                          
                          <span>•</span>
                          
                          <span className="group-feed-badge purple flex items-center gap-1">
                            <span>🏛️</span>
                            <span>{post.group_name}</span>
                          </span>

                          {post.faculty && (
                            <>
                              <span>•</span>
                              <span className="text-gray-400">{post.faculty}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {post.is_pinned && (
                          <span className="group-feed-badge yellow flex items-center gap-1">
                            <span>📌</span>
                            <span className="hidden sm:inline">Pinned</span>
                          </span>
                        )}
                        <span className="group-feed-badge blue flex items-center gap-1">
                          <span>💬</span>
                          <span>{post.reply_count ?? 0}</span>
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-400 pt-3 border-t border-gray-600">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <span>🕒</span>
                          <span>
                            {post.last_activity_at
                              ? formatDate(post.last_activity_at)
                              : post.created_at
                              ? formatDate(post.created_at)
                              : ''}
                          </span>
                        </span>
                      </div>
                      
                      <span className="flex items-center gap-1 text-blue-400">
                        <span>📖</span>
                        <span>Baca selengkapnya →</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="group-feed-pagination">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((pp) => pp - 1)}
                  className="group-feed-pagination-btn flex items-center gap-2"
                >
                  <span>←</span>
                  <span>Sebelumnya</span>
                </button>
                
                <span className="group-feed-pagination-info">
                  Halaman {page} dari {totalPages}
                </span>
                
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((pp) => pp + 1)}
                  className="group-feed-pagination-btn flex items-center gap-2"
                >
                  <span>Berikutnya</span>
                  <span>→</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="group-feed-section-card text-center">
            <h3 className="text-xl font-semibold text-white mb-3">
              {isLoggedIn ? '🚀 Siap Berkolaborasi?' : '🤝 Bergabunglah dengan Komunitas!'}
            </h3>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              {isLoggedIn
                ? 'Jelajahi lebih banyak group, buat postingan menarik, atau mulai diskusi baru dengan sesama anggota komunitas.'
                : 'Login untuk bergabung dengan group, berpartisipasi dalam diskusi, dan terhubung dengan komunitas yang sesuai minat Anda.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/groups"
                className="group-feed-gradient-btn yellow px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 justify-center"
              >
                <span>👥</span>
                <span>Jelajahi Semua Groups</span>
              </Link>
              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="group-feed-action-btn blue px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 justify-center"
                >
                  <span>🔐</span>
                  <span>Login untuk Bergabung</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}