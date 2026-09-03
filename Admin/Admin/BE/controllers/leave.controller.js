// controllers/leave.controller.js
import { pool } from "../config/db.js";

// Get all leaves with employee info
export const getLeaves = async (req, res) => {
  try {
    console.log("📋 Fetching leave records...");
    
    const [rows] = await pool.query(`
      SELECT 
        l.*,
        e.emp_id,
        u.username as employee_name,
        u.email as employee_email,
        d.name as department_name,
        e.designation,
        hu.username as approved_by_name
      FROM leaves l
      LEFT JOIN employees e ON l.emp_id = e.emp_id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      LEFT JOIN hr_info h ON l.hr_approved_by = h.hr_id
      LEFT JOIN users hu ON h.user_id = hu.id
      ORDER BY l.leave_id DESC
    `);
    
    console.log(`✅ Found ${rows.length} leave records`);
    res.json(rows);
  } catch (err) {
    console.error("❌ Leave fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single leave
export const getLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        l.*,
        e.emp_id,
        u.username as employee_name,
        u.email as employee_email,
        d.name as department_name,
        e.designation,
        hu.username as approved_by_name
      FROM leaves l
      LEFT JOIN employees e ON l.emp_id = e.emp_id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      LEFT JOIN hr_info h ON l.hr_approved_by = h.hr_id
      LEFT JOIN users hu ON h.user_id = hu.id
      WHERE l.leave_id = ?
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Leave record not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create leave request
export const createLeave = async (req, res) => {
  try {
    const { emp_id, start_date, end_date, type } = req.body;

    // Check if employee exists
    const [employee] = await pool.query(
      "SELECT emp_id FROM employees WHERE emp_id = ?",
      [emp_id]
    );

    if (!employee.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Insert leave record
    const [result] = await pool.query(
      `INSERT INTO leaves (emp_id, start_date, end_date, type, status) 
       VALUES (?, ?, ?, ?, 'PENDING')`,
      [emp_id, start_date, end_date, type]
    );

    res.status(201).json({ 
      message: "Leave request submitted successfully",
      leave_id: result.insertId 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update leave status (Approve/Reject)
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const hr_id = req.user.id;

    // Get HR info ID from user ID
    const [hrInfo] = await pool.query(
      "SELECT hr_id FROM hr_info WHERE user_id = ?",
      [hr_id]
    );

    if (!hrInfo.length) {
      return res.status(403).json({ message: "Only HR can approve leaves" });
    }

    const hr_approved_by = hrInfo[0].hr_id;

    const [existing] = await pool.query(
      "SELECT leave_id FROM leaves WHERE leave_id = ?",
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ message: "Leave record not found" });
    }

    await pool.query(
      "UPDATE leaves SET status = ?, hr_approved_by = ? WHERE leave_id = ?",
      [status, hr_approved_by, id]
    );

    res.json({ message: `Leave ${status.toLowerCase()} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete leave
export const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      "SELECT leave_id FROM leaves WHERE leave_id = ?",
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ message: "Leave record not found" });
    }

    await pool.query("DELETE FROM leaves WHERE leave_id = ?", [id]);
    res.json({ message: "Leave record deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get employees for leave requests
export const getEmployeesForLeave = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.emp_id,
        u.username,
        u.email,
        d.name as department_name,
        e.designation
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      WHERE u.is_active = 1
      ORDER BY u.username
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get my leaves (for employees)
export const getMyLeaves = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const [rows] = await pool.query(`
      SELECT 
        l.*,
        hu.username as approved_by_name
      FROM leaves l
      LEFT JOIN employees e ON l.emp_id = e.emp_id
      LEFT JOIN hr_info h ON l.hr_approved_by = h.hr_id
      LEFT JOIN users hu ON h.user_id = hu.id
      WHERE e.user_id = ?
      ORDER BY l.leave_id DESC
    `, [user_id]);
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};