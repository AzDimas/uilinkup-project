import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setProfile(response.data.user);
      setFormData(response.data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditing(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleArrayChange = (fieldName, value) => {
    // Convert string dengan koma menjadi array
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item !== '');
    setFormData({
      ...formData,
      [fieldName]: arrayValue
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userAPI.updateProfile(formData);
      setProfile(formData);
      setEditing(false);
      // Refresh auth context
      window.location.reload();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
                  className="text-gray-600 hover:text-gray-800"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Profile Header */}
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Profil Saya</h2>
                <p className="text-gray-600">Kelola informasi profil Anda</p>
              </div>
              {!editing ? (
                <button
                  onClick={handleEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profil
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informasi Dasar */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Dasar</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                      {editing ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{profile?.email}</p>
                      <p className="text-xs text-gray-500">Email tidak dapat diubah</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {profile?.role}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fakultas</label>
                      {editing ? (
                        <select
                          name="fakultas"
                          value={formData.fakultas || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Pilih Fakultas</option>
                          <option value="Ilmu Komputer">Ilmu Komputer</option>
                          <option value="Teknik Komputer">Teknik Komputer</option>
                          <option value="Teknik Elektro">Teknik Elektro</option>
                          <option value="Ekonomi">Ekonomi</option>
                          <option value="Hukum">Hukum</option>
                          <option value="Kedokteran">Kedokteran</option>
                          <option value="Teknik">Teknik</option>
                          <option value="Psikologi">Psikologi</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{profile?.fakultas || 'Belum diisi'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Angkatan</label>
                      {editing ? (
                        <input
                          type="number"
                          name="angkatan"
                          value={formData.angkatan || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="1950"
                          max={new Date().getFullYear()}
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.angkatan || 'Belum diisi'}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      {editing ? (
                        <textarea
                          name="bio"
                          value={formData.bio || ''}
                          onChange={handleChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ceritakan tentang diri Anda..."
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.bio || 'Belum diisi'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Specific Info - STUDENT */}
                {profile?.role === 'student' && (
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Akademik</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NIM</label>
                        {editing ? (
                          <input
                            type="text"
                            name="nim"
                            value={formData.nim || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.nim || 'Belum diisi'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                        {editing ? (
                          <input
                            type="number"
                            name="current_semester"
                            value={formData.current_semester || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="1"
                            max="14"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.current_semester || 'Belum diisi'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IPK</label>
                        {editing ? (
                          <input
                            type="number"
                            name="ipk"
                            value={formData.ipk || ''}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            max="4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.ipk || 'Belum diisi'}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minat/Keterampilan</label>
                        {editing ? (
                          <textarea
                            value={Array.isArray(formData.interests) ? formData.interests.join(', ') : formData.interests || ''}
                            onChange={(e) => handleArrayChange('interests', e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Python, JavaScript, AI, IoT"
                          />
                        ) : (
                          <div>
                            {profile?.interests && profile.interests.length > 0 ? (
                              <p className="text-gray-900">
                                {Array.isArray(profile.interests) 
                                  ? profile.interests.join(', ')
                                  : profile.interests
                                }
                              </p>
                            ) : (
                              <p className="text-gray-500 italic">Belum diisi</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                        {editing ? (
                          <input
                            type="url"
                            name="linkedin_url"
                            value={formData.linkedin_url || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://linkedin.com/in/username"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.linkedin_url || 'Belum diisi'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
                        {editing ? (
                          <input
                            type="url"
                            name="portfolio_link"
                            value={formData.portfolio_link || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://portfolio.com"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.portfolio_link || 'Belum diisi'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Role Specific Info - ALUMNI */}
                {profile?.role === 'alumni' && (
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Profesional</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan Saat Ini</label>
                        {editing ? (
                          <input
                            type="text"
                            name="current_job"
                            value={formData.current_job || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Job title"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.current_job || 'Belum diisi'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Perusahaan</label>
                        {editing ? (
                          <input
                            type="text"
                            name="company"
                            value={formData.company || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Nama perusahaan"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.company || 'Belum diisi'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Industri</label>
                        {editing ? (
                          <input
                            type="text"
                            name="industry"
                            value={formData.industry || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Technology, Finance, dll"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.industry || 'Belum diisi'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                        {editing ? (
                          <input
                            type="text"
                            name="location"
                            value={formData.location || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Jakarta, Indonesia"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.location || 'Belum diisi'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pengalaman (tahun)</label>
                        {editing ? (
                          <input
                            type="number"
                            name="years_of_experience"
                            value={formData.years_of_experience || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="0"
                            max="50"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.years_of_experience || 'Belum diisi'}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                        {editing ? (
                          <textarea
                            value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills || ''}
                            onChange={(e) => handleArrayChange('skills', e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Python, Machine Learning, TensorFlow, AWS"
                          />
                        ) : (
                          <div>
                            {profile?.skills && profile.skills.length > 0 ? (
                              <p className="text-gray-900">
                                {Array.isArray(profile.skills) 
                                  ? profile.skills.join(', ')
                                  : profile.skills
                                }
                              </p>
                            ) : (
                              <p className="text-gray-500 italic">Belum diisi</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                        {editing ? (
                          <input
                            type="url"
                            name="linkedin_url"
                            value={formData.linkedin_url || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://linkedin.com/in/username"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.linkedin_url || 'Belum diisi'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CV Link</label>
                        {editing ? (
                          <input
                            type="url"
                            name="cv_link"
                            value={formData.cv_link || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://drive.google.com/..."
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.cv_link || 'Belum diisi'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Account Info */}
                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Info Akun</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Bergabung sejak</p>
                      <p className="text-gray-900">
                        {profile?.createdAt 
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

                {/* Quick Stats */}
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

export default Profile;