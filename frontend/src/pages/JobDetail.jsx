// src/pages/JobDetail.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './JobDetail.css';

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

export default function JobDetail() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const myId = useMemo(
    () => (Number(user?.id ?? user?.userId ?? 0) || null),
    [user]
  );

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // apply form
  const [cover, setCover] = useState('');
  const [resume, setResume] = useState('');
  const [applying, setApplying] = useState(false);

  // applied state
  const [hasApplied, setHasApplied] = useState(false);
  const [myApplication, setMyApplication] = useState(null);

  const mine = useMemo(() => {
    if (!job || !myId) return false;
    return Number(job.posted_by_id) === Number(myId);
  }, [job, myId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/jobs/${jobId}`);
      setJob(data?.job || null);
    } catch (e) {
      console.error('Job detail error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const checkApplied = async () => {
    try {
      const { data } = await api.get('/jobs/me/applied', { params: { jobId } });
      const list = Array.isArray(data?.items) ? data.items : [];
      const found = list.find((a) => Number(a.job_id) === Number(jobId));
      if (found) {
        setHasApplied(true);
        setMyApplication(found);
      } else {
        setHasApplied(false);
        setMyApplication(null);
      }
    } catch {
      setHasApplied(false);
      setMyApplication(null);
    }
  };

  const onApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      await api.post(`/jobs/${jobId}/apply`, {
        cover_letter: cover,
        resume_link: resume,
      });
      setCover('');
      setResume('');
      await checkApplied();
      alert('Application submitted!');
    } catch (e2) {
      alert(e2?.response?.data?.error || 'Failed to apply.');
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    if (myId) checkApplied();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, myId]);

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      particles.push(
        <div
          key={i}
          className="jobdetail-particle"
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

  if (loading) return (
    <div className="jobdetail-container">
      {renderParticles()}
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="jobdetail-loading mx-auto mb-4"></div>
          <p className="text-white text-lg">Memuat detail lowongan...</p>
        </div>
      </div>
    </div>
  );
  
  if (!job) return (
    <div className="jobdetail-container">
      {renderParticles()}
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-white mb-2">Lowongan Tidak Ditemukan</h2>
          <p className="text-gray-400 mb-6">Lowongan yang Anda cari tidak ditemukan atau telah dihapus.</p>
          <button
            onClick={() => navigate('/jobs')}
            className="jobdetail-gradient-btn yellow px-6 py-3 rounded-xl font-semibold"
          >
            Kembali ke Daftar Lowongan
          </button>
        </div>
      </div>
    </div>
  );

  const now = new Date();
  const isExpired = job.expires_at ? new Date(job.expires_at) < now : false;
  const isClosed = !job.is_active || isExpired;

  const closedReason = !job.is_active
    ? 'Lowongan ini sudah dinonaktifkan oleh pengiklan.'
    : isExpired
      ? 'Periode pendaftaran telah berakhir.'
      : 'Lowongan sudah ditutup.';

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

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'blue',
      reviewed: 'yellow',
      accepted: 'green',
      rejected: 'red'
    };
    return colors[status] || 'blue';
  };

  return (
    <div className="jobdetail-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-yellow-500 rounded-full opacity-20 jobdetail-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-blue-500 rounded-full opacity-20 jobdetail-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-18 h-18 bg-blue-400 rounded-full opacity-20 jobdetail-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/jobs')}
            className="jobdetail-back-btn px-4 py-2 mb-6 flex items-center gap-2"
          >
            <span>←</span>
            <span>Kembali ke Lowongan</span>
          </button>

          {/* Main Job Card */}
          <div className="jobdetail-glass-card dark p-8 rounded-2xl mb-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between jobdetail-header mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-3 jobdetail-gradient-text-blue-yellow">
                  {job.title}
                </h1>
                <div className="flex items-center gap-4 text-lg text-gray-300 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">🏢</span>
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">📍</span>
                    <span>{job.location}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 jobdetail-badges">
                  <span className={`jobdetail-badge ${getJobTypeColor(job.job_type)}`}>
                    {jobTypeLabel(job.job_type)}
                  </span>
                  {isClosed ? (
                    <span className="jobdetail-badge red">
                      <span className="jobdetail-status-indicator closed"></span>
                      Ditutup
                    </span>
                  ) : (
                    <span className="jobdetail-badge green">
                      <span className="jobdetail-status-indicator open"></span>
                      Dibuka
                    </span>
                  )}
                  {job.expires_at && (
                    <span className="jobdetail-badge yellow">
                      ⏰ {new Date(job.expires_at).toLocaleDateString('id-ID')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>📝</span>
                Deskripsi Pekerjaan
              </h3>
              <div className="jobdetail-description whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            {/* Required Skills */}
            {job.required_skills?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span>💻</span>
                  Skills yang Dibutuhkan
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((s, i) => (
                    <span
                      key={i}
                      className="jobdetail-skill-tag"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Details Grid */}
            <div className="jobdetail-info-grid mb-6">
              <div className="jobdetail-info-item">
                <div className="text-sm text-gray-400 mb-1">🏭 Industri</div>
                <div className="text-white font-semibold">{job.industry || 'Tidak ditentukan'}</div>
              </div>
              
              <div className="jobdetail-info-item">
                <div className="text-sm text-gray-400 mb-1">📊 Pengalaman Minimal</div>
                <div className="text-white font-semibold">
                  {job.min_experience ? `${job.min_experience} tahun` : 'Fresh Graduate'}
                </div>
              </div>
              
              <div className="jobdetail-info-item">
                <div className="text-sm text-gray-400 mb-1">💰 Rentang Gaji</div>
                <div className="text-white font-semibold">{job.salary_range || 'Dirahasiakan'}</div>
              </div>
              
              <div className="jobdetail-info-item">
                <div className="text-sm text-gray-400 mb-1">🔗 Link Lamaran</div>
                <div className="text-white font-semibold">
                  {job.application_link ? (
                    <a href={job.application_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      Apply via External Link
                    </a>
                  ) : 'Apply via Platform'}
                </div>
              </div>
            </div>

            {/* Poster Info */}
            <div className="pt-6 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                Diposting oleh <span className="text-yellow-400">{job.poster_name}</span> ({job.poster_email}) •{' '}
                <span className="text-blue-400">{new Date(job.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</span>
              </div>
            </div>
          </div>

          {/* Apply / Status Section */}
          {Number(job.posted_by_id) !== Number(myId) && (
            <>
              {hasApplied ? (
                <div className="jobdetail-application-status">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <span>📨</span>
                    Status Lamaran Anda
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-gray-400 text-sm">Status Lamaran</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`jobdetail-badge ${getStatusColor(myApplication?.status)}`}>
                            {myApplication?.status || 'submitted'}
                          </span>
                        </div>
                      </div>
                      {myApplication?.applied_at && (
                        <div className="text-right">
                          <div className="text-gray-400 text-sm">Tanggal Apply</div>
                          <div className="text-white text-sm">
                            {new Date(myApplication.applied_at).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      )}
                    </div>

                    {myApplication?.status_note && (
                      <div>
                        <div className="text-gray-400 text-sm mb-2">Pesan dari Perusahaan:</div>
                        <div className="jobdetail-glass-card dark p-4 rounded-xl">
                          <div className="text-white whitespace-pre-wrap">
                            {myApplication.status_note}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-700">
                      <Link
                        to="/jobs/me/applied"
                        className="jobdetail-gradient-btn blue px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
                      >
                        <span>Lihat Semua Lamaran Saya</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : isClosed ? (
                <div className="jobdetail-apply-section p-6">
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                    <span>🔒</span>
                    Lowongan Ditutup
                  </h3>
                  <p className="text-gray-400 mb-4">{closedReason}</p>
                  <button
                    disabled
                    className="jobdetail-gradient-btn red px-6 py-3 rounded-xl font-semibold opacity-50 cursor-not-allowed"
                  >
                    Tidak Dapat Melamar
                  </button>
                </div>
              ) : (
                <form onSubmit={onApply} className="jobdetail-apply-section p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <span>🚀</span>
                    Lamar ke Lowongan Ini
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Surat Lamaran (Opsional)
                      </label>
                      <textarea
                        className="w-full jobdetail-glass-textarea px-4 py-3"
                        rows={6}
                        placeholder="Ceritakan mengapa Anda tertarik dengan posisi ini dan bagaimana pengalaman Anda relevan..."
                        value={cover}
                        onChange={(e) => setCover(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Link Resume/CV
                      </label>
                      <input
                        className="w-full jobdetail-glass-input px-4 py-3"
                        placeholder="https://drive.google.com/... atau https://linkedin.com/in/..."
                        value={resume}
                        onChange={(e) => setResume(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    disabled={applying}
                    className="jobdetail-gradient-btn yellow px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    {applying ? (
                      <>
                        <div className="jobdetail-loading"></div>
                        <span>Mengirim Lamaran...</span>
                      </>
                    ) : (
                      <>
                        <span>📨</span>
                        <span>Kirim Lamaran</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}