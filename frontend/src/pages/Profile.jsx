// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI, connectionAPI } from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // 🔢 Stats koneksi user login
  const [stats, setStats] = useState({
    totalConnections: 0,
  });

  // Pilihan fakultas (samakan dengan Register.jsx)
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

  // helper: parse string "python, ai, java" -> ["python","ai","java"]
  const parseCommaSeparated = (str) => {
    if (!str) return [];
    return str
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  useEffect(() => {
    const init = async () => {
      await fetchProfile();
      await fetchConnectionStatsFromLists();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const raw = response.data.user || {};

      // Normalisasi array di profile (bukan di form) biar tampilan rapi
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

      // 🟡 formData pakai string mentah untuk textarea,
      // supaya user bisa ngetik koma & spasi bebas.
      setFormData({
        ...normalized,
        interestsText: normalized.interests.join(', '),
        skillsText: normalized.skills.join(', '),
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // 👉 Ambil angka koneksi dari endpoint list koneksi
  const fetchConnectionStatsFromLists = async () => {
    try {
      const connectionsRes = await connectionAPI.getMyConnections();
      const connections =
        connectionsRes.data?.connections || connectionsRes.data || [];

      setStats({
        totalConnections: Array.isArray(connections)
          ? connections.length
          : 0,
      });
    } catch (error) {
      console.error('Error fetching connection stats:', error);
      setStats({
        totalConnections: 0,
      });
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    // balikin lagi ke data profile + rebuild string textarea
    if (profile) {
      setFormData({
        ...profile,
        interestsText: Array.isArray(profile.interests)
          ? profile.interests.join(', ')
          : '',
        skillsText: Array.isArray(profile.skills)
          ? profile.skills.join(', ')
          : '',
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

      // 🔑 Konversi string textarea menjadi array untuk dikirim ke backend
      if (payload.interestsText !== undefined) {
        payload.interests = parseCommaSeparated(payload.interestsText);
        delete payload.interestsText;
      }
      if (payload.skillsText !== undefined) {
        payload.skills = parseCommaSeparated(payload.skillsText);
        delete payload.skillsText;
      }

      // IPK: kalau kosong → null
      if (payload.ipk !== undefined) {
        if (payload.ipk === '' || payload.ipk === null) {
          payload.ipk = null;
        } else {
          const n = Number(payload.ipk);
          payload.ipk = Number.isNaN(n) ? null : n;
        }
      }

      // years_of_experience alumni: kosong -> null
      if (payload.years_of_experience !== undefined) {
        if (
          payload.years_of_experience === '' ||
          payload.years_of_experience === null
        ) {
          payload.years_of_experience = null;
        } else {
          const y = Number(payload.years_of_experience);
          payload.years_of_experience = Number.isNaN(y) ? null : y;
        }
      }

      await userAPI.updateProfile(payload);
      await fetchProfile();
      setEditing(false);
      alert('Profil berhasil diperbarui!');
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
      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Profile Header */}
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Profil Saya
                </h2>
                <p className="text-gray-600">Kelola informasi profil Anda</p>
              </div>
              {!editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Profil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
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
              {/* Basic + Role Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informasi Dasar */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Informasi Dasar
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Lengkap
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900">{profile?.email}</p>
                      <p className="text-xs text-gray-500">
                        Email tidak dapat diubah
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {profile?.role}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fakultas
                      </label>
                      {editing ? (
                        <select
                          name="fakultas"
                          value={formData.fakultas || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Pilih Fakultas</option>
                          {fakultasOptions.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-900">
                          {profile?.fakultas || 'Belum diisi'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Angkatan
                      </label>
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
                        <p className="text-gray-900">
                          {profile?.angkatan || 'Belum diisi'}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
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
                        <p className="text-gray-900">
                          {profile?.bio || 'Belum diisi'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Specific Info - STUDENT */}
                {profile?.role === 'student' && (
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Informasi Akademik
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          NIM
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            name="nim"
                            value={formData.nim || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">
                            {profile?.nim || 'Belum diisi'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Semester
                        </label>
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
                          <p className="text-gray-900">
                            {profile?.current_semester || 'Belum diisi'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IPK
                        </label>
                        {editing ? (
                          <input
                            type="number"
                            name="ipk"
                            value={
                              formData.ipk === null ||
                              formData.ipk === undefined
                                ? ''
                                : formData.ipk
                            }
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            max="4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Kosongkan jika belum ada IPK"
                          />
                        ) : (
                          <p className="text-gray-900">
                            {profile?.ipk === null ||
                            profile?.ipk === undefined
                              ? '-'
                              : profile.ipk}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minat/Keterampilan
                        </label>
                        {editing ? (
                          <div>
                            <textarea
                              name="interestsText"
                              value={formData.interestsText || ''}
                              onChange={handleChange}
                              rows="3"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="python, java, ai, machine learning"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Pisahkan dengan koma. Contoh: python, java, ai
                            </p>
                          </div>
                        ) : (
                          <div>
                            {profile?.interests &&
                            profile.interests.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {profile.interests.map((interest, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">
                                Belum diisi
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          LinkedIn
                        </label>
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
                          <p className="text-gray-900">
                            {profile?.linkedin_url || 'Belum diisi'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Portfolio
                        </label>
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
                          <p className="text-gray-900">
                            {profile?.portfolio_link || 'Belum diisi'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Role Specific Info - ALUMNI */}
                {profile?.role === 'alumni' && (
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Informasi Profesional
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pekerjaan Saat Ini
                        </label>
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
                          <p className="text-gray-900">
                            {profile?.current_job || 'Belum diisi'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Perusahaan
                        </label>
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
                          <p className="text-gray-900">
                            {profile?.company || 'Belum diisi'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Industri
                        </label>
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
                          <p className="text-gray-900">
                            {profile?.industry || 'Belum diisi'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lokasi
                        </label>
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
                          <p className="text-gray-900">
                            {profile?.location || 'Belum diisi'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pengalaman (tahun)
                        </label>
                        {editing ? (
                          <input
                            type="number"
                            name="years_of_experience"
                            value={
                              formData.years_of_experience === null ||
                              formData.years_of_experience === undefined
                                ? ''
                                : formData.years_of_experience
                            }
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="0"
                            max="50"
                            placeholder="Kosongkan jika belum diisi"
                          />
                        ) : (
                          <p className="text-gray-900">
                            {profile?.years_of_experience === null ||
                            profile?.years_of_experience === undefined
                              ? 'Belum diisi'
                              : profile.years_of_experience}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Skills
                        </label>
                        {editing ? (
                          <div>
                            <textarea
                              name="skillsText"
                              value={formData.skillsText || ''}
                              onChange={handleChange}
                              rows="3"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="python, machine learning, tensorflow, aws"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Pisahkan dengan koma. Contoh: python, machine learning, tensorflow
                            </p>
                          </div>
                        ) : (
                          <div>
                            {profile?.skills && profile.skills.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                  >
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          LinkedIn
                        </label>
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
                          <p className="text-gray-900">
                            {profile?.linkedin_url || 'Belum diisi'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CV Link
                        </label>
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
                          <p className="text-gray-900">
                            {profile?.cv_link || 'Belum diisi'}
                          </p>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Info Akun
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Bergabung sejak</p>
                      <p className="text-gray-900">
                        {profile?.createdAt
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
                      <p className="text-sm text-gray-600">Status</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Aktif
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-orange-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Statistik
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Koneksi</span>
                      <span className="font-medium">
                        {stats.totalConnections}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Event diikuti
                      </span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Postingan</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* End Sidebar */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
