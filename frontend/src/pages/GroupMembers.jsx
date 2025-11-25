import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './GroupMembers.css';

const getInitials = (name) => {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
};

const getRoleBadgeClass = (role) => {
  const roleMap = {
    owner: 'owner',
    admin: 'admin',
    member: 'member'
  };
  return roleMap[role] || 'member';
};

const getRoleEmoji = (role) => {
  const roleMap = {
    owner: '👑',
    admin: '⚡',
    member: '👤'
  };
  return roleMap[role] || '👤';
};

export default function GroupMembers() {
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gRes, mRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/members`),
      ]);
      setGroup(gRes.data?.group || null);
      setMembers(mRes.data?.items || []);
    } catch (e) {
      console.error('Group members error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      particles.push(
        <div
          key={i}
          className="group-members-particle"
          style={{
            width: `${Math.random() * 10 + 4}px`,
            height: `${Math.random() * 10 + 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            background: i % 2 === 0 
              ? `rgba(255, 193, 7, ${Math.random() * 0.2 + 0.1})`
              : `rgba(33, 150, 243, ${Math.random() * 0.2 + 0.1})`
          }}
        />
      );
    }
    return particles;
  };

  const stats = {
    total: members.length,
    owners: members.filter(m => m.role === 'owner').length,
    admins: members.filter(m => m.role === 'admin').length,
    members: members.filter(m => m.role === 'member').length
  };

  if (loading) {
    return (
      <div className="group-members-container">
        {renderParticles()}
        <div className="min-h-screen flex items-center justify-center">
          <div className="group-members-loading"></div>
          <span className="ml-4 text-white text-lg">Memuat anggota...</span>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-members-container">
        {renderParticles()}
        <div className="min-h-screen flex items-center justify-center">
          <div className="group-members-empty-state">
            <div className="text-6xl mb-4 opacity-60">❌</div>
            <h3 className="text-xl font-semibold text-white mb-2">Group Tidak Ditemukan</h3>
            <p className="text-gray-400 mb-6">
              Group yang Anda cari tidak ditemukan atau mungkin telah dihapus.
            </p>
            <Link
              to="/groups"
              className="group-members-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-block"
            >
              ← Kembali ke Groups
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const EmptyState = () => (
    <div className="group-members-empty-state">
      <div className="text-6xl mb-4 opacity-60">👥</div>
      <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Anggota</h3>
      <p className="text-gray-400 mb-6">
        Belum ada anggota yang bergabung dengan group ini.
      </p>
      <Link
        to={`/groups/${groupId}`}
        className="group-members-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-block"
      >
        ← Kembali ke Group
      </Link>
    </div>
  );

  const MemberCard = ({ member }) => (
    <div className="group-members-member-card">
      <div className="flex items-center gap-4 mb-4">
        <div className="group-members-avatar">
          {getInitials(member.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">
            {member.name}
          </h3>
          <p className="text-gray-400 text-sm truncate">{member.email}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <span className={`group-members-role-badge ${getRoleBadgeClass(member.role)} flex items-center gap-1`}>
          <span>{getRoleEmoji(member.role)}</span>
          <span>{member.role}</span>
        </span>
        
        <Link
          to={`/profile/${member.user_id}`}
          className="group-members-action-btn blue px-3 py-1 text-sm flex items-center gap-1"
        >
          <span>👀</span>
          <span>Profil</span>
        </Link>
      </div>
      
      <div className="text-xs text-gray-400">
        Bergabung: {member.joined_at ? new Date(member.joined_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }) : '-'}
      </div>
    </div>
  );

  return (
    <div className="group-members-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-yellow-500 rounded-full opacity-20 group-members-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-blue-500 rounded-full opacity-20 group-members-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-22 h-22 bg-blue-400 rounded-full opacity-20 group-members-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                to="/groups"
                className="group-members-action-btn blue px-4 py-2 flex items-center gap-2"
              >
                <span>←</span>
                <span>Groups</span>
              </Link>
              
              <Link
                to={`/groups/${groupId}`}
                className="group-members-action-btn green px-4 py-2 flex items-center gap-2"
              >
                <span>📋</span>
                <span>Detail Group</span>
              </Link>
            </div>
          </div>

          {/* Group Header */}
          <div className="group-members-section-card mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-3 group-members-gradient-text-blue-yellow">
                  👥 Anggota Group
                </h1>
                <h2 className="text-xl text-gray-300 mb-2">{group.name}</h2>
                
                {group.description && (
                  <p className="text-gray-400 mb-4 max-w-2xl">
                    {group.description}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      viewMode === 'table' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    📊 Tabel
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    🎨 Grid
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="group-members-stats-card">
              <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
              <div className="text-gray-400 text-sm">Total Anggota</div>
            </div>
            <div className="group-members-stats-card">
              <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.owners}</div>
              <div className="text-gray-400 text-sm">Pemilik</div>
            </div>
            <div className="group-members-stats-card">
              <div className="text-2xl font-bold text-blue-400 mb-1">{stats.admins}</div>
              <div className="text-gray-400 text-sm">Admin</div>
            </div>
            <div className="group-members-stats-card">
              <div className="text-2xl font-bold text-green-400 mb-1">{stats.members}</div>
              <div className="text-gray-400 text-sm">Member</div>
            </div>
          </div>

          {/* Members Content */}
          <div className="group-members-section-card">
            {members.length === 0 ? (
              <EmptyState />
            ) : viewMode === 'table' ? (
              /* Table View */
              <div className="group-members-table rounded-2xl overflow-hidden">
                <div className="group-members-table-header p-4 grid grid-cols-12 gap-4 text-gray-400 text-sm font-semibold">
                  <div className="col-span-4">Anggota</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Bergabung</div>
                  <div className="col-span-1">Aksi</div>
                </div>

                <div className="divide-y divide-gray-700">
                  {members.map((member) => (
                    <div key={member.group_member_id} className="group-members-table-row p-4 grid grid-cols-12 gap-4 items-center text-white">
                      {/* Member Info */}
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="group-members-avatar text-sm">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <div className="font-semibold">{member.name}</div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="col-span-3 text-gray-300">
                        {member.email}
                      </div>

                      {/* Role */}
                      <div className="col-span-2">
                        <span className={`group-members-role-badge ${getRoleBadgeClass(member.role)} flex items-center gap-1 w-fit`}>
                          <span>{getRoleEmoji(member.role)}</span>
                          <span className="capitalize">{member.role}</span>
                        </span>
                      </div>

                      {/* Join Date */}
                      <div className="col-span-2 text-sm text-gray-300">
                        {member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : '-'}
                      </div>

                      {/* Action */}
                      <div className="col-span-1">
                        <Link
                          to={`/profile/${member.user_id}`}
                          className="group-members-action-btn blue px-3 py-2 flex items-center gap-1 text-sm"
                        >
                          <span>👀</span>
                          <span className="hidden sm:inline">Lihat</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Grid View */
              <div className="group-members-grid">
                {members.map((member) => (
                  <MemberCard key={member.group_member_id} member={member} />
                ))}
              </div>
            )}
          </div>

          {/* Export Section */}
          {members.length > 0 && (
            <div className="group-members-section-card text-center">
              <h3 className="text-lg font-semibold text-white mb-3">📊 Ekspor Data Anggota</h3>
              <p className="text-gray-400 mb-4">
                Unduh data anggota group dalam format CSV untuk keperluan analisis atau dokumentasi.
              </p>
              <button
                onClick={() => {
                  // Simple CSV export implementation
                  const headers = ['Nama', 'Email', 'Role', 'Tanggal Bergabung'];
                  const csvData = members.map(member => [
                    member.name,
                    member.email,
                    member.role,
                    member.joined_at ? new Date(member.joined_at).toLocaleDateString('id-ID') : '-'
                  ]);

                  const csvContent = [
                    headers.join(','),
                    ...csvData.map(row => row.map(field => `"${field}"`).join(','))
                  ].join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `anggota-${group.name}-${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="group-members-gradient-btn green px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2"
              >
                <span>📥</span>
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}