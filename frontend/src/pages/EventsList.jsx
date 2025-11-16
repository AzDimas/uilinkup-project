// src/pages/EventsList.jsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventsAPI } from '../services/api';

const pageSize = 12;

// Mapping label enum event_type -> label cantik
const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'career_talk', label: 'Career Talk' },
  { value: 'networking', label: 'Networking' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
];

const capBadge = (registered, max) => {
  if (!max) return `${registered} registered`;
  return `${registered}/${max} registered`;
};

export default function EventsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  const audience = searchParams.get('audience') || '';
  const from = searchParams.get('from') || '';
  const status = searchParams.get('status') || ''; // "" | "open" | "closed"
  const page = Number(searchParams.get('page') || '1');

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await eventsAPI.list({
        q,
        type,
        audience,
        from,
        status,   // backend boleh abaikan, tidak masalah
        page,
        pageSize,
      });
      setItems(data?.items || []);
      setTotal(data?.total || 0);
    } catch (err) {
      console.error('Events list error:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, audience, from, status, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const now = new Date();

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Upcoming Events</h1>
        <Link
          to="/events/new"
          className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
        >
          Create Event
        </Link>
      </div>

      {/* FILTERS */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {/* Search */}
          <input
            className="border rounded px-2 py-1"
            placeholder="Search title/desc/location"
            defaultValue={q}
            onBlur={(e) =>
              setSearchParams({
                q: e.target.value,
                type,
                audience,
                from,
                status,
                page: 1,
              })
            }
          />

          {/* Event type: pakai enum */}
          <select
            className="border rounded px-2 py-1"
            defaultValue={type}
            onChange={(e) =>
              setSearchParams({
                q,
                type: e.target.value,
                audience,
                from,
                status,
                page: 1,
              })
            }
          >
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value || 'all-types'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Audience */}
          <select
            className="border rounded px-2 py-1"
            defaultValue={audience}
            onChange={(e) =>
              setSearchParams({
                q,
                type,
                audience: e.target.value,
                from,
                status,
                page: 1,
              })
            }
          >
            <option value="">Audience (all)</option>
            <option value="all">All</option>
            <option value="students">Students</option>
            <option value="alumni">Alumni</option>
          </select>

          {/* From (start date) */}
          <input
            type="date"
            className="border rounded px-2 py-1"
            defaultValue={from}
            onBlur={(e) =>
              setSearchParams({
                q,
                type,
                audience,
                from: e.target.value,
                status,
                page: 1,
              })
            }
          />

          {/* Status: Open / Closed (ganti filter "to") */}
          <select
            className="border rounded px-2 py-1"
            defaultValue={status}
            onChange={(e) =>
              setSearchParams({
                q,
                type,
                audience,
                from,
                status: e.target.value,
                page: 1,
              })
            }
          >
            <option value="">Status (All)</option>
            <option value="open">Open Only</option>
            <option value="closed">Closed Only</option>
          </select>
        </div>
      </div>

      {/* EVENT LIST */}
      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No events found.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map((ev) => {
            const isRegistrationClosed =
              ev.is_cancelled ||
              (ev.registration_deadline &&
                new Date(ev.registration_deadline) < now) ||
              (ev.max_attendees && ev.registered_count >= ev.max_attendees);

            const isEventOver = new Date(ev.end_time) < now;

            const isClosed = isRegistrationClosed || isEventOver;

            return (
              <Link
                key={ev.event_id}
                to={`/events/${ev.event_id}`}
                className="block border rounded-lg p-4 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{ev.title}</h3>
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

                <div className="text-sm text-gray-700">{ev.location}</div>

                <div className="text-xs text-gray-500 mt-1">
                  <b>Starts:</b> {new Date(ev.start_time).toLocaleString()}
                  <br />
                  <b>Ends:</b> {new Date(ev.end_time).toLocaleString()}
                </div>

                <div className="text-xs text-gray-600 mt-1">
                  <b>Deadline:</b>{' '}
                  {ev.registration_deadline
                    ? new Date(ev.registration_deadline).toLocaleString()
                    : '-'}
                </div>

                <div className="mt-2 text-xs">
                  {capBadge(ev.registered_count, ev.max_attendees)}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            disabled={page <= 1}
            onClick={() =>
              setSearchParams({ q, type, audience, from, status, page: page - 1 })
            }
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm">
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() =>
              setSearchParams({ q, type, audience, from, status, page: page + 1 })
            }
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
