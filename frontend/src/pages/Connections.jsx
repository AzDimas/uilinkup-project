import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { connectionAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Connections.css';

const Connections = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('connections');
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'connections') {
        const res = await connectionAPI.getMyConnections();
        setConnections(res.data?.connections || res.data || []);
      } else if (activeTab === 'requests') {
        const res = await connectionAPI.getPendingRequests();
        setPendingRequests(res.data?.pendingRequests || res.data || []);
      } else if (activeTab === 'sent') {
        const res = await connectionAPI.getSentRequests();
        setSentRequests(res.data?.sentRequests || res.data || []);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (connectionId) => {
    try {
      await connectionAPI.acceptConnection(connectionId);
      await loadData();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert(error.response?.data?.error || 'Gagal menerima koneksi');
    }
  };

  const handleRejectRequest = async (connectionId) => {
    try {
      await connectionAPI.rejectConnection(connectionId);
      await loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(error.response?.data?.error || 'Gagal menolak koneksi');
    }
  };

  const handleCancelRequest = async (connectionId) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan permintaan koneksi?')) return;
    try {
      await connectionAPI.removeConnection(connectionId);
      await loadData();
    } catch (error) {
      console.error('Error canceling request:', error);
      alert(error.response?.data?.error || 'Gagal membatalkan permintaan koneksi');
    }
  };

  const handleRemoveConnection = async (connectionId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus koneksi ini?')) return;
    try {
      await connectionAPI.removeConnection(connectionId);
      await loadData();
    } catch (error) {
      console.error('Error removing connection:', error);
      alert(error.response?.data?.error || 'Gagal menghapus koneksi');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'alumni': return 'connections-badge purple';
      case 'student': return 'connections-badge green';
      case 'admin': return 'connections-badge red';
      default: return 'connections-badge';
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'alumni': return 'Alumni';
      case 'student': return 'Mahasiswa';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  const EmptyState = ({ icon, title, subtitle, cta, onCta }) => (
    <div className="connections-empty-state">
      <div className="text-6xl mb-4 opacity-60">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6">{subtitle}</p>
      {cta && (
        <button
          onClick={onCta}
          className="connections-gradient-btn yellow px-6 py-3 rounded-xl font-semibold"
        >
          {cta}
        </button>
      )}
    </div>
  );

  return (
    <div className="connections-container">
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header - TIDAK ada efek karena hanya display */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 connections-gradient-text-blue-yellow">
              Jaringan Koneksi
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Kelola koneksi profesional Anda dengan alumni dan mahasiswa UI
            </p>
          </div>

          {/* Main Content */}
          <div className="connections-glass-card dark p-6">
            {/* Tabs - ADA efek karena bisa diklik */}
            <div className="border-b border-gray-700 mb-6">
              <div className="flex flex-wrap gap-4 connections-tab-container">
                <button
                  onClick={() => setActiveTab('connections')}
                  className={`connections-tab-button flex items-center gap-2 ${
                    activeTab === 'connections' ? 'active' : ''
                  }`}
                >
                  <span>Koneksi Saya</span>
                  {connections.length > 0 && (
                    <span className="connections-badge blue">
                      {connections.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('requests')}
                  className={`connections-tab-button flex items-center gap-2 ${
                    activeTab === 'requests' ? 'active' : ''
                  }`}
                >
                  <span>Permintaan Masuk</span>
                  {pendingRequests.length > 0 && (
                    <span className="connections-badge yellow">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('sent')}
                  className={`connections-tab-button flex items-center gap-2 ${
                    activeTab === 'sent' ? 'active' : ''
                  }`}
                >
                  <span>Permintaan Dikirim</span>
                  {sentRequests.length > 0 && (
                    <span className="connections-badge">
                      {sentRequests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="connections-loading"></div>
                </div>
              ) : activeTab === 'connections' ? (
                // TAB: Accepted connections
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Koneksi Saya <span className="text-blue-400">({connections.length})</span>
                    </h2>
                    <button
                      onClick={() => navigate('/users')}
                      className="connections-gradient-btn px-6 py-3 rounded-xl font-semibold text-sm"
                    >
                      Cari User Lain
                    </button>
                  </div>

                  {connections.length === 0 ? (
                    <EmptyState
                      icon="👥"
                      title="Belum ada koneksi"
                      subtitle="Mulai terhubung dengan user lain untuk membangun jaringan profesional Anda."
                      cta="Jelajahi User"
                      onCta={() => navigate('/users')}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 connections-grid">
                      {connections.map((c) => (
                        <div 
                          key={c.connection_id} 
                          className="connections-user-card p-6 rounded-2xl"
                          onClick={() => navigate(`/profile/${c.user_id}`)}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="relative">
                              <div className="connections-avatar">
                                {(c.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="connections-status-indicator online"></div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-lg mb-1">{c.name}</h3>
                              <div className={getRoleBadgeColor(c.role)}>
                                {getRoleDisplay(c.role)}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-gray-300 mb-6">
                            {c.fakultas && (
                              <div className="flex items-center gap-2">
                                <span>🎓</span>
                                <span>{c.fakultas}</span>
                              </div>
                            )}
                            {c.angkatan && (
                              <div className="flex items-center gap-2">
                                <span>📅</span>
                                <span>Angkatan {c.angkatan}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 connections-action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/profile/${c.user_id}`)}
                              className="flex-1 connections-gradient-btn blue px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Profil
                            </button>
                            
                            <button
                              onClick={() => navigate(`/messages?userId=${c.user_id}`)}
                              className="connections-gradient-btn yellow px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                              title="Kirim pesan"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                            </button>
                            
                            <button
                              onClick={() => handleRemoveConnection(c.connection_id)}
                              className="connections-gradient-btn red px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === 'requests' ? (
                // TAB: Incoming pending requests
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Permintaan Koneksi <span className="text-yellow-400">({pendingRequests.length})</span>
                  </h2>

                  {pendingRequests.length === 0 ? (
                    <EmptyState
                      icon="⏳"
                      title="Tidak ada permintaan koneksi"
                      subtitle="Permintaan koneksi yang masuk akan muncul di sini."
                    />
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map((req) => (
                        <div key={req.connection_id} className="connections-user-card p-6 rounded-2xl border-l-4 border-yellow-500">
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex items-center gap-4 cursor-pointer"
                              onClick={() => navigate(`/profile/${req.user_id}`)}
                            >
                              <div className="connections-avatar">
                                {(req.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-semibold text-white text-lg">{req.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className={getRoleBadgeColor(req.role)}>
                                    {getRoleDisplay(req.role)}
                                  </div>
                                  {req.fakultas && (
                                    <span className="text-sm text-gray-400">{req.fakultas}</span>
                                  )}
                                </div>
                                <p className="text-sm text-yellow-400 mt-1">Mengirim permintaan koneksi</p>
                              </div>
                            </div>

                            <div className="flex gap-2 connections-action-buttons">
                              <button
                                onClick={() => handleAcceptRequest(req.connection_id)}
                                className="connections-gradient-btn green px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                              title="Terima koneksi"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              
                              <button
                                onClick={() => handleRejectRequest(req.connection_id)}
                                className="connections-gradient-btn red px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                                title="Tolak koneksi"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              
                              <button
                                onClick={() => navigate(`/profile/${req.user_id}`)}
                                className="connections-gradient-btn blue px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                                title="Lihat profil"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              
                              <button
                                onClick={() => navigate(`/messages?userId=${req.user_id}`)}
                                className="connections-gradient-btn yellow px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                                title="Kirim pesan"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // TAB: Outgoing (sent) pending requests
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Permintaan Dikirim <span className="text-blue-400">({sentRequests.length})</span>
                  </h2>

                  {sentRequests.length === 0 ? (
                    <EmptyState
                      icon="📤"
                      title="Belum ada permintaan terkirim"
                      subtitle="Permintaan koneksi yang Anda kirim akan muncul di sini."
                      cta="Cari User"
                      onCta={() => navigate('/users')}
                    />
                  ) : (
                    <div className="space-y-4">
                      {sentRequests.map((req) => (
                        <div key={req.connection_id} className="connections-user-card p-6 rounded-2xl border-l-4 border-blue-500">
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex items-center gap-4 cursor-pointer"
                              onClick={() => navigate(`/profile/${req.user_id}`)}
                            >
                              <div className="connections-avatar">
                                {(req.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-semibold text-white text-lg">{req.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className={getRoleBadgeColor(req.role)}>
                                    {getRoleDisplay(req.role)}
                                  </div>
                                  {req.fakultas && (
                                    <span className="text-sm text-gray-400">{req.fakultas}</span>
                                  )}
                                </div>
                                <p className="text-sm text-blue-400 mt-1">Menunggu konfirmasi</p>
                              </div>
                            </div>

                            <div className="flex gap-2 connections-action-buttons">
                              <button
                                onClick={() => handleCancelRequest(req.connection_id)}
                                className="connections-gradient-btn red px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                                title="Batalkan permintaan"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              
                              <button
                                onClick={() => navigate(`/profile/${req.user_id}`)}
                                className="connections-gradient-btn blue px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                                title="Lihat profil"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              
                              <button
                                onClick={() => navigate(`/messages?userId=${req.user_id}`)}
                                className="connections-gradient-btn yellow px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                                title="Kirim pesan"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Connections;