// src/pages/JobApplicants.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const statusLabel = {
  pending: 'Pending',
  review: 'Dalam Pertimbangan',
  interview: 'Interview',
  offered: 'Offered',
  hired: 'Hired',
  rejected: 'Rejected',
};

export default function JobApplicants() {
  const { jobId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const myId = useMemo(() => Number(user?.id ?? user?.userId ?? 0) || null, [user]);

  const [job, setJob] = useState(null);
  const [items, setItems] = useState([]); // applications
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // ============== Fetch Job Info ==============
  const fetchJob = async () => {
    try {
      const { data } = await api.get(`/jobs/${jobId}`);
      setJob(data?.job || null);
    } catch (e) {}
  };

  // ============== Fetch Applicants ==============
  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/jobs/${jobId}/applications`);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.error('Load applicants error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  // ============== Update Status + Note ==============
  const updateStatus = async (applicationId, nextStatus) => {
    const prompts = {
      review: "Tandai lamaran ini sebagai 'Dalam Pertimbangan'?",
      interview: "Lulus ke 'Interview'? Kami sarankan Anda menghubungi kandidat via email. Lanjutkan?",
      offered: "Set status menjadi 'Offered'? Pastikan Anda sudah mengirimkan detail offer.",
      hired: "Set status menjadi 'Hired'? Kandidat dianggap diterima.",
      rejected: "Tolak lamaran ini? Keputusan akan terlihat oleh kandidat.",
    };

    if (!window.confirm(prompts[nextStatus])) return;

    // ✅ Minta pesan tambahan
    const note = window.prompt("Tambahkan pesan untuk kandidat (opsional):") || null;

    setUpdatingId(applicationId);

    try {
      await api.patch(`/jobs/${jobId}/applications/${applicationId}`, {
        status: nextStatus,
        note,   // ✅ Kirim pesan ke backend
      });

      await fetchApplicants();

      alert(
        `Status diperbarui menjadi: ${statusLabel[nextStatus]}\n` +
        (note ? `Pesan dikirim: "${note}"` : "")
      );
    } catch (e) {
      alert(e?.response?.data?.error || 'Gagal memperbarui status.');
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchJob();
    fetchApplicants();
  }, [jobId]);

  // Hanya owner job yang boleh melihat
  const mine = useMemo(() => {
    if (!job || !myId) return false;
    return Number(job.posted_by_id) === Number(myId);
  }, [job, myId]);

  if (!mine) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-white border rounded p-4">
          <div className="text-red-600 font-medium">
            Anda tidak memiliki akses ke daftar pelamar untuk lowongan ini.
          </div>
          <div className="mt-3">
            <Link to="/jobs" className="text-blue-600 hover:underline">Kembali ke Jobs</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav(-1)}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Kembali
          </button>
          <h1 className="text-2xl font-bold">Applicants</h1>
        </div>
        <Link to={`/jobs/${jobId}`} className="text-blue-600 hover:underline">
          Lihat Detail Job →
        </Link>
      </div>

      {/* Job Info */}
      {job && (
        <div className="bg-white border rounded p-4 mb-4">
          <div className="font-semibold text-lg">{job.title}</div>
          <div className="text-sm text-gray-700">
            {job.company} — {job.location}
          </div>
        </div>
      )}

      {/* Applicants List */}
      <div className="bg-white border rounded">
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-gray-500">Belum ada pelamar.</div>
        ) : (
          <ul className="divide-y">
            {items.map((a) => (
              <li key={a.application_id} className="p-4">
                <div className="flex items-start justify-between gap-4">

                  {/* Left: Candidate Info */}
                  <div className="min-w-0">
                    <Link
                    to={`/profile/${a.applicant_id}`}
                    className="font-semibold text-blue-600 hover:underline"
                    >
                    {a.applicant_name || 'Nama tidak tersedia'}
                    </Link>
                    <div className="text-sm text-gray-600">{a.applicant_email}</div>

                    <div className="mt-2 text-sm">
                      <div className="text-gray-500">Cover Letter:</div>
                      <div className="whitespace-pre-wrap">{a.cover_letter || '-'}</div>
                    </div>

                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Resume: </span>
                      {a.resume_link ? (
                        <a
                          href={a.resume_link}
                          className="text-blue-600 hover:underline break-all"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {a.resume_link}
                        </a>
                      ) : (
                        '-'
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      Applied: {new Date(a.applied_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Right: Status + Actions */}
                  <div className="shrink-0 w-56">
                    <div className="text-xs mb-2">
                      Status saat ini:{' '}
                      <span className="inline-block px-2 py-0.5 rounded bg-gray-100">
                        {statusLabel[a.status] || a.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={updatingId === a.application_id}
                        onClick={() => updateStatus(a.application_id, 'review')}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                      >
                        Review
                      </button>

                      <button
                        disabled={updatingId === a.application_id}
                        onClick={() => updateStatus(a.application_id, 'interview')}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                      >
                        Interview
                      </button>

                      <button
                        disabled={updatingId === a.application_id}
                        onClick={() => updateStatus(a.application_id, 'offered')}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                      >
                        Offered
                      </button>

                      <button
                        disabled={updatingId === a.application_id}
                        onClick={() => updateStatus(a.application_id, 'hired')}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                      >
                        Hired
                      </button>

                      <button
                        disabled={updatingId === a.application_id}
                        onClick={() => updateStatus(a.application_id, 'rejected')}
                        className="text-xs px-2 py-1 border rounded text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
