const express = require('express');

const router = express.Router();

const holidayController = require('../controllers/holidayController');

const {
    authMiddleware,
    requireRole
} = require('../middleware/authMiddleware');



router.post(
    '/',
    authMiddleware,
    requireRole('admin'),
    holidayController.createHoliday
);



router.get(
    '/',
    authMiddleware,
    holidayController.getAllHolidays
);



router.get(
    '/:id',
    authMiddleware,
    holidayController.getHolidayById
);


router.put(
    '/:id',
    authMiddleware,
    requireRole('admin'),
    holidayController.updateHoliday
);



router.delete(
    '/:id',
    authMiddleware,
    requireRole('admin'),
    holidayController.deleteHoliday
);


module.exports = router;