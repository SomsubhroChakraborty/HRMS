const express = require('express');

const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    approveLeave,
    rejectLeave
} = require('../controllers/leaveController');

const {
    authMiddleware
} = require('../middleware/authMiddleware');

const router = express.Router();


// All leave routes require login
router.use(authMiddleware);


// Employee
router.post('/', applyLeave);

router.get('/my', getMyLeaves);


// Admin
router.get('/', getAllLeaves);

router.put('/:id/approve', approveLeave);

router.put('/:id/reject', rejectLeave);


module.exports = router;