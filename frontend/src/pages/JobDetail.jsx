// src/pages/JobDetail.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

export default function JobDetail() {
  const { jobId } = useParams();
  const { user } = useAuth();

  const myId = useMemo(
    () => (Number(user?.id ?? user?.userId ?? 0) || null),
    [user]
  );

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // apply form
  const [cover, setCover] = useState('');
  const [resume, setResume] = useState('');
  const [applying, setApplying] = useState(false);

  // applied state
  const [hasApplied, setHasApplied] = useState(false);
  const [myApplication, setMyApplication] = useState(null);

  const mine = useMemo(() => {
    if (!job || !myId) return false;
    return Number(job.posted_by_id) === Number(myId);
  }, [job, myId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/jobs/${jobId}`);
      setJob(data?.job || null);
    } catch (e) {
      console.error('Job detail error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  // cek apakah user sudah apply ke job ini
  const checkApplied = async () => {
    try {
      const { data } = await api.get('/jobs/me/applied', { params: { jobId } });
      const list = Array.isArray(data?.items) ? data.items : [];
      const found = list.find((a) => Number(a.job_id) === Number(jobId));
      if (found) {
        setHasApplied(true);
        setMyApplication(found);
      } else {
        setHasApplied(false);
        setMyApplication(null);
      }
    } catch {
      setHasApplied(false);
      setMyApplication(null);
    }
  };

  const onApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      await api.post(`/jobs/${jobId}/apply`, {
        cover_letter: cover,
        resume_link: resume,
      });
      setCover('');
      setResume('');
      await checkApplied();
      alert('Application submitted!');
    } catch (e2) {
      alert(e2?.response?.data?.error || 'Failed to apply.');
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    if (myId) checkApplied();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, myId]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!job) return <div className="p-4">Job not found.</div>;

  const now = new Date();
  const isExpired = job.expires_at ? new Date(job.expires_at) < now : false;
  const isClosed = !job.is_active || isExpired;

  const closedReason = !job.is_active
    ? 'Lowongan ini sudah dinonaktifkan oleh pengiklan.'
    : isExpired
      ? 'Periode pendaftaran telah berakhir.'
      : 'Lowongan sudah ditutup.';

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white border rounded-lg p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <div className="text-gray-700">
              {job.company} — {job.location}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs inline-block px-2 py-0.5 rounded-full bg-gray-100">
                {jobTypeLabel(job.job_type)}
              </span>
              {job.expires_at && (
                <span className="text-xs text-gray-500">
                  Tutup: {new Date(job.expires_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasApplied && !mine && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">
                Submitted
              </span>
            )}
            {isClosed ? (
              <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700">
                Closed
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">
                Open
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 whitespace-pre-wrap">{job.description}</div>

        <div className="mt-4">
          <h3 className="font-semibold">Required Skills</h3>
          {job.required_skills?.length ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {job.required_skills.map((s, i) => (
                <span
                  key={i}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">-</div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Industry:</span> {job.industry || '-'}
          </div>
          <div>
            <span className="text-gray-500">Min Experience:</span>{' '}
            {job.min_experience ?? '-'}
          </div>
          <div>
            <span className="text-gray-500">Salary Range:</span>{' '}
            {job.salary_range || '-'}
          </div>
          <div>
            <span className="text-gray-500">Apply Link:</span>{' '}
            {job.application_link || '-'}
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-400">
          Posted by {job.poster_name} ({job.poster_email}) •{' '}
          {new Date(job.created_at).toLocaleString()}
        </div>
      </div>

      {/* Section Apply / Status */}
      {Number(job.posted_by_id) !== Number(myId) && (
        <>
          {hasApplied ? (
            <div className="bg-white border rounded-lg p-5 mt-4">
              <h3 className="text-lg font-semibold mb-2">Your application</h3>
              <div className="text-sm">
                Status:{' '}
                <span className="font-medium">
                  {myApplication?.status || 'submitted'}
                </span>
              </div>
              {myApplication?.applied_at && (
                <div className="text-xs text-gray-500 mt-1">
                  Applied: {new Date(myApplication.applied_at).toLocaleString()}
                </div>
              )}
              {myApplication?.status_note && (
                <div className="mt-3 text-sm">
                  <div className="text-gray-500">Message from employer:</div>
                  <div className="whitespace-pre-wrap">
                    {myApplication.status_note}
                  </div>
                </div>
              )}
              <div className="mt-3">
                <Link
                  to="/jobs/me/applied"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View my applications →
                </Link>
              </div>
            </div>
          ) : isClosed ? (
            <div className="bg-white border rounded-lg p-5 mt-4">
              <h3 className="text-lg font-semibold mb-2">Lowongan ditutup</h3>
              <p className="text-sm text-gray-600 mb-3">{closedReason}</p>
              <button
                disabled
                className="bg-gray-200 text-gray-500 px-4 py-2 rounded cursor-not-allowed text-sm"
              >
                Sudah ditutup
              </button>
            </div>
          ) : (
            <form onSubmit={onApply} className="bg-white border rounded-lg p-5 mt-4">
              <h3 className="text-lg font-semibold mb-2">Apply to this job</h3>
              <textarea
                className="w-full border rounded p-2 mb-2"
                rows={5}
                placeholder="Cover Letter (optional)"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
              />
              <input
                className="w-full border rounded p-2 mb-2"
                placeholder="Resume link (URL)"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
              />
              <button
                disabled={applying}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
