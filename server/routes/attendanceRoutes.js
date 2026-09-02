const express = require('express');

const {
    clockIn,
    clockOut,
    getTodayAttendance,
    getMyAttendance,
    getAllAttendance
} = require('../controllers/attendanceController');

const {
    authMiddleware
} = require('../middleware/authMiddleware');

const router = express.Router();


// All attendance APIs require JWT
router.use(authMiddleware);


// Employee
router.post('/clock-in', clockIn);

router.post('/clock-out', clockOut);

router.get('/my/today', getTodayAttendance);

router.get('/my', getMyAttendance);


// Admin
router.get('/', getAllAttendance);


module.exports = router;