// src/pages/EventsList.jsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import './EventsList.css';

const pageSize = 12;

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All Types', emoji: '🎭' },
  { value: 'webinar', label: 'Webinar', emoji: '💻' },
  { value: 'career_talk', label: 'Career Talk', emoji: '💼' },
  { value: 'networking', label: 'Networking', emoji: '🤝' },
  { value: 'workshop', label: 'Workshop', emoji: '🔧' },
  { value: 'seminar', label: 'Seminar', emoji: '🎓' },
];

const AUDIENCE_OPTIONS = [
  { value: '', label: 'All Audience', emoji: '👥' },
  { value: 'all', label: 'Everyone', emoji: '🌍' },
  { value: 'students', label: 'Students', emoji: '🎓' },
  { value: 'alumni', label: 'Alumni', emoji: '👨‍🎓' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status', emoji: '📊' },
  { value: 'open', label: 'Open Only', emoji: '✅' },
  { value: 'closed', label: 'Closed Only', emoji: '❌' },
];

const capBadge = (registered, max) => {
  if (!max) return `${registered} terdaftar`;
  return `${registered}/${max} terdaftar`;
};

export default function EventsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  const audience = searchParams.get('audience') || '';
  const from = searchParams.get('from') || '';
  const status = searchParams.get('status') || '';
  const page = Number(searchParams.get('page') || '1');

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await eventsAPI.list({
        q,
        type,
        audience,
        from,
        status,
        page,
        pageSize,
      });
      setItems(data?.items || []);
      setTotal(data?.total || 0);
    } catch (err) {
      console.error('Events list error:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, audience, from, status, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const updateParams = (patch) => {
    setSearchParams({
      q,
      type,
      audience,
      from,
      status,
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
          className="eventslist-particle"
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
    <div className="eventslist-empty-state">
      <div className="text-6xl mb-4 opacity-60">📅</div>
      <h3 className="text-xl font-semibold text-white mb-2">Tidak Ada Event Ditemukan</h3>
      <p className="text-gray-400 mb-6">
        Coba ubah filter pencarian Anda atau buat event baru
      </p>
      <Link
        to="/events/new"
        className="eventslist-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-block"
      >
        🎉 Buat Event Baru
      </Link>
    </div>
  );

  const getEventTypeColor = (eventType) => {
    const colors = {
      webinar: 'blue',
      career_talk: 'green',
      networking: 'purple',
      workshop: 'orange',
      seminar: 'yellow'
    };
    return colors[eventType] || 'blue';
  };

  const isUrgent = (event) => {
    if (!event.registration_deadline) return false;
    const deadline = new Date(event.registration_deadline);
    const now = new Date();
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);
    return hoursLeft <= 24 && hoursLeft > 0;
  };

  const now = new Date();

  return (
    <div className="eventslist-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-yellow-500 rounded-full opacity-20 eventslist-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-blue-500 rounded-full opacity-20 eventslist-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-22 h-22 bg-blue-400 rounded-full opacity-20 eventslist-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-4xl font-bold text-white mb-2 eventslist-gradient-text-blue-yellow">
                📅 Event & Kegiatan
              </h1>
              <p className="text-gray-300 text-lg">
                Temukan webinar, workshop, dan networking event terbaru dari komunitas UI
              </p>
            </div>
            <Link
              to="/events/new"
              className="eventslist-gradient-btn yellow px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <span>🎉</span>
              <span>Buat Event</span>
            </Link>
          </div>

          {/* Filter Card */}
          <div className="eventslist-filter-card p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span>🔍</span>
              Filter Pencarian
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 eventslist-filter-grid mb-4">
              <input
                className="eventslist-glass-input px-4 py-3"
                placeholder="Cari judul, deskripsi, lokasi..."
                defaultValue={q}
                onBlur={(e) =>
                  updateParams({ q: e.target.value, page: 1 })
                }
              />

              <select
                className="eventslist-glass-select px-4 py-3"
                defaultValue={type}
                onChange={(e) =>
                  updateParams({ type: e.target.value, page: 1 })
                }
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all-types'} value={opt.value}>
                    {opt.emoji} {opt.label}
                  </option>
                ))}
              </select>

              <select
                className="eventslist-glass-select px-4 py-3"
                defaultValue={audience}
                onChange={(e) =>
                  updateParams({ audience: e.target.value, page: 1 })
                }
              >
                {AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all-audience'} value={opt.value}>
                    {opt.emoji} {opt.label}
                  </option>
                ))}
              </select>

              <input
                type="date"
                className="eventslist-glass-input px-4 py-3"
                defaultValue={from}
                onBlur={(e) =>
                  updateParams({ from: e.target.value, page: 1 })
                }
              />

              <select
                className="eventslist-glass-select px-4 py-3"
                defaultValue={status}
                onChange={(e) =>
                  updateParams({ status: e.target.value, page: 1 })
                }
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all-status'} value={opt.value}>
                    {opt.emoji} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">
                Ditemukan: <span className="text-blue-400 font-semibold">{total}</span> event
              </div>
              <button
                onClick={() => updateParams({ q: '', type: '', audience: '', from: '', status: '', page: 1 })}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                🔄 Reset Filter
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="eventslist-loading"></div>
              <span className="ml-4 text-white text-lg">Memuat event...</span>
            </div>
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 eventslist-events-grid">
              {items.map((event) => {
                const isRegistrationClosed =
                  event.is_cancelled ||
                  (event.registration_deadline &&
                    new Date(event.registration_deadline) < now) ||
                  (event.max_attendees && event.registered_count >= event.max_attendees);

                const isEventOver = new Date(event.end_time) < now;
                const isClosed = isRegistrationClosed || isEventOver;
                const eventTypeColor = getEventTypeColor(event.event_type);
                const isUrgentEvent = isUrgent(event);

                return (
                  <Link
                    key={event.event_id}
                    to={`/events/${event.event_id}`}
                    className="block eventslist-event-card dark p-6 rounded-2xl transition-all duration-300"
                  >
                    {/* Header dengan status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`eventslist-badge ${eventTypeColor}`}>
                            {EVENT_TYPE_OPTIONS.find(opt => opt.value === event.event_type)?.emoji} 
                            {EVENT_TYPE_OPTIONS.find(opt => opt.value === event.event_type)?.label}
                          </span>
                          {isUrgentEvent && (
                            <span className="eventslist-urgent-badge text-xs px-2 py-1 rounded-full">
                              🔥 Mendesak
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center ${isClosed ? 'text-red-400' : 'text-green-400'}`}>
                        <span className={`eventslist-status-indicator ${isClosed ? 'closed' : 'open'}`}></span>
                        <span className="text-sm font-semibold">
                          {isClosed ? 'Ditutup' : 'Dibuka'}
                        </span>
                      </div>
                    </div>

                    {/* Location dan Audience */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                        📍
                      </div>
                      <div>
                        <div className="font-semibold text-white">{event.location}</div>
                        <div className="text-sm text-gray-400">
                          Untuk: {AUDIENCE_OPTIONS.find(opt => opt.value === event.audience)?.label || 'Semua'}
                        </div>
                      </div>
                    </div>

                    {/* Time Information */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span>🕐</span>
                        <span>Mulai: {new Date(event.start_time).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span>🕒</span>
                        <span>Selesai: {new Date(event.end_time).toLocaleString('id-ID')}</span>
                      </div>
                      {event.registration_deadline && (
                        <div className={`flex items-center gap-2 text-sm ${isUrgentEvent ? 'text-red-400' : 'text-gray-300'}`}>
                          <span>⏰</span>
                          <span>Deadline: {new Date(event.registration_deadline).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>

                    {/* Attendee Count */}
                    <div className="pt-4 border-t border-gray-700">
                      <div className="flex justify-between items-center">
                        <div className="eventslist-attendee-badge">
                          {capBadge(event.registered_count, event.max_attendees)}
                        </div>
                        {event.is_cancelled && (
                          <span className="eventslist-badge red text-xs">
                            ❌ Dibatalkan
                          </span>
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
                className="eventslist-pagination-btn px-4 py-2 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <span>←</span>
                <span>Sebelumnya</span>
              </button>
              
              <div className="text-white flex items-center gap-2">
                <span className="eventslist-badge blue">
                  Halaman {page} dari {totalPages}
                </span>
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: page + 1 })}
                className="eventslist-pagination-btn px-4 py-2 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
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