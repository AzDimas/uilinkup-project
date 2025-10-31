import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { userAPI } from '../services/api';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('not_connected');

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await userAPI.getUserById(userId);
      const userData = response.data?.user || response.data;
      
      if (userData) {
        setProfile(userData);
      } else {
        throw new Error('No user data');
      }
    } catch (error) {
      console.error('Error:', error);
      try {
        const response = await userAPI.getAllUsers();
        const allUsers = response.data?.users || response.data || [];
        const foundUser = allUsers.find(u => u.id == userId || u._id == userId);
        
        if (foundUser) {
          setProfile(foundUser);
        } else {
          navigate('/users');
        }
      } catch (fallbackError) {
        navigate('/users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleConnect = async () => {
    try {
      setConnectionStatus('pending');
    } catch (error) {
      console.error('Error sending connection request:', error);
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

  // Helper function untuk cek apakah field ada dan tidak kosong
  const hasData = (field) => {
    return field !== null && field !== undefined && field !== '' && field !== '-';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile || !profile.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">User tidak ditemukan</h2>
          <button 
            onClick={() => navigate('/users')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Kembali ke Daftar User
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/users')}
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

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-8 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile.name ? profile.name.charAt(0) : 'U'}
                </div>
                
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-3xl font-bold text-gray-900">{profile.name}</h2>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(profile.role)}`}>
                      {getRoleDisplay(profile.role)}
                    </span>
                  </div>
                  
                  <p className="text-lg text-gray-600 mb-2">{profile.email}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {hasData(profile.fakultas) && (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {profile.fakultas}
                      </div>
                    )}
                    
                    {hasData(profile.angkatan) && (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Angkatan {profile.angkatan}
                      </div>
                    )}

                    {profile.role === 'alumni' && hasData(profile.current_job) && (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {profile.current_job}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                {connectionStatus === 'not_connected' && (
                  <button
                    onClick={handleConnect}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    Connect
                  </button>
                )}

                {connectionStatus === 'pending' && (
                  <button
                    disabled
                    className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold opacity-75 cursor-not-allowed flex items-center justify-center"
                  >
                    <svg className="h-5 w-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Request Sent
                  </button>
                )}

                {connectionStatus === 'connected' && (
                  <button
                    disabled
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold opacity-75 cursor-not-allowed flex items-center justify-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Connected
                  </button>
                )}

                <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Message
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Informasi Dasar - Hanya tampilkan yang ada datanya */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Dasar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                      <p className="text-gray-900">{profile.name}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{profile.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                        {getRoleDisplay(profile.role)}
                      </span>
                    </div>

                    {hasData(profile.fakultas) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fakultas</label>
                        <p className="text-gray-900">{profile.fakultas}</p>
                      </div>
                    )}

                    {hasData(profile.angkatan) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Angkatan</label>
                        <p className="text-gray-900">{profile.angkatan}</p>
                      </div>
                    )}

                    {hasData(profile.bio) && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <p className="text-gray-900 leading-relaxed">{profile.bio}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informasi Profesional untuk Alumni - Hanya tampilkan section jika ada data */}
                {profile.role === 'alumni' && (
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Profesional</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hasData(profile.current_job) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan Saat Ini</label>
                          <p className="text-gray-900">{profile.current_job}</p>
                        </div>
                      )}
                      
                      {hasData(profile.company) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Perusahaan</label>
                          <p className="text-gray-900">{profile.company}</p>
                        </div>
                      )}
                      
                      {hasData(profile.industry) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Industri</label>
                          <p className="text-gray-900">{profile.industry}</p>
                        </div>
                      )}
                      
                      {hasData(profile.location) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                          <p className="text-gray-900">{profile.location}</p>
                        </div>
                      )}
                      
                      {hasData(profile.years_of_experience) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pengalaman</label>
                          <p className="text-gray-900">{profile.years_of_experience} tahun</p>
                        </div>
                      )}
                      
                      {profile.skills && profile.skills.length > 0 && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill, index) => (
                              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Informasi Akademik untuk Student - Hanya tampilkan section jika ada data */}
                {profile.role === 'student' && (
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Akademik</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hasData(profile.nim) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">NIM</label>
                          <p className="text-gray-900">{profile.nim}</p>
                        </div>
                      )}
                      
                      {hasData(profile.current_semester) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                          <p className="text-gray-900">{profile.current_semester}</p>
                        </div>
                      )}
                      
                      {hasData(profile.ipk) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">IPK</label>
                          <p className="text-gray-900">{profile.ipk}</p>
                        </div>
                      )}
                      
                      {profile.interests && profile.interests.length > 0 && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Minat/Keterampilan</label>
                          <div className="flex flex-wrap gap-2">
                            {profile.interests.map((interest, index) => (
                              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Kontak - Hanya tampilkan jika ada data */}
                {(hasData(profile.linkedin_url) || hasData(profile.portfolio_link) || hasData(profile.cv_link)) && (
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontak</h3>
                    <div className="space-y-3">
                      {hasData(profile.linkedin_url) && (
                        <a 
                          href={profile.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          LinkedIn
                        </a>
                      )}
                      
                      {hasData(profile.portfolio_link) && (
                        <a 
                          href={profile.portfolio_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-gray-600 hover:text-gray-800"
                        >
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                          </svg>
                          Portfolio
                        </a>
                      )}
                      
                      {hasData(profile.cv_link) && (
                        <a 
                          href={profile.cv_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-gray-600 hover:text-gray-800"
                        >
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download CV
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Info Bergabung */}
                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Info Bergabung</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Bergabung sejak</p>
                      <p className="text-gray-900">
                        {profile.createdAt 
                          ? new Date(profile.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          : 'Baru bergabung'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Aktif
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-orange-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Koneksi</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Event diikuti</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Postingan</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;