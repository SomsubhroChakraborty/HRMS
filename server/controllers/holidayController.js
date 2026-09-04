const db = require('../config/database');


// ==========================================
// CREATE HOLIDAY
// ==========================================

const createHoliday = async (req, res) => {
    try {

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can create holidays'
            });
        }

        const {
            holiday_name,
            holiday_date,
            holiday_type,
            is_paid,
            remarks
        } = req.body;


        if (!holiday_name || !holiday_date) {
            return res.status(400).json({
                success: false,
                message: 'holiday_name and holiday_date are required'
            });
        }


        const existingHoliday = await db('holidays')
            .where('holiday_date', holiday_date)
            .first();


        if (existingHoliday) {
            return res.status(400).json({
                success: false,
                message: 'A holiday already exists on this date'
            });
        }


        const [id] = await db('holidays').insert({
            holiday_name,
            holiday_date,
            holiday_type: holiday_type || 'company',
            is_paid: is_paid !== undefined ? is_paid : true,
            remarks: remarks || null
        });


        const holiday = await db('holidays')
            .where('id', id)
            .first();


        return res.status(201).json({
            success: true,
            message: 'Holiday created successfully',
            data: holiday
        });

    } catch (error) {

        console.error('Create Holiday Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to create holiday'
        });
    }
};


// ==========================================
// GET ALL HOLIDAYS
// ==========================================

const getAllHolidays = async (req, res) => {
    try {

        const holidays = await db('holidays')
            .orderBy('holiday_date', 'asc');


        return res.status(200).json({
            success: true,
            count: holidays.length,
            data: holidays
        });

    } catch (error) {

        console.error('Get Holidays Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch holidays'
        });
    }
};


// ==========================================
// GET HOLIDAY BY ID
// ==========================================

const getHolidayById = async (req, res) => {
    try {

        const { id } = req.params;

        const holiday = await db('holidays')
            .where('id', id)
            .first();


        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found'
            });
        }


        return res.status(200).json({
            success: true,
            data: holiday
        });

    } catch (error) {

        console.error('Get Holiday Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch holiday'
        });
    }
};


// ==========================================
// UPDATE HOLIDAY
// ==========================================

const updateHoliday = async (req, res) => {
    try {

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can update holidays'
            });
        }


        const { id } = req.params;

        const {
            holiday_name,
            holiday_date,
            holiday_type,
            is_paid,
            remarks
        } = req.body;


        const holiday = await db('holidays')
            .where('id', id)
            .first();


        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found'
            });
        }


        if (holiday_date) {

            const duplicate = await db('holidays')
                .where('holiday_date', holiday_date)
                .whereNot('id', id)
                .first();


            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: 'Another holiday already exists on this date'
                });
            }
        }


        await db('holidays')
            .where('id', id)
            .update({
                holiday_name:
                    holiday_name ?? holiday.holiday_name,

                holiday_date:
                    holiday_date ?? holiday.holiday_date,

                holiday_type:
                    holiday_type ?? holiday.holiday_type,

                is_paid:
                    is_paid ?? holiday.is_paid,

                remarks:
                    remarks ?? holiday.remarks,

                updated_at: db.fn.now()
            });


        const updatedHoliday = await db('holidays')
            .where('id', id)
            .first();


        return res.status(200).json({
            success: true,
            message: 'Holiday updated successfully',
            data: updatedHoliday
        });

    } catch (error) {

        console.error('Update Holiday Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update holiday'
        });
    }
};


// ==========================================
// DELETE HOLIDAY
// ==========================================

const deleteHoliday = async (req, res) => {
    try {

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can delete holidays'
            });
        }


        const { id } = req.params;


        const holiday = await db('holidays')
            .where('id', id)
            .first();


        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found'
            });
        }


        await db('holidays')
            .where('id', id)
            .del();


        return res.status(200).json({
            success: true,
            message: 'Holiday deleted successfully'
        });

    } catch (error) {

        console.error('Delete Holiday Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to delete holiday'
        });
    }
};


module.exports = {
    createHoliday,
    getAllHolidays,
    getHolidayById,
    updateHoliday,
    deleteHoliday
};