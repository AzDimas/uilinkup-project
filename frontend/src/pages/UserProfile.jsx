import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { userAPI, connectionAPI } from '../services/api';
import ConnectionButton from '../components/ConnectionButton';
import './UserProfile.css';

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();

  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('not_connected');

  // 🔢 Stats: koneksi, event, dan postingan
  const [stats, setStats] = useState({
    totalConnections: 0,
    eventsJoined: 0,
    totalPosts: 0,
  });

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await userAPI.getUserById(userId);
      const userData = response.data?.user || response.data;

      if (userData) {
        setProfile(userData);
        await fetchUserStats(userData.id || userId);
      } else {
        throw new Error('No user data');
      }
    } catch (error) {
      console.error('Error:', error);
      // fallback ke getAllUsers kalau getUserById gagal
      try {
        const response = await userAPI.getAllUsers();
        const allUsers = response.data?.users || response.data || [];
        const foundUser = allUsers.find(
          (u) => u.id == userId || u._id == userId
        );

        if (foundUser) {
          setProfile(foundUser);
          await fetchUserStats(foundUser.id || userId);
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

  const fetchUserStats = async (targetUserId) => {
    try {
      const res = await connectionAPI.getStatsByUserId(targetUserId);
      const apiStats = res.data?.stats || res.data || {};

      // 🎯 Mapping fleksibel: sesuaikan dengan kemungkinan nama field dari backend
      const totalConnections =
        apiStats.total_connections ??
        apiStats.totalConnections ??
        apiStats.connections ??
        0;

      const eventsJoined =
        apiStats.events_joined ??
        apiStats.eventsJoined ??
        apiStats.total_events_joined ??
        apiStats.events ??
        0;

      const totalPosts =
        apiStats.total_posts ??
        apiStats.totalPosts ??
        apiStats.posts_count ??
        apiStats.posts ??
        0;

      setStats({
        totalConnections: Number(totalConnections || 0),
        eventsJoined: Number(eventsJoined || 0),
        totalPosts: Number(totalPosts || 0),
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleMessage = () => {
    if (!profile.id) return;
    navigate(`/messages?userId=${profile.id}`);
  };

  const handleBackToUsers = () => {
    navigate('/users');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'alumni':
        return 'userprofile-badge purple';
      case 'student':
        return 'userprofile-badge green';
      case 'admin':
        return 'userprofile-badge red';
      default:
        return 'userprofile-badge blue';
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'alumni':
        return 'Alumni';
      case 'student':
        return 'Mahasiswa';
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
  };

  const hasData = (field) => {
    return (
      field !== null &&
      field !== undefined &&
      field !== '' &&
      field !== '-' &&
      !(Array.isArray(field) && field.length === 0)
    );
  };

  if (loading) {
    return (
      <div className="userprofile-container min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="userprofile-loading-pulse w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profile || !profile.id) {
    return (
      <div className="userprofile-container min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            User tidak ditemukan
          </h2>
          <button
            onClick={handleBackToUsers}
            className="userprofile-gradient-btn yellow px-6 py-3 rounded-xl font-semibold"
          >
            Kembali ke Daftar User
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="userprofile-container">
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold userprofile-gradient-text-blue-yellow mb-4">
            Profil Pengguna
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Lihat informasi lengkap dan statistik profil {profile.name}
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 userprofile-grid-container">
          {/* Sidebar Section */}
          <div className="lg:col-span-1 space-y-6 userprofile-sidebar">
            {/* User Profile Card */}
            <div className="userprofile-glass-card dark">
              <div className="text-center p-6">
                <div className="userprofile-avatar-glow mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center text-black font-bold text-2xl relative z-10">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {profile.name}
                </h2>
                <div className={getRoleBadgeColor(profile.role)}>
                  {getRoleDisplay(profile.role)}
                </div>
                <p className="text-gray-400 text-sm mt-3">{profile.email}</p>

                {/* Quick Info */}
                <div className="mt-4 space-y-2">
                  {hasData(profile.fakultas) && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <span>🏛️</span>
                      <span>{profile.fakultas}</span>
                    </div>
                  )}
                  {hasData(profile.angkatan) && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <span>📅</span>
                      <span>Angkatan {profile.angkatan}</span>
                    </div>
                  )}
                  {profile.role === 'alumni' &&
                    hasData(profile.current_job) && (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                        <span>💼</span>
                        <span>{profile.current_job}</span>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="userprofile-stats-card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                Interaksi
              </h3>
              <div className="space-y-3">
                <ConnectionButton
                  targetUserId={profile.id}
                  onStatusChange={(status) => setConnectionStatus(status)}
                />

                <button
                  onClick={handleMessage}
                  className="w-full userprofile-gradient-btn yellow py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  Kirim Pesan
                </button>

                <button
                  onClick={handleBackToUsers}
                  className="w-full userprofile-secondary-btn py-3 px-4 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Kembali ke Users
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="userprofile-stats-card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Statistik Platform
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-400">Koneksi</span>
                  <span className="text-blue-400 font-bold text-xl">
                    {stats.totalConnections}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-400">Event Diikuti</span>
                  <span className="text-green-400 font-bold text-xl">
                    {stats.eventsJoined}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-400">Postingan</span>
                  <span className="text-purple-400 font-bold text-xl">
                    {stats.totalPosts}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Info Card */}
            <div className="userprofile-stats-card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Info Akun
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Bergabung sejak</p>
                  <p className="text-white font-medium">
                    {profile.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(
                          'id-ID',
                          {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }
                        )
                      : 'Baru bergabung'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <div className="userprofile-badge green mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Aktif
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Section */}
          <div className="lg:col-span-3 space-y-6 userprofile-main-content">
            {/* Basic Information Section */}
            <div className="userprofile-section-card blue">
              <div className="userprofile-section-header">
                <div className="userprofile-section-dot blue"></div>
                <h3 className="text-2xl font-bold text-white">
                  Informasi Dasar
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <span>👤</span>
                    Nama Lengkap
                  </label>
                  <p className="text-white text-lg font-medium">
                    {profile.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <span>📧</span>
                    Email
                  </label>
                  <p className="text-white text-lg font-medium">
                    {profile.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <span>🎓</span>
                    Role
                  </label>
                  <div className={getRoleBadgeColor(profile.role)}>
                    {getRoleDisplay(profile.role)}
                  </div>
                </div>

                {hasData(profile.fakultas) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <span>🏛️</span>
                      Fakultas
                    </label>
                    <p className="text-white text-lg font-medium">
                      {profile.fakultas}
                    </p>
                  </div>
                )}

                {hasData(profile.angkatan) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <span>📅</span>
                      Angkatan
                    </label>
                    <p className="text-white text-lg font-medium">
                      {profile.angkatan}
                    </p>
                  </div>
                )}

                {hasData(profile.bio) && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <span>📝</span>
                      Bio
                    </label>
                    <p className="text-white leading-relaxed bg-gray-700/30 rounded-xl p-4">
                      {profile.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Role Specific Sections */}
            {profile.role === 'student' && (
              <StudentProfileSection profile={profile} />
            )}

            {profile.role === 'alumni' && (
              <AlumniProfileSection profile={profile} />
            )}

            {/* Contact Links Section */}
            {(hasData(profile.linkedin_url) ||
              hasData(profile.portfolio_link) ||
              hasData(profile.cv_link)) && (
              <div className="userprofile-section-card green">
                <div className="userprofile-section-header">
                  <div className="userprofile-section-dot green"></div>
                  <h3 className="text-2xl font-bold text-white">
                    Kontak & Links
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {hasData(profile.linkedin_url) && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="userprofile-link-card text-center"
                    >
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </div>
                      <p className="text-white font-medium">LinkedIn</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Professional Profile
                      </p>
                    </a>
                  )}

                  {hasData(profile.portfolio_link) && (
                    <a
                      href={profile.portfolio_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="userprofile-link-card text-center"
                    >
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9"
                          />
                        </svg>
                      </div>
                      <p className="text-white font-medium">Portfolio</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Work Showcase
                      </p>
                    </a>
                  )}

                  {hasData(profile.cv_link) && (
                    <a
                      href={profile.cv_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="userprofile-link-card text-center"
                    >
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-white font-medium">CV/Resume</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Download CV
                      </p>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Student Profile Section Component
const StudentProfileSection = ({ profile }) => {
  const hasData = (field) =>
    field !== null && field !== undefined && field !== '' && field !== '-';

  return (
    <div className="userprofile-section-card green">
      <div className="userprofile-section-header">
        <div className="userprofile-section-dot green"></div>
        <h3 className="text-2xl font-bold text-white">Informasi Akademik</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hasData(profile.nim) && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <span>🆔</span>
              NIM
            </label>
            <p className="text-white text-lg font-medium bg-gray-700/30 rounded-xl p-3">
              {profile.nim}
            </p>
          </div>
        )}

        {hasData(profile.current_semester) && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <span>📚</span>
              Semester
            </label>
            <p className="text-white text-lg font-medium bg-gray-700/30 rounded-xl p-3">
              Semester {profile.current_semester}
            </p>
          </div>
        )}

        {hasData(profile.ipk) && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <span>📊</span>
              IPK
            </label>
            <p className="text-white text-lg font-medium bg-gray-700/30 rounded-xl p-3">
              {profile.ipk}
            </p>
          </div>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <span>🎯</span>
              Minat/Keterampilan
            </label>
            <div className="flex flex-wrap gap-2 bg-gray-700/30 rounded-xl p-4">
              {profile.interests.map((interest, index) => (
                <span key={index} className="userprofile-tag blue">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Alumni Profile Section Component
const AlumniProfileSection = ({ profile }) => {
  const hasData = (field) =>
    field !== null && field !== undefined && field !== '' && field !== '-';

  return (
    <div className="userprofile-section-card purple">
      <div className="userprofile-section-header">
        <div className="userprofile-section-dot purple"></div>
        <h3 className="text-2xl font-bold text-white">Informasi Profesional</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hasData(profile.current_job) && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <span>💼</span>
              Pekerjaan Saat Ini
            </label>
            <p className="text-white text-lg font-medium bg-gray-700/30 rounded-xl p-3">
              {profile.current_job}
            </p>
          </div>
        )}

        {hasData(profile.company) && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <span>🏢</span>
              Perusahaan
            </label>
            <p className="text-white text-lg font-medium bg-gray-700/30 rounded-xl p-3">
              {profile.company}
            </p>
          </div>
        )}

        {hasData(profile.industry) && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <span>🏭</span>
              Industri
            </label>
            <p className="text-white text-lg font-medium bg-gray-700/30 rounded-xl p-3">
              {profile.industry}
            </p>
          </div>
        )}

        {hasData(profile.location) && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <span>📍</span>
              Lokasi
            </label>
            <p className="text-white text-lg font-medium bg-gray-700/30 rounded-xl p-3">
              {profile.location}
            </p>
          </div>
        )}

        {hasData(profile.years_of_experience) && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <span>⏳</span>
              Pengalaman
            </label>
            <p className="text-white text-lg font-medium bg-gray-700/30 rounded-xl p-3">
              {profile.years_of_experience} tahun
            </p>
          </div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <span>🛠️</span>
              Skills
            </label>
            <div className="flex flex-wrap gap-2 bg-gray-700/30 rounded-xl p-4">
              {profile.skills.map((skill, index) => (
                <span key={index} className="userprofile-tag green">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
