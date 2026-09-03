// controllers/projectAssignment.controller.js
import { pool } from "../config/db.js";

// ✅ GET all project assignments
const getProjectAssignments = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pa.assign_id,
        pa.project_id,
        pa.emp_id,
        pa.role,
        pa.progress,
        pa.remarks,
        p.name AS project_name,
        e.designation,
        u.username,
        u.email,
        d.name AS department_name
      FROM project_assignment pa
      JOIN projects p ON pa.project_id = p.project_id
      JOIN employees e ON pa.emp_id = e.emp_id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      ORDER BY pa.assign_id DESC
    `);
    
    res.json({
      success: true,
      data: rows,
      message: "Project assignments fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching project assignments:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch project assignments",
      message: err.message
    });
  }
};

// ✅ GET assignment by ID
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT 
        pa.assign_id,
        pa.project_id,
        pa.emp_id,
        pa.role,
        pa.progress,
        pa.remarks,
        p.name AS project_name,
        e.designation,
        u.username,
        u.email,
        d.name AS department_name
      FROM project_assignment pa
      JOIN projects p ON pa.project_id = p.project_id
      JOIN employees e ON pa.emp_id = e.emp_id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      WHERE pa.assign_id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Assignment not found",
        message: "No assignment found with the provided ID"
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: "Assignment fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching assignment:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch assignment",
      message: err.message
    });
  }
};

// ✅ CREATE new assignment
const createAssignment = async (req, res) => {
  try {
    const { project_id, emp_id, role, progress, remarks } = req.body;

    // Validation
    if (!project_id || !emp_id || !role) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "Project ID, Employee ID, and Role are required"
      });
    }

    // Check if project exists
    const [projectRows] = await pool.query(
      "SELECT * FROM projects WHERE project_id = ?", 
      [project_id]
    );
    if (projectRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: "No project found with the provided ID"
      });
    }

    // Check if employee exists
    const [employeeRows] = await pool.query(
      "SELECT * FROM employees WHERE emp_id = ?", 
      [emp_id]
    );
    if (employeeRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
        message: "No employee found with the provided ID"
      });
    }

    // Check for duplicate assignment
    const [existingAssignment] = await pool.query(
      "SELECT * FROM project_assignment WHERE project_id = ? AND emp_id = ?",
      [project_id, emp_id]
    );
    
    if (existingAssignment.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Duplicate assignment",
        message: "This employee is already assigned to this project"
      });
    }

    const [result] = await pool.query(
      "INSERT INTO project_assignment (project_id, emp_id, role, progress, remarks) VALUES (?, ?, ?, ?, ?)",
      [project_id, emp_id, role, progress || "Not Started", remarks || ""]
    );

    res.status(201).json({
      success: true,
      data: { assign_id: result.insertId },
      message: "✅ Project assigned successfully"
    });
  } catch (err) {
    console.error("Error creating assignment:", err);
    res.status(500).json({
      success: false,
      error: "Failed to assign project",
      message: err.message
    });
  }
};

// ✅ UPDATE assignment
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, progress, remarks } = req.body;

    // Check if assignment exists
    const [existingAssignment] = await pool.query(
      "SELECT * FROM project_assignment WHERE assign_id = ?",
      [id]
    );
    
    if (existingAssignment.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Assignment not found",
        message: "No assignment found with the provided ID"
      });
    }

    const [result] = await pool.query(
      "UPDATE project_assignment SET role = ?, progress = ?, remarks = ? WHERE assign_id = ?",
      [role, progress, remarks, id]
    );

    res.json({
      success: true,
      data: { affectedRows: result.affectedRows },
      message: "✅ Assignment updated successfully"
    });
  } catch (err) {
    console.error("Error updating assignment:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update assignment",
      message: err.message
    });
  }
};

// ✅ DELETE assignment
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM project_assignment WHERE assign_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Assignment not found",
        message: "No assignment found with the provided ID"
      });
    }

    res.json({
      success: true,
      data: { affectedRows: result.affectedRows },
      message: "✅ Assignment deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting assignment:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete assignment",
      message: err.message
    });
  }
};

// ✅ GET assignments by project ID
const getAssignmentsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const [rows] = await pool.query(
      `SELECT 
        pa.assign_id,
        pa.project_id,
        pa.emp_id,
        pa.role,
        pa.progress,
        pa.remarks,
        e.designation,
        u.username,
        u.email,
        d.name AS department_name
      FROM project_assignment pa
      JOIN employees e ON pa.emp_id = e.emp_id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      WHERE pa.project_id = ?
      ORDER BY pa.assign_id DESC`,
      [projectId]
    );
    
    res.json({
      success: true,
      data: rows,
      message: "Project assignments fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching project assignments:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch project assignments",
      message: err.message
    });
  }
};

// ✅ GET assignments by employee ID
const getAssignmentsByEmployee = async (req, res) => {
  try {
    const { empId } = req.params;
    const [rows] = await pool.query(
      `SELECT 
        pa.assign_id,
        pa.project_id,
        pa.emp_id,
        pa.role,
        pa.progress,
        pa.remarks,
        p.name AS project_name,
        p.start_date,
        p.end_date,
        p.description
      FROM project_assignment pa
      JOIN projects p ON pa.project_id = p.project_id
      WHERE pa.emp_id = ?
      ORDER BY p.start_date DESC`,
      [empId]
    );
    
    // Add project status
    const assignmentsWithStatus = rows.map(assignment => ({
      ...assignment,
      project_status: getProjectStatus(assignment.start_date, assignment.end_date)
    }));
    
    res.json({
      success: true,
      data: assignmentsWithStatus,
      message: "Employee assignments fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching employee assignments:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch employee assignments",
      message: err.message
    });
  }
};

// ✅ ASSIGN DEPARTMENT TO PROJECT (Assigns all department employees)
const assignDepartmentToProject = async (req, res) => {
  try {
    const { project_id, department_id, role_template, progress, remarks } = req.body;

    // Validation
    if (!project_id || !department_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "Project ID and Department ID are required"
      });
    }

    // Check if project exists
    const [projectRows] = await pool.query(
      "SELECT * FROM projects WHERE project_id = ?", 
      [project_id]
    );
    if (projectRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: "No project found with the provided ID"
      });
    }

    // Check if department exists
    const [departmentRows] = await pool.query(
      "SELECT * FROM departments WHERE dept_id = ?", 
      [department_id]
    );
    if (departmentRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Department not found",
        message: "No department found with the provided ID"
      });
    }

    // Get all employees from this department
    const [employees] = await pool.query(
      `SELECT e.emp_id, e.designation 
       FROM employees e 
       WHERE e.department_id = ?`,
      [department_id]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No employees in department",
        message: "This department has no employees to assign"
      });
    }

    // Assign each employee to the project
    const assignmentResults = [];
    for (const employee of employees) {
      // Check for existing assignment
      const [existingAssignment] = await pool.query(
        "SELECT * FROM project_assignment WHERE project_id = ? AND emp_id = ?",
        [project_id, employee.emp_id]
      );
      
      if (existingAssignment.length === 0) {
        // Use employee's designation as role if no template provided
        const role = role_template || employee.designation || 'Team Member';
        
        const [result] = await pool.query(
          "INSERT INTO project_assignment (project_id, emp_id, role, progress, remarks) VALUES (?, ?, ?, ?, ?)",
          [project_id, employee.emp_id, role, progress || "Not Started", remarks || ""]
        );
        
        assignmentResults.push({
          emp_id: employee.emp_id,
          assigned: true,
          assign_id: result.insertId
        });
      } else {
        assignmentResults.push({
          emp_id: employee.emp_id,
          assigned: false,
          reason: "Already assigned"
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        total_employees: employees.length,
        assigned_count: assignmentResults.filter(r => r.assigned).length,
        already_assigned: assignmentResults.filter(r => !r.assigned).length,
        assignments: assignmentResults
      },
      message: `✅ Successfully assigned ${assignmentResults.filter(r => r.assigned).length} employees from department to project`
    });
  } catch (err) {
    console.error("Error assigning department to project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to assign department to project",
      message: err.message
    });
  }
};

// ✅ GET DEPARTMENT ASSIGNMENTS FOR PROJECT
const getDepartmentAssignments = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const [rows] = await pool.query(`
      SELECT 
        d.dept_id,
        d.name AS department_name,
        d.description,
        COUNT(DISTINCT pa.emp_id) AS assigned_employees,
        COUNT(DISTINCT e.emp_id) AS total_employees,
        GROUP_CONCAT(DISTINCT pa.role) AS roles_used
      FROM departments d
      LEFT JOIN employees e ON d.dept_id = e.department_id
      LEFT JOIN project_assignment pa ON e.emp_id = pa.emp_id AND pa.project_id = ?
      GROUP BY d.dept_id, d.name, d.description
      ORDER BY d.name
    `, [projectId]);
    
    res.json({
      success: true,
      data: rows,
      message: "Department assignments fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching department assignments:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch department assignments",
      message: err.message
    });
  }
};

// ✅ REMOVE DEPARTMENT FROM PROJECT (Remove all department employees)
const removeDepartmentFromProject = async (req, res) => {
  try {
    const { projectId, departmentId } = req.params;

    // Get all employees from this department
    const [employees] = await pool.query(
      "SELECT emp_id FROM employees WHERE department_id = ?",
      [departmentId]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No employees found",
        message: "No employees found in this department"
      });
    }

    const employeeIds = employees.map(emp => emp.emp_id);
    
    // Remove all assignments for these employees in this project
    const [result] = await pool.query(
      "DELETE FROM project_assignment WHERE project_id = ? AND emp_id IN (?)",
      [projectId, employeeIds]
    );

    res.json({
      success: true,
      data: {
        removed_assignments: result.affectedRows,
        department_id: parseInt(departmentId),
        project_id: parseInt(projectId)
      },
      message: `✅ Removed ${result.affectedRows} assignments for department from project`
    });
  } catch (err) {
    console.error("Error removing department from project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to remove department from project",
      message: err.message
    });
  }
};

// ✅ Helper function for project status
const getProjectStatus = (startDate, endDate) => {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (today > end) return "completed";
  if (today >= start && today <= end) return "active";
  return "upcoming";
};

// ✅ GET EMPLOYEES BY DEPARTMENT
const getEmployeesByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    const [rows] = await pool.query(`
      SELECT 
        e.emp_id,
        e.designation,
        e.department_id,
        u.username,
        u.email,
        u.phone,
        d.name AS department_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.dept_id
      WHERE e.department_id = ? AND u.is_active = 1
      ORDER BY u.username
    `, [departmentId]);
    
    res.json({
      success: true,
      data: rows,
      message: "Employees fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching employees by department:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch employees",
      message: err.message
    });
  }
};

// ✅ ASSIGN MULTIPLE EMPLOYEES TO PROJECT
const assignMultipleEmployees = async (req, res) => {
  try {
    const { project_id, department_id, employee_ids, role_template, progress, remarks, assign_all = false } = req.body;

    // Validation
    if (!project_id || !department_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "Project ID and Department ID are required"
      });
    }

    // Check if project exists
    const [projectRows] = await pool.query(
      "SELECT * FROM projects WHERE project_id = ?", 
      [project_id]
    );
    if (projectRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: "No project found with the provided ID"
      });
    }

    // Check if department exists
    const [departmentRows] = await pool.query(
      "SELECT * FROM departments WHERE dept_id = ?", 
      [department_id]
    );
    if (departmentRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Department not found",
        message: "No department found with the provided ID"
      });
    }

    let employeesToAssign = [];
    
    if (assign_all) {
      // Get all employees from the department
      const [allEmployees] = await pool.query(
        `SELECT e.emp_id, e.designation 
         FROM employees e 
         JOIN users u ON e.user_id = u.id
         WHERE e.department_id = ? AND u.is_active = 1`,
        [department_id]
      );
      employeesToAssign = allEmployees;
    } else if (employee_ids && employee_ids.length > 0) {
      // Get specific employees
      const [specificEmployees] = await pool.query(
        `SELECT e.emp_id, e.designation 
         FROM employees e 
         JOIN users u ON e.user_id = u.id
         WHERE e.emp_id IN (?) AND u.is_active = 1`,
        [employee_ids]
      );
      employeesToAssign = specificEmployees;
    } else {
      return res.status(400).json({
        success: false,
        error: "No employees selected",
        message: "Please select employees or choose to assign all"
      });
    }

    if (employeesToAssign.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No employees found",
        message: "No active employees found to assign"
      });
    }

    // Assign each selected employee to the project
    const assignmentResults = [];
    for (const employee of employeesToAssign) {
      // Check for existing assignment
      const [existingAssignment] = await pool.query(
        "SELECT * FROM project_assignment WHERE project_id = ? AND emp_id = ?",
        [project_id, employee.emp_id]
      );
      
      if (existingAssignment.length === 0) {
        // Use employee's designation as role if no template provided
        const role = role_template || employee.designation || 'Team Member';
        
        const [result] = await pool.query(
          "INSERT INTO project_assignment (project_id, emp_id, role, progress, remarks) VALUES (?, ?, ?, ?, ?)",
          [project_id, employee.emp_id, role, progress || "Not Started", remarks || ""]
        );
        
        assignmentResults.push({
          emp_id: employee.emp_id,
          assigned: true,
          assign_id: result.insertId
        });
      } else {
        assignmentResults.push({
          emp_id: employee.emp_id,
          assigned: false,
          reason: "Already assigned"
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        total_employees: employeesToAssign.length,
        assigned_count: assignmentResults.filter(r => r.assigned).length,
        already_assigned: assignmentResults.filter(r => !r.assigned).length,
        assignments: assignmentResults
      },
      message: `✅ Successfully assigned ${assignmentResults.filter(r => r.assigned).length} employees to project`
    });
  } catch (err) {
    console.error("Error assigning employees to project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to assign employees to project",
      message: err.message
    });
  }
};

// ✅ ADD THIS TO projectAssignment.controller.js (at the end)
export {
  getProjectAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByProject,
  getAssignmentsByEmployee,
  assignDepartmentToProject,
  getDepartmentAssignments,
  removeDepartmentFromProject,
  getEmployeesByDepartment,
  assignMultipleEmployees
};