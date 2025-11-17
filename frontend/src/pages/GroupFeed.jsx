// src/pages/GroupFeed.jsx
import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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

export default function GroupFeed() {
  const { user } = useAuth();
  const isLoggedIn = useMemo(() => !!user, [user]);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [faculty, setFaculty] = useState('');
  const [scope, setScope] = useState('all'); // 'all' | 'my'
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/groups/posts/feed', {
        params: {
          q,
          faculty,
          scope,   // <- kirim scope ke backend: 'all' atau 'my'
          page,
          pageSize,
        },
      });
      setItems(data?.items || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error('Global feed error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, faculty, scope, page]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Forum Feed</h1>
        <Link
          to="/groups"
          className="text-sm text-blue-600 hover:underline"
        >
          Browse Groups →
        </Link>
      </div>

      {/* FILTERS */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Search posts (title/content)"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />

          {/* Faculty filter */}
          <select
            className="border rounded px-2 py-1 text-sm"
            value={faculty}
            onChange={(e) => {
              setFaculty(e.target.value);
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

          {/* Scope: All vs My Groups */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <select
              className="border rounded px-2 py-1 text-xs"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                setPage(1);
              }}
              disabled={!isLoggedIn}
            >
              <option value="all">All groups</option>
              {isLoggedIn && <option value="my">My groups only</option>}
            </select>
            <span className="hidden md:inline">
              {scope === 'my'
                ? 'Showing posts from groups you joined (faculty filter still applies).'
                : 'Showing public posts from all open groups.'}
            </span>
          </div>
        </div>

        {/* Helper text on mobile */}
        <div className="mt-2 text-[11px] text-gray-500 md:hidden">
          {scope === 'my'
            ? 'Showing posts from groups you joined (faculty filter still applies).'
            : 'Showing public posts from all open groups.'}
        </div>
      </div>

      {/* FEED LIST */}
      <div className="bg-white border rounded-lg p-4">
        {loading ? (
          <div className="text-sm text-gray-500">Loading feed...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500">
            No posts found. Try adjusting filters.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((p) => (
              <Link
                key={p.post_id}
                to={`/groups/${p.group_id}/posts/${p.post_id}`}
                className="block border rounded p-3 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{p.title}</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100">
                    {p.group_name}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                  {p.content}
                </div>
                <div className="mt-2 text-[11px] text-gray-500 flex justify-between">
                  <span>
                    {p.faculty && `Faculty: ${p.faculty} • `}By {p.author_name}
                  </span>
                  <span>
                    Replies: {p.reply_count ?? 0} •{' '}
                    {p.last_activity_at
                      ? new Date(p.last_activity_at).toLocaleString()
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
              onClick={() => setPage((pp) => pp - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 text-xs"
            >
              Prev
            </button>
            <span className="text-xs">
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((pp) => pp + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 text-xs"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
