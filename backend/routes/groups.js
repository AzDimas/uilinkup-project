// backend/routes/groups.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const {
  listGroups,
  getGroupDetail,
  createGroup,
  joinGroup,
  leaveGroup,
  listGroupMembers,
  listGlobalPosts,
  listGroupPosts,
  getGroupPostDetail,
  createGroupPost,
  listPostReplies,
  addPostReply,
  markReplyAsAnswer,
} = require('../controllers/groupsController');

// ==== PUBLIC (tanpa auth wajib) ====

// daftar group (bisa di-browse semua)
router.get('/', listGroups);

// detail post (baca tanpa login)
router.get('/:groupId/posts/:postId', getGroupPostDetail);

// list replies (baca saja)
router.get('/:groupId/posts/:postId/replies', listPostReplies);

// list post per group (baca tanpa login)
router.get('/:groupId/posts', listGroupPosts);

// ==== PERLU LOGIN ====

// global feed post publik (semua group yang tidak private)
// + bisa pakai filter scope=my (My Groups)
router.get('/posts/feed', auth, listGlobalPosts);

// detail group (butuh login agar bisa tahu myRole)
router.get('/:groupId', auth, getGroupDetail);

// buat group
router.post('/', auth, createGroup);

// join / leave group
router.post('/:groupId/join', auth, joinGroup);
router.post('/:groupId/leave', auth, leaveGroup);

// lihat member group
router.get('/:groupId/members', auth, listGroupMembers);

// buat post baru dalam group
router.post('/:groupId/posts', auth, createGroupPost);

// tambah reply
router.post('/:groupId/posts/:postId/replies', auth, addPostReply);

// tandai jawaban (Q&A)
router.post(
  '/:groupId/posts/:postId/replies/:replyId/mark-answer',
  auth,
  markReplyAsAnswer
);

module.exports = router;
