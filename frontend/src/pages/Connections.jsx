import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { connectionAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Connections = () => {
  const { user,logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('connections');
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]); // TAMBAHKAN
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
        const response = await connectionAPI.getMyConnections();
        setConnections(response.data.connections);
      } else if (activeTab === 'requests') {
        const response = await connectionAPI.getPendingRequests();
        setPendingRequests(response.data.pendingRequests);
      } else if (activeTab === 'sent') {
        const response = await connectionAPI.getSentRequests();
        setSentRequests(response.data.sentRequests);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (connectionId) => {
    try {
      await connectionAPI.acceptConnection(connectionId);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error accepting request:', error);
      alert(error.response?.data?.error || 'Gagal menerima koneksi');
    }
  };

  const handleRejectRequest = async (connectionId) => {
    try {
      await connectionAPI.rejectConnection(connectionId);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(error.response?.data?.error || 'Gagal menolak koneksi');
    }
  };

  const handleCancelRequest = async (connectionId) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan permintaan koneksi?')) return;
    
    try {
      await connectionAPI.removeConnection(connectionId);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error canceling request:', error);
      alert(error.response?.data?.error || 'Gagal membatalkan permintaan koneksi');
    }
  };

  const handleRemoveConnection = async (connectionId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus koneksi ini?')) return;
    
    try {
      await connectionAPI.removeConnection(connectionId);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error removing connection:', error);
      alert(error.response?.data?.error || 'Gagal menghapus koneksi');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'alumni': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Kembali
              </button>
              <h1 className="text-2xl font-bold text-gray-900">UILinkUp</h1>
              <nav className="flex space-x-4">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Profile
                </button>
                <button 
                  onClick={() => navigate('/users')}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Users
                </button>
                <button 
                  onClick={() => navigate('/connections')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Connections
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Halo, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header Tabs */}
          <div className="border-b">
            <div className="px-6">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('connections')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'connections'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Connections
                  {connections.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                      {connections.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'requests'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pending Requests
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('sent')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'sent'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Sent Requests
                  {sentRequests.length > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {sentRequests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : activeTab === 'connections' ? (
              // Tab Connections (tetap sama)
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">My Connections ({connections.length})</h2>
                {connections.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada koneksi</h3>
                    <p className="mt-1 text-sm text-gray-500">Mulai terhubung dengan user lain untuk membangun jaringan.</p>
                    <button
                      onClick={() => navigate('/users')}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Cari User
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {connections.map((connection) => (
                      <div key={connection.connection_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {connection.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{connection.name}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(connection.role)}`}>
                              {getRoleDisplay(connection.role)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          {connection.fakultas && (
                            <p>Fakultas: {connection.fakultas}</p>
                          )}
                          {connection.angkatan && (
                            <p>Angkatan: {connection.angkatan}</p>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/profile/${connection.user_id}`)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => handleRemoveConnection(connection.connection_id)}
                            className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'requests' ? (
              // Tab Pending Requests (incoming)
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Pending Connection Requests ({pendingRequests.length})</h2>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada permintaan koneksi</h3>
                    <p className="mt-1 text-sm text-gray-500">Permintaan koneksi yang masuk akan muncul di sini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.connection_id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {request.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{request.name}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(request.role)}`}>
                                  {getRoleDisplay(request.role)}
                                </span>
                                {request.fakultas && (
                                  <span className="text-xs text-gray-500">{request.fakultas}</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">Mengirim permintaan koneksi</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAcceptRequest(request.connection_id)}
                              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.connection_id)}
                              className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Tab Sent Requests (outgoing)
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Sent Connection Requests ({sentRequests.length})</h2>
                {sentRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada permintaan terkirim</h3>
                    <p className="mt-1 text-sm text-gray-500">Permintaan koneksi yang Anda kirim akan muncul di sini.</p>
                    <button
                      onClick={() => navigate('/users')}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Cari User
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentRequests.map((request) => (
                      <div key={request.connection_id} className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {request.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{request.name}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(request.role)}`}>
                                  {getRoleDisplay(request.role)}
                                </span>
                                {request.fakultas && (
                                  <span className="text-xs text-gray-500">{request.fakultas}</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">Menunggu konfirmasi</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleCancelRequest(request.connection_id)}
                            className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                          >
                            Cancel Request
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Connections;