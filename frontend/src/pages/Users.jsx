import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import './Users.css';

const Users = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [fakultasFilter, setFakultasFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAllUsers();
      // Hide admin + hide current user from list
      const currentId = user?.id ?? user?.userId ?? user?.user_id;
      const nonAdminUsers = (response.data?.users || [])
        .filter(u => u.role !== 'admin')
        .filter(u => String(u.id ?? u.user_id) !== String(currentId));
      setUsers(nonAdminUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'alumni': return 'users-badge purple';
      case 'student': return 'users-badge green';
      default: return 'users-badge blue';
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'alumni': return 'Alumni';
      case 'student': return 'Mahasiswa';
      default: return role;
    }
  };

  // daftar fakultas unik untuk filter
  const fakultasOptions = useMemo(() => {
    return [...new Set(users.map(u => u.fakultas).filter(Boolean))];
  }, [users]);

  // filter berdasar search & dropdown
  const filteredUsers = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return users.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const fakultas = (u.fakultas || '').toLowerCase();

      const matchesSearch =
        name.includes(term) || email.includes(term) || fakultas.includes(term);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesFakultas = fakultasFilter === 'all' || u.fakultas === fakultasFilter;

      return matchesSearch && matchesRole && matchesFakultas;
    });
  }, [users, searchTerm, roleFilter, fakultasFilter]);

  if (loading) {
    return (
      <div className="users-container min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="users-loading-pulse w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Memuat daftar pengguna...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section - TIDAK ada efek karena hanya display */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold users-gradient-text-blue-yellow mb-4">
            Daftar Pengguna
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Temukan dan terhubung dengan sesama mahasiswa dan alumni UI
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Search and Filters Card */}
          <div className="users-glass-card dark mb-8">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                {/* Search Input - ADA efek karena input */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    🔍 Cari Pengguna
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari nama, email, atau fakultas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="users-glass-input dark w-full px-4 py-3 rounded-xl"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Role Filter - ADA efek karena select */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    🎓 Filter Role
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="users-select"
                  >
                    <option value="all">Semua Role</option>
                    <option value="student">Mahasiswa</option>
                    <option value="alumni">Alumni</option>
                  </select>
                </div>

                {/* Fakultas Filter - ADA efek karena select */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    🏛️ Filter Fakultas
                  </label>
                  <select
                    value={fakultasFilter}
                    onChange={(e) => setFakultasFilter(e.target.value)}
                    className="users-select"
                  >
                    <option value="all">Semua Fakultas</option>
                    {fakultasOptions.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Card - TIDAK ada efek karena hanya display */}
          <div className="users-stats-card mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  📊 Statistik Pengguna
                </h3>
                <p className="text-gray-400 text-sm">
                  Menampilkan <span className="text-yellow-400 font-bold">{filteredUsers.length}</span> dari{' '}
                  <span className="text-blue-400 font-bold">{users.length}</span> pengguna
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-gray-400">Mahasiswa: {users.filter(u => u.role === 'student').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-400">Alumni: {users.filter(u => u.role === 'alumni').length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Users Grid */}
          {filteredUsers.length === 0 ? (
            <div className="users-glass-card dark text-center py-16">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-white mb-2">Tidak ada pengguna ditemukan</h3>
              <p className="text-gray-400 mb-6">Coba ubah pencarian atau filter Anda</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setFakultasFilter('all');
                }}
                className="users-gradient-btn yellow px-6 py-3 rounded-xl font-semibold"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map((uItem) => {
                const id = uItem.id ?? uItem.user_id;
                return (
                  <div 
                    key={id} 
                    className="users-user-card"
                    onClick={() => navigate(`/profile/${id}`)}
                  >
                    {/* User Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center text-black font-bold text-lg">
                          {uItem.name ? uItem.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {uItem.name}
                          </h3>
                          <p className="text-sm text-gray-400 truncate max-w-[120px]">
                            {uItem.email}
                          </p>
                        </div>
                      </div>
                      <div className={getRoleBadgeColor(uItem.role)}>
                        {getRoleDisplay(uItem.role)}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>🏛️</span>
                        <span className="text-white">{uItem.fakultas || 'Fakultas belum diisi'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>📅</span>
                        <span className="text-white">Angkatan {uItem.angkatan || 'Tidak diketahui'}</span>
                      </div>

                      {uItem.role === 'alumni' && uItem.current_job && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>💼</span>
                          <span className="text-white">{uItem.current_job}</span>
                        </div>
                      )}

                      {uItem.bio && (
                        <div className="text-sm text-gray-400 line-clamp-2 bg-gray-700/30 rounded-lg p-2">
                          "{uItem.bio}"
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - ADA efek karena bisa diklik */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/profile/${id}`)}
                        className="flex-1 users-gradient-btn blue py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Lihat Profil
                      </button>
                      
                      <button
                        onClick={() => navigate(`/messages?userId=${id}`)}
                        className="users-gradient-btn yellow py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                        title="Kirim pesan"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Section (for future pagination) */}
          {filteredUsers.length > 0 && (
            <div className="text-center mt-8">
              <div className="users-stats-card inline-block">
                <p className="text-gray-400 text-sm">
                  🎉 Menampilkan semua {filteredUsers.length} pengguna yang sesuai
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;