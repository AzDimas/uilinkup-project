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
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">UILinkUp</h1>
              <nav className="flex space-x-4">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
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
                  className="text-gray-600 hover:text-gray-800"
                >
                  Connections
                </button>
                <button  
                  onClick={() => navigate('/messages')} 
                  className="text-gray-600 hover:text-gray-800" 
                > 
                  Messages 
                </button> 
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Halo, {user?.name}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user?.role}
              </span>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* User Info Card */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3">Info Profil</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <p><strong>Role:</strong> {user?.role}</p>
                <p><strong>Fakultas:</strong> {user?.fakultas || 'Belum diisi'}</p>
                <p><strong>Angkatan:</strong> {user?.angkatan || 'Belum diisi'}</p>
              </div>
              <button 
                onClick={() => navigate('/profile')}
                className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Edit Profil
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h3 className="font-medium text-green-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
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
                <button 
                  onClick={() => navigate('/events')}
                  className="w-full bg-green-400 text-white py-2 px-4 rounded text-sm hover:bg-green-500 transition-colors"
                >
                  Events
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <h3 className="font-medium text-purple-900 mb-3">Status Akun</h3>
              <div className="space-y-2 text-sm text-purple-700">
                <p>✅ Email terverifikasi</p>
                <p>✅ Akun aktif</p>
                <p>📧 {user?.email}</p>
              </div>
              <div className="mt-4 p-2 bg-purple-100 rounded text-xs text-purple-800">
                Bergabung sejak {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })
                    : 'Baru bergabung'
                }
            </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-2">
              Selamat datang di UILinkUp! 🎉
            </h3>
            <p className="opacity-90">
              Platform untuk menghubungkan mahasiswa dan alumni Universitas Indonesia. 
              {user?.role === 'alumni' && ' Anda dapat berbagi pengalaman dan menjadi mentor bagi mahasiswa.'}
              {user?.role === 'student' && ' Temukan mentor dan peluang karir dari alumni UI.'}
              {user?.role === 'admin' && ' Kelola platform dan pantau aktivitas users.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;