import { pool } from "../config/db.js";

// ✅ POST attendance records with filters
export const getAttendance = async (req, res) => {
  try {
    const { department, date, status } = req.body;
    
    console.log("📅 Fetching attendance with filters:", { department, date, status });
    
    let query = `
      SELECT 
        a.attendance_id,
        a.emp_id,
        u.username as emp_name,
        d.name as department,
        a.date,
        a.check_in,
        a.check_out,
        a.status
      FROM attendance a
      JOIN employees e ON a.emp_id = e.emp_id
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.dept_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (department) {
      query += ' AND d.name = ?';
      params.push(department);
    }
    
    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }
    
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY a.date DESC, u.username';
    
    console.log("🔍 Executing query:", query);
    console.log("📝 With parameters:", params);
    
    const [attendance] = await pool.execute(query, params);
    console.log(`✅ Found ${attendance.length} attendance records`);
    
    res.json(attendance);
  } catch (err) {
    console.error("❌ Error fetching attendance:", err);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
};