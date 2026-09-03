// controllers/project.controller.js
import { pool } from "../config/db.js";

// ✅ GET all projects
export const getProjects = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM projects ORDER BY project_id DESC");
    
    // Add status based on dates
    const projectsWithStatus = rows.map(project => ({
      ...project,
      status: getProjectStatus(project.start_date, project.end_date)
    }));
    
    res.json({
      success: true,
      data: projectsWithStatus,
      message: "Projects fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
      message: err.message
    });
  }
};

// ✅ GET single project by ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: "No project found with the provided ID"
      });
    }
    
    const project = {
      ...rows[0],
      status: getProjectStatus(rows[0].start_date, rows[0].end_date)
    };
    
    res.json({
      success: true,
      data: project,
      message: "Project fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch project",
      message: err.message
    });
  }
};

// ✅ CREATE new project
export const createProject = async (req, res) => {
  try {
    const { name, description, start_date, end_date } = req.body;

    // Validation
    if (!name || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "Name, start date, and end date are required"
      });
    }

    // Date validation
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        error: "Invalid dates",
        message: "End date must be after start date"
      });
    }

    const [result] = await pool.query(
      "INSERT INTO projects (name, description, start_date, end_date) VALUES (?, ?, ?, ?)",
      [name, description || '', start_date, end_date]
    );

    res.status(201).json({
      success: true,
      data: { project_id: result.insertId },
      message: "✅ Project created successfully"
    });
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create project",
      message: err.message
    });
  }
};

// ✅ UPDATE project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, start_date, end_date } = req.body;

    // Check if project exists
    const [existingProject] = await pool.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [id]
    );
    
    if (existingProject.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: "No project found with the provided ID"
      });
    }

    // Date validation
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          error: "Invalid dates",
          message: "End date must be after start date"
        });
      }
    }

    const [result] = await pool.query(
      "UPDATE projects SET name = ?, description = ?, start_date = ?, end_date = ? WHERE project_id = ?",
      [name, description, start_date, end_date, id]
    );

    res.json({
      success: true,
      data: { affectedRows: result.affectedRows },
      message: "✅ Project updated successfully"
    });
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update project",
      message: err.message
    });
  }
};

// ✅ DELETE project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project has assignments
    const [assignments] = await pool.query(
      "SELECT * FROM project_assignment WHERE project_id = ?",
      [id]
    );
    
    if (assignments.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Project has assignments",
        message: "Cannot delete project with existing assignments. Remove assignments first."
      });
    }

    const [result] = await pool.query(
      "DELETE FROM projects WHERE project_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: "No project found with the provided ID"
      });
    }

    res.json({
      success: true,
      data: { affectedRows: result.affectedRows },
      message: "✅ Project deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete project",
      message: err.message
    });
  }
};

// ✅ Get project status helper function
const getProjectStatus = (startDate, endDate) => {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (today > end) return "completed";
  if (today >= start && today <= end) return "active";
  return "upcoming";
};