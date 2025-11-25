// src/pages/EventRegistrants.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import './EventRegistrants.css';

export default function EventRegistrants() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registrants, setRegistrants] = useState([]);
  const [filteredRegistrants, setFilteredRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadEventData = async () => {
    setLoading(true);
    try {
      // pakai API lama yang sudah terbukti jalan
      const [eventResponse, registrantsResponse] = await Promise.all([
        eventsAPI.detail(eventId),       // GET /events/:id
        eventsAPI.registrants(eventId),  // GET /events/:id/registrants
      ]);

      const eventData = eventResponse?.data?.event || null;
      const registrantsData = registrantsResponse?.data?.items || [];

      setEvent(eventData);
      setRegistrants(registrantsData);
      setFilteredRegistrants(registrantsData);
    } catch (error) {
      console.error('Error loading event registrants:', error);
      alert(
        error?.response?.data?.error ||
        'Gagal memuat data peserta event'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  // Re-filter ketika search / status berubah
  useEffect(() => {
    let filtered = [...registrants];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((r) => {
        const name = (r.user_name || r.name || '').toLowerCase();
        const email = (r.user_email || r.email || '').toLowerCase();
        const regId = (r.registration_id ?? r.user_id ?? '')
          .toString()
          .toLowerCase();

        return (
          name.includes(term) ||
          email.includes(term) ||
          regId.includes(term)
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => {
        const attended = !!r.attended;
        const cancelled = !!r.is_cancelled;

        if (statusFilter === 'attended') return attended;
        if (statusFilter === 'cancelled') return cancelled;
        if (statusFilter === 'registered') return !attended && !cancelled;
        return true;
      });
    }

    setFilteredRegistrants(filtered);
  }, [searchTerm, statusFilter, registrants]);

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (r) => {
    const attended = !!r.attended;
    const cancelled = !!r.is_cancelled;

    if (cancelled) return { status: 'cancelled', label: 'Dibatalkan', emoji: '❌' };
    if (attended) return { status: 'attended', label: 'Hadir', emoji: '✅' };
    return { status: 'registered', label: 'Terdaftar', emoji: '📝' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // export CSV TANPA ID & NO TELEPON
  const exportToCSV = () => {
    const headers = ['Nama', 'Email', 'Status', 'Tanggal Daftar', 'Catatan'];
    const csvData = filteredRegistrants.map((r) => {
      const status = getStatusBadge(r);
      const name = r.user_name || r.name || '-';
      const email = r.user_email || r.email || '-';

      return [
        name,
        email,
        status.label,
        formatDate(r.registered_at),
        r.notes || '-',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((field) => `"${field}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `peserta-${event?.title || 'event'}-${new Date()
      .toISOString()
      .split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      particles.push(
        <div
          key={i}
          className="event-registrants-particle"
          style={{
            width: `${Math.random() * 10 + 4}px`,
            height: `${Math.random() * 10 + 4}px`,
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

  const stats = {
    total: registrants.length,
    attended: registrants.filter((r) => r.attended).length,
    cancelled: registrants.filter((r) => r.is_cancelled).length,
    registered: registrants.filter((r) => !r.attended && !r.is_cancelled).length,
  };

  const handleOpenProfile = (userId) => {
    if (!userId) return;
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="event-registrants-container">
        {renderParticles()}
        <div className="min-h-screen flex items-center justify-center">
          <div className="event-registrants-loading"></div>
          <span className="ml-4 text-white text-lg">Memuat data peserta...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="event-registrants-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-yellow-500 rounded-full opacity-20 event-registrants-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-blue-500 rounded-full opacity-20 event-registrants-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-22 h-22 bg-blue-400 rounded-full opacity-20 event-registrants-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="event-registrants-action-btn blue mb-4 px-4 py-2 flex items-center gap-2"
              >
                <span>←</span>
                <span>Kembali</span>
              </button>
              <h1 className="text-4xl font-bold text-white mb-2 event-registrants-gradient-text-blue-yellow">
                👥 Daftar Peserta
              </h1>
              {event && (
                <div className="text-gray-300">
                  <p className="text-xl font-semibold">{event.title}</p>
                  <p className="text-sm opacity-80">
                    {formatDate(event.start_time)} • {event.location}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="event-registrants-export-btn px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2"
                disabled={filteredRegistrants.length === 0}
              >
                <span>📊</span>
                <span>Export CSV</span>
              </button>
              <Link
                to={`/events/${eventId}`}
                className="event-registrants-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <span>👀</span>
                <span>Lihat Event</span>
              </Link>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="event-registrants-stats-card">
              <div className="text-3xl font-bold text-white mb-2">{stats.total}</div>
              <div className="text-gray-400 text-sm">Total Pendaftar</div>
            </div>
            <div className="event-registrants-stats-card">
              <div className="text-3xl font-bold text-green-400 mb-2">{stats.registered}</div>
              <div className="text-gray-400 text-sm">Terdaftar</div>
            </div>
            <div className="event-registrants-stats-card">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.attended}</div>
              <div className="text-gray-400 text-sm">Hadir</div>
            </div>
            <div className="event-registrants-stats-card">
              <div className="text-3xl font-bold text-red-400 mb-2">{stats.cancelled}</div>
              <div className="text-gray-400 text-sm">Dibatalkan</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="event-registrants-section-card mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Cari peserta berdasarkan nama, email, atau ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="event-registrants-search w-full px-4 py-3 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex gap-3 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="event-registrants-search px-4 py-3 rounded-xl focus:outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="registered">Terdaftar</option>
                  <option value="attended">Hadir</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>

                <div className="event-registrants-badge blue">
                  {filteredRegistrants.length} Peserta
                </div>
              </div>
            </div>
          </div>

          {/* Registrants Table */}
          <div className="event-registrants-section-card">
            {filteredRegistrants.length === 0 ? (
              <div className="event-registrants-empty-state">
                <div className="text-6xl mb-4 opacity-60">👥</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {registrants.length === 0 ? 'Belum Ada Peserta' : 'Peserta Tidak Ditemukan'}
                </h3>
                <p className="text-gray-400 mb-6">
                  {registrants.length === 0
                    ? 'Belum ada yang mendaftar untuk event ini. Bagikan link pendaftaran untuk mendapatkan peserta.'
                    : 'Coba ubah kata kunci pencarian atau filter status.'}
                </p>
                {registrants.length === 0 && (
                  <button className="event-registrants-action-btn blue px-6 py-3 rounded-xl font-semibold">
                    📤 Bagikan Event
                  </button>
                )}
              </div>
            ) : (
              <div className="event-registrants-table rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="event-registrants-table-header p-4 grid grid-cols-12 gap-4 text-gray-400 text-sm font-semibold">
                  <div className="col-span-4">Peserta</div>
                  <div className="col-span-3">Kontak</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Tanggal Daftar</div>
                  <div className="col-span-1">Aksi</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-700">
                  {filteredRegistrants.map((r, index) => {
                    const status = getStatusBadge(r);
                    const name = r.user_name || r.name || 'Tidak Diketahui';
                    const email = r.user_email || r.email || '-';
                    const key = r.registration_id || `${r.event_id}-${r.user_id}` || index;

                    return (
                      <div
                        key={key}
                        className="event-registrants-table-row p-4 grid grid-cols-12 gap-4 items-center text-white cursor-pointer"
                        onClick={() => handleOpenProfile(r.user_id)}
                      >
                        {/* Peserta */}
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="event-registrants-avatar">
                            {getInitials(name)}
                          </div>
                          <div>
                            <div className="font-semibold">{name}</div>
                            {/* ID sengaja DIHAPUS dari tampilan */}
                          </div>
                        </div>

                        {/* Kontak */}
                        <div className="col-span-3">
                          <div className="text-sm">{email}</div>
                          {/* No telepon sengaja DIHAPUS dari tampilan */}
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <span
                            className={`event-registrants-badge ${
                              status.status === 'attended'
                                ? 'green'
                                : status.status === 'cancelled'
                                ? 'red'
                                : 'blue'
                            }`}
                          >
                            <span
                              className={`event-registrants-status-indicator ${status.status}`}
                            ></span>
                            <span className="ml-1">
                              {status.emoji} {status.label}
                            </span>
                          </span>
                        </div>

                        {/* Tanggal daftar */}
                        <div className="col-span-2 text-sm text-gray-300">
                          {formatDate(r.registered_at)}
                        </div>

                        {/* Aksi */}
                        <div className="col-span-1">
                          <button
                            className="event-registrants-action-btn blue px-3 py-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProfile(r.user_id);
                            }}
                          >
                            Lihat Profil
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Info Event */}
          {event && (
            <div className="event-registrants-section-card">
              <h3 className="text-lg font-semibold text-white mb-4">
                📋 Informasi Event
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
                <div>
                  <h4 className="font-semibold text-white mb-2">Detail Event</h4>
                  <p>
                    <strong>Judul:</strong> {event.title}
                  </p>
                  <p>
                    <strong>Lokasi:</strong> {event.location}
                  </p>
                  <p>
                    <strong>Waktu Mulai:</strong> {formatDate(event.start_time)}
                  </p>
                  <p>
                    <strong>Waktu Selesai:</strong> {formatDate(event.end_time)}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Kapasitas</h4>
                  <p>
                    <strong>Pendaftar:</strong> {stats.total} orang
                  </p>
                  <p>
                    <strong>Maksimal:</strong>{' '}
                    {event.max_attendees
                      ? `${event.max_attendees} orang`
                      : 'Tidak terbatas'}
                  </p>
                  <p>
                    <strong>Tersisa:</strong>{' '}
                    {event.max_attendees
                      ? `${event.max_attendees - stats.total} slot`
                      : 'Tidak terbatas'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
