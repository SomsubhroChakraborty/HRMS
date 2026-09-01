const express = require('express');

const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');

const {
  authMiddleware,
} = require('../middleware/authMiddleware');

const router = express.Router();


// All employee APIs require login
router.use(authMiddleware);


// Create employee
router.post('/', createEmployee);


// Get all employees
router.get('/', getEmployees);


// Get employee
router.get('/:id', getEmployeeById);


// Update employee
router.put('/:id', updateEmployee);


// Delete employee
router.delete('/:id', deleteEmployee);


module.exports = router;