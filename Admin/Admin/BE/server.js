import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import hrRoutes from "./routes/hr.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import payrollRoutes from "./routes/payroll.routes.js";
import leaveRoutes from "./routes/leave.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import internalRequestsRoutes from "./routes/internalRequests.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";
import meetingAttendanceRoutes from "./routes/meetingAttendance.routes.js";
import projectRoutes from "./routes/project.routes.js";
import projectAssignmentRoutes from "./routes/projectAssignment.routes.js";
import { pool } from "./config/db.js"; // ADD THIS IMPORT

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Register all routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/requests", internalRequestsRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/meeting-attendance", meetingAttendanceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/project-assignments", projectAssignmentRoutes);

// Test route for leaves
app.get("/api/leaves/test", (req, res) => {
  console.log("✅ Leaves test endpoint working");
  res.json({ message: "Leaves endpoint is working!", timestamp: new Date().toISOString() });
});

// Add this to server.js to check ALL HR users
app.get('/api/debug/all-hr-users', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id as user_id,
        u.username,
        u.email,
        u.role,
        u.is_active,
        hi.hr_id,
        hi.department_id,
        d.name as department_name,
        e.emp_id
      FROM users u
      LEFT JOIN hr_info hi ON u.id = hi.user_id
      LEFT JOIN departments d ON hi.department_id = d.dept_id
      LEFT JOIN employees e ON u.id = e.user_id
      WHERE u.role = 'HR' OR u.role = 'EMPLOYEE'
      ORDER BY u.role, u.username
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add this route to create a test HR user
app.post('/api/debug/create-test-hr', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    // Create HR user
    const [userResult] = await connection.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['test_hr_user', 'testhr@company.com', '$2b$10$example', 'HR']
    );
    
    const userId = userResult.insertId;

    // Get HR department ID
    const [deptResult] = await connection.query(
      'SELECT dept_id FROM departments WHERE name = "HR"'
    );
    
    let hrDeptId;
    if (deptResult.length > 0) {
      hrDeptId = deptResult[0].dept_id;
    } else {
      // Create HR department if it doesn't exist
      const [newDept] = await connection.query(
        'INSERT INTO departments (name, description) VALUES (?, ?)',
        ['HR', 'Human Resources Department']
      );
      hrDeptId = newDept.insertId;
    }

    // Create hr_info record
    await connection.query(
      'INSERT INTO hr_info (user_id, department_id) VALUES (?, ?)',
      [userId, hrDeptId]
    );

    await connection.commit();
    connection.release();

    res.json({
      message: 'Test HR user created successfully',
      user_id: userId,
      department_id: hrDeptId
    });

  } catch (err) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.send("Backend running"));

// 404 handler for undefined routes
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});