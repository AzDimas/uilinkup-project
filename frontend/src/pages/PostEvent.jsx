// src/pages/PostEvent.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import './PostEvent.css';

const EVENT_TYPE_OPTIONS = [
  { value: 'webinar', label: 'Webinar', emoji: '💻' },
  { value: 'career_talk', label: 'Career Talk', emoji: '💼' },
  { value: 'networking', label: 'Networking Session', emoji: '🤝' },
  { value: 'workshop', label: 'Workshop', emoji: '🔧' },
  { value: 'seminar', label: 'Seminar', emoji: '🎓' },
];

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Semua Orang', emoji: '🌍' },
  { value: 'students', label: 'Mahasiswa Saja', emoji: '🎓' },
  { value: 'alumni', label: 'Alumni Saja', emoji: '👨‍🎓' },
];

export default function PostEvent() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'webinar',
    start_time: '',
    end_time: '',
    location: '',
    meeting_link: '',
    max_attendees: '',
    is_public: true,
    audience: 'all',
    registration_deadline: '',
    cover_image: '',
  });

  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
        meeting_link: form.meeting_link || null,
        registration_deadline: form.registration_deadline || null,
        cover_image: form.cover_image || null,
      };

      const { data } = await eventsAPI.create(payload);
      nav(`/events/${data?.event?.event_id}`);
    } catch (err) {
      alert(err?.response?.data?.error || 'Gagal membuat event.');
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
          className="postevent-particle"
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

  return (
    <div className="postevent-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-yellow-500 rounded-full opacity-20 postevent-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-blue-500 rounded-full opacity-20 postevent-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-18 h-18 bg-blue-400 rounded-full opacity-20 postevent-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => nav('/events')}
            className="postevent-back-btn px-4 py-2 mb-6 flex items-center gap-2"
          >
            <span>←</span>
            <span>Kembali ke Event</span>
          </button>

          {/* Main Form Card */}
          <div className="postevent-glass-card dark p-8 rounded-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-3 postevent-gradient-text-blue-yellow">
                🎉 Buat Event Baru
              </h1>
              <p className="text-gray-300 text-lg">
                Bagikan pengalaman dan pengetahuan dengan komunitas UI
              </p>
            </div>

            <form onSubmit={onSubmit}>
              {/* Basic Information Section */}
              <div className="postevent-form-section mb-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span>📋</span>
                  Informasi Dasar
                </h3>
                
                <div className="postevent-form-grid">
                  <div>
                    <label className="postevent-label">
                      Judul Event <span className="postevent-required">*</span>
                    </label>
                    <input
                      className="postevent-glass-input w-full px-4 py-3"
                      name="title"
                      placeholder="Contoh: Webinar Karir di Tech Industry 2024"
                      value={form.title}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="postevent-label">
                      Tipe Event <span className="postevent-required">*</span>
                    </label>
                    <select
                      className="postevent-glass-select w-full px-4 py-3"
                      name="event_type"
                      value={form.event_type}
                      onChange={onChange}
                      required
                    >
                      {EVENT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.emoji} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="postevent-label">
                      Lokasi <span className="postevent-required">*</span>
                    </label>
                    <input
                      className="postevent-glass-input w-full px-4 py-3"
                      name="location"
                      placeholder="Contoh: Zoom Meeting, Gedung A UI, etc."
                      value={form.location}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="postevent-label">
                      Link Meeting
                    </label>
                    <input
                      className="postevent-glass-input w-full px-4 py-3"
                      name="meeting_link"
                      placeholder="https://zoom.us/j/..."
                      value={form.meeting_link}
                      onChange={onChange}
                    />
                  </div>
                </div>
              </div>

              {/* Time & Date Section */}
              <div className="postevent-form-section mb-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span>🕐</span>
                  Waktu & Tanggal
                </h3>
                
                <div className="postevent-form-grid">
                  <div className="postevent-datetime-input">
                    <label className="postevent-label">
                      Waktu Mulai <span className="postevent-required">*</span>
                    </label>
                    <input
                      className="postevent-glass-input w-full px-4 py-3 pl-12"
                      type="datetime-local"
                      name="start_time"
                      value={form.start_time}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div className="postevent-datetime-input">
                    <label className="postevent-label">
                      Waktu Selesai <span className="postevent-required">*</span>
                    </label>
                    <input
                      className="postevent-glass-input w-full px-4 py-3 pl-12"
                      type="datetime-local"
                      name="end_time"
                      value={form.end_time}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div className="postevent-datetime-input">
                    <label className="postevent-label">
                      Batas Pendaftaran
                    </label>
                    <input
                      className="postevent-glass-input w-full px-4 py-3 pl-12"
                      type="datetime-local"
                      name="registration_deadline"
                      value={form.registration_deadline}
                      onChange={onChange}
                    />
                  </div>
                </div>
              </div>

              {/* Audience & Capacity Section */}
              <div className="postevent-form-section mb-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span>👥</span>
                  Peserta & Kapasitas
                </h3>
                
                <div className="postevent-form-grid">
                  <div>
                    <label className="postevent-label">
                      Target Audience
                    </label>
                    <select
                      className="postevent-glass-select w-full px-4 py-3"
                      name="audience"
                      value={form.audience}
                      onChange={onChange}
                    >
                      {AUDIENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.emoji} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="postevent-label">
                      Kapasitas Maksimal
                    </label>
                    <input
                      className="postevent-glass-input w-full px-4 py-3"
                      type="number"
                      name="max_attendees"
                      placeholder="Kosongkan untuk tidak terbatas"
                      min="1"
                      value={form.max_attendees}
                      onChange={onChange}
                    />
                  </div>

                  <div>
                    <label className="postevent-label">
                      Cover Image URL
                    </label>
                    <input
                      className="postevent-glass-input w-full px-4 py-3"
                      name="cover_image"
                      placeholder="https://example.com/image.jpg"
                      value={form.cover_image}
                      onChange={onChange}
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="postevent-checkbox">
                      <input
                        type="checkbox"
                        name="is_public"
                        checked={form.is_public}
                        onChange={onChange}
                      />
                      <span className="text-white">Event Terbuka untuk Umum</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="postevent-form-section mb-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span>📄</span>
                  Deskripsi Event <span className="postevent-required">*</span>
                </h3>
                
                <textarea
                  className="postevent-glass-textarea w-full px-4 py-3"
                  rows={8}
                  name="description"
                  placeholder="Jelaskan detail event, agenda, pembicara, benefit untuk peserta, dan informasi penting lainnya..."
                  value={form.description}
                  onChange={onChange}
                  required
                />
                <div className="postevent-char-counter">
                  {form.description.length} karakter
                </div>
              </div>

              {/* Form Tips */}
              <div className="postevent-form-tips mb-6">
                <h4 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                  <span>💡</span>
                  Tips untuk Event yang Sukses
                </h4>
                <div className="space-y-2">
                  <div className="postevent-tip-item">
                    <span className="postevent-tip-icon">✓</span>
                    <span>Buat deskripsi yang jelas dan menarik untuk meningkatkan minat peserta</span>
                  </div>
                  <div className="postevent-tip-item">
                    <span className="postevent-tip-icon">✓</span>
                    <span>Berikan informasi lengkap tentang pembicara dan materi yang akan dibahas</span>
                  </div>
                  <div className="postevent-tip-item">
                    <span className="postevent-tip-icon">✓</span>
                    <span>Sertakan link meeting jika event dilakukan secara online</span>
                  </div>
                  <div className="postevent-tip-item">
                    <span className="postevent-tip-icon">✓</span>
                    <span>Atur batas pendaftaran untuk mengelola ekspektasi peserta</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  disabled={saving}
                  className="postevent-gradient-btn yellow px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-3"
                  type="submit"
                >
                  {saving ? (
                    <>
                      <div className="postevent-loading"></div>
                      <span>Membuat Event...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Publikasikan Event</span>
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