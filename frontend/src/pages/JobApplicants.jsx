// src/pages/JobApplicants.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './JobApplicants.css';

const statusLabel = {
  pending: 'Menunggu',
  review: 'Dalam Pertimbangan',
  interview: 'Interview',
  offered: 'Ditawarkan',
  hired: 'Diterima',
  rejected: 'Ditolak',
};

const statusConfig = {
  pending: { color: 'yellow', emoji: '⏳' },
  review: { color: 'blue', emoji: '📋' },
  interview: { color: 'purple', emoji: '🎯' },
  offered: { color: 'green', emoji: '✅' },
  hired: { color: 'green', emoji: '🎉' },
  rejected: { color: 'red', emoji: '❌' },
};

export default function JobApplicants() {
  const { jobId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const myId = useMemo(
    () => Number(user?.id ?? user?.userId ?? 0) || null,
    [user]
  );

  const [job, setJob] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchJob = async () => {
    try {
      const { data } = await api.get(`/jobs/${jobId}`);
      setJob(data?.job || null);
    } catch (e) {
      console.error('Fetch job error:', e?.response?.data || e.message);
    }
  };

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/jobs/${jobId}/applications`);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.error('Load applicants error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (applicationId, nextStatus) => {
    const prompts = {
      review: "Tandai lamaran ini sebagai 'Dalam Pertimbangan'?",
      interview:
        "Lulus ke 'Interview'? Kami sarankan Anda menghubungi kandidat via email. Lanjutkan?",
      offered:
        "Set status menjadi 'Ditawarkan'? Pastikan Anda sudah mengirimkan detail offer.",
      hired: "Set status menjadi 'Diterima'? Kandidat dianggap diterima.",
      rejected: "Tolak lamaran ini? Keputusan akan terlihat oleh kandidat.",
    };

    if (!window.confirm(prompts[nextStatus])) return;

    const note = window.prompt('Tambahkan pesan untuk kandidat (opsional):') || null;

    setUpdatingId(applicationId);

    try {
      await api.patch(`/jobs/${jobId}/applications/${applicationId}`, {
        status: nextStatus,
        note,
      });

      await fetchApplicants();

      alert(
        `Status diperbarui menjadi: ${statusLabel[nextStatus]}\n` +
          (note ? `Pesan dikirim: "${note}"` : '')
      );
    } catch (e) {
      alert(e?.response?.data?.error || 'Gagal memperbarui status.');
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchJob();
    fetchApplicants();
  }, [jobId]);

  const mine = useMemo(() => {
    if (!job || !myId) return false;
    return Number(job.posted_by_id) === Number(myId);
  }, [job, myId]);

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 6; i++) {
      particles.push(
        <div
          key={i}
          className="jobapplicants-particle"
          style={{
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            background:
              i % 2 === 0
                ? `rgba(255, 193, 7, ${Math.random() * 0.2 + 0.1})`
                : `rgba(33, 150, 243, ${Math.random() * 0.2 + 0.1})`,
          }}
        />
      );
    }
    return particles;
  };

  const EmptyState = () => (
    <div className="jobapplicants-empty-state">
      <div className="text-6xl mb-4 opacity-60">👥</div>
      <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Pelamar</h3>
      <p className="text-gray-400 mb-6">
        Belum ada yang melamar ke lowongan ini. Bagikan link lowongan untuk
        mendapatkan lebih banyak pelamar.
      </p>
      <button
        onClick={() => nav(`/jobs/${jobId}`)}
        className="jobapplicants-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
      >
        Lihat Detail Lowongan
      </button>
    </div>
  );

  const AccessDenied = () => (
    <div className="jobapplicants-access-denied">
      <div className="text-6xl mb-4">🚫</div>
      <h3 className="text-xl font-semibold text-white mb-2">Akses Ditolak</h3>
      <p className="text-gray-400 mb-6">
        Anda tidak memiliki akses ke daftar pelamar untuk lowongan ini.
      </p>
      <Link
        to="/jobs"
        className="jobapplicants-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-block"
      >
        Kembali ke Lowongan
      </Link>
    </div>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!mine) {
    return (
      <div className="jobapplicants-container">
        {renderParticles()}
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl mx-auto">
            <AccessDenied />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="jobapplicants-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-yellow-500 rounded-full opacity-20 jobapplicants-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-blue-500 rounded-full opacity-20 jobapplicants-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-18 h-18 bg-blue-400 rounded-full opacity-20 jobapplicants-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 jobapplicants-header">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => nav(-1)}
                  className="jobapplicants-back-btn px-4 py-2 flex items-center gap-2"
                >
                  <span>←</span>
                  <span>Kembali</span>
                </button>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2 jobapplicants-gradient-text-blue-yellow">
                👥 Daftar Pelamar
              </h1>
              <p className="text-gray-300 text-lg">
                Kelola dan tinjau semua pelamar untuk lowongan Anda
              </p>
            </div>
            <Link
              to={`/jobs/${jobId}`}
              className="jobapplicants-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <span>👁️</span>
              <span>Lihat Detail Lowongan</span>
            </Link>
          </div>

          {/* Job Info */}
          {job && (
            <div className="jobapplicants-glass-card dark p-6 rounded-2xl mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    {job.title}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-300">
                    <div className="flex items-center gap-2">
                      <span>🏢</span>
                      <span>{job.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{job.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-400">
                    {items.length}
                  </div>
                  <div className="text-gray-400 text-sm">Total Pelamar</div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          {items.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              {Object.entries(statusConfig).map(([status, cfg]) => (
                <div key={status} className="jobapplicants-stats-card text-center">
                  <div className="text-2xl mb-1">{cfg.emoji}</div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {items.filter((item) => item.status === status).length}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {statusLabel[status]}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Applicants List */}
          <div className="jobapplicants-glass-card dark p-6 rounded-2xl">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="jobapplicants-loading"></div>
                <span className="ml-4 text-white text-lg">
                  Memuat daftar pelamar...
                </span>
              </div>
            ) : items.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {items.map((applicant) => {
                  const currentStatusConfig =
                    statusConfig[applicant.status] || {
                      color: 'yellow',
                      emoji: '⏳',
                    };

                  return (
                    <div
                      key={applicant.application_id}
                      className="jobapplicants-applicant-card dark p-6 rounded-2xl"
                    >
                      <div className="flex flex-col lg:flex-row gap-6 jobapplicants-applicant-content">
                        {/* Applicant Info */}
                        <div className="flex-1 jobapplicants-applicant-info">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <Link
                                to={`/profile/${applicant.applicant_id}`}
                                className="text-xl font-semibold text-white hover:text-blue-400 transition-colors"
                              >
                                {applicant.applicant_name ||
                                  'Nama tidak tersedia'}
                              </Link>
                              <div className="text-gray-400 mt-1 flex items-center gap-2">
                                <span>📧</span>
                                <span>{applicant.applicant_email}</span>
                              </div>
                            </div>
                            <div
                              className={`jobapplicants-badge ${currentStatusConfig.color}`}
                            >
                              <span>{currentStatusConfig.emoji}</span>
                              <span className="ml-1">
                                {statusLabel[applicant.status]}
                              </span>
                            </div>
                          </div>

                          {/* Cover Letter */}
                          {applicant.cover_letter && (
                            <div className="mb-4">
                              <div className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                                <span>💌</span>
                                <span>Surat Lamaran:</span>
                              </div>
                              <div className="jobapplicants-cover-letter">
                                <div className="text-white whitespace-pre-wrap text-sm">
                                  {applicant.cover_letter}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Resume Link */}
                          <div className="mb-3">
                            <div className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                              <span>📄</span>
                              <span>Resume/CV:</span>
                            </div>
                            {applicant.resume_link ? (
                              <a
                                href={applicant.resume_link}
                                className="jobapplicants-resume-link text-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {applicant.resume_link}
                              </a>
                            ) : (
                              <span className="text-gray-500 text-sm">-</span>
                            )}
                          </div>

                          {/* Applied Date */}
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <span>📅</span>
                            <span>
                              Melamar: {formatDate(applicant.applied_at)}
                            </span>
                          </div>
                        </div>

                        {/* Status Actions */}
                        <div className="lg:w-64">
                          <div className="text-gray-400 text-sm mb-3">
                            Ubah Status:
                          </div>
                          <div className="grid grid-cols-2 gap-2 jobapplicants-actions-grid">
                            <button
                              disabled={
                                updatingId === applicant.application_id
                              }
                              onClick={() =>
                                updateStatus(
                                  applicant.application_id,
                                  'review'
                                )
                              }
                              className="jobapplicants-status-btn review flex items-center gap-1 justify-center"
                            >
                              <span>📋</span>
                              <span>Review</span>
                            </button>

                            <button
                              disabled={
                                updatingId === applicant.application_id
                              }
                              onClick={() =>
                                updateStatus(
                                  applicant.application_id,
                                  'interview'
                                )
                              }
                              className="jobapplicants-status-btn interview flex items-center gap-1 justify-center"
                            >
                              <span>🎯</span>
                              <span>Interview</span>
                            </button>

                            <button
                              disabled={
                                updatingId === applicant.application_id
                              }
                              onClick={() =>
                                updateStatus(
                                  applicant.application_id,
                                  'offered'
                                )
                              }
                              className="jobapplicants-status-btn offered flex items-center gap-1 justify-center"
                            >
                              <span>✅</span>
                              <span>Offered</span>
                            </button>

                            <button
                              disabled={
                                updatingId === applicant.application_id
                              }
                              onClick={() =>
                                updateStatus(
                                  applicant.application_id,
                                  'hired'
                                )
                              }
                              className="jobapplicants-status-btn hired flex items-center gap-1 justify-center"
                            >
                              <span>🎉</span>
                              <span>Hired</span>
                            </button>

                            <button
                              disabled={
                                updatingId === applicant.application_id
                              }
                              onClick={() =>
                                updateStatus(
                                  applicant.application_id,
                                  'rejected'
                                )
                              }
                              className="jobapplicants-status-btn rejected flex items-center gap-1 justify-center col-span-2"
                            >
                              <span>❌</span>
                              <span>Tolak Lamaran</span>
                            </button>
                          </div>

                          {updatingId === applicant.application_id && (
                            <div className="flex justify-center mt-3">
                              <div className="jobapplicants-loading"></div>
                            </div>
                          )}
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
    </div>
  );
}
