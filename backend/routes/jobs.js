// backend/routes/jobs.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  listJobs,
  getJobDetail,
  createJob,
  updateJob,
  deactivateJob,
  applyJob,
  listPostedByMe,
  listAppliedByMe,
  listApplicationsForJob,
  updateApplicationStatus,
  updateApplicationStatusByAppId, // <-- tambahkan export baru
} = require('../controllers/jobsController');

// ---- Urutan penting: literal dulu baru yang pakai :param ----

// Publik
router.get('/', listJobs);

// Perlu login (literal path)
router.get('/me/posted', auth, listPostedByMe);
router.get('/me/applied', auth, listAppliedByMe);

// Applications (literal + param spesifik)
router.get('/:jobId/applications', auth, listApplicationsForJob);
router.post('/:jobId/apply', auth, applyJob);
router.patch('/:jobId/applications/:applicationId', auth, updateApplicationStatus);

// Alias agar FE lama tetap jalan:
// PUT /job-applications/:applicationId/status { status }
router.put('/job-applications/:applicationId/status', auth, updateApplicationStatusByAppId);

// Employer job CRUD
router.post('/', auth, createJob);
router.put('/:jobId', auth, updateJob);
router.delete('/:jobId', auth, deactivateJob);

// Terakhir: detail by id (param umum)
router.get('/:jobId', getJobDetail);

module.exports = router;
