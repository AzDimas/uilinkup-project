// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(true);

  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);

  const fetchPreview = async () => {
    setLoadingPreview(true);
    try {
      const [jobsRes, eventsRes, feedRes] = await Promise.all([
        api
          .get('/jobs', { params: { page: 1, pageSize: 3 } })
          .catch(() => ({ data: { items: [] } })),
        api
          .get('/events', { params: { page: 1, pageSize: 3 } })
          .catch(() => ({ data: { items: [] } })),
        api
          .get('/groups/posts/feed', { params: { page: 1, pageSize: 3 } })
          .catch(() => ({ data: { items: [] } })),
      ]);

      setJobs(jobsRes.data?.items || []);
      setEvents(eventsRes.data?.items || []);
      setFeeds(feedRes.data?.items || []);
    } catch (e) {
      console.error('Dashboard preview error:', e?.response?.data || e.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, []);

  const runAiSearch = async (queryText) => {
    const q = (queryText ?? aiInput).trim();
    if (!q) return;

    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.post('/ai/search', {
        message: q,
        // bisa tambah keyword/location/skill kalau mau
        // keyword: q,
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
    switch (source) {
      case 'alumni':
        return 'ALUMNI';
      case 'student':
        return 'STUDENT';
      case 'job':
        return 'JOB';
      case 'event':
        return 'EVENT';
      default:
        return (source || '').toUpperCase();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Dashboard
          </h2>

          {/* Top section: Profile & Getting Started */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Profil & Status Akun */}
            <div className="lg:col-span-2 bg-white border rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {initial}
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-900">
                    {user?.name || 'User'}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {user?.role || 'Member'}
                    </span>
                    {user?.fakultas && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {user.fakultas}
                      </span>
                    )}
                    {user?.angkatan && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        Angkatan {user.angkatan}
                      </span>
                    )}
                  </div>
                  {user?.email && (
                    <div className="mt-1 text-xs text-gray-500">
                      📧 {user.email}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-3 md:text-right w-full md:w-auto">
                <div>
                  <div className="font-medium text-gray-800 mb-2">
                    Status Akun
                  </div>
                  <div className="flex flex-col gap-1 md:items-end">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                      <span className="text-[8px]">●</span> Email terverifikasi
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                      <span className="text-[8px]">●</span> Akun aktif
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-gray-500">
                    Bergabung sejak {joinedAtText}
                  </div>
                  <button
                    onClick={() => navigate('/profile')}
                    className="inline-flex justify-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    Kelola Profil
                  </button>
                </div>
              </div>
            </div>

            {/* Getting Started / Shortcuts */}
            <div className="bg-white border rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Mulai dari sini
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Beberapa hal yang bisa kamu jelajahi di UILinkUp:
              </p>
              <div className="space-y-2">
                <Link
                  to="/jobs"
                  className="block w-full text-left text-xs px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
                >
                  🔍 Cari peluang kerja & magang
                </Link>
                <Link
                  to="/events"
                  className="block w-full text-left text-xs px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
                >
                  📅 Lihat event & webinar
                </Link>
                <Link
                  to="/groups/feed"
                  className="block w-full text-left text-xs px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
                >
                  💬 Ikuti diskusi di Forum Feed
                </Link>
              </div>
            </div>
          </div>

          {/* Preview rows: Jobs / Events / Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Jobs */}
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Latest Jobs
                </h3>
                <Link
                  to="/jobs"
                  className="text-xs text-blue-600 hover:underline"
                >
                  See more →
                </Link>
              </div>
              {loadingPreview ? (
                <div className="text-xs text-gray-500">Loading...</div>
              ) : jobs.length === 0 ? (
                <div className="text-xs text-gray-500">
                  Belum ada job terbaru.
                </div>
              ) : (
                <ul className="space-y-2 text-xs">
                  {jobs.map((j) => (
                    <li
                      key={j.job_id || j.id}
                      className="p-2 rounded hover:bg-white hover:shadow-sm transition"
                    >
                      <Link
                        to={`/jobs/${j.job_id || j.id}`}
                        className="font-semibold text-gray-900 hover:underline"
                      >
                        {j.title}
                      </Link>
                      <div className="text-gray-600">
                        {j.company} • {j.location}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Events */}
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Upcoming Events
                </h3>
                <Link
                  to="/events"
                  className="text-xs text-blue-600 hover:underline"
                >
                  See more →
                </Link>
              </div>
              {loadingPreview ? (
                <div className="text-xs text-gray-500">Loading...</div>
              ) : events.length === 0 ? (
                <div className="text-xs text-gray-500">
                  Belum ada event terjadwal.
                </div>
              ) : (
                <ul className="space-y-2 text-xs">
                  {events.map((ev) => (
                    <li
                      key={ev.event_id || ev.id}
                      className="p-2 rounded hover:bg-white hover:shadow-sm transition"
                    >
                      <div className="font-semibold text-gray-900">
                        {ev.title}
                      </div>
                      <div className="text-gray-600">
                        {ev.date
                          ? new Date(ev.date).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Tanggal belum ditentukan'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Forum Feed */}
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Forum Feed
                </h3>
                <Link
                  to="/groups/feed"
                  className="text-xs text-blue-600 hover:underline"
                >
                  See more →
                </Link>
              </div>
              {loadingPreview ? (
                <div className="text-xs text-gray-500">Loading...</div>
              ) : feeds.length === 0 ? (
                <div className="text-xs text-gray-500">
                  Belum ada diskusi terbaru.
                </div>
              ) : (
                <ul className="space-y-2 text-xs">
                  {feeds.map((p) => (
                    <li
                      key={p.post_id}
                      className="p-2 rounded hover:bg-white hover:shadow-sm transition"
                    >
                      <Link
                        to={`/groups/${p.group_id}/posts/${p.post_id}`}
                        className="font-semibold text-gray-900 hover:underline line-clamp-1"
                      >
                        {p.title}
                      </Link>
                      <div className="text-gray-600 line-clamp-1">
                        {p.group_name} • By {p.author_name}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
            <h3 className="text-xl font-bold mb-2">
              Selamat datang di UILinkUp! 🎉
            </h3>
            <p className="opacity-90 text-sm">
              Platform untuk menghubungkan mahasiswa dan alumni Universitas
              Indonesia.
              {user?.role === 'alumni' &&
                ' Anda dapat berbagi pengalaman dan menjadi mentor bagi mahasiswa.'}
              {user?.role === 'student' &&
                ' Temukan mentor dan peluang karir dari alumni UI.'}
              {user?.role === 'admin' &&
                ' Kelola platform dan pantau aktivitas users.'}
            </p>
          </div>

          {/* AI Career Assistant */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-5 text-white shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">AI Career Assistant</h3>
                <p className="text-xs opacity-80">
                  Cari alumni, mentor, atau peluang karir pakai AI.
                </p>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                Beta
              </span>
            </div>

            <div className="bg-white/10 rounded-lg p-4 text-sm mb-3">
              Hai {user?.name || 'kamu'}! Ada yang bisa saya bantu? Coba tanya:
              <br />
              <span className="italic text-xs">
                "Alumni yang bekerja di bidang AI di Jakarta" atau
                "Rekomendasi mentor untuk karir data science"
              </span>
            </div>

            {/* Suggestion buttons */}
            <div className="space-y-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  const text =
                    'Alumni yang bekerja sebagai backend engineer di Jakarta';
                  setAiInput(text);
                  runAiSearch(text);
                }}
                className="w-full text-left text-xs bg-white/10 hover:bg-white/20 rounded-full px-4 py-2"
              >
                "Alumni yang bekerja sebagai backend engineer di Jakarta"
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = 'Rekomendasi mentor untuk data science';
                  setAiInput(text);
                  runAiSearch(text);
                }}
                className="w-full text-left text-xs bg-white/10 hover:bg-white/20 rounded-full px-4 py-2"
              >
                "Rekomendasi mentor untuk data science"
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = 'Event tech bulan ini';
                  setAiInput(text);
                  runAiSearch(text);
                }}
                className="w-full text-left text-xs bg-white/10 hover:bg-white/20 rounded-full px-4 py-2"
              >
                "Event tech bulan ini"
              </button>
            </div>

            {/* Input */}
            <form
              className="flex items-center gap-2 bg-white rounded-full px-3 py-1"
              onSubmit={(e) => {
                e.preventDefault();
                runAiSearch();
              }}
            >
              <input
                className="flex-1 text-xs text-gray-800 outline-none border-none bg-transparent"
                placeholder="Tanya AI Assistant..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-lg leading-none hover:bg-green-600 disabled:opacity-60"
              >
                {aiLoading ? '…' : '➤'}
              </button>
            </form>

            {/* Error / hasil dari backend AI */}
            {aiError && (
              <div className="mt-3 text-xs text-red-200">
                {aiError}
              </div>
            )}

            {aiAnswer && (
              <div className="mt-3 bg-white/20 rounded-lg p-4 text-sm">
                <div className="italic mb-2 text-xs">Jawaban AI:</div>
                <p className="mb-2">{aiAnswer.message}</p>

                {aiAnswer.results?.length > 0 && (
                  <ul className="space-y-2">
                    {aiAnswer.results.map((r, idx) => (
                      <li
                        key={idx}
                        className="border border-white/15 rounded-md p-2 bg-black/5"
                      >
                        {/* SOURCE LABEL */}
                        <div className="text-[10px] uppercase tracking-wide mb-1 opacity-70">
                          {formatSourceLabel(r.source)}
                        </div>

                        {/* NAMA (UTAMA) */}
                        <div className="font-semibold text-sm">
                          {r.name
                            ? r.name
                            : r.title
                            ? r.title
                            : r.source === 'student'
                            ? 'Mahasiswa'
                            : r.source === 'alumni'
                            ? 'Alumni'
                            : 'Result'}
                        </div>

                        {/* TITLE + CONTEXT (job/fakultas/perusahaan) */}
                        {(r.title || r.context) && (
                          <div className="text-[11px] opacity-90">
                            {r.title && <span>{r.title}</span>}
                            {r.title && r.context && <span> • </span>}
                            {r.context && <span>{r.context}</span>}
                          </div>
                        )}

                        {/* FAKULTAS & ANGKATAN */}
                        {(r.fakultas || r.angkatan) && (
                          <div className="text-[11px] opacity-80">
                            {r.fakultas && <span>Fakultas: {r.fakultas}</span>}
                            {r.fakultas && r.angkatan && <span> • </span>}
                            {r.angkatan && (
                              <span>Angkatan: {r.angkatan}</span>
                            )}
                          </div>
                        )}

                        {/* IPK & SEMESTER */}
                        {(r.ipk || r.semester) && (
                          <div className="text-[11px] opacity-80">
                            {r.ipk && <span>IPK: {r.ipk}</span>}
                            {r.ipk && r.semester && <span> • </span>}
                            {r.semester && (
                              <span>Semester: {r.semester}</span>
                            )}
                          </div>
                        )}

                        {/* INTEREST FIELD */}
                        {r.interest && r.interest.length > 0 && (
                          <div className="text-[11px] opacity-80">
                            Minat: {r.interest.join(', ')}
                          </div>
                        )}

                        {/* BIO */}
                        {r.bio && (
                          <div className="text-[11px] opacity-90 mt-1 line-clamp-2">
                            {r.bio}
                          </div>
                        )}

                        {/* SCORE */}
                        {typeof r.score === 'number' && (
                          <div className="text-[10px] opacity-60 mt-1">
                            score: {r.score.toFixed(3)}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
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
