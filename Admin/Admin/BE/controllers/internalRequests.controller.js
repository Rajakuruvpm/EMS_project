import { pool } from "../config/db.js";

// GET ALL INTERNAL REQUESTS
export const getInternalRequests = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        ir.request_id,
        ue.username AS employee_name,
        ir.category,
        ir.description,
        ir.status,
        uh.username AS hr_handler_name
      FROM internal_requests ir
      LEFT JOIN employees e ON ir.emp_id = e.emp_id
      LEFT JOIN users ue ON e.user_id = ue.id
      LEFT JOIN hr_info h ON ir.hr_handler_id = h.hr_id
      LEFT JOIN users uh ON h.user_id = uh.id
      ORDER BY ir.request_id DESC
    `);

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("GET REQUESTS ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch requests" });
  }
};

// UPDATE STATUS
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(
      "UPDATE internal_requests SET status = ? WHERE request_id = ?",
      [status, id]
    );

    return res.json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to update status" });
  }
};
