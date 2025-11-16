// src/pages/PostEvent.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';

const EVENT_TYPE_OPTIONS = [
  { value: 'webinar',      label: 'Webinar' },
  { value: 'career_talk',  label: 'Career Talk' },
  { value: 'networking',   label: 'Networking Session' },
  { value: 'workshop',     label: 'Workshop' },
  { value: 'seminar',     label: 'Seminar' },
];

export default function PostEvent() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    // ✅ default ke value enum yang valid
    event_type: 'webinar',
    start_time: '',
    end_time: '',
    location: '',
    meeting_link: '',
    max_attendees: '',
    is_public: true,
    audience: 'all',
    registration_deadline: '',
    cover_image: '',
  });

  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
        meeting_link: form.meeting_link || null,
        registration_deadline: form.registration_deadline || null,
        cover_image: form.cover_image || null,
      };

      const { data } = await eventsAPI.create(payload);
      nav(`/events/${data?.event?.event_id}`);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to create event.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <form onSubmit={onSubmit} className="bg-white border rounded-lg p-5">
        <h1 className="text-2xl font-bold mb-4">Create Event</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Title */}
          <input
            className="border rounded p-2"
            name="title"
            placeholder="Event Title"
            value={form.title}
            onChange={onChange}
            required
          />

          {/* ✅ Event Type pakai select, value = enum */}
          <select
            className="border rounded p-2"
            name="event_type"
            value={form.event_type}
            onChange={onChange}
            required
          >
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Location */}
          <input
            className="border rounded p-2"
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={onChange}
            required
          />

          {/* Meeting link (optional) */}
          <input
            className="border rounded p-2"
            name="meeting_link"
            placeholder="Meeting Link (optional)"
            value={form.meeting_link}
            onChange={onChange}
          />

          {/* Start time */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Event Starts At</label>
            <input
              className="border rounded p-2"
              type="datetime-local"
              name="start_time"
              value={form.start_time}
              onChange={onChange}
              required
            />
          </div>

          {/* End time */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Event Ends At</label>
            <input
              className="border rounded p-2"
              type="datetime-local"
              name="end_time"
              value={form.end_time}
              onChange={onChange}
              required
            />
          </div>

          {/* Capacity */}
          <input
            className="border rounded p-2"
            type="number"
            name="max_attendees"
            placeholder="Max Attendees (optional)"
            value={form.max_attendees}
            onChange={onChange}
          />

          {/* Audience */}
          <select
            className="border rounded p-2"
            name="audience"
            value={form.audience}
            onChange={onChange}
          >
            <option value="all">Audience: All</option>
            <option value="students">Students Only</option>
            <option value="alumni">Alumni Only</option>
          </select>

          {/* Registration deadline */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">
              Registration Deadline
            </label>
            <input
              className="border rounded p-2"
              type="datetime-local"
              name="registration_deadline"
              value={form.registration_deadline}
              onChange={onChange}
            />
          </div>

          {/* Cover image */}
          <input
            className="border rounded p-2"
            name="cover_image"
            placeholder="Cover Image URL (optional)"
            value={form.cover_image}
            onChange={onChange}
          />

          {/* Public checkbox */}
          <label className="flex items-center gap-2 text-sm mt-1">
            <input
              type="checkbox"
              name="is_public"
              checked={form.is_public}
              onChange={onChange}
            />
            Public Event
          </label>
        </div>

        {/* Description */}
        <textarea
          className="border rounded p-2 w-full mt-3"
          rows={6}
          name="description"
          placeholder="Detailed event description..."
          value={form.description}
          onChange={onChange}
          required
        />

        <div className="mt-4">
          <button
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Publish Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
