// src/pages/JobsList.jsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const pageSize = 12;

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

// menerima input "Full Time" / "full time" / "full_time" -> simpan param 'full_time'
const toSnakeJobType = (s) => {
  if (!s) return '';
  const norm = s.trim().toLowerCase().replace(/\s+/g, '_');
  const allowed = ['full_time','part_time','internship','contract','freelance','temporary'];
  return allowed.includes(norm) ? norm : s; // kalau tidak cocok, tetap kirim apa adanya
};

export default function JobsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  const location = searchParams.get('location') || '';
  const company = searchParams.get('company') || '';
  const skills = searchParams.get('skills') || '';
  const page = Number(searchParams.get('page') || '1');

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs', {
        params: { q, type, location, company, skills, page, pageSize }
      });
      setItems(data?.items || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error('Jobs list error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, location, company, skills, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Link to="/jobs/new" className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700">Post a Job</Link>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input
            className="border rounded px-2 py-1"
            placeholder="Search title/company/location"
            defaultValue={q}
            onBlur={(e)=> setSearchParams({ q: e.target.value, type, location, company, skills, page: 1 })}
          />
          <input
            className="border rounded px-2 py-1"
            placeholder="Type (Full Time, Part Time, ...)"
            defaultValue={type ? jobTypeLabel(type) : ''}
            onBlur={(e)=> {
              const snake = toSnakeJobType(e.target.value);
              setSearchParams({ q, type: snake, location, company, skills, page: 1 });
            }}
          />
          <input
            className="border rounded px-2 py-1"
            placeholder="Location"
            defaultValue={location}
            onBlur={(e)=> setSearchParams({ q, type, location: e.target.value, company, skills, page:1 })}
          />
          <input
            className="border rounded px-2 py-1"
            placeholder="Company"
            defaultValue={company}
            onBlur={(e)=> setSearchParams({ q, type, location, company: e.target.value, skills, page:1 })}
          />
          <input
            className="border rounded px-2 py-1"
            placeholder="Skills csv (react,js)"
            defaultValue={skills}
            onBlur={(e)=> setSearchParams({ q, type, location, company, skills: e.target.value, page:1 })}
          />
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No jobs found.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map(job => (
            <Link key={job.job_id} to={`/jobs/${job.job_id}`} className="block border rounded-lg p-4 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                  {jobTypeLabel(job.job_type)}
                </span>
              </div>
              <div className="text-sm text-gray-700">{job.company} — {job.location}</div>
              {job.required_skills?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {job.required_skills.slice(0,6).map((s,i)=>(
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              ) : null}
              <div className="mt-2 text-xs text-gray-400">Posted: {new Date(job.created_at).toLocaleDateString()}</div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            disabled={page<=1}
            onClick={()=> setSearchParams({ q, type, location, company, skills, page: page-1 })}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm">Page {page} / {totalPages}</span>
          <button
            disabled={page>=totalPages}
            onClick={()=> setSearchParams({ q, type, location, company, skills, page: page+1 })}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
