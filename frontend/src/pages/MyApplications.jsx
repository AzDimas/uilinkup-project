// src/pages/MyApplications.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const statusLabel = {
  pending: 'Pending',
  review: 'Dalam Pertimbangan',
  interview: 'Interview',
  offered: 'Offered',
  hired: 'Hired',
  rejected: 'Rejected',
};

export default function MyApplications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs/me/applied');
      setItems(data?.items || []);
    } catch (e) {
      console.error('MyApplications error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Applications</h1>
      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No applications yet.</div>
      ) : (
        <div className="space-y-2">
          {items.map(a => (
            <div key={a.application_id} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-sm text-gray-700">{a.company} — {a.location}</div>
                  <div className="text-xs text-gray-500">
                    Applied: {a.applied_at ? new Date(a.applied_at).toLocaleString() : '-'}
                  </div>
                  <div className="text-xs">
                    Status:{' '}
                    <span className="font-medium">
                      {statusLabel[a.status] || a.status}
                    </span>
                  </div>
                  {a.status_note && (
                    <div className="mt-2 text-sm">
                      <div className="text-gray-500">Message from employer:</div>
                      <div className="whitespace-pre-wrap">{a.status_note}</div>
                    </div>
                  )}
                </div>
                <Link to={`/jobs/${a.job_id}`} className="px-3 py-1 border rounded">
                  View Job
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
