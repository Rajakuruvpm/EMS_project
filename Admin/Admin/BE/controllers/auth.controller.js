import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      "SELECT id, username, email, password, role FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      console.log("Incoming email:", email);
      console.log("Query result:", rows);
      console.log("User password:", rows[0]?.password);

      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login success",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if email exists
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into DB (using `password`)
    await pool.query(
      `INSERT INTO users (username, email, password, role, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [username, email, hashedPassword, role || "EMPLOYEE"]
    );

    return res.status(201).json({ message: "Registration successful!" });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Add this function to get current user
export const getCurrentUser = async (req, res) => {
  try {
    // Get user ID from the authenticated request
    const userId = req.user.id;
    
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.username, u.email, u.phone, u.role, u.is_active, u.created_at,
        e.designation, e.join_date,
        h.department_id as hr_department_id,
        d.name as department_name
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN hr_info h ON u.id = h.user_id
      LEFT JOIN departments d ON e.department_id = d.dept_id OR h.department_id = d.dept_id
      WHERE u.id = ?
    `, [userId]);

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    
    // Return user data without sensitive information
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      designation: user.designation,
      join_date: user.join_date,
      department_name: user.department_name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};