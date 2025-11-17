// src/pages/Groups.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

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
  const [formType, setFormType] = useState('faculty'); // faculty | program | interest

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
          type: typeFilter, // backend pakai req.query.type
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

    // base payload, tanpa batch_year & is_private
    const payload = {
      name: '',
      description: trimmedDesc,
      group_type: formType, // 'faculty' | 'program' | 'interest'
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

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Groups & Forums</h1>
        <button
          onClick={() => {
            setShowCreate((v) => !v);
            resetCreateForm();
          }}
          className="px-3 py-2 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700"
        >
          {showCreate ? 'Tutup Form' : 'Create Group'}
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Search group name/description"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />

          <select
            className="border rounded px-2 py-1 text-sm"
            value={facultyFilter}
            onChange={(e) => {
              setFacultyFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Faculties</option>
            {FACULTIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <select
            className="border rounded px-2 py-1 text-sm"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Group Types</option>
            <option value="faculty">Faculty Forum</option>
            <option value="program">Program Forum</option>
            <option value="interest">Interest / Topic Forum</option>
          </select>
        </div>
      </div>

      {/* CREATE FORM */}
      {showCreate && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Create New Group</h2>

          <form onSubmit={handleSubmitCreate} className="space-y-4">
            {/* Pilih tipe & fakultas / interest */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Group Type
                </label>
                <select
                  className="border rounded w-full px-2 py-1 text-sm"
                  value={formType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormType(newType);
                    // reset field terkait
                    setFaculty('');
                    setProgramName('');
                    setInterestName('');
                  }}
                >
                  <option value="faculty">Faculty Forum</option>
                  <option value="program">Program Forum (Jurusan)</option>
                  <option value="interest">Interest / Topic Forum</option>
                </select>
              </div>

              {/* Faculty untuk faculty & program */}
              {(formType === 'faculty' || formType === 'program') && (
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Faculty
                  </label>
                  <select
                    className="border rounded w-full px-2 py-1 text-sm"
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

              {/* Program name (hanya untuk program forum) */}
              {formType === 'program' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">
                    Program / Jurusan
                  </label>
                  <input
                    className="border rounded w-full px-2 py-1 text-sm"
                    placeholder="Contoh: Teknik Komputer, Ilmu Statistik, dll."
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                  />
                </div>
              )}

              {/* Interest name (hanya interest forum) */}
              {formType === 'interest' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">
                    Interest / Topic Name
                  </label>
                  <input
                    className="border rounded w-full px-2 py-1 text-sm"
                    placeholder="Contoh: Data Science, Startup, UI/UX, Competitive Programming"
                    value={interestName}
                    onChange={(e) => setInterestName(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Short description untuk semua tipe */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Short Description
              </label>
              <textarea
                className="border rounded w-full px-2 py-1 text-sm"
                rows={3}
                placeholder="Deskripsikan tujuan dan topik utama forum ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      )}

      {/* LIST GROUPS */}
      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No groups found.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map((g) => (
            <Link
              key={g.group_id}
              to={`/groups/${g.group_id}`}
              className="block border rounded-lg p-4 bg-white hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{g.name}</h3>
                <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100">
                  {groupTypeLabel(g.group_type)}
                </span>
              </div>

              {g.faculty && (
                <div className="text-xs text-gray-600 mt-1">
                  Faculty: {g.faculty}
                </div>
              )}
              {g.group_type === 'interest' && g.interest_field && (
                <div className="text-xs text-gray-600 mt-1">
                  Topic: {g.interest_field}
                </div>
              )}

              {g.description && (
                <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                  {g.description}
                </p>
              )}

              <div className="mt-3 text-xs text-gray-400 flex justify-between">
                <span>
                  Members: {g.member_count ?? 0} • By {g.creator_name}
                </span>
                <span>
                  {g.created_at
                    ? new Date(g.created_at).toLocaleDateString()
                    : ''}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
          >
            Prev
          </button>
          <span className="text-sm">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
