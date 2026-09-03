// controllers/hr.controller.js
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";

// Get only employees (for HR users)
export const getEmployees = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.username, u.email, u.phone, u.role, u.is_active, u.created_at,
        e.emp_id, e.designation, e.join_date,
        d.dept_id, d.name as department_name
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      WHERE u.role = 'EMPLOYEE'
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single employee (for HR users)
export const getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.username, u.email, u.phone, u.role, u.is_active,
        e.emp_id, e.designation, e.join_date, e.department_id,
        d.name as department_name
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      WHERE u.id = ? AND u.role = 'EMPLOYEE'
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new employee (HR can only create employees)
export const createEmployee = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { username, email, phone, password, is_active, department_id, designation, join_date } = req.body;

    // HR can only create EMPLOYEE role
    const role = 'EMPLOYEE';

    // Check if email exists
    const [existing] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into users table
    const [userResult] = await connection.query(
      `INSERT INTO users (username, email, phone, password, role, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, phone, hashedPassword, role, is_active || true]
    );

    const userId = userResult.insertId;

    // Insert into employees table
    await connection.query(
      `INSERT INTO employees (user_id, department_id, designation, join_date) 
       VALUES (?, ?, ?, ?)`,
      [userId, department_id, designation, join_date || new Date()]
    );

    await connection.commit();
    res.status(201).json({ 
      message: "Employee created successfully",
      id: userId 
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
};

// controllers/hr.controller.js - Fix the updateEmployee function
export const updateEmployee = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { username, phone, is_active, department_id, designation } = req.body;

    console.log('HR updating employee:', { id, body: req.body });

    // Check if user exists and is an employee - REMOVED join_date from query
    const [existing] = await connection.query(
      "SELECT id, role, email FROM users WHERE id = ?",
      [id]
    );

    if (!existing.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Employee not found" });
    }

    if (existing[0].role !== 'EMPLOYEE') {
      await connection.rollback();
      return res.status(403).json({ message: "HR can only update employees" });
    }

    // Update only allowed fields - username, phone, is_active
    await connection.query(
      `UPDATE users 
       SET username = ?, phone = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [username, phone, is_active, id]
    );

    // Update employees table - only department_id and designation
    const [empExists] = await connection.query("SELECT emp_id FROM employees WHERE user_id = ?", [id]);
    if (empExists.length > 0) {
      await connection.query(
        "UPDATE employees SET department_id = ?, designation = ? WHERE user_id = ?",
        [department_id, designation, id]
      );
    } else {
      // If employee record doesn't exist, create it with current date as join_date
      await connection.query(
        `INSERT INTO employees (user_id, department_id, designation, join_date) 
         VALUES (?, ?, ?, ?)`,
        [id, department_id, designation, new Date()]
      );
    }

    await connection.commit();
    res.json({ message: "Employee updated successfully" });
  } catch (err) {
    await connection.rollback();
    console.error('HR update error:', err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
};

// Delete employee (HR can only delete employees)
export const deleteEmployee = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Check if user exists and is an employee
    const [existing] = await connection.query(
      "SELECT id, role FROM users WHERE id = ?",
      [id]
    );

    if (!existing.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Employee not found" });
    }

    if (existing[0].role !== 'EMPLOYEE') {
      await connection.rollback();
      return res.status(403).json({ message: "HR can only delete employees" });
    }

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      await connection.rollback();
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    // Delete from employees table first
    await connection.query("DELETE FROM employees WHERE user_id = ?", [id]);

    // Then delete from users table
    await connection.query("DELETE FROM users WHERE id = ?", [id]);

    await connection.commit();
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
};