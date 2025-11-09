// src/pages/PostJob.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function PostJob() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', company: '', location: '', job_type: 'full_time',
    industry: '', required_skills: '', min_experience: '', salary_range: '',
    application_link: '', expires_at: ''
  });
  const [saving, setSaving] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        required_skills: form.required_skills
          ? form.required_skills.split(',').map(s=>s.trim()).filter(Boolean)
          : []
      };
      const { data } = await api.post('/jobs', payload);
      nav(`/jobs/${data?.job?.job_id}`);
    } catch (e2) {
      alert(e2?.response?.data?.error || 'Failed to post job.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <form onSubmit={onSubmit} className="bg-white border rounded-lg p-5">
        <h1 className="text-2xl font-bold mb-4">Post a Job</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded p-2" name="title" placeholder="Job Title" value={form.title} onChange={onChange} required />
          <input className="border rounded p-2" name="company" placeholder="Company" value={form.company} onChange={onChange} required />
          <input className="border rounded p-2" name="location" placeholder="Location" value={form.location} onChange={onChange} required />
          <select className="border rounded p-2" name="job_type" value={form.job_type} onChange={onChange}>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
            <option value="freelance">Freelance</option>
            <option value="temporary">Temporary</option>
          </select>
          <input className="border rounded p-2" name="industry" placeholder="Industry" value={form.industry} onChange={onChange} />
          <input className="border rounded p-2" name="min_experience" type="number" placeholder="Min Experience (years)" value={form.min_experience} onChange={onChange} />
          <input className="border rounded p-2" name="salary_range" placeholder="Salary Range" value={form.salary_range} onChange={onChange} />
          <input className="border rounded p-2" name="application_link" placeholder="External Apply Link (optional)" value={form.application_link} onChange={onChange} />
          <input className="border rounded p-2" name="expires_at" type="datetime-local" value={form.expires_at} onChange={onChange} />
        </div>

        <textarea className="border rounded p-2 w-full mt-3" rows={6} name="description" placeholder="Job Description"
                  value={form.description} onChange={onChange} required />
        <input className="border rounded p-2 w-full mt-3" name="required_skills" placeholder="Required skills (csv, e.g. react,js,rest)"
               value={form.required_skills} onChange={onChange} />

        <div className="mt-4">
          <button disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Publish Job'}
          </button>
        </div>
      </form>
    </div>
  );
}
