import { pool } from "../config/db.js";

// ✅ Get all meetings with department info (for Admin Attendance Page)
export const getAllMeetingsWithDept = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        m.meeting_id, 
        m.title, 
        m.date_time, 
        m.link,
        d.name AS department_name,
        u.username AS host_name
      FROM meetings m
      LEFT JOIN departments d ON m.department_id = d.dept_id
      LEFT JOIN users u ON m.host_id = u.id
      ORDER BY m.date_time DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Error fetching meetings:", err);
    res.status(500).json({ message: "Error fetching meetings" });
  }
};

// ✅ Get attendance for a particular meeting
export const getMeetingAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        ma.record_id,
        ma.emp_id,
        e.user_id,
        u.username AS employee_name,
        u.email,
        ma.status
      FROM meeting_attendance ma
      LEFT JOIN employees e ON ma.emp_id = e.emp_id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE ma.meeting_id = ?
    `, [meetingId]);

    res.json(rows);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ message: "Error fetching attendance" });
  }
};
