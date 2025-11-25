// src/pages/MyApplications.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import './MyApplications.css';

const statusLabel = {
  pending: 'Menunggu',
  review: 'Dalam Pertimbangan',
  interview: 'Interview',
  offered: 'Ditawarkan',
  hired: 'Diterima',
  rejected: 'Ditolak',
};

const statusConfig = {
  pending: { color: 'yellow', emoji: '⏳', description: 'Lamaran Anda sedang menunggu ditinjau' },
  review: { color: 'blue', emoji: '📋', description: 'Lamaran Anda sedang dalam pertimbangan' },
  interview: { color: 'purple', emoji: '🎯', description: 'Anda diundang untuk interview' },
  offered: { color: 'green', emoji: '✅', description: 'Anda mendapat penawaran pekerjaan' },
  hired: { color: 'green', emoji: '🎉', description: 'Selamat! Anda diterima' },
  rejected: { color: 'red', emoji: '❌', description: 'Lamaran Anda tidak dilanjutkan' },
};

export default function MyApplications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs/me/applied');
      setItems(data?.items || []);
    } catch (e) {
      console.error('MyApplications error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      particles.push(
        <div
          key={i}
          className="myapplications-particle"
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

  const EmptyState = () => (
    <div className="myapplications-empty-state">
      <div className="text-6xl mb-4 opacity-60">📨</div>
      <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Lamaran</h3>
      <p className="text-gray-400 mb-6">
        Mulai jelajahi lowongan pekerjaan dan kirim lamaran pertama Anda
      </p>
      <Link
        to="/jobs"
        className="myapplications-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-block"
      >
        🔍 Jelajahi Lowongan
      </Link>
    </div>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysAgo = (dateString) => {
    const applied = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - applied);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Stats calculation
  const totalApplications = items.length;
  const activeApplications = items.filter(app => 
    ['pending', 'review', 'interview'].includes(app.status)
  ).length;
  const successfulApplications = items.filter(app => 
    ['offered', 'hired'].includes(app.status)
  ).length;

  return (
    <div className="myapplications-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-yellow-500 rounded-full opacity-20 myapplications-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-blue-500 rounded-full opacity-20 myapplications-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-22 h-22 bg-blue-400 rounded-full opacity-20 myapplications-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3 myapplications-gradient-text-blue-yellow">
              📋 Lamaran Saya
            </h1>
            <p className="text-gray-300 text-lg">
              Pantau status semua lamaran pekerjaan yang Anda kirim
            </p>
          </div>

          {/* Stats Summary */}
          {items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 myapplications-stats-grid">
              <div className="myapplications-stats-card">
                <div className="text-3xl font-bold text-white mb-2">{totalApplications}</div>
                <div className="text-gray-400 text-sm">Total Lamaran</div>
              </div>
              <div className="myapplications-stats-card">
                <div className="text-3xl font-bold text-blue-400 mb-2">{activeApplications}</div>
                <div className="text-gray-400 text-sm">Dalam Proses</div>
              </div>
              <div className="myapplications-stats-card">
                <div className="text-3xl font-bold text-green-400 mb-2">{successfulApplications}</div>
                <div className="text-gray-400 text-sm">Berhasil</div>
              </div>
            </div>
          )}

          {/* Applications List */}
          <div className="myapplications-glass-card dark p-6 rounded-2xl">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="myapplications-loading"></div>
                <span className="ml-4 text-white text-lg">Memuat lamaran Anda...</span>
              </div>
            ) : items.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {items.map(application => {
                  const statusInfo = statusConfig[application.status] || statusConfig.pending;
                  const daysAgo = getDaysAgo(application.applied_at);
                  
                  return (
                    <div key={application.application_id} className="myapplications-application-card dark p-6 rounded-2xl">
                      <div className="flex flex-col lg:flex-row gap-6 myapplications-application-content">
                        {/* Application Info */}
                        <div className="flex-1 myapplications-application-info">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-white mb-2">
                                {application.title}
                              </h3>
                              <div className="flex items-center gap-4 text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span>🏢</span>
                                  <span>{application.company}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>📍</span>
                                  <span>{application.location}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2 lg:mt-0">
                              <span className={`myapplications-badge ${statusInfo.color}`}>
                                <span className="myapplications-status-indicator ${application.status}"></span>
                                <span className="ml-1">{statusInfo.emoji} {statusLabel[application.status]}</span>
                              </span>
                            </div>
                          </div>

                          {/* Status Description */}
                          <div className="text-gray-400 text-sm mb-4">
                            {statusInfo.description}
                          </div>

                          {/* Application Timeline */}
                          <div className="myapplications-timeline">
                            <div className="myapplications-timeline-item">
                              <div className="text-white text-sm">Melamar posisi</div>
                              <div className="text-gray-400 text-xs">
                                {formatDate(application.applied_at)} ({daysAgo} hari yang lalu)
                              </div>
                            </div>
                            {application.status_updated_at && (
                              <div className="myapplications-timeline-item">
                                <div className="text-white text-sm">Status diperbarui</div>
                                <div className="text-gray-400 text-xs">
                                  {formatDate(application.status_updated_at)}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Employer Message */}
                          {application.status_note && (
                            <div className="mt-4">
                              <div className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                                <span>💬</span>
                                <span>Pesan dari Perusahaan:</span>
                              </div>
                              <div className="myapplications-message-box">
                                <div className="text-white whitespace-pre-wrap text-sm">
                                  {application.status_note}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <div className="lg:w-48 flex lg:justify-center items-start">
                          <Link 
                            to={`/jobs/${application.job_id}`}
                            className="myapplications-action-btn px-6 py-3 flex items-center gap-2 justify-center w-full lg:w-auto"
                          >
                            <span>👁️</span>
                            <span>Lihat Lowongan</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tips Section */}
          {items.length > 0 && (
            <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
              <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <span>💡</span>
                Tips Melamar Pekerjaan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>Follow up lamaran setelah 1-2 minggu jika belum ada kabar</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>Siapkan portofolio dan CV terbaru untuk interview</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>Pelajari perusahaan sebelum menghadiri interview</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>Jangan ragu untuk melamar ke multiple perusahaan</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}