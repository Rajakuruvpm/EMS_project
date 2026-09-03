// routes/hrDashboard.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// HR Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    // Total Employees
    const [employees] = await db.execute('SELECT COUNT(*) as count FROM employees');
    
    // Pending Payroll
    const [payroll] = await db.execute(`
      SELECT COUNT(*) as count FROM payroll 
      WHERE status = 'PENDING'
    `);
    
    // Active Projects
    const [projects] = await db.execute('SELECT COUNT(*) as count FROM projects');
    
    // Pending Leaves
    const [leaves] = await db.execute(`
      SELECT COUNT(*) as count FROM leaves 
      WHERE status = 'PENDING'
    `);
    
    // Pending Requests
    const [requests] = await db.execute(`
      SELECT COUNT(*) as count FROM internal_requests 
      WHERE status = 'PENDING'
    `);
    
    // Today's Attendance
    const [attendance] = await db.execute(`
      SELECT COUNT(*) as count FROM attendance 
      WHERE DATE(date) = CURDATE() AND status = 'PRESENT'
    `);
    
    // Upcoming Meetings (next 7 days)
    const [meetings] = await db.execute(`
      SELECT COUNT(*) as count FROM meetings 
      WHERE date_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
    `);
    
    // Candidate Applications
    const [candidates] = await db.execute(`
      SELECT COUNT(*) as count FROM candidates 
      WHERE status IN ('REGISTER_PENDING', 'TEST_PENDING')
    `);

    res.json({
      totalEmployees: employees[0].count,
      pendingPayroll: payroll[0].count,
      activeProjects: projects[0].count,
      pendingLeaves: leaves[0].count,
      pendingRequests: requests[0].count,
      todayAttendance: attendance[0].count,
      upcomingMeetings: meetings[0].count,
      candidateApplications: candidates[0].count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;