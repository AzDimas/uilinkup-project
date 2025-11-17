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
  updateApplicationStatusByAppId
} = require('../controllers/jobsController');

// PUBLIC
router.get('/', listJobs);

// USER (needs login)
router.get('/me/posted', auth, listPostedByMe);
router.get('/me/applied', auth, listAppliedByMe);

// APPLICATIONS
router.get('/:jobId/applications', auth, listApplicationsForJob);
router.post('/:jobId/apply', auth, applyJob);
router.patch('/:jobId/applications/:applicationId', auth, updateApplicationStatus);

// LEGACY ROUTE (keep compatibility)
router.put('/job-applications/:applicationId/status', auth, updateApplicationStatusByAppId);

// JOB CRUD (employer only)
router.post('/', auth, createJob);
router.put('/:jobId', auth, updateJob);
router.delete('/:jobId', auth, deactivateJob);

// DETAIL (always at bottom)
router.get('/:jobId', getJobDetail);

module.exports = router;
