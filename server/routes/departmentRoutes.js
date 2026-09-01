const express = require('express');

const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');

const {
  authMiddleware,
  requireRole,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  requireRole('admin'),
  createDepartment
);

router.get(
  '/',
  requireRole('admin'),
  getDepartments
);

router.get(
  '/:id',
  requireRole('admin'),
  getDepartmentById
);

router.put(
  '/:id',
  requireRole('admin'),
  updateDepartment
);

router.delete(
  '/:id',
  requireRole('admin'),
  deleteDepartment
);

module.exports = router;