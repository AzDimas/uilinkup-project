// src/pages/JobsList.jsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './JobsList.css';

const pageSize = 12;

const jobTypeLabel = (t) => {
  const map = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    internship: 'Internship',
    contract: 'Contract',
    freelance: 'Freelance',
    temporary: 'Temporary',
  };
  return map[t] || (t ? t.replace(/_/g, ' ') : t);
};

const toSnakeJobType = (s) => {
  if (!s) return '';
  const norm = s.trim().toLowerCase().replace(/\s+/g, '_');
  const allowed = ['full_time', 'part_time', 'internship', 'contract', 'freelance', 'temporary'];
  return allowed.includes(norm) ? norm : s;
};

export default function JobsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  const location = searchParams.get('location') || '';
  const company = searchParams.get('company') || '';
  const skills = searchParams.get('skills') || '';
  const status = searchParams.get('status') || 'open';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || '1');

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs', {
        params: { q, type, location, company, skills, page, pageSize, status, sort },
      });
      setItems(data?.items || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error('Jobs list error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, location, company, skills, status, sort, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const updateParams = (patch) => {
    setSearchParams({
      q,
      type,
      location,
      company,
      skills,
      status,
      sort,
      page,
      ...patch,
    });
  };

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 10; i++) {
      particles.push(
        <div
          key={i}
          className="jobslist-particle"
          style={{
            width: `${Math.random() * 12 + 4}px`,
            height: `${Math.random() * 12 + 4}px`,
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

  const EmptyState = () => (
    <div className="jobslist-empty-state">
      <div className="text-6xl mb-4 opacity-60">💼</div>
      <h3 className="text-xl font-semibold text-white mb-2">Tidak Ada Lowongan Ditemukan</h3>
      <p className="text-gray-400 mb-6">
        Coba ubah filter pencarian Anda atau posting lowongan baru
      </p>
      <Link
        to="/jobs/new"
        className="jobslist-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-block"
      >
        📝 Posting Lowongan Baru
      </Link>
    </div>
  );

  const getJobTypeColor = (jobType) => {
    const colors = {
      full_time: 'blue',
      part_time: 'green',
      internship: 'yellow',
      contract: 'purple',
      freelance: 'blue',
      temporary: 'red'
    };
    return colors[jobType] || 'blue';
  };

  const isUrgent = (job) => {
    if (!job.expires_at) return false;
    const expires = new Date(job.expires_at);
    const now = new Date();
    const daysLeft = (expires - now) / (1000 * 60 * 60 * 24);
    return daysLeft <= 3 && daysLeft > 0;
  };

  return (
    <div className="jobslist-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-yellow-500 rounded-full opacity-20 jobslist-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-blue-500 rounded-full opacity-20 jobslist-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-22 h-22 bg-blue-400 rounded-full opacity-20 jobslist-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-4xl font-bold text-white mb-2 jobslist-gradient-text-blue-yellow">
                🔍 Lowongan Pekerjaan
              </h1>
              <p className="text-gray-300 text-lg">
                Temukan peluang karir terbaik dari alumni dan perusahaan terpercaya
              </p>
            </div>
            <Link
              to="/jobs/new"
              className="jobslist-gradient-btn yellow px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <span>📝</span>
              <span>Posting Lowongan</span>
            </Link>
          </div>

          {/* Filter Card */}
          <div className="jobslist-filter-card p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span>🔍</span>
              Filter Pencarian
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 jobslist-filter-grid mb-4">
              <input
                className="jobslist-glass-input dark px-4 py-3"
                placeholder="Cari judul, perusahaan, lokasi..."
                defaultValue={q}
                onBlur={(e) =>
                  updateParams({ q: e.target.value, page: 1 })
                }
              />

              <input
                className="jobslist-glass-input dark px-4 py-3"
                placeholder="Tipe (Full Time, Internship...)"
                defaultValue={type ? jobTypeLabel(type) : ''}
                onBlur={(e) => {
                  const snake = toSnakeJobType(e.target.value);
                  updateParams({ type: snake, page: 1 });
                }}
              />

              <input
                className="jobslist-glass-input dark px-4 py-3"
                placeholder="📍 Lokasi"
                defaultValue={location}
                onBlur={(e) =>
                  updateParams({ location: e.target.value, page: 1 })
                }
              />

              <input
                className="jobslist-glass-input dark px-4 py-3"
                placeholder="🏢 Perusahaan"
                defaultValue={company}
                onBlur={(e) =>
                  updateParams({ company: e.target.value, page: 1 })
                }
              />

              <input
                className="jobslist-glass-input dark px-4 py-3"
                placeholder="💻 Skills (react, js, python)"
                defaultValue={skills}
                onBlur={(e) =>
                  updateParams({ skills: e.target.value, page: 1 })
                }
              />
            </div>

            {/* Secondary Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <select
                className="jobslist-glass-select dark px-4 py-3 text-sm"
                value={status}
                onChange={(e) =>
                  updateParams({ status: e.target.value, page: 1 })
                }
              >
                <option value="open">📊 Status: Buka</option>
                <option value="closed">📊 Status: Tutup</option>
                <option value="all">📊 Status: Semua</option>
              </select>

              <select
                className="jobslist-glass-select dark px-4 py-3 text-sm"
                value={sort}
                onChange={(e) =>
                  updateParams({ sort: e.target.value, page: 1 })
                }
              >
                <option value="newest">🕒 Urutkan: Terbaru → Terlama</option>
                <option value="oldest">🕒 Urutkan: Terlama → Terbaru</option>
              </select>

              <div className="text-sm text-gray-300 ml-auto">
                Ditemukan: <span className="text-blue-400 font-semibold">{total}</span> lowongan
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="jobslist-loading"></div>
              <span className="ml-4 text-white text-lg">Memuat lowongan...</span>
            </div>
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 jobslist-grid">
              {items.map((job) => {
                const now = new Date();
                const isExpired = job.expires_at
                  ? new Date(job.expires_at) < now
                  : false;
                const isClosed = !job.is_active || isExpired;
                const isUrgentJob = isUrgent(job);
                const jobTypeColor = getJobTypeColor(job.job_type);

                return (
                  <Link
                    key={job.job_id}
                    to={`/jobs/${job.job_id}`}
                    className="block jobslist-job-card dark p-6 rounded-2xl transition-all duration-300"
                  >
                    {/* Header dengan status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`jobslist-badge ${jobTypeColor}`}>
                            {jobTypeLabel(job.job_type)}
                          </span>
                          {isUrgentJob && (
                            <span className="jobslist-urgent-badge text-xs px-2 py-1 rounded-full">
                              🔥 Urgent
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center ${isClosed ? 'text-red-400' : 'text-green-400'}`}>
                        <span className={`jobslist-status-indicator ${isClosed ? 'closed' : 'open'}`}></span>
                        <span className="text-sm font-semibold">
                          {isClosed ? 'Ditutup' : 'Dibuka'}
                        </span>
                      </div>
                    </div>

                    {/* Company dan Location */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                        🏢
                      </div>
                      <div>
                        <div className="font-semibold text-white">{job.company}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <span>📍</span>
                          <span>{job.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    {job.required_skills?.length ? (
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-2">Skills yang dibutuhkan:</div>
                        <div className="flex flex-wrap gap-1 jobslist-skills-container">
                          {job.required_skills.slice(0, 4).map((s, i) => (
                            <span
                              key={i}
                              className="jobslist-skill-tag"
                            >
                              {s}
                            </span>
                          ))}
                          {job.required_skills.length > 4 && (
                            <span className="jobslist-skill-tag bg-gray-500">
                              +{job.required_skills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Footer Info */}
                    <div className="pt-4 border-t border-gray-700">
                      <div className="flex justify-between items-center text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <span>📅</span>
                          <span>Post: {new Date(job.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        {job.expires_at && (
                          <div className={`flex items-center gap-1 ${isUrgentJob ? 'text-red-400' : ''}`}>
                            <span>⏰</span>
                            <span>
                              {isExpired ? 'Kadaluarsa' : `Sampai ${new Date(job.expires_at).toLocaleDateString('id-ID')}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => updateParams({ page: page - 1 })}
                className="jobslist-pagination-btn px-4 py-2 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <span>←</span>
                <span>Sebelumnya</span>
              </button>
              
              <div className="text-white flex items-center gap-2">
                <span className="jobslist-badge blue">
                  Halaman {page} dari {totalPages}
                </span>
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: page + 1 })}
                className="jobslist-pagination-btn px-4 py-2 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <span>Selanjutnya</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}