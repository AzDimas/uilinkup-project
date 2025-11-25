import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { userAPI, connectionAPI, eventsAPI } from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const [stats, setStats] = useState({
    totalConnections: 0,
    eventsJoined: 0,
    totalPosts: 0,
  });

  const fakultasOptions = [
    'Ilmu Komputer',
    'Ekonomi',
    'Hukum',
    'Kedokteran',
    'Teknik',
    'Psikologi',
    'Ilmu Sosial & Ilmu Politik',
    'Kesehatan Masyarakat',
    'Farmasi',
    'Matematika & Ilmu Pengetahuan Alam',
    'Ilmu Pengetahuan Budaya',
    'Ilmu Keperawatan',
  ];

  const parseCommaSeparated = (str) => {
    if (!str) return [];
    return str
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const fetchStats = async (userId) => {
    try {
      const [connectionsRes, eventsRes, postsRes] = await Promise.all([
        connectionAPI.getMyConnections().catch(() => ({ data: [] })),
        eventsAPI.myRegistered().catch(() => ({ data: [] })),
        api.get('/groups/posts/feed', {
          params: {
            scope: 'my',
            page: 1,
            pageSize: 100,
          },
        }).catch(() => ({ data: { items: [] } })),
      ]);

      const connections = connectionsRes.data?.connections || connectionsRes.data || [];
      const registeredEvents = eventsRes.data?.items || eventsRes.data?.events || [];
      const posts = postsRes.data?.items || [];
      const myPosts = posts.filter((p) => {
        const authorId = p.author_id || p.authorId;
        return authorId === userId;
      });

      setStats({
        totalConnections: Array.isArray(connections) ? connections.length : 0,
        eventsJoined: Array.isArray(registeredEvents) ? registeredEvents.length : 0,
        totalPosts: myPosts.length,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({
        totalConnections: 0,
        eventsJoined: 0,
        totalPosts: 0,
      });
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const raw = response.data.user || {};

      const normalized = {
        ...raw,
        interests: Array.isArray(raw.interests)
          ? raw.interests
          : raw.interests
          ? parseCommaSeparated(raw.interests)
          : [],
        skills: Array.isArray(raw.skills)
          ? raw.skills
          : raw.skills
          ? parseCommaSeparated(raw.skills)
          : [],
      };

      setProfile(normalized);
      setFormData({
        ...normalized,
        interestsText: normalized.interests.join(', '),
        skillsText: normalized.skills.join(', '),
      });

      if (normalized.id) {
        await fetchStats(normalized.id);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        ...profile,
        interestsText: Array.isArray(profile.interests) ? profile.interests.join(', ') : '',
        skillsText: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
      });
    }
    setEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...formData };

      if (payload.interestsText !== undefined) {
        payload.interests = parseCommaSeparated(payload.interestsText);
        delete payload.interestsText;
      }
      if (payload.skillsText !== undefined) {
        payload.skills = parseCommaSeparated(payload.skillsText);
        delete payload.skillsText;
      }

      if (payload.ipk !== undefined) {
        payload.ipk = payload.ipk === '' || payload.ipk === null ? null : Number(payload.ipk);
      }
      if (payload.years_of_experience !== undefined) {
        payload.years_of_experience = payload.years_of_experience === '' || payload.years_of_experience === null ? null : Number(payload.years_of_experience);
      }

      await userAPI.updateProfile(payload);
      await fetchProfile();
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal mengupdate profil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="profile-container min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="profile-loading-pulse w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section - TIDAK ada efek karena hanya display */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold profile-gradient-text-blue-yellow mb-4">
            Profil Saya
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Kelola informasi profil dan statistik Anda di platform UILinkUp
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 profile-grid-container">
          
          {/* Sidebar Section */}
          <div className="lg:col-span-1 space-y-6 profile-sidebar">
            
            {/* User Profile Card - TIDAK ada efek karena hanya display */}
            <div className="profile-glass-card dark">
              <div className="text-center p-6">
                <div className="profile-avatar-glow mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center text-black font-bold text-2xl relative z-10">
                    {(profile?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{profile?.name}</h2>
                <div className="profile-badge blue mb-4">
                  {profile?.role?.toUpperCase()}
                </div>
                <p className="text-gray-400 text-sm">{profile?.email}</p>
              </div>
            </div>

            {/* Stats Card - TIDAK ada efek karena hanya display */}
            <div className="profile-stats-card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                Statistik Platform
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-400">Koneksi</span>
                  <span className="text-blue-400 font-bold text-xl">{stats.totalConnections}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-400">Event Diikuti</span>
                  <span className="text-green-400 font-bold text-xl">{stats.eventsJoined}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-400">Postingan</span>
                  <span className="text-purple-400 font-bold text-xl">{stats.totalPosts}</span>
                </div>
              </div>
            </div>

            {/* Account Info Card - TIDAK ada efek karena hanya display */}
            <div className="profile-stats-card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Info Akun
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Bergabung sejak</p>
                  <p className="text-white font-medium">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Baru bergabung'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <div className="profile-badge green mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Aktif
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - ADA efek karena bisa diklik */}
            <div className="profile-stats-card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Aksi Profil
              </h3>
              <div className="space-y-3">
                {!editing ? (
                  <>
                    <button
                      onClick={handleEdit}
                      className="w-full profile-gradient-btn yellow py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profil
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full profile-gradient-btn red py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full profile-gradient-btn green py-3 px-4 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Simpan Perubahan
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="w-full profile-secondary-btn py-3 px-4 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Batalkan
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Section */}
          <div className="lg:col-span-3 space-y-6 profile-main-content">
            
            {/* Basic Information Section - TIDAK ada efek karena hanya display */}
            <div className="profile-section-card blue">
              <div className="profile-section-header">
                <div className="profile-section-dot blue"></div>
                <h3 className="text-2xl font-bold text-white">Informasi Dasar</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <span>👤</span>
                    Nama Lengkap
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
                      placeholder="Masukkan nama lengkap"
                    />
                  ) : (
                    <p className="text-white text-lg font-medium">{profile?.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <span>📧</span>
                    Email
                  </label>
                  <p className="text-white text-lg font-medium">{profile?.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                </div>

                {/* Fakultas */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <span>🏛️</span>
                    Fakultas
                  </label>
                  {editing ? (
                    <select
                      name="fakultas"
                      value={formData.fakultas || ''}
                      onChange={handleChange}
                      className="profile-select"
                    >
                      <option value="">Pilih Fakultas</option>
                      {fakultasOptions.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-white text-lg font-medium">
                      {profile?.fakultas || 'Belum diisi'}
                    </p>
                  )}
                </div>

                {/* Angkatan */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <span>📅</span>
                    Angkatan
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      name="angkatan"
                      value={formData.angkatan || ''}
                      onChange={handleChange}
                      className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
                      placeholder="Tahun angkatan"
                      min="1950"
                      max={new Date().getFullYear()}
                    />
                  ) : (
                    <p className="text-white text-lg font-medium">
                      {profile?.angkatan || 'Belum diisi'}
                    </p>
                  )}
                </div>

                {/* Bio */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <span>📝</span>
                    Bio
                  </label>
                  {editing ? (
                    <textarea
                      name="bio"
                      value={formData.bio || ''}
                      onChange={handleChange}
                      rows="3"
                      className="profile-glass-input dark w-full px-4 py-3 rounded-xl resize-none"
                      placeholder="Ceritakan tentang diri Anda..."
                    />
                  ) : (
                    <p className="text-white leading-relaxed">
                      {profile?.bio || 'Belum diisi'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Role Specific Sections */}
            {profile?.role === 'student' && (
              <StudentProfileSection 
                profile={profile} 
                formData={formData} 
                editing={editing} 
                handleChange={handleChange} 
              />
            )}

            {profile?.role === 'alumni' && (
              <AlumniProfileSection 
                profile={profile} 
                formData={formData} 
                editing={editing} 
                handleChange={handleChange} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Student Profile Section Component - Input fields ADA efek
const StudentProfileSection = ({ profile, formData, editing, handleChange }) => (
  <div className="profile-section-card green">
    <div className="profile-section-header">
      <div className="profile-section-dot green"></div>
      <h3 className="text-2xl font-bold text-white">Informasi Akademik</h3>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* NIM */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>🆔</span>
          NIM
        </label>
        {editing ? (
          <input
            type="text"
            name="nim"
            value={formData.nim || ''}
            onChange={handleChange}
            className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
            placeholder="Masukkan NIM"
          />
        ) : (
          <p className="text-white text-lg font-medium">
            {profile?.nim || 'Belum diisi'}
          </p>
        )}
      </div>

      {/* Semester */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>📚</span>
          Semester
        </label>
        {editing ? (
          <input
            type="number"
            name="current_semester"
            value={formData.current_semester || ''}
            onChange={handleChange}
            className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
            min="1"
            max="14"
          />
        ) : (
          <p className="text-white text-lg font-medium">
            {profile?.current_semester || 'Belum diisi'}
          </p>
        )}
      </div>

      {/* IPK */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>📊</span>
          IPK
        </label>
        {editing ? (
          <input
            type="number"
            name="ipk"
            value={formData.ipk === null || formData.ipk === undefined ? '' : formData.ipk}
            onChange={handleChange}
            step="0.01"
            min="0"
            max="4"
            className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
            placeholder="Kosongkan jika belum ada IPK"
          />
        ) : (
          <p className="text-white text-lg font-medium">
            {profile?.ipk === null || profile?.ipk === undefined ? '-' : profile.ipk}
          </p>
        )}
      </div>

      {/* Interests */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>🎯</span>
          Minat/Keterampilan
        </label>
        {editing ? (
          <div>
            <textarea
              name="interestsText"
              value={formData.interestsText || ''}
              onChange={handleChange}
              rows="3"
              className="profile-glass-input dark w-full px-4 py-3 rounded-xl resize-none"
              placeholder="python, java, ai, machine learning"
            />
            <p className="text-xs text-gray-500 mt-2">
              Pisahkan dengan koma. Contoh: python, java, ai
            </p>
          </div>
        ) : (
          <div>
            {profile?.interests && profile.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span key={index} className="profile-tag blue">
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">Belum diisi</p>
            )}
          </div>
        )}
      </div>

      {/* LinkedIn & Portfolio */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>💼</span>
          LinkedIn
        </label>
        {editing ? (
          <input
            type="url"
            name="linkedin_url"
            value={formData.linkedin_url || ''}
            onChange={handleChange}
            className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
            placeholder="https://linkedin.com/in/username"
          />
        ) : (
          <p className="text-white text-lg font-medium">
            {profile?.linkedin_url || 'Belum diisi'}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>🌐</span>
          Portfolio
        </label>
        {editing ? (
          <input
            type="url"
            name="portfolio_link"
            value={formData.portfolio_link || ''}
            onChange={handleChange}
            className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
            placeholder="https://portfolio.com"
          />
        ) : (
          <p className="text-white text-lg font-medium">
            {profile?.portfolio_link || 'Belum diisi'}
          </p>
        )}
      </div>
    </div>
  </div>
);

// Alumni Profile Section Component - Input fields ADA efek
const AlumniProfileSection = ({ profile, formData, editing, handleChange }) => (
  <div className="profile-section-card purple">
    <div className="profile-section-header">
      <div className="profile-section-dot purple"></div>
      <h3 className="text-2xl font-bold text-white">Informasi Profesional</h3>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Current Job */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>💼</span>
          Pekerjaan Saat Ini
        </label>
        {editing ? (
          <input
            type="text"
            name="current_job"
            value={formData.current_job || ''}
            onChange={handleChange}
            className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
            placeholder="Job title"
          />
        ) : (
          <p className="text-white text-lg font-medium">
            {profile?.current_job || 'Belum diisi'}
          </p>
        )}
      </div>

      {/* Company */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>🏢</span>
          Perusahaan
        </label>
        {editing ? (
          <input
            type="text"
            name="company"
            value={formData.company || ''}
            onChange={handleChange}
            className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
            placeholder="Nama perusahaan"
          />
        ) : (
          <p className="text-white text-lg font-medium">
            {profile?.company || 'Belum diisi'}
          </p>
        )}
      </div>

      {/* Industry */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>🏭</span>
          Industri
        </label>
        {editing ? (
          <input
            type="text"
            name="industry"
            value={formData.industry || ''}
            onChange={handleChange}
            className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
            placeholder="Technology, Finance, dll"
          />
        ) : (
          <p className="text-white text-lg font-medium">
            {profile?.industry || 'Belum diisi'}
          </p>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>📍</span>
          Lokasi
        </label>
        {editing ? (
          <input
            type="text"
            name="location"
            value={formData.location || ''}
            onChange={handleChange}
            className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
            placeholder="Jakarta, Indonesia"
          />
        ) : (
          <p className="text-white text-lg font-medium">
            {profile?.location || 'Belum diisi'}
          </p>
        )}
      </div>

      {/* Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>⏳</span>
          Pengalaman (tahun)
        </label>
        {editing ? (
          <input
            type="number"
            name="years_of_experience"
            value={formData.years_of_experience === null || formData.years_of_experience === undefined ? '' : formData.years_of_experience}
            onChange={handleChange}
            className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
            min="0"
            max="50"
            placeholder="Kosongkan jika belum diisi"
          />
        ) : (
          <p className="text-white text-lg font-medium">
            {profile?.years_of_experience === null || profile?.years_of_experience === undefined
              ? 'Belum diisi'
              : profile.years_of_experience}
          </p>
        )}
      </div>

      {/* Skills */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>🛠️</span>
          Skills
        </label>
        {editing ? (
          <div>
            <textarea
              name="skillsText"
              value={formData.skillsText || ''}
              onChange={handleChange}
              rows="3"
              className="profile-glass-input dark w-full px-4 py-3 rounded-xl resize-none"
              placeholder="python, machine learning, tensorflow, aws"
            />
            <p className="text-xs text-gray-500 mt-2">
              Pisahkan dengan koma. Contoh: python, machine learning, tensorflow
            </p>
          </div>
        ) : (
          <div>
            {profile?.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span key={index} className="profile-tag green">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">Belum diisi</p>
            )}
          </div>
        )}
      </div>

      {/* LinkedIn & CV */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>💼</span>
          LinkedIn
        </label>
        {editing ? (
          <input
            type="url"
            name="linkedin_url"
            value={formData.linkedin_url || ''}
            onChange={handleChange}
            className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
            placeholder="https://linkedin.com/in/username"
          />
        ) : (
          <p className="text-white text-lg font-medium">
            {profile?.linkedin_url || 'Belum diisi'}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <span>📄</span>
          CV Link
        </label>
        {editing ? (
          <input
            type="url"
            name="cv_link"
            value={formData.cv_link || ''}
            onChange={handleChange}
            className="profile-glass-input dark w-full px-4 py-3 rounded-xl"
            placeholder="https://drive.google.com/..."
          />
        ) : (
          <p className="text-white text-lg font-medium">
            {profile?.cv_link || 'Belum diisi'}
          </p>
        )}
      </div>
    </div>
  </div>
);

export default Profile;