const db = require('../config/database');

// CREATE DEPARTMENT
const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required',
      });
    }

    const departmentName = name.trim();

    const existing = await db('departments')
      .whereRaw('LOWER(name) = LOWER(?)', [departmentName])
      .first();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Department already exists',
      });
    }

    const [id] = await db('departments').insert({
      name: departmentName,
      description: description?.trim() || null,
    });

    const department = await db('departments')
      .where({ id })
      .first();

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (error) {
    console.error('Create department error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create department',
    });
  }
};

// GET ALL DEPARTMENTS
const getDepartments = async (req, res) => {
  try {
    const departments = await db('departments')
      .select('*')
      .orderBy('name', 'asc');

    return res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    console.error('Get departments error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
    });
  }
};

// GET DEPARTMENT BY ID
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await db('departments')
      .where({ id })
      .first();

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Get department error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch department',
    });
  }
};

// UPDATE DEPARTMENT
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const department = await db('departments')
      .where({ id })
      .first();

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Department name cannot be empty',
        });
      }

      const duplicate = await db('departments')
        .whereRaw('LOWER(name) = LOWER(?)', [name.trim()])
        .whereNot('id', id)
        .first();

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'Another department with this name already exists',
        });
      }

      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    updateData.updated_at = db.fn.now();

    await db('departments')
      .where({ id })
      .update(updateData);

    const updatedDepartment = await db('departments')
      .where({ id })
      .first();

    return res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment,
    });
  } catch (error) {
    console.error('Update department error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update department',
    });
  }
};

// DELETE DEPARTMENT
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await db('departments')
      .where({ id })
      .first();

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    await db('departments')
      .where({ id })
      .del();

    return res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Delete department error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete department',
    });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};