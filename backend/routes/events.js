// backend/routes/events.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const {
  listEvents,
  getEventDetail,
  createEvent,
  updateEvent,
  cancelEvent,
  registerEvent,
  unregisterEvent,
  listMyHosting,
  listMyRegistered,
  listRegistrants,
} = require('../controllers/eventsController');

// Publik
router.get('/', listEvents); // /api/events?q=&type=&audience=&from=&to=&page=&pageSize=&onlyPublic=

// Perlu login - "me" dulu
router.get('/me/hosting/list', auth, listMyHosting);
router.get('/me/registered/list', auth, listMyRegistered);

// Detail event publik (boleh tanpa login)
router.get('/:eventId', getEventDetail);

// Perlu login - CRUD event
router.post('/', auth, createEvent);
router.put('/:eventId', auth, updateEvent);
router.delete('/:eventId', auth, cancelEvent); // cancel (soft)

// Registrasi event
router.post('/:eventId/register', auth, registerEvent);
router.delete('/:eventId/register', auth, unregisterEvent);

// Organizer only: lihat peserta
router.get('/:eventId/registrants', auth, listRegistrants);

module.exports = router;
