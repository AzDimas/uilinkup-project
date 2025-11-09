// src/pages/MyJobs.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const jobTypeLabel = (t) => {
  const map = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    internship: 'Internship',
    contract: 'Contract',
    freelance: 'Freelance',
    temporary: 'Temporary',
  };
  return map[t] || (t ? t.replace(/_/g, ' ') : t);
};

export default function MyJobs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs/me/posted');
      setItems(data?.items || []);
    } catch (e) {
      console.error('MyJobs error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deactivate = async (jobId) => {
    if (!confirm('Deactivate this job?')) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Posted Jobs</h1>
        <Link to="/jobs/new" className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700">Post a Job</Link>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">You have not posted any jobs.</div>
      ) : (
        <div className="space-y-2">
          {items.map((j) => (
            <div key={j.job_id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{j.title}</div>
                <div className="text-sm text-gray-700">{j.company} — {j.location}</div>
                <div className="text-xs text-gray-500">{jobTypeLabel(j.job_type)}</div>
                <div className="text-xs text-gray-400">Status: {j.is_active ? 'Active' : 'Inactive'}</div>
              </div>
              <div className="flex gap-2">
                <Link to={`/jobs/${j.job_id}`} className="px-3 py-1 border rounded">View</Link>
                <Link to={`/jobs/${j.job_id}/applicants`} className="px-3 py-1 border rounded">Applicants</Link>
                <button onClick={() => deactivate(j.job_id)} className="px-3 py-1 border rounded text-red-600">Deactivate</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
