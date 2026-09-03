// controllers/admin.controller.js
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";

// Get all employees with extended info
export const getEmployees = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.username, u.email, u.phone, u.role, u.is_active, u.created_at,
        e.emp_id, e.designation, e.join_date,
        d.dept_id, d.name as department_name
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN hr_info h ON u.id = h.user_id
      LEFT JOIN departments d ON e.department_id = d.dept_id OR h.department_id = d.dept_id
      WHERE u.role IN ('EMPLOYEE', 'HR', 'ADMIN')
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single employee with extended info
export const getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.username, u.email, u.phone, u.role, u.is_active,
        e.emp_id, e.designation, e.join_date, e.department_id,
        h.hr_id, h.department_id as hr_department_id,
        d.name as department_name
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN hr_info h ON u.id = h.user_id
      LEFT JOIN departments d ON e.department_id = d.dept_id OR h.department_id = d.dept_id
      WHERE u.id = ?
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

// Create new employee/HR with extended info
export const createEmployee = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { username, email, phone, password, role, is_active, department_id, designation, join_date } = req.body;

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

    // Insert into appropriate table based on role
    if (role === 'EMPLOYEE') {
      await connection.query(
        `INSERT INTO employees (user_id, department_id, designation, join_date) 
         VALUES (?, ?, ?, ?)`,
        [userId, department_id, designation, join_date || new Date()]
      );
    } else if (role === 'HR') {
      await connection.query(
        `INSERT INTO hr_info (user_id, department_id) 
         VALUES (?, ?)`,
        [userId, department_id]
      );
    }
    // ADMIN users don't need additional table entries

    await connection.commit();
    res.status(201).json({ 
      message: "User created successfully",
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

// Update employee/HR with extended info
export const updateEmployee = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { username, email, phone, role, is_active, department_id, designation, join_date } = req.body;

    // Check if user exists
    const [existing] = await connection.query(
      "SELECT id, role FROM users WHERE id = ?",
      [id]
    );

    if (!existing.length) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    const oldRole = existing[0].role;

    // Check if email is taken by another user
    const [emailCheck] = await connection.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, id]
    );

    if (emailCheck.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Email already taken" });
    }

    // Update users table
    await connection.query(
      `UPDATE users 
       SET username = ?, email = ?, phone = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [username, email, phone, role, is_active, id]
    );

    // Handle role-specific table updates
    if (oldRole !== role) {
      // If role changed, remove from old table and add to new table
      if (oldRole === 'EMPLOYEE') {
        await connection.query("DELETE FROM employees WHERE user_id = ?", [id]);
      } else if (oldRole === 'HR') {
        await connection.query("DELETE FROM hr_info WHERE user_id = ?", [id]);
      }
    }

    // Insert/update in appropriate table based on new role
    if (role === 'EMPLOYEE') {
      const [empExists] = await connection.query("SELECT emp_id FROM employees WHERE user_id = ?", [id]);
      if (empExists.length > 0) {
        await connection.query(
          "UPDATE employees SET department_id = ?, designation = ?, join_date = ? WHERE user_id = ?",
          [department_id, designation, join_date, id]
        );
      } else {
        await connection.query(
          `INSERT INTO employees (user_id, department_id, designation, join_date) 
           VALUES (?, ?, ?, ?)`,
          [id, department_id, designation, join_date || new Date()]
        );
      }
    } else if (role === 'HR') {
      const [hrExists] = await connection.query("SELECT hr_id FROM hr_info WHERE user_id = ?", [id]);
      if (hrExists.length > 0) {
        await connection.query(
          "UPDATE hr_info SET department_id = ? WHERE user_id = ?",
          [department_id, id]
        );
      } else {
        await connection.query(
          `INSERT INTO hr_info (user_id, department_id) 
           VALUES (?, ?)`,
          [id, department_id]
        );
      }
    }

    await connection.commit();
    res.json({ message: "User updated successfully" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
};

// Delete employee/HR
export const deleteEmployee = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Check if user exists
    const [existing] = await connection.query(
      "SELECT id, role FROM users WHERE id = ?",
      [id]
    );

    if (!existing.length) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    const userRole = existing[0].role;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      await connection.rollback();
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    // Delete from role-specific table first
    if (userRole === 'EMPLOYEE') {
      await connection.query("DELETE FROM employees WHERE user_id = ?", [id]);
    } else if (userRole === 'HR') {
      await connection.query("DELETE FROM hr_info WHERE user_id = ?", [id]);
    }

    // Then delete from users table
    await connection.query("DELETE FROM users WHERE id = ?", [id]);

    await connection.commit();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
};
