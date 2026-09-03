import { pool } from "../config/db.js";

// ✅ Create a new meeting (Admin/HR)
export const createMeeting = async (req, res) => {
  try {
    const { title, date_time, link, department_id } = req.body;
    const host_id = req.user.id; // Get host_id from authenticated user

    // Validate required fields
    if (!title || !date_time || !link || !department_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO meetings (host_id, title, date_time, link, department_id)
       VALUES (?, ?, ?, ?, ?)`,
      [host_id, title, date_time, link, department_id]
    );

    res.status(201).json({ 
      message: "Meeting created successfully!",
      meeting_id: result.insertId 
    });
  } catch (err) {
    console.error("Meeting creation error:", err);
    res.status(500).json({ message: "Server error while creating meeting" });
  }
};

// ✅ Get all meetings (Admin/HR view)
export const getAllMeetings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        m.*, 
        d.name AS department_name, 
        u.username AS host_name
       FROM meetings m
       LEFT JOIN departments d ON m.department_id = d.dept_id
       LEFT JOIN users u ON m.host_id = u.id
       ORDER BY m.date_time DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching meetings:", err);
    res.status(500).json({ message: "Error fetching meetings" });
  }
};

// ✅ Get meetings by department (Employee view)
export const getMeetingsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    const [rows] = await pool.query(
      `SELECT 
        m.*, 
        u.username AS host_name
       FROM meetings m
       LEFT JOIN users u ON m.host_id = u.id
       WHERE m.department_id = ?
       ORDER BY m.date_time DESC`,
      [departmentId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching department meetings:", err);
    res.status(500).json({ message: "Error fetching meetings" });
  }
};

// ✅ Get my meetings (for employees based on their department)
export const getMyMeetings = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    // Get employee's department
    const [employee] = await pool.query(
      `SELECT department_id FROM employees WHERE user_id = ?`,
      [user_id]
    );

    if (!employee.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const department_id = employee[0].department_id;

    const [rows] = await pool.query(
      `SELECT 
        m.*, 
        u.username AS host_name,
        d.name AS department_name
       FROM meetings m
       LEFT JOIN users u ON m.host_id = u.id
       LEFT JOIN departments d ON m.department_id = d.dept_id
       WHERE m.department_id = ?
       ORDER BY m.date_time DESC`,
      [department_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching my meetings:", err);
    res.status(500).json({ message: "Error fetching meetings" });
  }
};

// ✅ Delete meeting
export const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM meetings WHERE meeting_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({ message: "Meeting deleted successfully" });
  } catch (err) {
    console.error("Error deleting meeting:", err);
    res.status(500).json({ message: "Error deleting meeting" });
  }
};