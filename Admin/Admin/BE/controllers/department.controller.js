// controllers/department.controller.js
import { pool } from "../config/db.js";

// Get all departments
export const getDepartments = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, 
        COUNT(DISTINCT e.emp_id) as employee_count,
        COUNT(DISTINCT h.hr_id) as hr_count
      FROM departments d
      LEFT JOIN employees e ON d.dept_id = e.department_id
      LEFT JOIN hr_info h ON d.dept_id = h.department_id
      GROUP BY d.dept_id
      ORDER BY d.name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single department
export const getDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT d.*, 
        COUNT(DISTINCT e.emp_id) as employee_count,
        COUNT(DISTINCT h.hr_id) as hr_count
      FROM departments d
      LEFT JOIN employees e ON d.dept_id = e.department_id
      LEFT JOIN hr_info h ON d.dept_id = h.department_id
      WHERE d.dept_id = ?
      GROUP BY d.dept_id
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new department
export const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if department name exists
    const [existing] = await pool.query(
      "SELECT dept_id FROM departments WHERE name = ?",
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Department name already exists" });
    }

    // Insert department
    const [result] = await pool.query(
      `INSERT INTO departments (name, description) VALUES (?, ?)`,
      [name, description]
    );

    res.status(201).json({ 
      message: "Department created successfully",
      id: result.insertId 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if department exists
    const [existing] = await pool.query(
      "SELECT dept_id FROM departments WHERE dept_id = ?",
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Check if department name is taken by another department
    const [nameCheck] = await pool.query(
      "SELECT dept_id FROM departments WHERE name = ? AND dept_id != ?",
      [name, id]
    );

    if (nameCheck.length > 0) {
      return res.status(400).json({ message: "Department name already taken" });
    }

    // Update department
    await pool.query(
      `UPDATE departments SET name = ?, description = ? WHERE dept_id = ?`,
      [name, description, id]
    );

    res.json({ message: "Department updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete department
export const deleteDepartment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Check if department exists
    const [existing] = await connection.query(
      "SELECT dept_id FROM departments WHERE dept_id = ?",
      [id]
    );

    if (!existing.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Department not found" });
    }

    // Check if department has employees
    const [employees] = await connection.query(
      "SELECT emp_id FROM employees WHERE department_id = ?",
      [id]
    );

    // Check if department has HR staff
    const [hrStaff] = await connection.query(
      "SELECT hr_id FROM hr_info WHERE department_id = ?",
      [id]
    );

    if (employees.length > 0 || hrStaff.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        message: "Cannot delete department with assigned employees or HR staff" 
      });
    }

    // Delete department
    await connection.query("DELETE FROM departments WHERE dept_id = ?", [id]);

    await connection.commit();
    res.json({ message: "Department deleted successfully" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
};