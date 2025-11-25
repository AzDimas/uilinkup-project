// src/pages/MyEvents.jsx
import React, { useEffect, useState } from 'react';
import { eventsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import './MyEvents.css';

const EVENT_TYPE_CONFIG = {
  webinar: { label: 'Webinar', emoji: '', color: 'blue' },
  career_talk: { label: 'Career Talk', emoji: '', color: 'green' },
  networking: { label: 'Networking', emoji: '', color: 'purple' },
  workshop: { label: 'Workshop', emoji: '', color: 'orange' },
  seminar: { label: 'Seminar', emoji: '', color: 'yellow' },
};

export default function MyEvents() {
  const [hosting, setHosting] = useState([]);
  const [registered, setRegistered] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [h, r] = await Promise.all([eventsAPI.myHosting(), eventsAPI.myRegistered()]);
      setHosting(h?.data?.items || []);
      setRegistered(r?.data?.items || []);
    } catch (e) {
      console.error('MyEvents error:', e?.response?.data || e.message);
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
          className="myevents-particle"
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

  const EmptyHostingState = () => (
    <div className="myevents-empty-state">
      <div className="text-6xl mb-4 opacity-60">🎤</div>
      <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Event yang Di-host</h3>
      <p className="text-gray-400 mb-6">
        Mulai bagikan pengetahuan dan pengalaman Anda dengan membuat event pertama
      </p>
      <Link
        to="/events/new"
        className="myevents-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-block"
      >
        🎉 Buat Event Pertama
      </Link>
    </div>
  );

  const EmptyRegisteredState = () => (
    <div className="myevents-empty-state">
      <div className="text-6xl mb-4 opacity-60">🎟️</div>
      <h3 className="text-xl font-semibold text-white mb-2">Belum Terdaftar di Event</h3>
      <p className="text-gray-400 mb-6">
        Jelajahi event menarik dan daftar untuk bergabung dengan komunitas
      </p>
      <Link
        to="/events"
        className="myevents-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-block"
      >
        🔍 Jelajahi Event
      </Link>
    </div>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (event.is_cancelled) {
      return { status: 'cancelled', label: 'Dibatalkan', emoji: '' };
    }
    if (now < startTime) {
      return { status: 'upcoming', label: 'Akan Datang', emoji: '' };
    }
    if (now >= startTime && now <= endTime) {
      return { status: 'ongoing', label: 'Berlangsung', emoji: '' };
    }
    return { status: 'completed', label: 'Selesai', emoji: '' };
  };

  const isUrgent = (event) => {
    const startTime = new Date(event.start_time);
    const now = new Date();
    const hoursLeft = (startTime - now) / (1000 * 60 * 60);
    return hoursLeft <= 24 && hoursLeft > 0;
  };

  return (
    <div className="myevents-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-yellow-500 rounded-full opacity-20 myevents-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-blue-500 rounded-full opacity-20 myevents-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-22 h-22 bg-blue-400 rounded-full opacity-20 myevents-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3 myevents-gradient-text-blue-yellow">
              📅 Event Saya
            </h1>
            <p className="text-gray-300 text-lg">
              Kelola event yang Anda host dan pantau event yang Anda ikuti
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="myevents-stats-card">
              <div className="text-3xl font-bold text-white mb-2">{hosting.length}</div>
              <div className="text-gray-400 text-sm">Event Di-host</div>
            </div>
            <div className="myevents-stats-card">
              <div className="text-3xl font-bold text-blue-400 mb-2">{registered.length}</div>
              <div className="text-gray-400 text-sm">Event Diikuti</div>
            </div>
            <div className="myevents-stats-card">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {hosting.filter(event => getEventStatus(event).status === 'upcoming').length}
              </div>
              <div className="text-gray-400 text-sm">Event Mendatang</div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="myevents-loading"></div>
              <span className="ml-4 text-white text-lg">Memuat event Anda...</span>
            </div>
          ) : (
            <>
              {/* Hosting Section */}
              <div className="myevents-section-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                    <span></span>
                    Event yang Saya Host
                    <span className="myevents-badge blue">{hosting.length}</span>
                  </h2>
                  <Link
                    to="/events/new"
                    className="myevents-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <span>➕</span>
                    <span>Buat Event</span>
                  </Link>
                </div>

                {hosting.length === 0 ? (
                  <EmptyHostingState />
                ) : (
                  <div className="space-y-4">
                    {hosting.map(event => {
                      const eventTypeConfig = EVENT_TYPE_CONFIG[event.event_type] || { label: event.event_type, emoji: '🎭', color: 'blue' };
                      const status = getEventStatus(event);
                      const urgent = isUrgent(event);
                      
                      return (
                        <div key={event.event_id} className="myevents-event-card dark p-6 rounded-2xl">
                          <div className="flex flex-col lg:flex-row gap-6 myevents-event-content">
                            {/* Event Info */}
                            <div className="flex-1 myevents-event-info">
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-semibold text-white mb-2">
                                    {event.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-gray-300 mb-3">
                                    <div className="flex items-center gap-2">
                                      <span></span>
                                      <span>{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span>{eventTypeConfig.emoji}</span>
                                      <span>{eventTypeConfig.label}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 mt-2 lg:mt-0">
                                  <span className={`myevents-badge ${status.status === 'cancelled' ? 'red' : status.status === 'upcoming' ? 'green' : status.status === 'ongoing' ? 'blue' : 'yellow'}`}>
                                    <span className={`myevents-status-indicator ${status.status}`}></span>
                                    <span className="ml-1">{status.emoji} {status.label}</span>
                                  </span>
                                  {urgent && status.status === 'upcoming' && (
                                    <span className="myevents-badge red">
                                       Segera
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Event Details */}
                              <div className="space-y-2 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                  <span></span>
                                  <span>{formatDate(event.start_time)}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <span></span>
                                    <span>
                                      {event.registered_count}
                                      {event.max_attendees ? ` / ${event.max_attendees}` : ''} peserta
                                    </span>
                                  </div>
                                  {event.is_cancelled && (
                                    <span className="text-red-400 text-sm">• Event dibatalkan</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 myevents-actions">
                              <Link 
                                to={`/events/${event.event_id}`}
                                className="myevents-action-btn green px-4 py-3 flex items-center gap-2"
                              >
                                <span></span>
                                <span>Lihat</span>
                              </Link>
                              <Link 
                                to={`/events/${event.event_id}/registrants`}
                                className="myevents-action-btn blue px-4 py-3 flex items-center gap-2"
                              >
                                <span></span>
                                <span>Peserta</span>
                                {event.registered_count > 0 && (
                                  <span className="myevents-registrant-badge">
                                    {event.registered_count}
                                  </span>
                                )}
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Registered Section */}
              <div className="myevents-section-card">
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                  <span></span>
                  Event yang Saya Ikuti
                  <span className="myevents-badge blue">{registered.length}</span>
                </h2>

                {registered.length === 0 ? (
                  <EmptyRegisteredState />
                ) : (
                  <div className="space-y-4">
                    {registered.map(event => {
                      const eventTypeConfig = EVENT_TYPE_CONFIG[event.event_type] || { label: event.event_type, emoji: '🎭', color: 'blue' };
                      const status = getEventStatus(event);
                      const urgent = isUrgent(event);
                      
                      return (
                        <div key={event.event_id} className="myevents-event-card dark p-6 rounded-2xl">
                          <div className="flex flex-col lg:flex-row gap-6 myevents-event-content">
                            {/* Event Info */}
                            <div className="flex-1 myevents-event-info">
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-semibold text-white mb-2">
                                    {event.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-gray-300 mb-3">
                                    <div className="flex items-center gap-2">
                                      <span></span>
                                      <span>{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span>{eventTypeConfig.emoji}</span>
                                      <span>{eventTypeConfig.label}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 mt-2 lg:mt-0">
                                  <span className={`myevents-badge ${status.status === 'cancelled' ? 'red' : status.status === 'upcoming' ? 'green' : status.status === 'ongoing' ? 'blue' : 'yellow'}`}>
                                    <span className={`myevents-status-indicator ${status.status}`}></span>
                                    <span className="ml-1">{status.emoji} {status.label}</span>
                                  </span>
                                  {urgent && status.status === 'upcoming' && (
                                    <span className="myevents-badge red">
                                       Segera
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Event Details */}
                              <div className="space-y-2 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                  <span></span>
                                  <span>{formatDate(event.start_time)}</span>
                                </div>
                                {event.meeting_link && status.status !== 'completed' && status.status !== 'cancelled' && (
                                  <div className="flex items-center gap-2">
                                    <span></span>
                                    <span className="text-blue-400">Tersedia link meeting</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action */}
                            <div className="flex items-center">
                              <Link 
                                to={`/events/${event.event_id}`}
                                className="myevents-action-btn green px-6 py-3 flex items-center gap-2"
                              >
                                <span></span>
                                <span>Lihat Detail</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}