// routes/adminDashboard.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Admin Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    // Total Employees
    const [employees] = await db.execute('SELECT COUNT(*) as count FROM employees');
    
    // Total Departments
    const [departments] = await db.execute('SELECT COUNT(*) as count FROM departments');
    
    // Total Projects
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
    
    // Total Payroll (sum of all paid payroll)
    const [payroll] = await db.execute(`
      SELECT COALESCE(SUM(total), 0) as total FROM payroll 
      WHERE status = 'PAID'
    `);
    
    // Active Meetings (today's meetings)
    const [meetings] = await db.execute(`
      SELECT COUNT(*) as count FROM meetings 
      WHERE DATE(date_time) = CURDATE()
    `);
    
    // Unread Notifications
    const [notifications] = await db.execute(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE status = 'UNREAD'
    `);

    res.json({
      totalEmployees: employees[0].count,
      totalDepartments: departments[0].count,
      totalProjects: projects[0].count,
      pendingLeaves: leaves[0].count,
      pendingRequests: requests[0].count,
      totalPayroll: payroll[0].total,
      activeMeetings: meetings[0].count,
      unreadNotifications: notifications[0].count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;