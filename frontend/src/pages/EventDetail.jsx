// src/pages/EventDetail.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './EventDetail.css';

const EVENT_TYPE_CONFIG = {
  webinar: { label: 'Webinar', emoji: '💻', color: 'blue' },
  career_talk: { label: 'Career Talk', emoji: '💼', color: 'green' },
  networking: { label: 'Networking', emoji: '🤝', color: 'purple' },
  workshop: { label: 'Workshop', emoji: '🔧', color: 'orange' },
  seminar: { label: 'Seminar', emoji: '🎓', color: 'yellow' },
};

const AUDIENCE_CONFIG = {
  all: { label: 'Semua Orang', emoji: '🌍' },
  students: { label: 'Mahasiswa', emoji: '🎓' },
  alumni: { label: 'Alumni', emoji: '👨‍🎓' },
};

export default function EventDetail() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const myId = useMemo(
    () => Number(user?.id ?? user?.userId ?? 0) || null,
    [user]
  );

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myReg, setMyReg] = useState(null);
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await eventsAPI.detail(eventId);
      setEvent(data?.event || null);
      setMyReg(data?.myRegistration || null);
    } catch (e) {
      console.error('Event detail error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 6; i++) {
      particles.push(
        <div
          key={i}
          className="eventdetail-particle"
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

  if (loading) return (
    <div className="eventdetail-container">
      {renderParticles()}
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="eventdetail-loading mx-auto mb-4"></div>
          <p className="text-white text-lg">Memuat detail event...</p>
        </div>
      </div>
    </div>
  );
  
  if (!event) return (
    <div className="eventdetail-container">
      {renderParticles()}
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-white mb-2">Event Tidak Ditemukan</h2>
          <p className="text-gray-400 mb-6">Event yang Anda cari tidak ditemukan atau telah dihapus.</p>
          <button
            onClick={() => navigate('/events')}
            className="eventdetail-gradient-btn yellow px-6 py-3 rounded-xl font-semibold"
          >
            Kembali ke Daftar Event
          </button>
        </div>
      </div>
    </div>
  );

  const mine = Number(event.organizer_id) === Number(myId);
  const eventTypeConfig = EVENT_TYPE_CONFIG[event.event_type] || { label: event.event_type, emoji: '🎭', color: 'blue' };
  const audienceConfig = AUDIENCE_CONFIG[event.audience] || { label: event.audience, emoji: '👥' };

  const now = new Date();
  const endTime = event.end_time ? new Date(event.end_time) : null;
  const regDeadline = event.registration_deadline ? new Date(event.registration_deadline) : null;

  // Registration logic
  let canRegister = true;
  let registerLabel = 'Daftar Sekarang';
  let registerReason = '';

  if (event.is_cancelled) {
    canRegister = false;
    registerLabel = 'Event Dibatalkan';
    registerReason = 'Event ini telah dibatalkan oleh penyelenggara';
  } else if (endTime && endTime < now) {
    canRegister = false;
    registerLabel = 'Event Selesai';
    registerReason = 'Event ini sudah selesai dilaksanakan';
  } else if (regDeadline && regDeadline < now) {
    canRegister = false;
    registerLabel = 'Pendaftaran Ditutup';
    registerReason = 'Periode pendaftaran telah berakhir';
  } else if (event.max_attendees && event.registered_count >= event.max_attendees) {
    canRegister = false;
    registerLabel = 'Kuota Penuh';
    registerReason = 'Kuota peserta untuk event ini sudah penuh';
  }

  const isClosed = !canRegister;

  const register = async () => {
    if (!canRegister) return;
    setWorking(true);
    try {
      await eventsAPI.register(event.event_id);
      await load();
      alert('Berhasil mendaftar!');
    } catch (e) {
      alert(e?.response?.data?.error || 'Gagal mendaftar');
    } finally {
      setWorking(false);
    }
  };

  const unregister = async () => {
    if (!window.confirm('Batalkan pendaftaran event ini?')) return;
    setWorking(true);
    try {
      await eventsAPI.unregister(event.event_id);
      await load();
      alert('Pendaftaran dibatalkan');
    } catch (e) {
      alert(e?.response?.data?.error || 'Gagal membatalkan pendaftaran');
    } finally {
      setWorking(false);
    }
  };

  const cancelEvent = async () => {
    if (!window.confirm('Batalkan event ini? Semua peserta akan diberitahu dan tidak bisa mendaftar lagi.')) return;
    setWorking(true);
    try {
      await eventsAPI.cancel(event.event_id);
      await load();
      alert('Event berhasil dibatalkan');
    } catch (e) {
      alert(e?.response?.data?.error || 'Gagal membatalkan event');
    } finally {
      setWorking(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCapacityPercentage = () => {
    if (!event.max_attendees) return 0;
    return Math.min(100, (event.registered_count / event.max_attendees) * 100);
  };

  const getCapacityColor = () => {
    const percentage = getCapacityPercentage();
    if (percentage >= 100) return 'full';
    if (percentage >= 80) return 'warning';
    return '';
  };

  return (
    <div className="eventdetail-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-yellow-500 rounded-full opacity-20 eventdetail-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-blue-500 rounded-full opacity-20 eventdetail-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-18 h-18 bg-blue-400 rounded-full opacity-20 eventdetail-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/events')}
            className="eventdetail-back-btn px-4 py-2 mb-6 flex items-center gap-2"
          >
            <span>←</span>
            <span>Kembali ke Event</span>
          </button>

          {/* Main Event Card */}
          <div className="eventdetail-glass-card dark p-8 rounded-2xl mb-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between eventdetail-header mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-3 eventdetail-gradient-text-blue-yellow">
                  {event.title}
                </h1>
                <div className="flex items-center gap-4 text-lg text-gray-300 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">📍</span>
                    <span>{event.location}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`eventdetail-badge ${eventTypeConfig.color}`}>
                    {eventTypeConfig.emoji} {eventTypeConfig.label}
                  </span>
                  <span className={`eventdetail-badge ${audienceConfig.emoji ? 'blue' : 'blue'}`}>
                    {audienceConfig.emoji} {audienceConfig.label}
                  </span>
                  {event.is_cancelled ? (
                    <span className="eventdetail-badge red">
                      <span className="eventdetail-status-indicator cancelled"></span>
                      Dibatalkan
                    </span>
                  ) : isClosed ? (
                    <span className="eventdetail-badge red">
                      <span className="eventdetail-status-indicator closed"></span>
                      Ditutup
                    </span>
                  ) : (
                    <span className="eventdetail-badge green">
                      <span className="eventdetail-status-indicator open"></span>
                      Dibuka
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cover Image */}
            {event.cover_image && (
              <img 
                src={event.cover_image} 
                alt={event.title}
                className="eventdetail-cover-image"
              />
            )}

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>📝</span>
                Deskripsi Event
              </h3>
              <div className="eventdetail-description whitespace-pre-wrap">
                {event.description}
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="eventdetail-info-grid mb-6">
              <div className="eventdetail-info-item">
                <div className="text-sm text-gray-400 mb-1">🕐 Waktu Mulai</div>
                <div className="text-white font-semibold">{formatDate(event.start_time)}</div>
              </div>
              
              <div className="eventdetail-info-item">
                <div className="text-sm text-gray-400 mb-1">🕒 Waktu Selesai</div>
                <div className="text-white font-semibold">{formatDate(event.end_time)}</div>
              </div>
              
              <div className="eventdetail-info-item">
                <div className="text-sm text-gray-400 mb-1">⏰ Deadline Pendaftaran</div>
                <div className="text-white font-semibold">
                  {event.registration_deadline ? formatDate(event.registration_deadline) : 'Tidak ada batas'}
                </div>
              </div>
              
              <div className="eventdetail-info-item">
                <div className="text-sm text-gray-400 mb-1">👥 Kapasitas</div>
                <div className="text-white font-semibold">
                  {event.max_attendees ? `${event.registered_count} / ${event.max_attendees}` : 'Tidak terbatas'}
                </div>
                {event.max_attendees && (
                  <div className="eventdetail-capacity-bar">
                    <div 
                      className={`eventdetail-capacity-fill ${getCapacityColor()}`}
                      style={{ width: `${getCapacityPercentage()}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="eventdetail-info-item">
                <div className="text-sm text-gray-400 mb-1">🌐 Tipe Akses</div>
                <div className="text-white font-semibold">
                  {event.is_public ? 'Terbuka untuk Umum' : 'Terbatas'}
                </div>
              </div>

              {event.meeting_link && (
                <div className="eventdetail-info-item">
                  <div className="text-sm text-gray-400 mb-1">🔗 Link Meeting</div>
                  <a 
                    href={event.meeting_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="eventdetail-meeting-link font-semibold"
                  >
                    {event.meeting_link}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Registration Status Section */}
          {myReg ? (
            <div className="eventdetail-registered-section mb-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>✅</span>
                Anda Terdaftar
              </h3>
              <div className="space-y-3">
                <div className="text-white">
                  Terdaftar pada: <span className="text-green-400">{formatDate(myReg.registered_at)}</span>
                </div>
                
                {event.meeting_link && (
                  <div>
                    <div className="text-gray-300 text-sm mb-2">Link untuk bergabung:</div>
                    <a 
                      href={event.meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="eventdetail-gradient-btn green px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
                    >
                      <span>🎯</span>
                      <span>Join Meeting</span>
                    </a>
                  </div>
                )}

                <div className="pt-4 border-t border-green-500/30">
                  <button
                    disabled={working}
                    onClick={unregister}
                    className="eventdetail-action-btn red px-6 py-3 flex items-center gap-2"
                  >
                    <span>❌</span>
                    <span>Batalkan Pendaftaran</span>
                  </button>
                </div>
              </div>
            </div>
          ) : !mine && (
            <div className="eventdetail-glass-card dark p-6 rounded-2xl mb-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>🎟️</span>
                Pendaftaran Event
              </h3>
              
              {!canRegister && registerReason && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <div className="text-red-400 text-sm">{registerReason}</div>
                </div>
              )}

              <button
                disabled={working || !canRegister}
                onClick={canRegister ? register : undefined}
                className={`${
                  canRegister 
                    ? 'eventdetail-gradient-btn yellow' 
                    : 'eventdetail-action-btn opacity-50 cursor-not-allowed'
                } px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-3 w-full justify-center`}
              >
                {working ? (
                  <>
                    <div className="eventdetail-loading"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>{canRegister ? '🎟️' : '❌'}</span>
                    <span>{registerLabel}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Organizer Actions */}
          {mine && (
            <div className="eventdetail-glass-card dark p-6 rounded-2xl">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>⚙️</span>
                Kelola Event
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 eventdetail-actions">
                <Link
                  to={`/events/${event.event_id}/registrants`}
                  className="eventdetail-action-btn green px-6 py-3 flex items-center gap-2 justify-center"
                >
                  <span>👥</span>
                  <span>Lihat Peserta ({event.registered_count})</span>
                </Link>
                
                {!event.is_cancelled && (
                  <button
                    disabled={working}
                    onClick={cancelEvent}
                    className="eventdetail-action-btn red px-6 py-3 flex items-center gap-2 justify-center"
                  >
                    <span>🚫</span>
                    <span>Batalkan Event</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}