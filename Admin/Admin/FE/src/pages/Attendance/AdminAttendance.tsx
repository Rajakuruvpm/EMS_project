import React, { useEffect, useState } from "react";
import {
  Box, Paper, Typography, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Alert, CircularProgress, Grid,
  Card, CardContent, MenuItem, FormControl, InputLabel, Select,
  type SelectChangeEvent, useTheme, useMediaQuery, Collapse, Fade
} from "@mui/material";
import {
  CalendarToday, FilterList, Download, Clear, Schedule
} from "@mui/icons-material";
import { motion, AnimatePresence } from 'framer-motion';

// API Service
const attendanceAPI = {
  async getAttendance(filters: { department?: string; date?: string; status?: string }) {
    const API_BASE_URL = 'https://admin-be-qe74.onrender.com';
    
    const response = await fetch(`${API_BASE_URL}/api/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch attendance records: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  },

  async getDepartments() {
    const API_BASE_URL = 'https://admin-be-qe74.onrender.com';
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch departments: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Departments API response:", data);
    return data;
  }
};

// Interfaces
interface AttendanceRecord {
  attendance_id: number;
  emp_id: number;
  emp_name: string;
  department: string;
  date: string;
  check_in: string;
  check_out: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
}

interface Department {
  dept_id: number;
  name: string;
  description?: string;
}

interface User {
  role: "HR" | "IT" | "Admin";
  department?: string;
}

const MotionPaper = motion(Paper);
const MotionButton = motion(Button);
const MotionCard = motion(Card);
const MotionTableRow = motion(TableRow);

const AdminAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    department: "",
    date: new Date().toISOString().split('T')[0],
    status: ""
  });

  const [user] = useState<User>({ role: "Admin", department: "" });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      setDeptLoading(true);
      console.log("Fetching departments from /api/departments...");
      const departmentsData = await attendanceAPI.getDepartments();
      console.log("Departments fetched:", departmentsData);
      setDepartments(departmentsData);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setError(`Failed to load departments: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeptLoading(false);
    }
  };

  // Fetch attendance data from API
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("Fetching attendance with filters:", filters);
      
      const apiFilters: any = {};
      
      if (filters.department) {
        apiFilters.department = filters.department;
      }
      
      if (filters.date) {
        apiFilters.date = filters.date;
      }
      
      if (filters.status) {
        apiFilters.status = filters.status;
      }

      if (user.role === "HR" || user.role === "IT") {
        apiFilters.department = user.department;
      }

      const attendanceData = await attendanceAPI.getAttendance(apiFilters);
      console.log("Attendance data received:", attendanceData);
      setRecords(attendanceData);
      setSuccess(`Loaded ${attendanceData.length} attendance records`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to fetch attendance records: ${errorMessage}`);
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's attendance automatically when component mounts
  useEffect(() => {
    const initializeData = async () => {
      await fetchDepartments();
      await fetchAttendance();
    };
    
    initializeData();
  }, []);

  // Handle text field changes (date field)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes (department and status fields)
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleApply = () => {
    fetchAttendance();
  };

  const handleClearFilter = () => {
    setFilters({
      department: "",
      date: new Date().toISOString().split('T')[0],
      status: ""
    });
    setTimeout(() => {
      fetchAttendance();
    }, 100);
    setSuccess('Filters cleared successfully');
  };

  const handleExport = () => {
    if (records.length === 0) {
      setError("No data to export");
      return;
    }
    
    const headers = ['Employee ID', 'Name', 'Department', 'Date', 'Check-In', 'Check-Out', 'Status'];
    const csvData = records.map(rec => [
      rec.emp_id,
      rec.emp_name,
      rec.department,
      rec.date,
      rec.check_in ? new Date(rec.check_in).toLocaleTimeString() : '—',
      rec.check_out ? new Date(rec.check_out).toLocaleTimeString() : '—',
      rec.status
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${filters.date || 'all'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccess('Attendance data exported successfully');
  };

  const getStatusChip = (status: string) => {
    const chipProps = {
      PRESENT: { color: "success" as const, label: "PRESENT" },
      ABSENT: { color: "error" as const, label: "ABSENT" },
      LATE: { color: "warning" as const, label: "LATE" },
      HALF_DAY: { color: "info" as const, label: "HALF DAY" },
    };
    
    const chipConfig = chipProps[status as keyof typeof chipProps] || { color: "default" as const, label: status };
    
    return (
      <Chip
        label={chipConfig.label}
        color={chipConfig.color}
        size="small"
        sx={{
          fontWeight: 'bold',
          borderRadius: 1
        }}
      />
    );
  };

  const getDepartmentChip = (department: string) => {
    return (
      <Chip
        label={department}
        color="primary"
        size="small"
        variant="outlined"
        sx={{ borderRadius: 1 }}
      />
    );
  };

  // Calculate summary counts
  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const lateCount = records.filter((r) => r.status === "LATE").length;
  const halfdayCount = records.filter((r) => r.status === "HALF_DAY").length;

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "PRESENT", label: "Present" },
    { value: "ABSENT", label: "Absent" },
    { value: "LATE", label: "Late" },
    { value: "HALF_DAY", label: "Half Day" }
  ];

  const hasActiveFilters = filters.department || filters.status || filters.date !== new Date().toISOString().split('T')[0];

  const summaryCards = [
    { label: "Present", value: presentCount, color: "success" as const },
    { label: "Absent", value: absentCount, color: "error" as const },
    { label: "Late", value: lateCount, color: "warning" as const },
    { label: "Half Day", value: halfdayCount, color: "info" as const }
  ];

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
              Admin Attendance Management
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Monitor and manage employee attendance records
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <MotionButton
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFiltersOpen(!filtersOpen)}
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
              Filters
            </MotionButton>
            <MotionButton
              variant="contained"
              startIcon={<Download />}
              onClick={handleExport}
              disabled={records.length === 0}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
                px: 3,
                py: 1,
                borderRadius: 2
              }}
            >
              Export
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

      {/* Filters Section */}
      <Collapse in={filtersOpen}>
        <MotionPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterList color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Filter Attendance
              </Typography>
            </Box>
            <Chip
              label={`${records.length} records`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          <Grid container spacing={2} alignItems="center">
            {/* Department Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={filters.department}
                  onChange={handleSelectChange}
                  label="Department"
                  disabled={user.role === "HR" || user.role === "IT" || deptLoading}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.dept_id} value={dept.name}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
                {deptLoading && (
                  <CircularProgress size={20} sx={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)' }} />
                )}
              </FormControl>
            </Grid>

            {/* Date Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                type="date"
                name="date"
                value={filters.date}
                onChange={handleInputChange}
                label="Date"
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>

            {/* Status Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  onChange={handleSelectChange}
                  label="Status"
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Action Buttons */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap' }}>
                <MotionButton
                  variant="contained"
                  startIcon={<Schedule />}
                  onClick={handleApply}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  sx={{ 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    flex: 1,
                    minWidth: 'auto'
                  }}
                >
                  {loading ? "Loading..." : "Apply"}
                </MotionButton>
                <MotionButton
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={handleClearFilter}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  sx={{ 
                    borderRadius: 2,
                    flex: 1,
                    minWidth: 'auto'
                  }}
                >
                  Clear
                </MotionButton>
              </Box>
            </Grid>
          </Grid>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Fade in>
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Active Filters:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {filters.department && (
                    <Chip 
                      label={`Department: ${filters.department}`}
                      size="small"
                      onDelete={() => setFilters(prev => ({ ...prev, department: '' }))}
                      color="primary"
                    />
                  )}
                  {filters.status && (
                    <Chip 
                      label={`Status: ${filters.status}`}
                      size="small"
                      onDelete={() => setFilters(prev => ({ ...prev, status: '' }))}
                      color="secondary"
                    />
                  )}
                  {filters.date !== new Date().toISOString().split('T')[0] && (
                    <Chip 
                      label={`Date: ${filters.date}`}
                      size="small"
                      onDelete={() => setFilters(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }))}
                      color="info"
                    />
                  )}
                </Box>
              </Box>
            </Fade>
          )}
        </MotionPaper>
      </Collapse>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              sx={{ 
                textAlign: "center", 
                bgcolor: `${stat.color}.main`, 
                color: "white",
                height: '100%',
                borderRadius: 3
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" component="div" fontWeight="bold">
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                  {stat.label}
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* Attendance Table */}
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255,255,255,0.95)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}
      >
        <CardContent sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Attendance Records ({records.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {filters.department && (
                <Chip
                  label={`Department: ${filters.department}`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
              {filters.status && (
                <Chip
                  label={`Status: ${filters.status}`}
                  color="secondary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
              <Chip
                label={`Date: ${filters.date}`}
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, flex: 1, justifyContent: 'center' }}>
              <CircularProgress size={60} thickness={4} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Loading today's attendance records...
              </Typography>
            </Box>
          ) : records.length > 0 ? (
            <TableContainer 
              sx={{ 
                flex: 1,
                overflow: 'auto',
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
              <Table stickyHeader>
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
                    <TableCell>Emp ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Check-In</TableCell>
                    <TableCell>Check-Out</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {records.map((rec, index) => (
                      <MotionTableRow
                        key={rec.attendance_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{
                          backgroundColor: 'rgba(0,0,0,0.02)',
                        }}
                        sx={{ transition: 'all 0.3s ease' }}
                      >
                        <TableCell>{rec.emp_id}</TableCell>
                        <TableCell sx={{ fontWeight: '500' }}>{rec.emp_name}</TableCell>
                        <TableCell>{getDepartmentChip(rec.department)}</TableCell>
                        <TableCell>{new Date(rec.date).toLocaleDateString()}</TableCell>
                        <TableCell>{rec.check_in ? new Date(rec.check_in).toLocaleTimeString() : "—"}</TableCell>
                        <TableCell>{rec.check_out ? new Date(rec.check_out).toLocaleTimeString() : "—"}</TableCell>
                        <TableCell>{getStatusChip(rec.status)}</TableCell>
                      </MotionTableRow>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <CalendarToday sx={{ fontSize: 48, mb: 2, color: 'text.secondary' }} />
              <Typography variant="h6" gutterBottom>
                No attendance records found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {hasActiveFilters ? 'Try adjusting your filters' : 'No records available for the selected criteria'}
              </Typography>
              <MotionButton
                variant="outlined"
                onClick={handleApply}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                sx={{ mt: 1 }}
              >
                Refresh Data
              </MotionButton>
            </Box>
          )}
        </CardContent>
      </MotionPaper>
    </Box>
  );
};

export default AdminAttendance;