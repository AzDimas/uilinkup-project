// src/pages/MyEvents.jsx
import React, { useEffect, useState } from 'react';
import { eventsAPI } from '../services/api';
import { Link } from 'react-router-dom';

export default function MyEvents() {
  const [hosting, setHosting] = useState([]);
  const [registered, setRegistered] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [h, r] = await Promise.all([eventsAPI.myHosting(), eventsAPI.myRegistered()]);
      setHosting(h?.data?.items || []);
      setRegistered(r?.data?.items || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Events</h1>

      {loading ? <div>Loading...</div> : (
        <>
          <div className="mb-6">
            <div className="font-semibold mb-2">I'm Hosting</div>
            {hosting.length === 0 ? (
              <div className="text-gray-500">No hosted events.</div>
            ) : (
              <div className="space-y-2">
                {hosting.map(ev => (
                  <div key={ev.event_id} className="border rounded p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{ev.title}</div>
                      <div className="text-sm text-gray-700">{ev.location}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(ev.start_time).toLocaleString()} — {new Date(ev.end_time).toLocaleString()}
                      </div>
                      <div className="text-xs">Registered: {ev.registered_count}{ev.max_attendees ? ` / ${ev.max_attendees}` : ''}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/events/${ev.event_id}`} className="px-3 py-1 border rounded">View</Link>
                      <Link to={`/events/${ev.event_id}/registrants`} className="px-3 py-1 border rounded">Registrants</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="font-semibold mb-2">I'm Registered</div>
            {registered.length === 0 ? (
              <div className="text-gray-500">No registrations yet.</div>
            ) : (
              <div className="space-y-2">
                {registered.map(ev => (
                  <div key={ev.event_id} className="border rounded p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{ev.title}</div>
                      <div className="text-sm text-gray-700">{ev.location}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(ev.start_time).toLocaleString()} — {new Date(ev.end_time).toLocaleString()}
                      </div>
                    </div>
                    <Link to={`/events/${ev.event_id}`} className="px-3 py-1 border rounded">View</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
