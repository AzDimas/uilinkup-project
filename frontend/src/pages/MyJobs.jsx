// src/pages/MyJobs.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './MyJobs.css';

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

export default function MyJobs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs/me/posted');
      setItems(data?.items || []);
    } catch (e) {
      console.error('MyJobs error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deactivate = async (jobId) => {
    if (!confirm('Nonaktifkan lowongan ini?')) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Gagal menonaktifkan lowongan');
    }
  };

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      particles.push(
        <div
          key={i}
          className="myjobs-particle"
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

  const EmptyState = () => (
    <div className="myjobs-empty-state">
      <div className="text-6xl mb-4 opacity-60">💼</div>
      <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Lowongan yang Diposting</h3>
      <p className="text-gray-400 mb-6">
        Mulai bagikan peluang karir pertama Anda kepada komunitas UI
      </p>
      <Link
        to="/jobs/new"
        className="myjobs-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-block"
      >
        📝 Posting Lowongan Pertama
      </Link>
    </div>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="myjobs-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-yellow-500 rounded-full opacity-20 myjobs-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-blue-500 rounded-full opacity-20 myjobs-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-22 h-22 bg-blue-400 rounded-full opacity-20 myjobs-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 myjobs-header">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-4xl font-bold text-white mb-2 myjobs-gradient-text-blue-yellow">
                📋 Lowongan Saya
              </h1>
              <p className="text-gray-300 text-lg">
                Kelola semua lowongan yang telah Anda posting
              </p>
            </div>
            <Link 
              to="/jobs/new"
              className="myjobs-gradient-btn yellow px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <span>📝</span>
              <span>Posting Lowongan Baru</span>
            </Link>
          </div>

          {/* Stats Summary */}
          {items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="myjobs-stats-card">
                <div className="text-2xl font-bold text-white mb-1">{items.length}</div>
                <div className="text-gray-400 text-sm">Total Lowongan</div>
              </div>
              <div className="myjobs-stats-card">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {items.filter(job => job.is_active).length}
                </div>
                <div className="text-gray-400 text-sm">Lowongan Aktif</div>
              </div>
              <div className="myjobs-stats-card">
                <div className="text-2xl font-bold text-red-400 mb-1">
                  {items.filter(job => !job.is_active).length}
                </div>
                <div className="text-gray-400 text-sm">Lowongan Nonaktif</div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="myjobs-loading"></div>
              <span className="ml-4 text-white text-lg">Memuat lowongan Anda...</span>
            </div>
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {items.map((job) => {
                const jobTypeColor = getJobTypeColor(job.job_type);
                const expired = isExpired(job.expires_at);
                
                return (
                  <div key={job.job_id} className="myjobs-job-card dark p-6 rounded-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Job Info */}
                      <div className="flex-1 myjobs-job-info">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-2">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-3 text-gray-300 mb-3">
                              <div className="flex items-center gap-1">
                                <span>🏢</span>
                                <span>{job.company}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>📍</span>
                                <span>{job.location}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`myjobs-badge ${jobTypeColor}`}>
                              {jobTypeLabel(job.job_type)}
                            </span>
                            <span className={`myjobs-badge ${job.is_active ? 'green' : 'red'}`}>
                              <span className={`myjobs-status-indicator ${job.is_active ? 'active' : 'inactive'}`}></span>
                              {job.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                            {expired && job.is_active && (
                              <span className="myjobs-badge red">
                                ⏰ Kadaluarsa
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <span>📅</span>
                            <span>Post: {formatDate(job.created_at)}</span>
                          </div>
                          {job.expires_at && (
                            <div className="flex items-center gap-1">
                              <span>⏰</span>
                              <span className={expired ? 'text-red-400' : ''}>
                                Deadline: {formatDate(job.expires_at)}
                              </span>
                            </div>
                          )}
                          {job.applicant_count > 0 && (
                            <div className="flex items-center gap-1">
                              <span>👥</span>
                              <span className="text-blue-400">
                                {job.applicant_count} Pelamar
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 myjobs-actions">
                        <Link 
                          to={`/jobs/${job.job_id}`}
                          className="myjobs-action-btn green px-4 py-2 flex items-center gap-2"
                        >
                          <span>👁️</span>
                          <span>Lihat</span>
                        </Link>
                        <Link 
                          to={`/jobs/${job.job_id}/applicants`}
                          className="myjobs-action-btn blue px-4 py-2 flex items-center gap-2"
                        >
                          <span>👥</span>
                          <span>Pelamar</span>
                          {job.applicant_count > 0 && (
                            <span className="myjobs-applicant-badge">
                              {job.applicant_count}
                            </span>
                          )}
                        </Link>
                        <button 
                          onClick={() => deactivate(job.job_id)}
                          className="myjobs-action-btn red px-4 py-2 flex items-center gap-2"
                          disabled={!job.is_active}
                        >
                          <span>🚫</span>
                          <span>{job.is_active ? 'Nonaktifkan' : 'Nonaktif'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}