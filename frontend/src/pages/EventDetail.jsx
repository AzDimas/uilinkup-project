// src/pages/EventDetail.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function EventDetail() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const myId = useMemo(
    () => Number(user?.id ?? user?.userId ?? 0) || null,
    [user]
  );

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myReg, setMyReg] = useState(null);
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await eventsAPI.detail(eventId);
      setEvent(data?.event || null);
      setMyReg(data?.myRegistration || null);
    } catch (e) {
      console.error('Event detail error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!event) return <div className="p-4">Event not found.</div>;

  const mine = Number(event.organizer_id) === Number(myId);

  const now = new Date();
  const endTime = event.end_time ? new Date(event.end_time) : null;
  const regDeadline = event.registration_deadline
    ? new Date(event.registration_deadline)
    : null;

  // --- Logic status pendaftaran + alasan ---
  let canRegister = true;
  let registerLabel = 'Register';

  if (event.is_cancelled) {
    canRegister = false;
    registerLabel = 'Event dibatalkan';
  } else if (endTime && endTime < now) {
    canRegister = false;
    registerLabel = 'Event sudah selesai';
  } else if (regDeadline && regDeadline < now) {
    canRegister = false;
    registerLabel = 'Periode pendaftaran telah berakhir';
  } else if (
    event.max_attendees &&
    event.registered_count >= event.max_attendees
  ) {
    canRegister = false;
    registerLabel = 'Kuota penuh';
  }

  const isClosed = !canRegister;

  const register = async () => {
    if (!canRegister) return;
    setWorking(true);
    try {
      await eventsAPI.register(event.event_id);
      await load();
      alert('Registered!');
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to register');
    } finally {
      setWorking(false);
    }
  };

  const unregister = async () => {
    if (!window.confirm('Batalkan pendaftaran event ini?')) return;
    setWorking(true);
    try {
      await eventsAPI.unregister(event.event_id);
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to unregister');
    } finally {
      setWorking(false);
    }
  };

  const cancelEvent = async () => {
    if (!window.confirm('Batalkan event ini? Peserta tidak lagi bisa mendaftar.')) return;
    setWorking(true);
    try {
      await eventsAPI.cancel(event.event_id);
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to cancel');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white border rounded-lg p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <div className="text-gray-700">{event.location}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(event.start_time).toLocaleString()} —{' '}
              {new Date(event.end_time).toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {event.is_cancelled && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700">
                Cancelled
              </span>
            )}
            {!event.is_cancelled &&
              (isClosed ? (
                <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700">
                  Closed
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">
                  Open
                </span>
              ))}
          </div>
        </div>

        {event.cover_image ? (
          <img src={event.cover_image} alt="" className="mt-3 w-full rounded" />
        ) : null}

        <div className="mt-4 whitespace-pre-wrap">{event.description}</div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Audience:</span> {event.audience}
          </div>
          <div>
            <span className="text-gray-500">Public:</span>{' '}
            {event.is_public ? 'Yes' : 'No'}
          </div>
          <div>
            <span className="text-gray-500">Capacity:</span>{' '}
            {event.max_attendees || '-'}
          </div>
          <div>
            <span className="text-gray-500">Registered:</span>{' '}
            {event.registered_count}
          </div>
          <div>
            <span className="text-gray-500">Registration Deadline:</span>{' '}
            {event.registration_deadline
              ? new Date(event.registration_deadline).toLocaleString()
              : '-'}
          </div>
          <div>
            <span className="text-gray-500">Organizer ID:</span>{' '}
            {event.organizer_id}
          </div>
        </div>

        {/* Info jika sudah terdaftar */}
        {myReg && (
          <div className="mt-6 p-4 border rounded bg-green-50">
            <div className="font-semibold mb-1">You are registered ✅</div>
            <div className="text-sm">
              Registered at:{' '}
              {new Date(myReg.registered_at).toLocaleString()}
            </div>
            <div className="mt-3 text-sm">
              <div className="text-gray-500">Extra info for participants:</div>
              <div>Meeting Link: {event.meeting_link || '-'}</div>
              {/* Bisa tambah info khusus peserta di sini */}
            </div>
            <div className="mt-3">
              <button
                disabled={working}
                onClick={unregister}
                className="px-3 py-1 border rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Cancel my registration
              </button>
            </div>
          </div>
        )}

        {/* Tombol utama: Register / Registered / alasan tutup */}
        {!mine && (
          <div className="mt-6">
            {myReg ? (
              <button
                disabled
                className="bg-green-600 text-white px-4 py-2 rounded opacity-70 cursor-default"
              >
                Registered
              </button>
            ) : (
              <button
                disabled={working || !canRegister}
                onClick={canRegister ? register : undefined}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {canRegister ? 'Register' : registerLabel}
              </button>
            )}
          </div>
        )}

        {mine && (
          <div className="mt-6 flex items-center gap-3">
            <Link
              to={`/events/${event.event_id}/registrants`}
              className="px-3 py-1 border rounded hover:bg-gray-50"
            >
              View Registrants
            </Link>
            {!event.is_cancelled && (
              <button
                disabled={working}
                onClick={cancelEvent}
                className="px-3 py-1 border rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Cancel Event
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
