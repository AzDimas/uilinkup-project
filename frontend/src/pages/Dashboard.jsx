import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api, { connectionAPI, eventsAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [stats, setStats] = useState({
    totalConnections: 0,
    eventsJoined: 0,
    totalPosts: 0,
  });

  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);

  const fetchStats = async (userId) => {
    try {
      const [connectionsRes, eventsRes, postsRes] = await Promise.all([
        connectionAPI.getMyConnections().catch(() => ({ data: [] })),
        eventsAPI.myRegistered().catch(() => ({ data: [] })),
        api.get('/groups/posts/feed', {
          params: {
            scope: 'my',
            page: 1,
            pageSize: 100,
          },
        }).catch(() => ({ data: { items: [] } })),
      ]);

      const connections = connectionsRes.data?.connections || connectionsRes.data || [];
      const registeredEvents = eventsRes.data?.items || eventsRes.data?.events || [];
      const posts = postsRes.data?.items || [];
      const myPosts = posts.filter((p) => {
        const authorId = p.author_id || p.authorId;
        return authorId === userId;
      });

      setStats({
        totalConnections: Array.isArray(connections) ? connections.length : 0,
        eventsJoined: Array.isArray(registeredEvents) ? registeredEvents.length : 0,
        totalPosts: myPosts.length,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({
        totalConnections: 0,
        eventsJoined: 0,
        totalPosts: 0,
      });
    }
  };

  const fetchPreview = async () => {
    setLoadingPreview(true);
    try {
      const [jobsRes, eventsRes, feedRes] = await Promise.all([
        api.get('/jobs?page=1&limit=3').catch(() => ({ data: { items: [] } })),
        api.get('/events?page=1&limit=3').catch(() => ({ data: { items: [] } })),
        api.get('/groups/posts/feed?page=1&limit=3').catch(() => ({ data: { items: [] } }))
      ]);

      const jobsData = jobsRes.data?.items || jobsRes.data?.data || [];
      const eventsData = eventsRes.data?.items || eventsRes.data?.data || [];
      const feedsData = feedRes.data?.items || feedRes.data?.data || [];

      setJobs(jobsData.slice(0, 3));
      
      const sortedEvents = [...eventsData].sort((a, b) => 
        new Date(b.start_time || b.date) - new Date(a.start_time || a.date)
      ).slice(0, 3);
      setEvents(sortedEvents);
      
      setFeeds(feedsData.slice(0, 3));

      if (user?.id) {
        await fetchStats(user.id);
      }

    } catch (e) {
      console.error('Dashboard preview error:', e);
      setJobs([]);
      setEvents([]);
      setFeeds([]);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [user?.id]);

  const runAiSearch = async (queryText) => {
    const q = (queryText ?? aiInput).trim();
    if (!q) return;

    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.post('/ai/search', {
        message: q,
      });

      setAiAnswer(res.data);
    } catch (err) {
      console.error('AI search error:', err?.response?.data || err.message);
      setAiError(err?.response?.data?.error || 'Terjadi kesalahan pada AI.');
      setAiAnswer(null);
    } finally {
      setAiLoading(false);
    }
  };

  const joinedAtText = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Baru bergabung';

  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  const formatSourceLabel = (source) => {
    const sourceConfig = {
      alumni: { label: 'ALUMNI', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
      student: { label: 'MAHASISWA', color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
      job: { label: 'LOWONGAN', color: 'bg-green-500/20 text-green-400 border border-green-500/30' },
      event: { label: 'EVENT', color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
    };

    const config = sourceConfig[source] || { label: source?.toUpperCase() || '', color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' };
    return config;
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return 'Tanggal belum ditentukan';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Tanggal invalid';

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === now.toDateString()) {
        return `Hari ini • ${date.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      }

      if (date.toDateString() === tomorrow.toDateString()) {
        return `Besok • ${date.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      }

      return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Tanggal invalid';
    }
  };

  const isUpcomingEvent = (eventDate) => {
    if (!eventDate) return false;
    try {
      return new Date(eventDate) >= new Date();
    } catch (e) {
      return false;
    }
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  // Generate floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 12; i++) {
      particles.push(
        <div
          key={i}
          className="dashboard-particle"
          style={{
            width: `${Math.random() * 15 + 5}px`,
            height: `${Math.random() * 15 + 5}px`,
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

  return (
    <div className="dashboard-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-500 rounded-full opacity-20 dashboard-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-blue-500 rounded-full opacity-20 dashboard-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-28 h-28 bg-blue-400 rounded-full opacity-20 dashboard-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Banner */}
          <div className="dashboard-welcome-banner dark p-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-4 gradient-text-blue-yellow">
                  Selamat Datang di UILinkUp! 🎓
                </h2>
                <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
                  Platform eksklusif untuk menghubungkan mahasiswa dan alumni UI. 
                  {user?.role === 'alumni' && ' Bagikan pengalaman Anda dan bimbing generasi penerus.'}
                  {user?.role === 'student' && ' Temukan mentor, peluang karir, dan kembangkan jaringan profesional Anda.'}
                  {user?.role === 'admin' && ' Kelola dan pantau aktivitas platform untuk pengalaman terbaik.'}
                </p>
              </div>
              <div className="mt-6 md:mt-0">
                <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 border border-yellow-500/30 neon-glow-yellow">
                  <p className="text-sm font-semibold text-yellow-400 mb-2">Status Akun</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-300">Aktif & Terverifikasi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile and Stats Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 dashboard-grid-container">
            {/* Profile Card */}
            <div className="lg:col-span-3 dashboard-glass-card dark p-8 text-white">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar Section */}
                <div className="flex flex-col items-center md:items-start gap-4">
                  <div className="dashboard-logo-container">
                    <div className="dashboard-logo-glow"></div>
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white font-bold text-4xl shadow-xl relative z-10 neon-glow-yellow">
                      {initial}
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="flex items-center gap-2 text-green-400 mb-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Online</span>
                    </div>
                    <div className="text-xs text-gray-400">Status: Aktif</div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-white mb-4">{user?.name || 'User'}</h3>
                      
                      {/* Badges */}
                      <div className="flex flex-wrap gap-3 mb-6">
                        <span className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                          {user?.role || 'Member'}
                        </span>
                        {user?.fakultas && (
                          <span className="px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-sm font-semibold flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                            {user.fakultas}
                          </span>
                        )}
                        {user?.angkatan && (
                          <span className="px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-sm font-semibold flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                            Angkatan {user.angkatan}
                          </span>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-4">
                        {user?.email && (
                          <div className="flex items-center gap-4 text-gray-300">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">Email</div>
                              <div className="text-sm text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Join Date */}
                        <div className="flex items-center gap-4 text-gray-300">
                          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">Bergabung</div>
                            <div className="text-sm text-gray-400">{joinedAtText}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button dan Stats */}
                    <div className="flex flex-col gap-6 min-w-[220px]">
                      <button
                        onClick={() => navigate('/profile')}
                        className="dashboard-gradient-btn yellow px-8 py-4 text-black rounded-2xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Kelola Profil
                      </button>
                      
                      {/* Quick Stats */}
                      <div className="dashboard-stats-card dark">
                        <div className="text-sm font-semibold text-white mb-4 text-center">Statistik</div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Koneksi</span>
                            <span className="text-lg font-bold text-blue-400">{stats.totalConnections}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Event Diikuti</span>
                            <span className="text-lg font-bold text-green-400">{stats.eventsJoined}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Postingan</span>
                            <span className="text-lg font-bold text-purple-400">{stats.totalPosts}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-glass-card dark p-6">
              <h3 className="text-xl font-bold text-white mb-6">Akses Cepat</h3>
              <div className="space-y-4">
                <Link
                  to="/jobs"
                  className="dashboard-quick-action dark flex items-center gap-4 p-4 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 text-lg group-hover:scale-110 transition-transform border border-blue-500/30">
                    🔍
                  </div>
                  <div>
                    <p className="font-semibold text-white">Cari Lowongan</p>
                    <p className="text-sm text-gray-400">Kerja & Magang</p>
                  </div>
                </Link>
                <Link
                  to="/events"
                  className="dashboard-quick-action dark flex items-center gap-4 p-4 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-lg group-hover:scale-110 transition-transform border border-yellow-500/30">
                    📅
                  </div>
                  <div>
                    <p className="font-semibold text-white">Event & Webinar</p>
                    <p className="text-sm text-gray-400">Acara Terkini</p>
                  </div>
                </Link>
                <Link
                  to="/groups/feed"
                  className="dashboard-quick-action dark flex items-center gap-4 p-4 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 text-lg group-hover:scale-110 transition-transform border border-green-500/30">
                    💬
                  </div>
                  <div>
                    <p className="font-semibold text-white">Forum Diskusi</p>
                    <p className="text-sm text-gray-400">Komunitas UI</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Preview Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 dashboard-preview-grid">
            {/* Jobs Preview */}
            <div className="dashboard-glass-card dark p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Lowongan Terbaru</h3>
                <Link
                  to="/jobs"
                  className="text-blue-400 hover:text-blue-300 font-semibold text-sm flex items-center gap-2 transition-all duration-200"
                >
                  Lihat Semua
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
              {loadingPreview ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="dashboard-loading-pulse">
                      <div className="h-4 bg-gray-600 rounded mb-2"></div>
                      <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-4xl mb-3">💼</div>
                  <p className="text-gray-500 text-sm">Belum ada lowongan terbaru</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.slice(0, 3).map((job) => (
                    <div
                      key={job.job_id || job.id}
                      className="dashboard-preview-item dark p-4 transition-all duration-200 group cursor-pointer"
                      onClick={() => navigate(`/jobs/${job.job_id || job.id}`)}
                    >
                      <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                        {job.title}
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">{job.company}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">{job.location}</span>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full border border-blue-500/30">
                          Baru
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Events Preview */}
            <div className="dashboard-glass-card dark p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Event Mendatang</h3>
                <Link
                  to="/events"
                  className="text-blue-400 hover:text-blue-300 font-semibold text-sm flex items-center gap-2 transition-all duration-200"
                >
                  Lihat Semua
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
              {loadingPreview ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="dashboard-loading-pulse">
                      <div className="h-4 bg-gray-600 rounded mb-2"></div>
                      <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-4xl mb-3">📅</div>
                  <p className="text-gray-500 text-sm">Belum ada event terjadwal</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.slice(0, 3).map((event) => {
                    const isUpcoming = isUpcomingEvent(event.start_time);
                    const isToday = new Date(event.start_time).toDateString() === new Date().toDateString();
                    const eventId = event.event_id || event.id;
                    
                    return (
                      <div
                        key={eventId}
                        className={`dashboard-preview-item dark p-4 transition-all duration-200 group cursor-pointer ${
                          isToday 
                            ? 'border-yellow-500/50 bg-yellow-500/10' 
                            : isUpcoming
                            ? 'border-green-500/50 bg-green-500/10'
                            : 'border-gray-500/30'
                        }`}
                        onClick={() => handleEventClick(eventId)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-white line-clamp-2 flex-1 group-hover:text-blue-400 transition-colors">
                            {event.title}
                          </h4>
                          {isToday && (
                            <span className="ml-2 px-2 py-1 bg-yellow-500 text-black text-xs rounded-full whitespace-nowrap font-semibold">
                              Hari Ini
                            </span>
                          )}
                          {isUpcoming && !isToday && (
                            <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full whitespace-nowrap font-semibold">
                              Mendatang
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                          <span>📅</span>
                          <span className="text-xs font-medium">
                            {formatEventDate(event.start_time)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                          <span>📍</span>
                          <span className="text-xs">{event.location}</span>
                        </div>

                        {event.event_type && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                              {event.event_type.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Forum Feed Preview */}
            <div className="dashboard-glass-card dark p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Diskusi Terbaru</h3>
                <Link
                  to="/groups/feed"
                  className="text-blue-400 hover:text-blue-300 font-semibold text-sm flex items-center gap-2 transition-all duration-200"
                >
                  Lihat Semua
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
              {loadingPreview ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="dashboard-loading-pulse">
                      <div className="h-4 bg-gray-600 rounded mb-2"></div>
                      <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : feeds.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-4xl mb-3">💬</div>
                  <p className="text-gray-500 text-sm">Belum ada diskusi terbaru</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feeds.slice(0, 3).map((post) => (
                    <div
                      key={post.post_id}
                      className="dashboard-preview-item dark p-4 transition-all duration-200 group cursor-pointer"
                      onClick={() => navigate(`/groups/${post.group_id}/posts/${post.post_id}`)}
                    >
                      <h4 className="font-semibold text-white group-hover:text-green-400 transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span className="bg-gray-500/20 px-2 py-1 rounded-full border border-gray-500/30">
                          {post.group_name}
                        </span>
                        <span className="text-gray-400">Oleh: {post.author_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Career Assistant */}
          <div className="dashboard-ai-section p-8 text-white">
            <div className="flex items-start justify-between mb-8 relative z-10">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="text-3xl font-bold gradient-text-blue-yellow">AI Career Assistant</h3>
                  <span className="px-4 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold border border-yellow-500/30">
                    BETA
                  </span>
                </div>
                <p className="text-blue-200 text-lg">
                  Temukan alumni, mentor, dan peluang karir dengan bantuan AI
                </p>
              </div>
              <div className="text-4xl">🤖</div>
            </div>

            {/* Quick Questions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
              <button
                onClick={() => {
                  const text = 'Alumni yang bekerja sebagai backend engineer di Jakarta';
                  setAiInput(text);
                  runAiSearch(text);
                }}
                className="p-5 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200 text-left group backdrop-blur-sm border border-white/10 hover:border-yellow-500/30"
              >
                <div className="text-base font-semibold mb-2 text-yellow-400">🔍 Cari Alumni</div>
                <p className="text-sm text-blue-200 opacity-90 group-hover:opacity-100">
                  "Alumni backend engineer di Jakarta"
                </p>
              </button>
              <button
                onClick={() => {
                  const text = 'Rekomendasi mentor untuk data science';
                  setAiInput(text);
                  runAiSearch(text);
                }}
                className="p-5 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200 text-left group backdrop-blur-sm border border-white/10 hover:border-blue-500/30"
              >
                <div className="text-base font-semibold mb-2 text-blue-400">👥 Temukan Mentor</div>
                <p className="text-sm text-blue-200 opacity-90 group-hover:opacity-100">
                  "Rekomendasi mentor data science"
                </p>
              </button>
              <button
                onClick={() => {
                  const text = 'Event tech bulan ini';
                  setAiInput(text);
                  runAiSearch(text);
                }}
                className="p-5 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200 text-left group backdrop-blur-sm border border-white/10 hover:border-green-500/30"
              >
                <div className="text-base font-semibold mb-2 text-green-400">📅 Event Terkini</div>
                <p className="text-sm text-blue-200 opacity-90 group-hover:opacity-100">
                  "Event tech bulan ini"
                </p>
              </button>
            </div>

            {/* Search Input */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 relative z-10 border border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runAiSearch();
                }}
                className="flex items-center gap-3"
              >
                <input
                  className="flex-1 px-5 py-4 text-white outline-none border-none bg-transparent text-base placeholder-blue-200"
                  placeholder="Tanyakan apapun tentang karir, alumni, atau event..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="dashboard-gradient-btn yellow px-8 py-4 text-black rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-3"
                >
                  {aiLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Cari</span>
                      <span>🔍</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Error Message */}
            {aiError && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-400 rounded-xl backdrop-blur-sm relative z-10">
                <div className="flex items-center gap-3 text-red-200">
                  <span>⚠️</span>
                  <span className="text-sm">{aiError}</span>
                </div>
              </div>
            )}

            {/* AI Results */}
            {aiAnswer && (
              <div className="mt-8 bg-white/10 rounded-2xl p-6 backdrop-blur-sm relative z-10 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-lg text-yellow-400">Hasil Pencarian AI</span>
                </div>
                
                <div className="bg-white/5 rounded-xl p-5 mb-6 border border-white/10">
                  <p className="text-base text-white">{aiAnswer.message}</p>
                </div>

                {aiAnswer.results?.length > 0 && (
                  <div className="space-y-4">
                    {aiAnswer.results.map((result, idx) => {
                      const sourceConfig = formatSourceLabel(result.source);
                      return (
                        <div
                          key={idx}
                          className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-yellow-500/30 transition-all duration-200 backdrop-blur-sm"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${sourceConfig.color}`}>
                                {sourceConfig.label}
                              </span>
                              {typeof result.score === 'number' && (
                                <span className="text-sm text-yellow-400">
                                  {Math.round(result.score * 100)}% match
                                </span>
                              )}
                            </div>
                          </div>

                          <h4 className="font-semibold text-white text-base mb-3">
                            {result.name || result.title || 'Tidak ada nama'}
                          </h4>

                          {(result.title || result.context) && (
                            <p className="text-sm text-blue-200 mb-3">
                              {result.title && <span>{result.title}</span>}
                              {result.title && result.context && <span> • </span>}
                              {result.context && <span>{result.context}</span>}
                            </p>
                          )}

                          {(result.fakultas || result.angkatan) && (
                            <div className="text-sm text-blue-200 mb-2">
                              {result.fakultas && <span>Fakultas {result.fakultas}</span>}
                              {result.fakultas && result.angkatan && <span> • </span>}
                              {result.angkatan && <span>Angkatan {result.angkatan}</span>}
                            </div>
                          )}

                          {(result.ipk || result.semester) && (
                            <div className="text-sm text-blue-200 mb-2">
                              {result.ipk && <span>IPK: {result.ipk}</span>}
                              {result.ipk && result.semester && <span> • </span>}
                              {result.semester && <span>Semester {result.semester}</span>}
                            </div>
                          )}

                          {result.interest && result.interest.length > 0 && (
                            <div className="text-sm text-blue-200 mb-3">
                              Minat: {result.interest.join(', ')}
                            </div>
                          )}

                          {result.bio && (
                            <p className="text-sm text-blue-200 line-clamp-2">
                              {result.bio}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;