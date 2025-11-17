// src/pages/GroupPostDetail.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function GroupPostPage() {
  const { groupId, postId } = useParams();
  const { user } = useAuth();
  const myId = useMemo(
    () => Number(user?.id ?? user?.userId ?? 0) || null,
    [user]
  );

  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState(true);

  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // myRole tidak lagi dipakai untuk Mark as Answer, tapi boleh tetap untuk future features
  const [myRole, setMyRole] = useState(null);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/groups/${groupId}/posts/${postId}`);
      setPost(data?.post || null);
    } catch (e) {
      console.error('Post detail error:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    setLoadingReplies(true);
    try {
      const { data } = await api.get(
        `/groups/${groupId}/posts/${postId}/replies`
      );
      setReplies(data?.items || []);
    } catch (e) {
      console.error('Replies error:', e?.response?.data || e.message);
    } finally {
      setLoadingReplies(false);
    }
  };

  const fetchMyRole = async () => {
    try {
      const { data } = await api.get(`/groups/${groupId}`);
      setMyRole(data?.myRole || null);
    } catch {
      setMyRole(null);
    }
  };

  useEffect(() => {
    fetchPost();
    fetchReplies();
    if (myId) fetchMyRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, postId, myId]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      alert('Isi reply terlebih dahulu.');
      return;
    }
    if (!myId) {
      alert('Harus login untuk mengirim reply.');
      return;
    }
    setSendingReply(true);
    try {
      await api.post(`/groups/${groupId}/posts/${postId}/replies`, {
        content: replyContent.trim(),
      });
      setReplyContent('');
      await fetchReplies();
      await fetchPost(); // update reply_count
    } catch (e2) {
      console.error('Add reply error:', e2?.response?.data || e2.message);
      alert(e2?.response?.data?.error || 'Gagal menambah reply.');
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) return <div className="p-4">Loading post...</div>;
  if (!post) return <div className="p-4">Post not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* HEADER NAV */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex gap-2">
          <Link to="/groups" className="hover:underline text-blue-600">
            Groups
          </Link>
          <span>/</span>
          <Link
            to={`/groups/${groupId}`}
            className="hover:underline text-blue-600"
          >
            {post.group_name || 'Group'}
          </Link>
        </div>
        <Link
          to="/groups/feed"
          className="hover:underline text-blue-600"
        >
          Forum Feed
        </Link>
      </div>

      {/* POST CARD */}
      <div className="bg-white border rounded-lg p-4">
        <h1 className="text-xl font-semibold">{post.title}</h1>
        <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-2 items-center">
          <span>
            By{' '}
            <Link
              to={`/profile/${post.author_id}`}
              className="font-medium text-blue-600 hover:underline"
            >
              {post.author_name}
            </Link>
          </span>
          <span>•</span>
          <span>
            {post.created_at ? new Date(post.created_at).toLocaleString() : ''}
          </span>
          {post.faculty && (
            <>
              <span>•</span>
              <span>Faculty: {post.faculty}</span>
            </>
          )}
        </div>
        <div className="mt-4 text-sm text-gray-800 whitespace-pre-wrap">
          {post.content}
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Replies: {post.reply_count ?? 0}
        </div>
      </div>

      {/* REPLY FORM */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-2">Add Reply</h2>
        <form onSubmit={handleSendReply} className="space-y-2">
          <textarea
            className="w-full border rounded px-2 py-1 text-sm"
            rows={4}
            placeholder="Tulis jawaban / diskusi kamu di sini..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sendingReply}
              className="px-4 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {sendingReply ? 'Sending...' : 'Post Reply'}
            </button>
          </div>
        </form>
      </div>

      {/* REPLIES LIST */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-3">Replies</h2>
        {loadingReplies ? (
          <div className="text-xs text-gray-500">Loading replies...</div>
        ) : replies.length === 0 ? (
          <div className="text-xs text-gray-500">Belum ada reply.</div>
        ) : (
          <div className="space-y-3">
            {replies.map((r) => (
              <div
                key={r.reply_id}
                className="border rounded p-3 text-sm border-gray-200"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="text-xs text-gray-600">
                    <Link
                      to={`/profile/${r.author_id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {r.author_name}
                    </Link>{' '}
                    •{' '}
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString()
                      : ''}
                  </div>
                </div>
                <div className="mt-2 text-gray-800 whitespace-pre-wrap">
                  {r.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
