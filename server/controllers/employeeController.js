const bcrypt = require('bcryptjs');
const db = require('../config/database');


// =====================================================
// CREATE EMPLOYEE
// Admin creates USER + EMPLOYEE together
// =====================================================

const createEmployee = async (req, res) => {
  const trx = await db.transaction();

  try {
    const {
      name,
      email,
      password,

      employee_code,
      phone,
      date_of_birth,
      gender,
      address,

      department_id,
      designation_id,

      joining_date,
      employment_status,

      bank_name,
      account_holder_name,
      account_number,
      ifsc_code,
    } = req.body;


    // -----------------------------
    // Required fields
    // -----------------------------

    if (
      !name ||
      !email ||
      !password ||
      !employee_code ||
      !department_id ||
      !designation_id ||
      !joining_date
    ) {
      await trx.rollback();

      return res.status(400).json({
        success: false,
        message:
          'name, email, password, employee_code, department_id, designation_id and joining_date are required',
      });
    }


    // -----------------------------
    // Check email
    // -----------------------------

    const existingUser = await trx('users')
      .where({ email })
      .first();

    if (existingUser) {
      await trx.rollback();

      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    }


    // -----------------------------
    // Check employee code
    // -----------------------------

    const existingEmployee = await trx('employees')
      .where({ employee_code })
      .first();

    if (existingEmployee) {
      await trx.rollback();

      return res.status(409).json({
        success: false,
        message: 'Employee code already exists',
      });
    }


    // -----------------------------
    // Check department
    // -----------------------------

    const department = await trx('departments')
      .where({ id: department_id })
      .first();

    if (!department) {
      await trx.rollback();

      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }


    // -----------------------------
    // Check designation
    // -----------------------------

    const designation = await trx('designations')
      .where({ id: designation_id })
      .first();

    if (!designation) {
      await trx.rollback();

      return res.status(404).json({
        success: false,
        message: 'Designation not found',
      });
    }


    // -----------------------------
    // Hash password
    // -----------------------------

    const hashedPassword = await bcrypt.hash(password, 10);


    // -----------------------------
    // Create USER
    // -----------------------------

    const [userId] = await trx('users').insert({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      is_active: true,
    });


    // -----------------------------
    // Create EMPLOYEE
    // -----------------------------

    const [employeeId] = await trx('employees').insert({
      user_id: userId,

      employee_code,

      phone: phone || null,

      date_of_birth: date_of_birth || null,

      gender: gender || null,

      address: address || null,

      department_id,

      designation_id,

      joining_date,

      employment_status:
        employment_status || 'active',

      bank_name: bank_name || null,

      account_holder_name:
        account_holder_name || null,

      account_number:
        account_number || null,

      ifsc_code:
        ifsc_code || null,
    });


    // -----------------------------
    // Commit transaction
    // -----------------------------

    await trx.commit();


    // -----------------------------
    // Return employee
    // -----------------------------

    const employee = await getEmployeeDetails(
      employeeId
    );


    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee,
    });

  } catch (error) {

    try {
      await trx.rollback();
    } catch (_) {}

    console.error(
      'Create employee error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to create employee',
    });
  }
};


// =====================================================
// GET ALL EMPLOYEES
// =====================================================

const getEmployees = async (req, res) => {
  try {

    const employees = await db('employees')

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
        'employees.id',
        'employees.employee_code',

        'employees.phone',
        'employees.date_of_birth',
        'employees.gender',
        'employees.address',

        'employees.joining_date',
        'employees.employment_status',

        'employees.bank_name',
        'employees.account_holder_name',
        'employees.account_number',
        'employees.ifsc_code',

        'users.id as user_id',
        'users.name as employee_name',
        'users.email',

        'departments.id as department_id',
        'departments.name as department_name',

        'designations.id as designation_id',
        'designations.name as designation_name'
      )

      .orderBy(
        'employees.id',
        'desc'
      );


    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });

  } catch (error) {

    console.error(
      'Get employees error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
    });
  }
};


// =====================================================
// GET EMPLOYEE BY ID
// =====================================================

const getEmployeeById = async (req, res) => {
  try {

    const { id } = req.params;

    const employee =
      await getEmployeeDetails(id);


    if (!employee) {

      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }


    return res.status(200).json({
      success: true,
      data: employee,
    });

  } catch (error) {

    console.error(
      'Get employee error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
    });
  }
};


// =====================================================
// UPDATE EMPLOYEE
// =====================================================

const updateEmployee = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      name,
      email,

      employee_code,
      phone,
      date_of_birth,
      gender,
      address,

      department_id,
      designation_id,

      joining_date,
      employment_status,

      bank_name,
      account_holder_name,
      account_number,
      ifsc_code,
    } = req.body;


    const employee = await db('employees')
      .where({ id })
      .first();


    if (!employee) {

      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }


    // --------------------------------
    // Employee code duplicate
    // --------------------------------

    if (
      employee_code &&
      employee_code !== employee.employee_code
    ) {

      const duplicate =
        await db('employees')
          .where({ employee_code })
          .whereNot({ id })
          .first();


      if (duplicate) {

        return res.status(409).json({
          success: false,
          message: 'Employee code already exists',
        });
      }
    }


    // --------------------------------
    // Department validation
    // --------------------------------

    if (department_id !== undefined) {

      const department =
        await db('departments')
          .where({
            id: department_id
          })
          .first();


      if (!department) {

        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }
    }


    // --------------------------------
    // Designation validation
    // --------------------------------

    if (designation_id !== undefined) {

      const designation =
        await db('designations')
          .where({
            id: designation_id
          })
          .first();


      if (!designation) {

        return res.status(404).json({
          success: false,
          message: 'Designation not found',
        });
      }
    }


    // --------------------------------
    // Update employee
    // --------------------------------

    const employeeData = {};


    if (employee_code !== undefined)
      employeeData.employee_code =
        employee_code;

    if (phone !== undefined)
      employeeData.phone = phone;

    if (date_of_birth !== undefined)
      employeeData.date_of_birth =
        date_of_birth;

    if (gender !== undefined)
      employeeData.gender = gender;

    if (address !== undefined)
      employeeData.address = address;

    if (department_id !== undefined)
      employeeData.department_id =
        department_id;

    if (designation_id !== undefined)
      employeeData.designation_id =
        designation_id;

    if (joining_date !== undefined)
      employeeData.joining_date =
        joining_date;

    if (employment_status !== undefined)
      employeeData.employment_status =
        employment_status;

    if (bank_name !== undefined)
      employeeData.bank_name =
        bank_name;

    if (account_holder_name !== undefined)
      employeeData.account_holder_name =
        account_holder_name;

    if (account_number !== undefined)
      employeeData.account_number =
        account_number;

    if (ifsc_code !== undefined)
      employeeData.ifsc_code =
        ifsc_code;


    employeeData.updated_at =
      db.fn.now();


    await db('employees')
      .where({ id })
      .update(employeeData);


    // --------------------------------
    // Update USER
    // --------------------------------

    const userData = {};


    if (name !== undefined)
      userData.name = name;

    if (email !== undefined)
      userData.email = email;


    if (Object.keys(userData).length > 0) {

      userData.updated_at =
        db.fn.now();


      await db('users')
        .where({
          id: employee.user_id
        })
        .update(userData);
    }


    const updatedEmployee =
      await getEmployeeDetails(id);


    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee,
    });

  } catch (error) {

    console.error(
      'Update employee error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to update employee',
    });
  }
};


// =====================================================
// DELETE EMPLOYEE
// =====================================================

const deleteEmployee = async (req, res) => {
  try {

    const { id } = req.params;


    const employee = await db('employees')
      .where({ id })
      .first();


    if (!employee) {

      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }


    // Because user_id has ON DELETE CASCADE,
    // deleting the user will delete employee too.

    await db('users')
      .where({
        id: employee.user_id
      })
      .del();


    return res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
    });

  } catch (error) {

    console.error(
      'Delete employee error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
    });
  }
};


// =====================================================
// GET EMPLOYEE DETAILS HELPER
// =====================================================

const getEmployeeDetails = async (id) => {

  return db('employees')

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

      'employees.id',
      'employees.employee_code',

      'employees.phone',
      'employees.date_of_birth',
      'employees.gender',
      'employees.address',

      'employees.joining_date',
      'employees.employment_status',

      'employees.bank_name',
      'employees.account_holder_name',
      'employees.account_number',
      'employees.ifsc_code',

      'users.id as user_id',
      'users.name as employee_name',
      'users.email',

      'departments.id as department_id',
      'departments.name as department_name',

      'designations.id as designation_id',
      'designations.name as designation_name'
    )

    .where(
      'employees.id',
      id
    )

    .first();
};


module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};