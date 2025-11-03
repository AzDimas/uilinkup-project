// components/ConnectionButton.jsx
import React, { useState, useEffect } from 'react';
import { connectionAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ConnectionButton = ({ targetUserId, onStatusChange }) => {
  const { user } = useAuth();
  const [connectionData, setConnectionData] = useState({
    status: 'not_connected',
    requestDirection: null, // 'outgoing' | 'incoming'
    connectionId: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  const checkConnectionStatus = async () => {
    try {
      console.log('🟡 [FRONTEND] Checking connection status for:', targetUserId);
      console.log('🟡 [FRONTEND] Current user ID:', user?.id);

      const response = await connectionAPI.checkConnectionStatus(targetUserId);
      console.log('🟢 [FRONTEND] Connection status response:', response.data);

      setConnectionData({
        status: response.data.status,
        requestDirection: response.data.requestDirection,
        connectionId: response.data.connectionId || null
      });
    } catch (error) {
      console.error('🔴 [FRONTEND] Error checking connection status:', error);
      console.error('🔴 [FRONTEND] Error details:', error.response?.data);
    }
  };

  const handleSendRequest = async () => {
    if (loading) return;

    setLoading(true);
    try {
      console.log('🟡 [FRONTEND] Sending connection to:', targetUserId);
      const response = await connectionAPI.sendConnectionRequest(targetUserId);
      console.log('🟢 [FRONTEND] Connection response:', response.data);

      setConnectionData({
        status: 'pending',
        requestDirection: 'outgoing',
        connectionId: response.data.connectionId
      });

      if (onStatusChange) onStatusChange('pending', 'outgoing');
    } catch (error) {
      console.error('🔴 [FRONTEND] Error sending connection request:', error);
      console.error('🔴 [FRONTEND] Error response:', error.response?.data);
      alert(error.response?.data?.error || 'Gagal mengirim permintaan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await connectionAPI.acceptConnection(connectionData.connectionId);
      setConnectionData(prev => ({
        ...prev,
        status: 'accepted',
        requestDirection: null
      }));
      if (onStatusChange) onStatusChange('accepted', null);
    } catch (error) {
      console.error('Error accepting connection:', error);
      alert(error.response?.data?.error || 'Gagal menerima koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await connectionAPI.rejectConnection(connectionData.connectionId);
      setConnectionData({
        status: 'not_connected',
        requestDirection: null,
        connectionId: null
      });
      if (onStatusChange) onStatusChange('not_connected', null);
    } catch (error) {
      console.error('Error rejecting connection:', error);
      alert(error.response?.data?.error || 'Gagal menolak koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (loading) return;
    if (!confirm('Apakah Anda yakin ingin membatalkan permintaan koneksi?')) return;

    setLoading(true);
    try {
      await connectionAPI.removeConnection(connectionData.connectionId);
      setConnectionData({
        status: 'not_connected',
        requestDirection: null,
        connectionId: null
      });
      if (onStatusChange) onStatusChange('not_connected', null);
    } catch (error) {
      console.error('Error canceling connection request:', error);
      alert(error.response?.data?.error || 'Gagal membatalkan permintaan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConnection = async () => {
    if (loading) return;
    if (!confirm('Apakah Anda yakin ingin menghapus koneksi ini?')) return;

    setLoading(true);
    try {
      await connectionAPI.removeConnection(connectionData.connectionId);
      setConnectionData({
        status: 'not_connected',
        requestDirection: null,
        connectionId: null
      });
      if (onStatusChange) onStatusChange('not_connected', null);
    } catch (error) {
      console.error('Error removing connection:', error);
      alert(error.response?.data?.error || 'Gagal menghapus koneksi');
    } finally {
      setLoading(false);
    }
  };

  // Jangan tampilkan button untuk diri sendiri
  if (user?.id == targetUserId) {
    return null;
  }

  const { status, requestDirection } = connectionData;

  return (
    <div className="flex flex-col space-y-2">
      {/* Not Connected */}
      {status === 'not_connected' && (
        <button
          onClick={handleSendRequest}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="h-5 w-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mengirim...
            </>
          ) : (
            <>
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Connect
            </>
          )}
        </button>
      )}

      {/* Pending */}
      {status === 'pending' && (
        <div className="flex flex-col space-y-3">
          {requestDirection === 'outgoing' ? (
            <div className="flex flex-col space-y-2">
              <button
                disabled
                className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold opacity-75 cursor-not-allowed flex items-center justify-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Request Sent
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={loading}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm"
              >
                {loading ? 'Membatalkan...' : 'Cancel Request'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <div className="text-center mb-2">
                <span className="text-sm text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                  Incoming Request
                </span>
              </div>
              <button
                onClick={handleAcceptRequest}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? 'Menerima...' : 'Accept Request'}
              </button>
              <button
                onClick={handleRejectRequest}
                disabled={loading}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}

      {/* Accepted */}
      {status === 'accepted' && (
        <div className="flex flex-col space-y-3">
          <button
            disabled
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold opacity-75 cursor-not-allowed flex items-center justify-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Connected
          </button>
          <button
            onClick={handleRemoveConnection}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm"
          >
            {loading ? 'Menghapus...' : 'Remove Connection'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionButton;
