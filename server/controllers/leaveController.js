const db = require('../config/database');


// =====================================================
// HELPER: GET EMPLOYEE BY LOGGED-IN USER
// =====================================================

const getEmployeeByUserId = async (userId) => {
    return await db('employees')
        .where('user_id', userId)
        .first();
};


// =====================================================
// HELPER: CALCULATE LEAVE DAYS
// =====================================================

const calculateLeaveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const difference =
        end.getTime() - start.getTime();

    return Math.floor(
        difference / (1000 * 60 * 60 * 24)
    ) + 1;
};


const applyLeave = async (req, res) => {
    try {

        if (req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Only employees can apply for leave'
            });
        }


        const employee = await getEmployeeByUserId(req.user.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee profile not found'
            });
        }


        const {
            leave_type,
            start_date,
            end_date,
            reason
        } = req.body;


        // Required fields
        if (
            !leave_type ||
            !start_date ||
            !end_date
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'leave_type, start_date and end_date are required'
            });
        }


        // Validate dates
        const leaveDays =
            calculateLeaveDays(
                start_date,
                end_date
            );


        if (leaveDays <= 0) {
            return res.status(400).json({
                success: false,
                message:
                    'End date must be after or equal to start date'
            });
        }


        // Check overlapping leave
        const existingLeave = await db('leaves')
            .where('employee_id', employee.id)
            .whereIn('status', [
                'pending',
                'approved'
            ])
            .where(function () {

                this.whereBetween(
                    'start_date',
                    [start_date, end_date]
                )

                .orWhereBetween(
                    'end_date',
                    [start_date, end_date]
                )

                .orWhere(function () {

                    this.where(
                        'start_date',
                        '<=',
                        start_date
                    )

                    .andWhere(
                        'end_date',
                        '>=',
                        end_date
                    );
                });

            })
            .first();


        if (existingLeave) {
            return res.status(400).json({
                success: false,
                message:
                    'You already have a pending or approved leave for these dates'
            });
        }


        // Create leave
        const [leaveId] = await db('leaves')
            .insert({
                employee_id: employee.id,
                leave_type,
                start_date,
                end_date,
                reason: reason || null,
                status: 'pending'
            });


        const leave = await db('leaves')
            .where('id', leaveId)
            .first();


        return res.status(201).json({
            success: true,
            message: 'Leave application submitted successfully',
            data: {
                ...leave,
                leave_days: leaveDays
            }
        });

    } catch (error) {

        console.error('Apply Leave Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to apply for leave'
        });
    }
};


const getMyLeaves = async (req, res) => {
    try {

        if (req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message:
                    'Only employees can access their leave history'
            });
        }


        const employee =
            await getEmployeeByUserId(req.user.id);


        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee profile not found'
            });
        }


        const leaves = await db('leaves')
            .where('employee_id', employee.id)
            .orderBy('start_date', 'desc');


        return res.status(200).json({
            success: true,
            count: leaves.length,
            data: leaves
        });

    } catch (error) {

        console.error('My Leaves Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch leave history'
        });
    }
};


const getAllLeaves = async (req, res) => {
    try {

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message:
                    'Only admin can access all leave applications'
            });
        }


        const leaves = await db('leaves')

            .leftJoin(
                'employees',
                'leaves.employee_id',
                'employees.id'
            )

            .leftJoin(
                'users',
                'employees.user_id',
                'users.id'
            )

            .leftJoin(
                'departments',
                'employees.department_id',
                'departments.id'
            )

            .leftJoin(
                'designations',
                'employees.designation_id',
                'designations.id'
            )

            .select(
                'leaves.id',
                'leaves.leave_type',
                'leaves.start_date',
                'leaves.end_date',
                'leaves.reason',
                'leaves.status',
                'leaves.approved_by',
                'leaves.admin_remarks',
                'leaves.created_at',

                'employees.id as employee_id',
                'employees.employee_code',

                'users.name as employee_name',
                'users.email as employee_email',

                'departments.name as department_name',

                'designations.name as designation_name'
            )

            .orderBy(
                'leaves.created_at',
                'desc'
            );


        return res.status(200).json({
            success: true,
            count: leaves.length,
            data: leaves
        });

    } catch (error) {

        console.error('All Leaves Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch leave applications'
        });
    }
};


const approveLeave = async (req, res) => {
    try {

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can approve leave'
            });
        }


        const { id } = req.params;

        const {admin_remarks} = req.body;


        const leave = await db('leaves')
            .where('id', id)
            .first();


        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave application not found'
            });
        }


        if (leave.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message:
                    `Leave is already ${leave.status}`
            });
        }


        await db('leaves')
            .where('id', id)
            .update({
                status: 'approved',
                approved_by: req.user.id,
                admin_remarks:
                    admin_remarks || null,
                updated_at: db.fn.now()
            });


        const updatedLeave = await db('leaves')
            .where('id', id)
            .first();


        return res.status(200).json({
            success: true,
            message: 'Leave approved successfully',
            data: updatedLeave
        });

    } catch (error) {

        console.error('Approve Leave Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to approve leave'
        });
    }
};

const rejectLeave = async (req, res) => {
    try {

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can reject leave'
            });
        }


        const { id } = req.params;

        const {
            admin_remarks
        } = req.body;


        const leave = await db('leaves')
            .where('id', id)
            .first();


        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave application not found'
            });
        }


        if (leave.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message:
                    `Leave is already ${leave.status}`
            });
        }


        await db('leaves')
            .where('id', id)
            .update({
                status: 'rejected',
                approved_by: req.user.id,
                admin_remarks:
                    admin_remarks || null,
                updated_at: db.fn.now()
            });


        const updatedLeave = await db('leaves')
            .where('id', id)
            .first();


        return res.status(200).json({
            success: true,
            message: 'Leave rejected successfully',
            data: updatedLeave
        });

    } catch (error) {

        console.error('Reject Leave Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to reject leave'
        });
    }
};


module.exports = {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    approveLeave,
    rejectLeave
};