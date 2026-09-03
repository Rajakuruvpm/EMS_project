// controllers/payroll.controller.js
import { pool } from "../config/db.js";

// Get payroll by ID
// FIXED getPayroll function
export const getPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        p.emp_id as user_id,                   
        u.username as employee_name,
        u.email as employee_email,
        COALESCE(d.name, dh.name) as department_name,
        COALESCE(e.designation, 'HR Personnel') as designation,
        hu.username as processed_by,
        p.payroll_month
      FROM payroll p
      LEFT JOIN users u ON p.emp_id = u.id      
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      LEFT JOIN hr_info hi ON u.id = hi.user_id
      LEFT JOIN departments dh ON hi.department_id = dh.dept_id
      LEFT JOIN hr_info h ON p.hr_id = h.hr_id
      LEFT JOIN users hu ON h.user_id = hu.id
      WHERE p.payroll_id = ?
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update payroll status
export const updatePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [existing] = await pool.query(
      "SELECT payroll_id FROM payroll WHERE payroll_id = ?",
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    await pool.query(
      "UPDATE payroll SET status = ? WHERE payroll_id = ?",
      [status, id]
    );

    res.json({ message: "Payroll status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete payroll record
export const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      "SELECT payroll_id FROM payroll WHERE payroll_id = ?",
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    await pool.query("DELETE FROM payroll WHERE payroll_id = ?", [id]);
    res.json({ message: "Payroll record deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// FIXED calculateSalary function
export const calculateSalary = async (req, res) => {
  try {
    const { emp_id, basic_salary, month, year } = req.body;

    // Default values if not provided
    const currentDate = new Date();
    const calcMonth = month || currentDate.getMonth() + 1;
    const calcYear = year || currentDate.getFullYear();

    console.log(`🧮 Calculating salary for user ${emp_id}, month: ${calcMonth}, year: ${calcYear}`);

    // Get user details directly from users table (since emp_id is now user_id)
    const [user] = await pool.query(`
      SELECT 
        u.id as user_id,
        u.username,
        u.role,
        COALESCE(e.designation, 'HR Personnel') as designation
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN hr_info hi ON u.id = hi.user_id
      WHERE u.id = ? AND u.is_active = 1
    `, [emp_id]);

    if (!user.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate components
    const basicSalary = Number(basic_salary) || 30000;

    // 1. Calculate attendance-based deductions
    const attendanceDeduction = await calculateAttendanceDeduction(emp_id, calcMonth, calcYear, basicSalary);

    // 2. Calculate leave-based deductions  
    const leaveDeduction = await calculateLeaveDeduction(emp_id, calcMonth, calcYear, basicSalary);

    // 3. Calculate bonuses
    const bonus = await calculateBonus(emp_id, calcMonth, calcYear, basicSalary);

    const totalDeduction = attendanceDeduction + leaveDeduction;
    const totalSalary = basicSalary + bonus - totalDeduction;

    const result = {
      emp_id,
      employee_name: user[0].username,
      basic_salary: basicSalary,
      bonus: Math.round(bonus),
      deduction: Math.round(totalDeduction),
      total: Math.round(totalSalary),
      breakdown: {
        attendance_deduction: Math.round(attendanceDeduction),
        leave_deduction: Math.round(leaveDeduction),
        bonus: Math.round(bonus)
      }
    };

    console.log('✅ Salary calculation result:', result);
    res.json(result);

  } catch (err) {
    console.error('❌ Salary calculation error:', err);
    res.status(500).json({ message: "Server error during calculation" });
  }
};

// Helper function: Calculate attendance-based deductions
async function calculateAttendanceDeduction(user_id, month, year, basicSalary) {
  try {
    const [attendance] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM attendance 
      WHERE emp_id = ? 
        AND MONTH(date) = ? 
        AND YEAR(date) = ?
      GROUP BY status
    `, [user_id, month, year]); // Changed emp_id to user_id

    let deduction = 0;
    const dailySalary = basicSalary / 30;

    attendance.forEach(record => {
      switch (record.status) {
        case 'ABSENT':
          deduction += record.count * dailySalary;
          break;
        case 'HALF_DAY':
          deduction += record.count * (dailySalary / 2);
          break;
        case 'LATE':
          deduction += record.count * (dailySalary * 0.1);
          break;
      }
    });

    return Math.max(0, deduction);
  } catch (err) {
    console.error('Attendance deduction calculation error:', err);
    return 0;
  }
}

// Helper function: Calculate leave-based deductions
async function calculateLeaveDeduction(user_id, month, year, basicSalary) {
  try {
    const [leaves] = await pool.query(`
      SELECT start_date, end_date, type, status
      FROM leaves 
      WHERE emp_id = ? 
        AND MONTH(start_date) = ? 
        AND YEAR(start_date) = ?
        AND status = 'APPROVED'
    `, [user_id, month, year]); // Changed emp_id to user_id

    const dailySalary = basicSalary / 30;
    let deduction = 0;

    leaves.forEach(leave => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const leaveDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (leave.type === 'UNPAID') {
        deduction += leaveDays * dailySalary;
      }
    });

    return Math.max(0, deduction);
  } catch (err) {
    console.error('Leave deduction calculation error:', err);
    return 0;
  }
}

// Helper function: Calculate bonus
async function calculateBonus(user_id, month, year, basicSalary) {
  try {
    let bonus = 0;

    // 1. Attendance Bonus - Perfect attendance
    const [attendance] = await pool.query(`
      SELECT COUNT(*) as present_days 
      FROM attendance 
      WHERE emp_id = ? 
        AND MONTH(date) = ? 
        AND YEAR(date) = ?
        AND status IN ('PRESENT', 'LATE')
    `, [user_id, month, year]); // Changed emp_id to user_id

    const workingDays = 22;
    if (attendance[0]?.present_days >= workingDays) {
      bonus += basicSalary * 0.05;
    }

    // 2. No Late Coming Bonus
    const [lateDays] = await pool.query(`
      SELECT COUNT(*) as late_days 
      FROM attendance 
      WHERE emp_id = ? 
        AND MONTH(date) = ? 
        AND YEAR(date) = ?
        AND status = 'LATE'
    `, [user_id, month, year]); // Changed emp_id to user_id

    if (lateDays[0]?.late_days === 0) {
      bonus += basicSalary * 0.03;
    }

    // 3. Festival Bonus
    if (month === 12) {
      bonus += basicSalary * 0.5;
    }

    // 4. Performance Bonus
    bonus += basicSalary * 0.02;

    return Math.max(0, bonus);
  } catch (err) {
    console.error('Bonus calculation error:', err);
    return 0;
  }
}

// controllers/payroll.controller.js

// Simplified getEmployeesForPayroll
export const getEmployeesForPayroll = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    let query = `
      SELECT 
        u.id as user_id,
        u.username,
        u.email,
        u.role,
        COALESCE(d.name, dh.name, 'General') as department_name,
        COALESCE(e.designation, 'HR Personnel') as designation,
        u.is_active
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      LEFT JOIN hr_info hi ON u.id = hi.user_id
      LEFT JOIN departments dh ON hi.department_id = dh.dept_id
      WHERE u.is_active = 1 
    `;

    // HR can only see EMPLOYEE roles (not HR roles)
    if (userRole === 'HR') {
      query += ` AND u.role = 'EMPLOYEE'`;
    }
    // Admin can see both EMPLOYEE and HR roles
    else if (userRole === 'ADMIN') {
      query += ` AND (u.role = 'EMPLOYEE' OR u.role = 'HR')`;
    }

    query += ` ORDER BY u.username`;

    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Simplified getPayrolls
export const getPayrolls = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let query = `
      SELECT 
        p.*,
        p.emp_id,
        u.username as employee_name,
        u.email as employee_email,
        COALESCE(d.name, dh.name) as department_name,
        COALESCE(e.designation, 'HR Personnel') as designation,
        hu.username as processed_by,
        p.payroll_month
      FROM payroll p
      LEFT JOIN users u ON p.emp_id = u.id
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      LEFT JOIN hr_info hi ON u.id = hi.user_id
      LEFT JOIN departments dh ON hi.department_id = dh.dept_id
      LEFT JOIN hr_info h ON p.hr_id = h.hr_id
      LEFT JOIN users hu ON h.user_id = hu.id
    `;

    // HR can only see payrolls they processed
    if (userRole === 'HR') {
      const [hrInfo] = await pool.query(
        'SELECT hr_id FROM hr_info WHERE user_id = ?',
        [userId]
      );
      if (hrInfo.length > 0) {
        query += ` WHERE p.hr_id = ? ORDER BY p.payroll_id DESC`;
        const [rows] = await pool.query(query, [hrInfo[0].hr_id]);
        return res.json(rows);
      }
      return res.json([]);
    }

    // Admin can see all payrolls
    const [rows] = await pool.query(query + ` ORDER BY p.payroll_id DESC`);
    res.json(rows);
  } catch (err) {
    console.error("Payroll fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Simplified createPayroll
export const createPayroll = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { emp_id, basic_salary, bonus, deduction, total, status, payroll_month } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get HR ID if user is HR or Admin
    let hr_id = null;
    if (userRole === 'HR' || userRole === 'ADMIN') {
      const [hrResult] = await connection.query(
        'SELECT hr_id FROM hr_info WHERE user_id = ?',
        [userId]
      );
      hr_id = hrResult.length > 0 ? hrResult[0].hr_id : null;
    }

    // Check if user exists and get role
    const [userInfo] = await connection.query(
      'SELECT id, role FROM users WHERE id = ? AND is_active = 1',
      [emp_id]
    );

    if (!userInfo.length) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found or inactive" });
    }

    const userRoleType = userInfo[0].role;

    // HR cannot process payroll for HR roles
    if (userRole === 'HR' && userRoleType === 'HR') {
      await connection.rollback();
      return res.status(403).json({ 
        message: "Access denied: HR cannot process payroll for HR users" 
      });
    }

    // Check for duplicate payroll
    const [existingPayroll] = await connection.query(
      `SELECT payroll_id FROM payroll WHERE emp_id = ? AND payroll_month = ?`,
      [emp_id, payroll_month]
    );

    if (existingPayroll.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        message: "Payroll already exists for this user for the selected month" 
      });
    }

    // Insert payroll record
    const [result] = await connection.query(
      `INSERT INTO payroll (emp_id, hr_id, basic_salary, bonus, deduction, total, status, payroll_month) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [emp_id, hr_id, basic_salary, bonus || 0, deduction || 0, total, status || 'PENDING', payroll_month]
    );

    await connection.commit();
    res.status(201).json({ 
      message: "Payroll record created successfully",
      payroll_id: result.insertId 
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
};