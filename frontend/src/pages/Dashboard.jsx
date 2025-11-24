// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api, { connectionAPI, eventsAPI } from '../services/api';

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

      // Koneksi
      const connections = connectionsRes.data?.connections || connectionsRes.data || [];

      // Event diikuti
      const registeredEvents = eventsRes.data?.items || eventsRes.data?.events || [];

      // Postingan: filter hanya yang author_id = userId
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
      // Coba dengan endpoint yang lebih sederhana dulu
      const [jobsRes, eventsRes, feedRes] = await Promise.all([
        api.get('/jobs?page=1&limit=3').catch(() => ({ data: { items: [] } })),
        api.get('/events?page=1&limit=3').catch(() => ({ data: { items: [] } })),
        api.get('/groups/posts/feed?page=1&limit=3').catch(() => ({ data: { items: [] } }))
      ]);

      console.log('Jobs Response:', jobsRes.data);
      console.log('Events Response:', eventsRes.data);
      console.log('Feed Response:', feedRes.data);

      // Handle berbagai struktur response
      const jobsData = jobsRes.data?.items || jobsRes.data?.data || [];
      const eventsData = eventsRes.data?.items || eventsRes.data?.data || [];
      const feedsData = feedRes.data?.items || feedRes.data?.data || [];

      // Batasi hanya 3 item pertama
      setJobs(jobsData.slice(0, 3));
      
      // Urutkan events dari yang terbaru (start_time terbesar) ke terlama dan batasi 3
      const sortedEvents = [...eventsData].sort((a, b) => 
        new Date(b.start_time || b.date) - new Date(a.start_time || a.date)
      ).slice(0, 3);
      setEvents(sortedEvents);
      
      // Batasi feeds hanya 3 item pertama
      setFeeds(feedsData.slice(0, 3));

      // Fetch stats setelah data utama selesai
      if (user?.id) {
        await fetchStats(user.id);
      }

    } catch (e) {
      console.error('Dashboard preview error:', e);
      // Set empty arrays
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
      alumni: { label: 'ALUMNI', color: 'bg-blue-100 text-blue-800' },
      student: { label: 'MAHASISWA', color: 'bg-yellow-100 text-yellow-800' },
      job: { label: 'LOWONGAN', color: 'bg-green-100 text-green-800' },
      event: { label: 'EVENT', color: 'bg-purple-100 text-purple-800' },
    };

    const config = sourceConfig[source] || { label: source?.toUpperCase() || '', color: 'bg-gray-100 text-gray-800' };
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

      // Cek jika event hari ini
      if (date.toDateString() === now.toDateString()) {
        return `Hari ini • ${date.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      }

      // Cek jika event besok
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

  // Fallback data untuk testing - sudah dibatasi 3 item
  const fallbackJobs = [
    { id: 1, job_id: 1, title: 'Software Engineer Frontend', company: 'Tech Company Indonesia', location: 'Jakarta Selatan' },
    { id: 2, job_id: 2, title: 'Data Scientist', company: 'Data Analytics Corp', location: 'Bandung' },
    { id: 3, job_id: 3, title: 'Product Manager', company: 'Startup Digital', location: 'Remote' }
  ].slice(0, 3);

  const fallbackEvents = [
    { 
      id: 1, 
      event_id: 1, 
      title: 'Tech Conference & Career Fair 2024', 
      start_time: new Date(Date.now() + 2 * 86400000).toISOString(), 
      location: 'Jakarta Convention Center', 
      event_type: 'seminar',
      description: 'Konferensi teknologi terbesar tahun ini'
    },
    { 
      id: 2, 
      event_id: 2, 
      title: 'UI Alumni Networking Night', 
      start_time: new Date(Date.now() + 5 * 86400000).toISOString(), 
      location: 'Hotel Indonesia Kempinski', 
      event_type: 'networking',
      description: 'Networking dengan alumni UI sukses'
    },
    { 
      id: 3, 
      event_id: 3, 
      title: 'Workshop Data Science for Beginners', 
      start_time: new Date(Date.now() + 7 * 86400000).toISOString(), 
      location: 'Gedung Fasilkom UI', 
      event_type: 'workshop',
      description: 'Belajar data science dari dasar'
    }
  ].slice(0, 3);

  const fallbackFeeds = [
    { 
      post_id: 1, 
      title: 'Tips Membangun Karir di Tech Industry sebagai Fresh Graduate', 
      group_name: 'Tech Community', 
      author_name: 'Budi Santoso',
      group_id: 1
    },
    { 
      post_id: 2, 
      title: 'Pengalaman Magang di Perusahaan Multinasional - Sharing Session', 
      group_name: 'Career Development', 
      author_name: 'Sari Wijaya',
      group_id: 2
    },
    { 
      post_id: 3, 
      title: 'Diskusi Tren Artificial Intelligence dan Machine Learning 2024', 
      group_name: 'AI Enthusiasts', 
      author_name: 'Ahmad Fauzi',
      group_id: 3
    }
  ].slice(0, 3);

  // Gunakan data fallback jika data utama kosong dan tidak loading
  const displayJobs = !loadingPreview && jobs.length === 0 ? fallbackJobs : jobs.slice(0, 3);
  const displayEvents = !loadingPreview && events.length === 0 ? fallbackEvents : events.slice(0, 3);
  const displayFeeds = !loadingPreview && feeds.length === 0 ? fallbackFeeds : feeds.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-3">
                  Selamat Datang di UILinkUp! 🎓
                </h2>
                <p className="text-blue-100 text-lg max-w-2xl">
                  Platform eksklusif untuk menghubungkan mahasiswa dan alumni UI. 
                  {user?.role === 'alumni' && ' Bagikan pengalaman Anda dan bimbing generasi penerus.'}
                  {user?.role === 'student' && ' Temukan mentor, peluang karir, dan kembangkan jaringan profesional Anda.'}
                  {user?.role === 'admin' && ' Kelola dan pantau aktivitas platform untuk pengalaman terbaik.'}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-sm font-semibold">Status Akun</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm">Aktif & Terverifikasi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Profile Card - Diperbaiki dengan layout yang lebih simetris */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar Section */}
                <div className="flex flex-col items-center md:items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                    {initial}
                  </div>
                  <div className="text-center md:text-left">
                    <div className="flex items-center gap-1 text-green-600 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-medium">Online</span>
                    </div>
                    <div className="text-xs text-gray-500">Status: Aktif</div>
                  </div>
                </div>

                {/* Profile Info Section */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{user?.name || 'User'}</h3>
                      
                      {/* Badges Row */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          {user?.role || 'Member'}
                        </span>
                        {user?.fakultas && (
                          <span className="px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                            {user.fakultas}
                          </span>
                        )}
                        {user?.angkatan && (
                          <span className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                            Angkatan {user.angkatan}
                          </span>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-3">
                        {user?.email && (
                          <div className="flex items-center gap-3 text-gray-700">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium">Email</div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Join Date */}
                        <div className="flex items-center gap-3 text-gray-700">
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Bergabung</div>
                            <div className="text-sm text-gray-600">{joinedAtText}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button dan Stats */}
                    <div className="flex flex-col gap-4 min-w-[200px]">
                      <button
                        onClick={() => navigate('/profile')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Kelola Profil
                      </button>
                      
                      {/* Quick Stats - Diperbaiki */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                        <div className="text-sm font-semibold text-gray-900 mb-3 text-center">Statistik</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Koneksi</span>
                            <span className="text-sm font-bold text-blue-600">{stats.totalConnections}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Event Diikuti</span>
                            <span className="text-sm font-bold text-green-600">{stats.eventsJoined}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Postingan</span>
                            <span className="text-sm font-bold text-purple-600">{stats.totalPosts}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Akses Cepat</h3>
              <div className="space-y-3">
                <Link
                  to="/jobs"
                  className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
                    🔍
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Cari Lowongan</p>
                    <p className="text-xs text-gray-600">Kerja & Magang</p>
                  </div>
                </Link>
                <Link
                  to="/events"
                  className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600 group-hover:bg-yellow-200 transition-colors">
                    📅
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Event & Webinar</p>
                    <p className="text-xs text-gray-600">Acara Terkini</p>
                  </div>
                </Link>
                <Link
                  to="/groups/feed"
                  className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-200 transition-colors">
                    💬
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Forum Diskusi</p>
                    <p className="text-xs text-gray-600">Komunitas UI</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Preview Sections - MAKSIMAL 3 ITEM */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Jobs Preview - Maksimal 3 */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Lowongan Terbaru</h3>
                <Link
                  to="/jobs"
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                >
                  Lihat Semua
                  <span>→</span>
                </Link>
              </div>
              {loadingPreview ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : displayJobs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">💼</div>
                  <p className="text-gray-500 text-sm">Belum ada lowongan terbaru</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayJobs.map((job) => (
                    <div
                      key={job.job_id || job.id}
                      className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 group cursor-pointer"
                      onClick={() => navigate(`/jobs/${job.job_id || job.id}`)}
                    >
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {job.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{job.company}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">{job.location}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          Baru
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Events Preview - Maksimal 3 */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Event Mendatang</h3>
                <Link
                  to="/events"
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                >
                  Lihat Semua
                  <span>→</span>
                </Link>
              </div>
              {loadingPreview ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : displayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📅</div>
                  <p className="text-gray-500 text-sm">Belum ada event terjadwal</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayEvents.map((event) => {
                    const isUpcoming = isUpcomingEvent(event.start_time);
                    const isToday = new Date(event.start_time).toDateString() === new Date().toDateString();
                    const eventId = event.event_id || event.id;
                    
                    return (
                      <div
                        key={eventId}
                        className={`p-4 rounded-xl border transition-all duration-200 group cursor-pointer ${
                          isToday 
                            ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100' 
                            : isUpcoming
                            ? 'border-green-200 bg-green-50 hover:bg-green-100'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleEventClick(eventId)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 line-clamp-2 flex-1 group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </h4>
                          {isToday && (
                            <span className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full whitespace-nowrap">
                              Hari Ini
                            </span>
                          )}
                          {isUpcoming && !isToday && (
                            <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full whitespace-nowrap">
                              Mendatang
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <span>📅</span>
                          <span className="text-xs font-medium">
                            {formatEventDate(event.start_time)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <span>📍</span>
                          <span className="text-xs">{event.location}</span>
                        </div>

                        {event.event_type && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
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

            {/* Forum Feed Preview - Maksimal 3 */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Diskusi Terbaru</h3>
                <Link
                  to="/groups/feed"
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                >
                  Lihat Semua
                  <span>→</span>
                </Link>
              </div>
              {loadingPreview ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : displayFeeds.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">💬</div>
                  <p className="text-gray-500 text-sm">Belum ada diskusi terbaru</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayFeeds.map((post) => (
                    <div
                      key={post.post_id}
                      className="p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all duration-200 group cursor-pointer"
                      onClick={() => navigate(`/groups/${post.group_id}/posts/${post.post_id}`)}
                    >
                      <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded-full">
                          {post.group_name}
                        </span>
                        <span>Oleh: {post.author_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Career Assistant */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold">AI Career Assistant</h3>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                    BETA
                  </span>
                </div>
                <p className="text-blue-100 text-lg">
                  Temukan alumni, mentor, dan peluang karir dengan bantuan AI
                </p>
              </div>
              <div className="text-3xl">🤖</div>
            </div>

            {/* Quick Questions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => {
                  const text = 'Alumni yang bekerja sebagai backend engineer di Jakarta';
                  setAiInput(text);
                  runAiSearch(text);
                }}
                className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200 text-left group"
              >
                <div className="text-sm font-semibold mb-1">🔍 Cari Alumni</div>
                <p className="text-xs text-blue-200 opacity-90 group-hover:opacity-100">
                  "Alumni backend engineer di Jakarta"
                </p>
              </button>
              <button
                onClick={() => {
                  const text = 'Rekomendasi mentor untuk data science';
                  setAiInput(text);
                  runAiSearch(text);
                }}
                className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200 text-left group"
              >
                <div className="text-sm font-semibold mb-1">👥 Temukan Mentor</div>
                <p className="text-xs text-blue-200 opacity-90 group-hover:opacity-100">
                  "Rekomendasi mentor data science"
                </p>
              </button>
              <button
                onClick={() => {
                  const text = 'Event tech bulan ini';
                  setAiInput(text);
                  runAiSearch(text);
                }}
                className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200 text-left group"
              >
                <div className="text-sm font-semibold mb-1">📅 Event Terkini</div>
                <p className="text-xs text-blue-200 opacity-90 group-hover:opacity-100">
                  "Event tech bulan ini"
                </p>
              </button>
            </div>

            {/* Search Input */}
            <div className="bg-white rounded-2xl p-2 shadow-lg">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runAiSearch();
                }}
                className="flex items-center gap-2"
              >
                <input
                  className="flex-1 px-4 py-3 text-gray-800 outline-none border-none bg-transparent text-sm"
                  placeholder="Tanyakan apapun tentang karir, alumni, atau event..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-xl font-semibold hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
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
              <div className="mt-4 p-4 bg-red-500/20 border border-red-400 rounded-xl">
                <div className="flex items-center gap-2 text-red-200">
                  <span>⚠️</span>
                  <span className="text-sm">{aiError}</span>
                </div>
              </div>
            )}

            {/* AI Results */}
            {aiAnswer && (
              <div className="mt-6 bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="font-semibold">Hasil Pencarian AI</span>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <p className="text-sm">{aiAnswer.message}</p>
                </div>

                {aiAnswer.results?.length > 0 && (
                  <div className="space-y-3">
                    {aiAnswer.results.map((result, idx) => {
                      const sourceConfig = formatSourceLabel(result.source);
                      return (
                        <div
                          key={idx}
                          className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sourceConfig.color}`}>
                                {sourceConfig.label}
                              </span>
                              {typeof result.score === 'number' && (
                                <span className="text-xs text-blue-200">
                                  {Math.round(result.score * 100)}% match
                                </span>
                              )}
                            </div>
                          </div>

                          <h4 className="font-semibold text-white text-sm mb-2">
                            {result.name || result.title || 'Tidak ada nama'}
                          </h4>

                          {(result.title || result.context) && (
                            <p className="text-xs text-blue-200 mb-2">
                              {result.title && <span>{result.title}</span>}
                              {result.title && result.context && <span> • </span>}
                              {result.context && <span>{result.context}</span>}
                            </p>
                          )}

                          {(result.fakultas || result.angkatan) && (
                            <div className="text-xs text-blue-200 mb-1">
                              {result.fakultas && <span>Fakultas {result.fakultas}</span>}
                              {result.fakultas && result.angkatan && <span> • </span>}
                              {result.angkatan && <span>Angkatan {result.angkatan}</span>}
                            </div>
                          )}

                          {(result.ipk || result.semester) && (
                            <div className="text-xs text-blue-200 mb-1">
                              {result.ipk && <span>IPK: {result.ipk}</span>}
                              {result.ipk && result.semester && <span> • </span>}
                              {result.semester && <span>Semester {result.semester}</span>}
                            </div>
                          )}

                          {result.interest && result.interest.length > 0 && (
                            <div className="text-xs text-blue-200 mb-2">
                              Minat: {result.interest.join(', ')}
                            </div>
                          )}

                          {result.bio && (
                            <p className="text-xs text-blue-200 line-clamp-2">
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
      </main>
    </div>
  );
};

export default Dashboard;