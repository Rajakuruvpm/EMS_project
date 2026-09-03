// src/pages/Projects/ProjectAssignment.tsx
import React, { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Button, TextField, Alert,
  CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, FormControlLabel, Checkbox, Grid,
  Card, CardContent, useTheme, useMediaQuery,
  Slide
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  GridView as GridIcon,
  GroupAdd as GroupAddIcon
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';

interface Employee {
  emp_id: number;
  username: string;
  email: string;
  designation: string;
  department_id: number;
  department_name: string;
}

interface Assignment {
  assign_id: number;
  project_id: number;
  emp_id: number;
  role: string;
  progress: string;
  remarks: string;
  username: string;
  designation: string;
  department_name: string;
}

interface Department {
  dept_id: number;
  name: string;
  description: string;
}

const MotionPaper = motion(Paper);
const MotionButton = motion(Button);
const MotionCard = motion(Card);
const MotionTableRow = motion(TableRow);

const ProjectAssignment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id || "0");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Remove the unused employees state and only keep filteredEmployees
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; assignment: Assignment | null }>({
    open: false,
    assignment: null
  });

  const [assignmentData, setAssignmentData] = useState({
    project_id: projectId,
    department_id: 0,
    role_template: "",
    progress: "Not Started",
    remarks: ""
  });

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://admin-be-qe74.onrender.com/api/departments", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDepartments(result.data || []);
        } else if (Array.isArray(result)) {
          setDepartments(result);
        } else {
          setDepartments(result.data || []);
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError("Failed to load departments");
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://admin-be-qe74.onrender.com/api/project-assignments/project/${projectId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAssignments(result.data || []);
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setError("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesByDepartment = async (departmentId: number) => {
    try {
      setEmployeesLoading(true);
      const token = localStorage.getItem("token");

      // Try multiple possible endpoints
      const endpoints = [
        `https://admin-be-qe74.onrender.com/api/project-assignments/department/${departmentId}/employees`,
        `https://admin-be-qe74.onrender.com/api/employees/department/${departmentId}`,
        `https://admin-be-qe74.onrender.com/api/departments/${departmentId}/employees`
      ];

      let employeesData: Employee[] = [];

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              employeesData = result.data || [];
              break;
            } else if (Array.isArray(result)) {
              employeesData = result;
              break;
            } else if (Array.isArray(result.data)) {
              employeesData = result.data;
              break;
            }
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} failed:`, error);
        }
      }

      // If no endpoint worked, try the general employees endpoint and filter
      if (employeesData.length === 0) {
        const response = await fetch("https://admin-be-qe74.onrender.com/api/employees", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            employeesData = result.data.filter((emp: Employee) => emp.department_id === departmentId);
          } else if (Array.isArray(result)) {
            employeesData = result.filter((emp: Employee) => emp.department_id === departmentId);
          }
        }
      }

      // Set filteredEmployees directly instead of employees + filteredEmployees
      setFilteredEmployees(employeesData);

      // Auto-select all employees when department changes
      const employeeIds = employeesData.map((emp: Employee) => emp.emp_id);
      setSelectedEmployees(employeeIds);
      setSelectAll(employeesData.length > 0);

    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to load employees from this department");
      // Remove setEmployees call here
      setFilteredEmployees([]);
      setSelectedEmployees([]);
      setSelectAll(false);
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchDepartments();
      fetchAssignments();
    }
  }, [projectId]);

  useEffect(() => {
    if (assignmentData.department_id > 0) {
      fetchEmployeesByDepartment(assignmentData.department_id);
    } else {
      setFilteredEmployees([]);
      setSelectedEmployees([]);
      setSelectAll(false);
    }
  }, [assignmentData.department_id]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allEmployeeIds = filteredEmployees.map(emp => emp.emp_id);
      setSelectedEmployees(allEmployeeIds);
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleEmployeeSelect = (empId: number, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, empId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== empId));
      setSelectAll(false);
    }
  };

  const isEmployeeAssigned = (empId: number) => {
    return assignments.some(assignment => assignment.emp_id === empId);
  };

  const handleBulkAssign = async () => {
    if (selectedEmployees.length === 0) {
      setError("Please select at least one employee");
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const token = localStorage.getItem("token");
      const response = await fetch("https://admin-be-qe74.onrender.com/api/project-assignments/assign-multiple", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          project_id: projectId,
          department_id: assignmentData.department_id,
          employee_ids: selectedEmployees,
          role_template: assignmentData.role_template,
          progress: assignmentData.progress,
          remarks: assignmentData.remarks,
          assign_all: false
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Successfully assigned ${result.data.assigned_count} employees to project!`);
        setAssignmentData(prev => ({
          ...prev,
          role_template: "",
          remarks: ""
        }));
        setSelectedEmployees([]);
        setSelectAll(false);
        fetchAssignments();
      } else {
        throw new Error(result.message || "Failed to assign employees");
      }
    } catch (error) {
      console.error("Error assigning employees:", error);
      setError(error instanceof Error ? error.message : "Failed to assign employees to project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://admin-be-qe74.onrender.com/api/project-assignments/${assignId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (result.success) {
        setSuccess("Assignment removed successfully!");
        fetchAssignments();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      setError("Failed to remove assignment");
    } finally {
      setDeleteDialog({ open: false, assignment: null });
    }
  };

  return (
    <Box sx={{
      p: isMobile ? 1 : 3,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Section */}
      <MotionPaper
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              Assign Team Members
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Assign employees to project #{projectId} - Department-based approach
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <MotionButton
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate(`/admin/projects/${projectId}`)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderColor: 'rgba(255,255,255,0.5)',
                },
                px: 3,
                py: 1,
                borderRadius: 2
              }}
            >
              Back to Project
            </MotionButton>
            <MotionButton
              variant="outlined"
              startIcon={<GridIcon />}
              onClick={() => navigate("/admin/projects")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderColor: 'rgba(255,255,255,0.5)',
                },
                px: 3,
                py: 1,
                borderRadius: 2
              }}
            >
              All Projects
            </MotionButton>
          </Box>
        </Box>
      </MotionPaper>

      {/* Alerts Section */}
      <Box sx={{ flexShrink: 0, mb: 3 }}>
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
              animation: error ? 'shake 0.5s ease-in-out' : 'none',
              '@keyframes shake': {
                '0%, 100%': { transform: 'translateX(0)' },
                '25%': { transform: 'translateX(-5px)' },
                '75%': { transform: 'translateX(5px)' },
              }
            }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Department Selection & Bulk Assignment */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              background: 'rgba(255,255,255,0.95)'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Department Assignment
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select department and assign multiple employees
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    select
                    label="Select Department"
                    value={assignmentData.department_id}
                    onChange={(e) => setAssignmentData(prev => ({
                      ...prev,
                      department_id: parseInt(e.target.value)
                    }))}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  >
                    <MenuItem value={0}>Select a Department</MenuItem>
                    {departments.map(dept => (
                      <MenuItem key={dept.dept_id} value={dept.dept_id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {assignmentData.department_id > 0 && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Default Role Template"
                        value={assignmentData.role_template}
                        onChange={(e) => setAssignmentData(prev => ({
                          ...prev,
                          role_template: e.target.value
                        }))}
                        placeholder="e.g., Developer, Tester, Designer"
                        helperText="Leave empty to use employee's designation as role"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Remarks & Notes"
                        value={assignmentData.remarks}
                        onChange={(e) => setAssignmentData(prev => ({
                          ...prev,
                          remarks: e.target.value
                        }))}
                        multiline
                        rows={3}
                        placeholder="Additional notes for all assigned employees..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                        p: 2,
                        bgcolor: 'primary.50',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'primary.100'
                      }}>
                        <Box>
                          <Typography variant="h6" color="primary.main" fontWeight="600">
                            Department Employees
                          </Typography>
                          <Typography variant="body2" color="primary.600">
                            {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} available
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectAll}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              disabled={filteredEmployees.length === 0 || employeesLoading}
                              color="primary"
                            />
                          }
                          label={
                            <Typography variant="subtitle2" fontWeight="600">
                              Select All
                            </Typography>
                          }
                          sx={{ m: 0 }}
                        />
                      </Box>

                      <Box sx={{
                        maxHeight: 400,
                        overflow: 'auto',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 2,
                        bgcolor: 'background.default',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        {employeesLoading ? (
                          <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            py: 3,
                            color: 'text.secondary'
                          }}>
                            <CircularProgress size={24} sx={{ mr: 2 }} />
                            <Typography variant="body1">
                              Loading employees...
                            </Typography>
                          </Box>
                        ) : filteredEmployees.length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {filteredEmployees.map(employee => (
                              <Box
                                key={employee.emp_id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  p: 2,
                                  borderRadius: 2,
                                  border: '1px solid',
                                  borderColor: isEmployeeAssigned(employee.emp_id) ? 'success.light' : 'divider',
                                  bgcolor: isEmployeeAssigned(employee.emp_id) ? 'success.50' :
                                    selectedEmployees.includes(employee.emp_id) ? 'primary.50' : 'background.paper',
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    bgcolor: isEmployeeAssigned(employee.emp_id) ? 'success.100' :
                                      selectedEmployees.includes(employee.emp_id) ? 'primary.100' : 'grey.50',
                                    borderColor: isEmployeeAssigned(employee.emp_id) ? 'success.main' : 'primary.main',
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={selectedEmployees.includes(employee.emp_id)}
                                  onChange={(e) => handleEmployeeSelect(employee.emp_id, e.target.checked)}
                                  disabled={isEmployeeAssigned(employee.emp_id)}
                                  color="primary"
                                  sx={{ mr: 2 }}
                                />

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{
                                        fontWeight: 600,
                                        color: isEmployeeAssigned(employee.emp_id) ? 'success.dark' : 'text.primary'
                                      }}
                                    >
                                      {employee.username}
                                    </Typography>
                                    {isEmployeeAssigned(employee.emp_id) && (
                                      <Chip
                                        label="Already Assigned"
                                        size="small"
                                        color="success"
                                        variant="filled"
                                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                                      />
                                    )}
                                  </Box>

                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ display: 'flex', alignItems: 'center' }}
                                    >
                                      <Box
                                        component="span"
                                        sx={{
                                          width: 6,
                                          height: 6,
                                          borderRadius: '50%',
                                          bgcolor: 'primary.main',
                                          mr: 1
                                        }}
                                      />
                                      {employee.designation || 'No designation'}
                                    </Typography>
                                  </Box>
                                </Box>

                                {employee.email && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      ml: 2,
                                      display: { xs: 'none', sm: 'block' }
                                    }}
                                  >
                                    {employee.email}
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Box sx={{
                            textAlign: 'center',
                            py: 4,
                            color: 'text.secondary'
                          }}>
                            <Box
                              sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                bgcolor: 'grey.100',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2
                              }}
                            >
                              <Typography variant="h4" color="grey.400">
                                👥
                              </Typography>
                            </Box>
                            <Typography variant="h6" gutterBottom>
                              No Employees Found
                            </Typography>
                            <Typography variant="body2">
                              This department doesn't have any active employees.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <MotionButton
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={submitting || selectedEmployees.length === 0 || employeesLoading}
                        onClick={handleBulkAssign}
                        startIcon={submitting ? <CircularProgress size={20} /> : <GroupAddIcon />}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        sx={{
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          py: 1.5
                        }}
                      >
                        {submitting ? "Assigning..." : `Assign ${selectedEmployees.length} Employees`}
                      </MotionButton>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Current Assignments */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              background: 'rgba(255,255,255,0.95)'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Current Team Assignments
                </Typography>
                <Chip
                  label={`${assignments.length} members`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body1" sx={{ ml: 2 }}>
                    Loading assignments...
                  </Typography>
                </Box>
              ) : assignments.length > 0 ? (
                <TableContainer
                  sx={{
                    borderRadius: 2,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                      height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#c1c1c1',
                      borderRadius: '4px',
                      '&:hover': {
                        background: '#a8a8a8',
                      },
                    },
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          '& th': {
                            backgroundColor: theme.palette.primary.main,
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            padding: '12px 16px'
                          }
                        }}
                      >
                        <TableCell>Employee</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <AnimatePresence>
                        {assignments.map((assignment, index) => (
                          <MotionTableRow
                            key={assignment.assign_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{
                              backgroundColor: 'rgba(0,0,0,0.02)',
                            }}
                            sx={{ transition: 'all 0.3s ease' }}
                          >
                            <TableCell>
                              <Box>
                                <Typography variant="body1" fontWeight="medium">
                                  {assignment.username}
                                </Typography>
                                {assignment.designation && (
                                  <Typography variant="body2" color="text.secondary">
                                    {assignment.designation}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={assignment.role}
                                color="info"
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 1 }}
                              />
                            </TableCell>
                            <TableCell>{assignment.department_name || 'No Department'}</TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {assignment.progress || "Not started"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <MotionButton
                                size="small"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => setDeleteDialog({ open: true, assignment })}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                sx={{ borderRadius: 1 }}
                              >
                                Remove
                              </MotionButton>
                            </TableCell>
                          </MotionTableRow>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <PersonAddIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No team members assigned
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select a department and assign team members to this project
                  </Typography>
                </Box>
              )}
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false,   assignment: null })}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Slide}
        transitionDuration={300}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          Remove Team Member
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography>
            Are you sure you want to remove <strong>{deleteDialog.assignment?.username}</strong> from this project?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, assignment: null })}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => deleteDialog.assignment && handleDeleteAssignment(deleteDialog.assignment.assign_id)}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Remove from Project
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectAssignment;