// src/pages/GroupDetail.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const groupTypeLabel = (t) => {
  const map = {
    faculty: 'Faculty Forum',
    program: 'Program Forum',
    interest: 'Interest / Topic Forum',
  };
  return map[t] || t || '-';
};

export default function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const myId = useMemo(
    () => Number(user?.id ?? user?.userId ?? 0) || null,
    [user]
  );

  const [group, setGroup] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(true);

  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [postSearch, setPostSearch] = useState('');
  const [postPage, setPostPage] = useState(1);
  const postPageSize = 10;

  const [joining, setJoining] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
  });

  const totalPostPages = Math.max(1, Math.ceil(totalPosts / postPageSize));
  const isMember = !!myRole;

  const fetchGroup = async () => {
    setLoadingGroup(true);
    try {
      const { data } = await api.get(`/groups/${groupId}`);
      setGroup(data?.group || null);
      setMyRole(data?.myRole || null);
    } catch (e) {
      console.error('Group detail error:', e?.response?.data || e.message);
    } finally {
      setLoadingGroup(false);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data } = await api.get(`/groups/${groupId}/posts`, {
        params: { q: postSearch, page: postPage, pageSize: postPageSize },
      });
      setPosts(data?.items || []);
      setTotalPosts(data?.total || 0);
    } catch (e) {
      console.error('Group posts error:', e?.response?.data || e.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, postSearch, postPage]);

  const handleJoin = async () => {
    if (!myId) {
      alert('Harus login untuk join group.');
      return;
    }
    setJoining(true);
    try {
      await api.post(`/groups/${groupId}/join`);
      await fetchGroup();
      await fetchPosts();
    } catch (e) {
      console.error('Join group error:', e?.response?.data || e.message);
      alert(e?.response?.data?.error || 'Gagal join group.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    setJoining(true);
    try {
      await api.post(`/groups/${groupId}/leave`);
      await fetchGroup();
    } catch (e) {
      console.error('Leave group error:', e?.response?.data || e.message);
      alert(e?.response?.data?.error || 'Gagal leave group.');
    } finally {
      setJoining(false);
    }
  };

  const onChangePostForm = (e) => {
    const { name, value } = e.target;
    setPostForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmitPost = async (e) => {
    e.preventDefault();
    if (!isMember) {
      alert('Anda harus menjadi member group untuk membuat post.');
      return;
    }
    if (!postForm.title.trim() || !postForm.content.trim()) {
      alert('Judul dan konten wajib diisi.');
      return;
    }
    try {
      const payload = {
        title: postForm.title.trim(),
        content: postForm.content.trim(),
      };
      await api.post(`/groups/${groupId}/posts`, payload);
      alert('Post berhasil dibuat.');
      setPostForm({ title: '', content: '' });
      setCreatingPost(false);
      setPostPage(1);
      await fetchPosts();
    } catch (e2) {
      console.error('Create post error:', e2?.response?.data || e2.message);
      alert(e2?.response?.data?.error || 'Gagal membuat post.');
    }
  };

  if (loadingGroup) return <div className="p-4">Loading group...</div>;
  if (!group) return <div className="p-4">Group not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      {/* HEADER */}
      <div className="bg-white border rounded-lg p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-2 items-center">
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100">
              {groupTypeLabel(group.group_type)}
            </span>
            {group.faculty && (
              <span className="text-xs text-gray-700">
                Faculty: {group.faculty}
              </span>
            )}
            {group.group_type === 'interest' && group.interest_field && (
              <span className="text-xs text-gray-700">
                Topic: {group.interest_field}
              </span>
            )}
          </div>
          {group.description && (
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
              {group.description}
            </p>
          )}
          <div className="mt-3 text-xs text-gray-500">
            Created by {group.creator_name} ({group.creator_email}) •{' '}
            {group.created_at
              ? new Date(group.created_at).toLocaleString()
              : ''}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col items-end gap-2">
          <div className="text-xs text-gray-500">
            Members: {group.member_count ?? 0}
          </div>
          <div className="flex gap-2 items-center">
            {isMember ? (
              <>
                {myRole && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {myRole}
                  </span>
                )}
                {myRole !== 'owner' && (
                  <button
                    onClick={handleLeave}
                    disabled={joining}
                    className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {joining ? 'Leaving...' : 'Exit Group'}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {joining ? 'Joining...' : 'Join Group'}
              </button>
            )}
          </div>
          <Link
            to="/groups/feed"
            className="text-xs text-blue-600 hover:underline"
          >
            ← Forum Feed
          </Link>
        </div>
      </div>

      {/* MEMBERS LINK */}
      <div className="bg-white border rounded-lg p-3 text-xs flex items-center justify-between">
        <span>
          You can view all members of this group for networking and collaboration.
        </span>
        <Link
          to={`/groups/${groupId}/members`}
          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
        >
          View Members
        </Link>
      </div>

      {/* POSTS HEADER + SEARCH + NEW POST */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="font-semibold text-sm">Posts in this Group</div>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Search posts (title/content)"
            value={postSearch}
            onChange={(e) => {
              setPostSearch(e.target.value);
              setPostPage(1);
            }}
          />
          {isMember && (
            <button
              onClick={() => setCreatingPost((v) => !v)}
              className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {creatingPost ? 'Cancel' : 'New Post'}
            </button>
          )}
        </div>
      </div>

      {/* NEW POST FORM */}
      {creatingPost && isMember && (
        <div className="bg-white border rounded-lg p-4">
          <form onSubmit={onSubmitPost} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Title</label>
              <input
                name="title"
                className="border rounded w-full px-2 py-1 text-sm"
                value={postForm.title}
                onChange={onChangePostForm}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Content</label>
              <textarea
                name="content"
                className="border rounded w-full px-2 py-1 text-sm"
                rows={5}
                value={postForm.content}
                onChange={onChangePostForm}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Visibility: currently only <b>public</b> is used.
              </span>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Publish Post
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POSTS LIST */}
      <div className="bg-white border rounded-lg p-4">
        {loadingPosts ? (
          <div className="text-sm text-gray-500">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-sm text-gray-500">
            No posts yet. {isMember && 'Be the first to post!'}
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <Link
                key={p.post_id}
                to={`/groups/${groupId}/posts/${p.post_id}`}
                className="block border rounded p-3 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{p.title}</h3>
                  {p.is_pinned && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                      Pinned
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                  {p.content}
                </div>
                <div className="mt-2 text-xs text-gray-400 flex justify-between">
                  <span>
                    By {p.author_name} • Replies: {p.reply_count ?? 0}
                  </span>
                  <span>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString()
                      : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPostPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              disabled={postPage <= 1}
              onClick={() => setPostPage((pp) => pp - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 text-xs"
            >
              Prev
            </button>
            <span className="text-xs">
              Page {postPage} / {totalPostPages}
            </span>
            <button
              disabled={postPage >= totalPostPages}
              onClick={() => setPostPage((pp) => pp + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 text-xs"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
