const db = require('../config/database');


const getEmployeeByUserId = async (userId) => {
    return await db('employees')
        .where('user_id', userId)
        .first();
};

const getTodayDate = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const formatWorkingTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
};
     
const clockIn = async (req, res) => {
    try {

        // Only employees can clock in
        if (req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Only employees can clock in'
            });
        }


        // Find employee profile
        const employee = await getEmployeeByUserId(req.user.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee profile not found'
            });
        }


        // Employee must be active
        if (employee.employment_status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Inactive employee cannot clock in'
            });
        }


        const today = getTodayDate();


        // Check if attendance already exists
        const existingAttendance = await db('attendance')
            .where({
                employee_id: employee.id,
                attendance_date: today
            })
            .first();


        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'You have already clocked in today'
            });
        }


        // Current server time
        const now = new Date();


        // Office start time = 09:00 AM
        const officeStartMinutes = 9 * 60;

        const currentMinutes =
            now.getHours() * 60 + now.getMinutes();


        let lateMinutes = 0;
        let status = 'present';


        // Check late
        if (currentMinutes > officeStartMinutes) {

            lateMinutes =
                currentMinutes - officeStartMinutes;

            status = 'late';
        }


        // Create attendance
        const [attendanceId] = await db('attendance')
            .insert({
                employee_id: employee.id,
                attendance_date: today,
                clock_in: db.fn.now(),
                clock_out: null,
                status: status,
                late_minutes: lateMinutes,
                early_departure_minutes: 0,
                working_minutes: 0,
                remarks:
                    lateMinutes > 0
                        ? `Late by ${lateMinutes} minutes`
                        : 'Employee arrived on time'
            });


        // Get created attendance
        const attendance = await db('attendance')
            .where('id', attendanceId)
            .first();


        return res.status(201).json({
            success: true,
            message:
                lateMinutes > 0
                    ? `Clock in successful. You are ${lateMinutes} minutes late.`
                    : 'Clock in successful',

            data: attendance
        });

    } catch (error) {

        console.error('Clock In Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to clock in'
        });
    }
};


const clockOut = async (req, res) => {
    try {

        // Only employees
        if (req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Only employees can clock out'
            });
        }


        // Find employee
        const employee = await getEmployeeByUserId(req.user.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee profile not found'
            });
        }


        const today = getTodayDate();


        // Find today's attendance
        const attendance = await db('attendance')
            .where({
                employee_id: employee.id,
                attendance_date: today
            })
            .first();


        if (!attendance) {
            return res.status(400).json({
                success: false,
                message: 'Please clock in first'
            });
        }


        // Already clocked out
        if (attendance.clock_out) {
            return res.status(400).json({
                success: false,
                message: 'You have already clocked out today'
            });
        }


        const now = new Date();


        // Office end time = 06:00 PM
        const officeEndMinutes = 18 * 60;

        const currentMinutes =
            now.getHours() * 60 + now.getMinutes();


        let earlyDepartureMinutes = 0;


        // Check early departure
        if (currentMinutes < officeEndMinutes) {

            earlyDepartureMinutes =
                officeEndMinutes - currentMinutes;
        }


        // Calculate working minutes
        const clockInTime =
            new Date(attendance.clock_in);

        const workingMinutes = Math.max(
            0,
            Math.floor(
                (now.getTime() - clockInTime.getTime()) / 60000
            )
        );


        // Existing status can be "present" or "late"
        let status = attendance.status;


        // If employee left early
        if (
            earlyDepartureMinutes > 0 &&
            status === 'present'
        ) {
            status = 'half_day';
        }


        await db('attendance')
            .where('id', attendance.id)
            .update({
                clock_out: db.fn.now(),
                working_minutes: workingMinutes,
                early_departure_minutes: earlyDepartureMinutes,
                status: status,
                updated_at: db.fn.now()
            });


        // Get updated attendance
        const updatedAttendance = await db('attendance')
            .where('id', attendance.id)
            .first();


        return res.status(200).json({
            success: true,

            message:
                earlyDepartureMinutes > 0
                    ? `Clock out successful. You left ${earlyDepartureMinutes} minutes early.`
                    : 'Clock out successful',

            data: {
                ...updatedAttendance,

                working_time:
                    formatWorkingTime(workingMinutes)
            }
        });

    } catch (error) {

        console.error('Clock Out Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to clock out'
        });
    }
};


const getTodayAttendance = async (req, res) => {
    try {

        if (req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Only employees can access this endpoint'
            });
        }


        const employee = await getEmployeeByUserId(req.user.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee profile not found'
            });
        }


        const today = getTodayDate();


        const attendance = await db('attendance')
            .where({
                employee_id: employee.id,
                attendance_date: today
            })
            .first();


        return res.status(200).json({
            success: true,
            data: attendance || null
        });

    } catch (error) {

        console.error(
            'Get Today Attendance Error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch today attendance'
        });
    }
};

const getMyAttendance = async (req, res) => {
    try {

        if (req.user.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Only employees can access this endpoint'
            });
        }


        const employee = await getEmployeeByUserId(req.user.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee profile not found'
            });
        }


        const attendance = await db('attendance')
            .where('employee_id', employee.id)
            .orderBy('attendance_date', 'desc');


        return res.status(200).json({
            success: true,
            count: attendance.length,
            data: attendance
        });

    } catch (error) {

        console.error(
            'Get My Attendance Error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance'
        });
    }
};

const getAllAttendance = async (req, res) => {
    try {

        // Only admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can access attendance'
            });
        }


        const attendance = await db('attendance')

            .leftJoin(
                'employees',
                'attendance.employee_id',
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
                'attendance.id',
                'attendance.attendance_date',
                'attendance.clock_in',
                'attendance.clock_out',
                'attendance.status',
                'attendance.late_minutes',
                'attendance.early_departure_minutes',
                'attendance.working_minutes',
                'attendance.remarks',

                'employees.id as employee_id',
                'employees.employee_code',

                'users.name as employee_name',
                'users.email as employee_email',

                'departments.name as department_name',

                'designations.name as designation_name'
            )

            .orderBy(
                'attendance.attendance_date',
                'desc'
            );


        return res.status(200).json({
            success: true,
            count: attendance.length,
            data: attendance
        });

    } catch (error) {

        console.error(
            'Get All Attendance Error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance'
        });
    }
};

module.exports = {
    clockIn,
    clockOut,
    getTodayAttendance,
    getMyAttendance,
    getAllAttendance
};