const db = require('../config/database');

// CREATE DESIGNATION
const createDesignation = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Designation name is required',
      });
    }

    const designationName = name.trim();

    const existing = await db('designations')
      .whereRaw('LOWER(name) = LOWER(?)', [designationName])
      .first();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Designation already exists',
      });
    }

    const [id] = await db('designations').insert({
      name: designationName,
      description: description?.trim() || null,
    });

    const designation = await db('designations')
      .where({ id })
      .first();

    return res.status(201).json({
      success: true,
      message: 'Designation created successfully',
      data: designation,
    });
  } catch (error) {
    console.error('Create designation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create designation',
    });
  }
};

// GET ALL DESIGNATIONS
const getDesignations = async (req, res) => {
  try {
    const designations = await db('designations')
      .select('*')
      .orderBy('name', 'asc');

    return res.status(200).json({
      success: true,
      count: designations.length,
      data: designations,
    });
  } catch (error) {
    console.error('Get designations error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch designations',
    });
  }
};

// GET DESIGNATION BY ID
const getDesignationById = async (req, res) => {
  try {
    const { id } = req.params;

    const designation = await db('designations')
      .where({ id })
      .first();

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: 'Designation not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: designation,
    });
  } catch (error) {
    console.error('Get designation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch designation',
    });
  }
};

// UPDATE DESIGNATION
const updateDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const designation = await db('designations')
      .where({ id })
      .first();

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: 'Designation not found',
      });
    }

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Designation name cannot be empty',
        });
      }

      const duplicate = await db('designations')
        .whereRaw('LOWER(name) = LOWER(?)', [name.trim()])
        .whereNot('id', id)
        .first();

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'Another designation with this name already exists',
        });
      }

      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    updateData.updated_at = db.fn.now();

    await db('designations')
      .where({ id })
      .update(updateData);

    const updatedDesignation = await db('designations')
      .where({ id })
      .first();

    return res.status(200).json({
      success: true,
      message: 'Designation updated successfully',
      data: updatedDesignation,
    });
  } catch (error) {
    console.error('Update designation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update designation',
    });
  }
};

// DELETE DESIGNATION
const deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params;

    const designation = await db('designations')
      .where({ id })
      .first();

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: 'Designation not found',
      });
    }

    await db('designations')
      .where({ id })
      .del();

    return res.status(200).json({
      success: true,
      message: 'Designation deleted successfully',
    });
  } catch (error) {
    console.error('Delete designation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete designation',
    });
  }
};

module.exports = {
  createDesignation,
  getDesignations,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
};