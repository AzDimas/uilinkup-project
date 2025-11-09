// src/pages/Users.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'alumni': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header dengan Search & Filter */}
          <div className="px-6 py-4 border-b">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Daftar Pengguna</h2>
                <p className="text-gray-600">Temukan dan terhubung dengan sesama mahasiswa dan alumni UI</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari nama, email, atau fakultas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Semua Role</option>
                    <option value="student">Mahasiswa</option>
                    <option value="alumni">Alumni</option>
                  </select>

                  <select
                    value={fakultasFilter}
                    onChange={(e) => setFakultasFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

          {/* Users List */}
          <div className="p-6">
            {/* Stats */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Menampilkan <span className="font-semibold">{filteredUsers.length}</span> dari <span className="font-semibold">{users.length}</span> pengguna
                <span className="text-xs text-gray-500 ml-2">(Admin & akun Anda tidak ditampilkan)</span>
              </p>
            </div>

            {/* Users Grid */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada pengguna ditemukan</h3>
                <p className="mt-1 text-sm text-gray-500">Coba ubah pencarian atau filter Anda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((uItem) => {
                  const id = uItem.id ?? uItem.user_id;
                  return (
                    <div key={id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{uItem.name}</h3>
                          <p className="text-sm text-gray-500">{uItem.email}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(uItem.role)}`}>
                          {getRoleDisplay(uItem.role)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>{uItem.fakultas || 'Fakultas belum diisi'}</span>
                        </div>

                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Angkatan {uItem.angkatan || 'Tidak diketahui'}</span>
                        </div>

                        {uItem.role === 'alumni' && uItem.current_job && (
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span>{uItem.current_job}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => navigate(`/profile/${id}`)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Lihat Profil
                        </button>
                        {/* Tombol Message: buka chat langsung */}
                        <button
                          onClick={() => navigate(`/messages?userId=${id}`)}
                          className="bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-300 transition-colors"
                          title="Kirim pesan"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Users;
