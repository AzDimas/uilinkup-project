// src/pages/GroupMembers.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function GroupMembers() {
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ambil info group (supaya bisa tampil nama)
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

  if (loading) return <div className="p-4">Loading members...</div>;

  if (!group) {
    return <div className="p-4">Group not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex gap-2">
          <Link to="/groups" className="hover:underline text-blue-600">
            Groups
          </Link>
          <span>/</span>
          <Link
            to={`/groups/${groupId}`}
            className="hover:underline text-blue-600"
          >
            {group.name}
          </Link>
          <span>/</span>
          <span>Members</span>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h1 className="text-xl font-semibold mb-2">
          Members of {group.name}
        </h1>
        <p className="text-xs text-gray-500 mb-3">
          Total members: {members.length}
        </p>

        {members.length === 0 ? (
          <div className="text-sm text-gray-500">
            Belum ada member di group ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Role
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Joined At
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.group_member_id} className="border-b">
                    <td className="px-3 py-1.5">
                      <Link
                        to={`/profile/${m.user_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {m.name}
                      </Link>
                    </td>
                    <td className="px-3 py-1.5 text-gray-700">
                      {m.email}
                    </td>
                    <td className="px-3 py-1.5 text-gray-700">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100">
                        {m.role}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-gray-500">
                      {m.joined_at
                        ? new Date(m.joined_at).toLocaleString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
