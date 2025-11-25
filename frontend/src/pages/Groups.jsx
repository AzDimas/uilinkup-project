import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Groups.css';

const FACULTIES = [
  'Fakultas Ekonomi dan Bisnis',
  'Fakultas Farmasi',
  'Fakultas Hukum',
  'Fakultas Ilmu Administrasi',
  'Fakultas Ilmu Keperawatan',
  'Fakultas Ilmu Komputer',
  'Fakultas Ilmu Pengetahuan Budaya',
  'Fakultas Ilmu Sosial dan Ilmu Politik',
  'Fakultas Kesehatan Masyarakat',
  'Fakultas Kedokteran',
  'Fakultas Kedokteran Gigi',
  'Fakultas Matematika dan Ilmu Pengetahuan Alam',
  'Fakultas Psikologi',
  'Fakultas Teknik',
  'Program Pendidikan Vokasi',
];

const groupTypeLabel = (t) => {
  const map = {
    faculty: 'Faculty Forum',
    program: 'Program Forum',
    interest: 'Interest / Topic Forum',
  };
  return map[t] || t || '-';
};

const groupTypeEmoji = (t) => {
  const map = {
    faculty: '🏛️',
    program: '🎓',
    interest: '💡',
  };
  return map[t] || '👥';
};

export default function Groups() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // create form
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formType, setFormType] = useState('faculty');

  const [faculty, setFaculty] = useState('');
  const [programName, setProgramName] = useState('');
  const [interestName, setInterestName] = useState('');
  const [description, setDescription] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/groups', {
        params: {
          q,
          faculty: facultyFilter,
          type: typeFilter,
          page,
          pageSize,
        },
      });
      setItems(data?.items || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error('Groups list error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, facultyFilter, typeFilter, page]);

  const resetCreateForm = () => {
    setFaculty('');
    setProgramName('');
    setInterestName('');
    setDescription('');
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (saving) return;

    let name = '';
    const trimmedDesc = description.trim() || null;

    const payload = {
      name: '',
      description: trimmedDesc,
      group_type: formType,
      faculty: null,
      interest_field: null,
    };

    if (formType === 'faculty') {
      if (!faculty) {
        alert('Pilih fakultas untuk Faculty Forum.');
        return;
      }
      name = `Forum ${faculty}`;
      payload.faculty = faculty;
    } else if (formType === 'program') {
      if (!faculty) {
        alert('Pilih fakultas untuk Program Forum.');
        return;
      }
      if (!programName.trim()) {
        alert('Isi nama program/jurusan.');
        return;
      }
      const prog = programName.trim();
      name = `Forum ${prog} (${faculty})`;
      payload.faculty = faculty;
    } else if (formType === 'interest') {
      if (!interestName.trim()) {
        alert('Isi nama interest/topic.');
        return;
      }
      const topic = interestName.trim();
      name = topic;
      payload.interest_field = topic;
    }

    payload.name = name;

    setSaving(true);
    try {
      await api.post('/groups', payload);
      alert('Group berhasil dibuat.');

      resetCreateForm();
      setPage(1);
      fetchGroups();
    } catch (e2) {
      console.error('Create group error:', e2?.response?.data || e2.message);
      alert(e2?.response?.data?.error || 'Gagal membuat group.');
    } finally {
      setSaving(false);
    }
  };

  // Render floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      particles.push(
        <div
          key={i}
          className="groups-particle"
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
    total: total,
    faculty: items.filter(g => g.group_type === 'faculty').length,
    program: items.filter(g => g.group_type === 'program').length,
    interest: items.filter(g => g.group_type === 'interest').length
  };

  const EmptyState = () => (
    <div className="groups-empty-state">
      <div className="text-6xl mb-4 opacity-60">👥</div>
      <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Groups</h3>
      <p className="text-gray-400 mb-6">
        {q || facultyFilter || typeFilter 
          ? 'Coba ubah filter pencarian untuk menemukan groups'
          : 'Jadilah yang pertama membuat group dan mulai berkolaborasi!'
        }
      </p>
      {!(q || facultyFilter || typeFilter) && (
        <button
          onClick={() => setShowCreate(true)}
          className="groups-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
        >
          🎉 Buat Group Pertama
        </button>
      )}
    </div>
  );

  return (
    <div className="groups-container">
      {/* Background Particles */}
      {renderParticles()}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-yellow-500 rounded-full opacity-20 groups-floating-element"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-blue-500 rounded-full opacity-20 groups-floating-element"></div>
      <div className="absolute bottom-1/4 left-1/3 w-22 h-22 bg-blue-400 rounded-full opacity-20 groups-floating-element"></div>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3 groups-gradient-text-blue-yellow">
              👥 Groups & Forums
            </h1>
            <p className="text-gray-300 text-lg">
              Temukan dan bergabung dengan komunitas yang sesuai dengan minat Anda
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="groups-stats-card">
              <div className="text-3xl font-bold text-white mb-2">{stats.total}</div>
              <div className="text-gray-400 text-sm">Total Groups</div>
            </div>
            <div className="groups-stats-card">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.faculty}</div>
              <div className="text-gray-400 text-sm">Faculty Forums</div>
            </div>
            <div className="groups-stats-card">
              <div className="text-3xl font-bold text-green-400 mb-2">{stats.program}</div>
              <div className="text-gray-400 text-sm">Program Forums</div>
            </div>
            <div className="groups-stats-card">
              <div className="text-3xl font-bold text-purple-400 mb-2">{stats.interest}</div>
              <div className="text-gray-400 text-sm">Interest Forums</div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="groups-section-card mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  className="groups-form-input px-4 py-3 rounded-xl focus:outline-none"
                  placeholder="🔍 Cari group..."
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                />

                <select
                  className="groups-form-select px-4 py-3 rounded-xl focus:outline-none"
                  value={facultyFilter}
                  onChange={(e) => {
                    setFacultyFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Semua Fakultas</option>
                  {FACULTIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>

                <select
                  className="groups-form-select px-4 py-3 rounded-xl focus:outline-none"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Semua Tipe</option>
                  <option value="faculty">Faculty Forum</option>
                  <option value="program">Program Forum</option>
                  <option value="interest">Interest Forum</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setShowCreate((v) => !v);
                  resetCreateForm();
                }}
                className="groups-gradient-btn yellow px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <span>{showCreate ? '✕' : '➕'}</span>
                <span>{showCreate ? 'Tutup Form' : 'Buat Group'}</span>
              </button>
            </div>
          </div>

          {/* Create Form */}
          {showCreate && (
            <div className="groups-section-card mb-6">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <span>🎯</span>
                Buat Group Baru
              </h2>

              <form onSubmit={handleSubmitCreate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Jenis Group
                    </label>
                    <select
                      className="groups-form-select w-full px-4 py-3 rounded-xl"
                      value={formType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormType(newType);
                        setFaculty('');
                        setProgramName('');
                        setInterestName('');
                      }}
                    >
                      <option value="faculty">🏛️ Faculty Forum</option>
                      <option value="program">🎓 Program Forum</option>
                      <option value="interest">💡 Interest Forum</option>
                    </select>
                  </div>

                  {(formType === 'faculty' || formType === 'program') && (
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Fakultas
                      </label>
                      <select
                        className="groups-form-select w-full px-4 py-3 rounded-xl"
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                      >
                        <option value="">Pilih Fakultas</option>
                        {FACULTIES.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formType === 'program' && (
                    <div className="md:col-span-2">
                      <label className="block text-white font-medium mb-2">
                        Nama Program / Jurusan
                      </label>
                      <input
                        className="groups-form-input w-full px-4 py-3 rounded-xl"
                        placeholder="Contoh: Teknik Komputer, Ilmu Statistik, Akuntansi..."
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                      />
                    </div>
                  )}

                  {formType === 'interest' && (
                    <div className="md:col-span-2">
                      <label className="block text-white font-medium mb-2">
                        Nama Topik / Minat
                      </label>
                      <input
                        className="groups-form-input w-full px-4 py-3 rounded-xl"
                        placeholder="Contoh: Data Science, Startup, UI/UX, Competitive Programming..."
                        value={interestName}
                        onChange={(e) => setInterestName(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Deskripsi Group
                  </label>
                  <textarea
                    className="groups-form-textarea w-full px-4 py-3 rounded-xl"
                    rows={4}
                    placeholder="Jelaskan tujuan, topik diskusi, dan aktivitas yang akan dilakukan dalam group ini..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="groups-gradient-btn blue px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="groups-loading"></div>
                      <span>Membuat...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Buat Group</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Groups List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="groups-loading"></div>
              <span className="ml-4 text-white text-lg">Memuat groups...</span>
            </div>
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((g) => (
                <Link
                  key={g.group_id}
                  to={`/groups/${g.group_id}`}
                  className="groups-card dark p-6 rounded-2xl block hover:no-underline"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white pr-4">
                      {g.name}
                    </h3>
                    <span className={`groups-type-badge ${g.group_type} flex items-center gap-1 whitespace-nowrap`}>
                      <span>{groupTypeEmoji(g.group_type)}</span>
                      <span>{groupTypeLabel(g.group_type)}</span>
                    </span>
                  </div>

                  {g.faculty && (
                    <div className="text-sm text-gray-300 mb-3 flex items-center gap-2">
                      <span>🏫</span>
                      <span>{g.faculty}</span>
                    </div>
                  )}
                  
                  {g.group_type === 'interest' && g.interest_field && (
                    <div className="text-sm text-gray-300 mb-3 flex items-center gap-2">
                      <span>📌</span>
                      <span>Topik: {g.interest_field}</span>
                    </div>
                  )}

                  {g.description && (
                    <p className="text-gray-400 mb-4 line-clamp-3">
                      {g.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <span>👥</span>
                        <span>{g.member_count ?? 0} members</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>👤</span>
                        <span>{g.creator_name}</span>
                      </span>
                    </div>
                    <span>
                      {g.created_at
                        ? new Date(g.created_at).toLocaleDateString('id-ID')
                        : ''}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="groups-pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="groups-pagination-btn flex items-center gap-2"
              >
                <span>←</span>
                <span>Prev</span>
              </button>
              
              <span className="groups-pagination-info">
                Halaman {page} dari {totalPages}
              </span>
              
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="groups-pagination-btn flex items-center gap-2"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}