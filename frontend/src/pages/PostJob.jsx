// src/pages/PostJob.jsx - Perbaikan Dropdown Section
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './PostJob.css';

export default function PostJob() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    job_type: 'full_time',
    industry: '',
    required_skills: '',
    min_experience: '',
    salary_range: '',
    application_link: '',
    expires_at: '',
  });
  const [saving, setSaving] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        required_skills: form.required_skills
          ? form.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const { data } = await api.post('/jobs', payload);
      nav(`/jobs/${data?.job?.job_id}`);
    } catch (e2) {
      alert(e2?.response?.data?.error || 'Gagal memposting lowongan.');
    } finally {
      setSaving(false);
    }
  };

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 6; i++) {
      particles.push(
        <div
          key={i}
          className="postjob-particle"
          style={{
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
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

  const jobTypeOptions = [
    { value: 'full_time', label: 'Full Time', emoji: '💼' },
    { value: 'part_time', label: 'Part Time', emoji: '⏰' },
    { value: 'internship', label: 'Internship', emoji: '🎓' },
    { value: 'contract', label: 'Contract', emoji: '📝' },
    { value: 'freelance', label: 'Freelance', emoji: '🚀' },
    { value: 'temporary', label: 'Temporary', emoji: '📅' }
  ];

  return (
    <div className="postjob-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-yellow-500 rounded-full opacity-20 postjob-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-blue-500 rounded-full opacity-20 postjob-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-18 h-18 bg-blue-400 rounded-full opacity-20 postjob-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => nav('/jobs')}
            className="postjob-back-btn px-4 py-2 mb-6 flex items-center gap-2"
          >
            <span>←</span>
            <span>Kembali ke Lowongan</span>
          </button>

          {/* Main Form Card */}
          <div className="postjob-glass-card dark p-8 rounded-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-3 postjob-gradient-text-blue-yellow">
                📝 Posting Lowongan Baru
              </h1>
              <p className="text-gray-300 text-lg">
                Bagikan peluang karir terbaik dengan komunitas UI
              </p>
            </div>

            <form onSubmit={onSubmit}>
              {/* Basic Information Section */}
              <div className="postjob-form-section mb-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span>📋</span>
                  Informasi Dasar
                </h3>
                
                <div className="postjob-form-grid">
                  <div>
                    <label className="postjob-label">
                      Judul Pekerjaan <span className="text-red-400">*</span>
                    </label>
                    <input
                      className="postjob-glass-input w-full px-4 py-3"
                      name="title"
                      placeholder="Contoh: Frontend Developer React"
                      value={form.title}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="postjob-label">
                      Nama Perusahaan <span className="text-red-400">*</span>
                    </label>
                    <input
                      className="postjob-glass-input w-full px-4 py-3"
                      name="company"
                      placeholder="Contoh: PT. Contoh Indonesia"
                      value={form.company}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="postjob-label">
                      Lokasi <span className="text-red-400">*</span>
                    </label>
                    <input
                      className="postjob-glass-input w-full px-4 py-3"
                      name="location"
                      placeholder="Contoh: Jakarta Selatan, Remote"
                      value={form.location}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="postjob-label">
                      Tipe Pekerjaan <span className="text-red-400">*</span>
                    </label>
                    <select
                      className="postjob-glass-select w-full px-4 py-3"
                      name="job_type"
                      value={form.job_type}
                      onChange={onChange}
                      required
                    >
                      {jobTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.emoji} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Job Details Section */}
              <div className="postjob-form-section mb-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span>🎯</span>
                  Detail Pekerjaan
                </h3>
                
                <div className="postjob-form-grid">
                  <div>
                    <label className="postjob-label">
                      Industri
                    </label>
                    <input
                      className="postjob-glass-input w-full px-4 py-3"
                      name="industry"
                      placeholder="Contoh: Technology, Finance, Healthcare"
                      value={form.industry}
                      onChange={onChange}
                    />
                  </div>

                  <div>
                    <label className="postjob-label">
                      Pengalaman Minimal (tahun)
                    </label>
                    <input
                      className="postjob-glass-input w-full px-4 py-3"
                      name="min_experience"
                      type="number"
                      min="0"
                      max="50"
                      placeholder="0"
                      value={form.min_experience}
                      onChange={onChange}
                    />
                  </div>

                  <div>
                    <label className="postjob-label">
                      Rentang Gaji
                    </label>
                    <input
                      className="postjob-glass-input w-full px-4 py-3"
                      name="salary_range"
                      placeholder="Contoh: Rp 8.000.000 - Rp 12.000.000"
                      value={form.salary_range}
                      onChange={onChange}
                    />
                  </div>

                  <div>
                    <label className="postjob-label">
                      Link Lamaran Eksternal
                    </label>
                    <input
                      className="postjob-glass-input w-full px-4 py-3"
                      name="application_link"
                      placeholder="https://company.com/careers/..."
                      value={form.application_link}
                      onChange={onChange}
                    />
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="postjob-form-section mb-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span>📄</span>
                  Deskripsi Pekerjaan <span className="text-red-400">*</span>
                </h3>
                
                <textarea
                  className="postjob-glass-textarea w-full px-4 py-3"
                  rows={8}
                  name="description"
                  placeholder="Jelaskan tentang peran, tanggung jawab, kualifikasi, dan manfaat yang ditawarkan..."
                  value={form.description}
                  onChange={onChange}
                  required
                />
                <div className="postjob-char-counter">
                  {form.description.length} karakter
                </div>
              </div>

              {/* Skills & Deadline Section */}
              <div className="postjob-form-section mb-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span>🔧</span>
                  Persyaratan & Deadline
                </h3>
                
                <div className="postjob-form-grid">
                  <div>
                    <label className="postjob-label">
                      Skills yang Dibutuhkan
                    </label>
                    <input
                      className="postjob-glass-input w-full px-4 py-3"
                      name="required_skills"
                      placeholder="Contoh: react, javascript, node.js, python"
                      value={form.required_skills}
                      onChange={onChange}
                    />
                    <div className="postjob-char-counter">
                      Pisahkan dengan koma
                    </div>
                  </div>

                  <div>
                    <label className="postjob-label">
                      Batas Waktu Lamaran
                    </label>
                    <input
                      className="postjob-glass-input w-full px-4 py-3"
                      name="expires_at"
                      type="datetime-local"
                      value={form.expires_at}
                      onChange={onChange}
                    />
                    <div className="postjob-char-counter">
                      Kosongkan untuk tidak ada batas waktu
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Tips */}
              <div className="postjob-form-tips mb-6">
                <h4 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                  <span>💡</span>
                  Tips untuk Lowongan yang Menarik
                </h4>
                <div className="space-y-2">
                  <div className="postjob-tip-item">
                    <span className="postjob-tip-icon">✓</span>
                    <span>Jelaskan tanggung jawab dan ekspektasi dengan jelas</span>
                  </div>
                  <div className="postjob-tip-item">
                    <span className="postjob-tip-icon">✓</span>
                    <span>Sebutkan benefit dan fasilitas yang ditawarkan</span>
                  </div>
                  <div className="postjob-tip-item">
                    <span className="postjob-tip-icon">✓</span>
                    <span>Gunakan kata kunci yang relevan untuk memudahkan pencarian</span>
                  </div>
                  <div className="postjob-tip-item">
                    <span className="postjob-tip-icon">✓</span>
                    <span>Sertakan rentang gaji untuk menarik lebih banyak pelamar</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  disabled={saving}
                  className="postjob-gradient-btn yellow px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-3"
                  type="submit"
                >
                  {saving ? (
                    <>
                      <div className="postjob-loading"></div>
                      <span>Memposting Lowongan...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Publikasikan Lowongan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}