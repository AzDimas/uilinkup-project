// src/pages/EventRegistrants.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';

export default function EventRegistrants() {
  const { eventId } = useParams();
  const nav = useNavigate();
  const [event, setEvent] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [d, r] = await Promise.all([
        eventsAPI.detail(eventId),
        eventsAPI.registrants(eventId)
      ]);
      setEvent(d?.data?.event || null);
      setItems(r?.data?.items || []);
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [eventId]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => nav(-1)} className="px-3 py-1 border rounded hover:bg-gray-50">Back</button>
          <h1 className="text-2xl font-bold">Event Registrants</h1>
        </div>
        <Link to={`/events/${eventId}`} className="text-blue-600 hover:underline">View Event →</Link>
      </div>

      {event && (
        <div className="bg-white border rounded p-4 mb-4">
          <div className="font-semibold text-lg">{event.title}</div>
          <div className="text-sm text-gray-700">
            {event.location} • {new Date(event.start_time).toLocaleString()} — {new Date(event.end_time).toLocaleString()}
          </div>
          <div className="text-xs mt-1">Registered: {event.registered_count}{event.max_attendees ? ` / ${event.max_attendees}` : ''}</div>
        </div>
      )}

      <div className="bg-white border rounded">
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-gray-500">No registrants.</div>
        ) : (
          <ul className="divide-y">
            {items.map((a) => (
              <li key={`${a.event_id}-${a.user_id}`} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold">
                      <Link to={`/profile/${a.user_id}`} className="text-blue-600 hover:underline">
                        {a.name || 'Unnamed'}
                      </Link>
                    </div>
                    <div className="text-sm text-gray-600">{a.email || '-'}</div>

                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Student NIM/IPK:</span> {a.nim || '-'} {a.ipk ? `(IPK ${a.ipk})` : ''}</div>
                      <div><span className="text-gray-500">Semester:</span> {a.current_semester ?? '-'}</div>
                      <div><span className="text-gray-500">Alumni Company:</span> {a.alumni_company || '-'}</div>
                      <div><span className="text-gray-500">Current Job:</span> {a.current_job || '-'}</div>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      Registered: {a.registered_at ? new Date(a.registered_at).toLocaleString() : '-'}
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
