import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">UILinkUp</h1>
              <p className="text-sm text-gray-600">Platform Jaringan Alumni UI</p>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Info Card */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">Info Profil</h3>
              <p className="text-sm text-blue-700">
                <strong>Role:</strong> {user?.role}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Fakultas:</strong> {user?.fakultas || 'Belum diisi'}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Angkatan:</strong> {user?.angkatan || 'Belum diisi'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h3 className="font-medium text-green-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Kelola Profil
                </button>
                <button 
                  onClick={() => navigate('/users')}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded text-sm hover:bg-green-600 transition-colors"
                >
                  Lihat Users
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <h3 className="font-medium text-purple-900 mb-2">Status</h3>
              <p className="text-sm text-purple-700">
                Anda berhasil login sebagai {user?.role}
              </p>
              <p className="text-xs text-purple-600 mt-2">
                Email: {user?.email}
              </p>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Selamat datang di UILinkUp! 🎉
            </h3>
            <p className="text-gray-600">
              Platform untuk menghubungkan mahasiswa dan alumni Universitas Indonesia. 
              {user?.role === 'alumni' && ' Anda dapat berbagi pengalaman dan menjadi mentor.'}
              {user?.role === 'student' && ' Temukan mentor dan peluang karir dari alumni.'}
              {user?.role === 'admin' && ' Kelola platform dan pantau aktivitas users.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;