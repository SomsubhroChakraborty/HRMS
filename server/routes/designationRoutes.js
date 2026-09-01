const express = require('express');

const {
  createDesignation,
  getDesignations,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
} = require('../controllers/designationController');

const {
  authMiddleware,
  requireRole,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  requireRole('admin'),
  createDesignation
);

router.get(
  '/',
  requireRole('admin'),
  getDesignations
);

router.get(
  '/:id',
  requireRole('admin'),
  getDesignationById
);

router.put(
  '/:id',
  requireRole('admin'),
  updateDesignation
);

router.delete(
  '/:id',
  requireRole('admin'),
  deleteDesignation
);

module.exports = router;