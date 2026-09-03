// src/pages/Leave/LeaveList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, CircularProgress, Alert,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Card, CardContent, Grid, useTheme, useMediaQuery,
  Fade, Slide, TextField, MenuItem, Collapse, InputAdornment
} from '@mui/material';
import {
  Add, Delete, Check, Close, Visibility, FilterList,
  Search, Clear, CalendarToday, Person, Work
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Leave {
  leave_id: number;
  emp_id: number;
  employee_name: string;
  employee_email: string;
  department_name: string;
  designation: string;
  start_date: string;
  end_date: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by_name: string;
}

interface FilterState {
  employee: string;
  department: string;
  status: string;
  type: string;
}

interface TempFilterState {
  employee: string;
  department: string;
  status: string;
  type: string;
}

const MotionPaper = motion(Paper);
const MotionButton = motion(Button);
const MotionTableRow = motion(TableRow);
const MotionCard = motion(Card);

const LeaveList: React.FC = () => {
  const navigate = useNavigate();
  // const { user } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<Leave[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    leave: null as Leave | null,
    action: ''
  });
  const [viewDialog, setViewDialog] = useState({ open: false, leave: null as Leave | null });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    employee: '',
    department: '',
    status: '',
    type: ''
  });
  const [tempFilters, setTempFilters] = useState<TempFilterState>({
    employee: '',
    department: '',
    status: '',
    type: ''
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://admin-be-qe74.onrender.com/api/leaves', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(response.data);
      setFilteredLeaves(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch leave records');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://admin-be-qe74.onrender.com/api/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Extract department names from the response
      const departmentNames = response.data.map((dept: any) => dept.name);
      setDepartments(departmentNames);
    } catch (err: any) {
      console.error('Failed to fetch departments:', err);
      setError('Failed to load departments');
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchDepartments();
  }, []);

  // Apply filters whenever filters state changes
  useEffect(() => {
    applyFilters();
  }, [filters, leaves]);

  // Get unique values for filter dropdowns
  const leaveTypes = Array.from(new Set(leaves.map(leave => leave.type).filter(Boolean)));
  // const employees = Array.from(new Set(leaves.map(leave => leave.employee_name).filter(Boolean)));

  const applyFilters = () => {
    let filtered = leaves;

    if (filters.employee) {
      filtered = filtered.filter(leave =>
        leave.employee_name.toLowerCase().includes(filters.employee.toLowerCase()) ||
        leave.employee_email.toLowerCase().includes(filters.employee.toLowerCase())
      );
    }

    if (filters.department) {
      filtered = filtered.filter(leave =>
        leave.department_name === filters.department
      );
    }

    if (filters.status) {
      filtered = filtered.filter(leave =>
        leave.status === filters.status
      );
    }

    if (filters.type) {
      filtered = filtered.filter(leave =>
        leave.type === filters.type
      );
    }

    setFilteredLeaves(filtered);
  };

  const handleTempFilterChange = (field: keyof TempFilterState, value: string) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setSuccess('Filters applied successfully');
  };

  const clearFilters = () => {
    const emptyFilters = {
      employee: '',
      department: '',
      status: '',
      type: ''
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setFilteredLeaves(leaves);
    setSuccess('All filters cleared');
  };

  const handleView = (leave: Leave) => {
    setViewDialog({ open: true, leave });
  };

  const handleCloseView = () => {
    setViewDialog({ open: false, leave: null });
  };

  const handleStatusUpdate = (leave: Leave, action: string) => {
    setStatusDialog({ open: true, leave, action });
  };

  const handleStatusConfirm = async () => {
    if (!statusDialog.leave) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://admin-be-qe74.onrender.com/api/leaves/${statusDialog.leave.leave_id}/status`,
        { status: statusDialog.action.toUpperCase() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(`Leave ${statusDialog.action.toLowerCase()} successfully!`);
      setStatusDialog({ open: false, leave: null, action: '' });
      fetchLeaves();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update leave status');
    }
  };

  const handleStatusCancel = () => {
    setStatusDialog({ open: false, leave: null, action: '' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this leave record?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://admin-be-qe74.onrender.com/api/leaves/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Leave record deleted successfully!');
      fetchLeaves();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete leave record');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateLeaveDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
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
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              Leave Management
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Manage employee leave requests and approvals
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
          </Box>
        </Box>
      </MotionPaper>

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
                Filters
              </Typography>
            </Box>
            <Chip
              label={`${filteredLeaves.length} records`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          <Grid container spacing={2} alignItems="center">
            {/* Employee Search */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Search Employee"
                value={tempFilters.employee}
                onChange={(e) => handleTempFilterChange('employee', e.target.value)}
                placeholder="Enter employee name..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>

            {/* Department Filter - Now from API */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Department"
                value={tempFilters.department}
                onChange={(e) => handleTempFilterChange('department', e.target.value)}
                size="small"
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Status Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Status"
                value={tempFilters.status}
                onChange={(e) => handleTempFilterChange('status', e.target.value)}
                size="small"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </TextField>
            </Grid>

            {/* Leave Type Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Leave Type"
                value={tempFilters.type}
                onChange={(e) => handleTempFilterChange('type', e.target.value)}
                size="small"
              >
                <MenuItem value="">All Types</MenuItem>
                {leaveTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Action Buttons */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap' }}>
                <MotionButton
                  variant="contained"
                  startIcon={<Check />}
                  onClick={handleApplyFilters}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  sx={{
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  Apply
                </MotionButton>
                <MotionButton
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={clearFilters}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  sx={{ borderRadius: 2 }}
                >
                  Clear
                </MotionButton>
              </Box>
            </Grid>
          </Grid>

          {/* Active Filters Display */}
          {(filters.employee || filters.department || filters.status || filters.type) && (
            <Fade in>
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Active Filters:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {filters.employee && (
                    <Chip
                      label={`Employee: ${filters.employee}`}
                      size="small"
                      onDelete={() => handleTempFilterChange('employee', '')}
                      color="primary"
                    />
                  )}
                  {filters.department && (
                    <Chip
                      label={`Department: ${filters.department}`}
                      size="small"
                      onDelete={() => handleTempFilterChange('department', '')}
                      color="secondary"
                    />
                  )}
                  {filters.status && (
                    <Chip
                      label={`Status: ${filters.status}`}
                      size="small"
                      onDelete={() => handleTempFilterChange('status', '')}
                      color={getStatusColor(filters.status) as any}
                    />
                  )}
                  {filters.type && (
                    <Chip
                      label={`Type: ${filters.type}`}
                      size="small"
                      onDelete={() => handleTempFilterChange('type', '')}
                      color="default"
                    />
                  )}
                </Box>
              </Box>
            </Fade>
          )}
        </MotionPaper>
      </Collapse>
      {/* Alerts Section */}
      <Box sx={{ mb: 2 }}>
        {error && (
          <Fade in>
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
          </Fade>
        )}

        {success && (
          <Fade in>
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          </Fade>
        )}
      </Box>

      {/* Table Section */}
      <MotionPaper
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
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Employee</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Department</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Leave Type</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Start Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>End Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Days</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Approved By</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {filteredLeaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <CalendarToday sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          No leave records found
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                          {Object.values(filters).some(f => f)
                            ? 'No records match your filters. Try clearing filters.'
                            : 'Get started by creating your first leave record.'
                          }
                        </Typography>
                        {Object.values(filters).some(f => f) ? (
                          <MotionButton
                            variant="outlined"
                            startIcon={<Clear />}
                            onClick={clearFilters}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            sx={{ borderRadius: 2 }}
                          >
                            Clear Filters
                          </MotionButton>
                        ) : (
                          <MotionButton
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => navigate('/admin/leaves/new')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            sx={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: 2
                            }}
                          >
                            Create First Leave
                          </MotionButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeaves.map((leave, index) => (
                    <MotionTableRow
                      key={leave.leave_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{
                        backgroundColor: 'rgba(0,0,0,0.02)',
                      }}
                      sx={{ transition: 'all 0.3s ease' }}
                    >
                      <TableCell>{leave.leave_id}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="500">
                            {leave.employee_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {leave.designation}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={leave.department_name}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={leave.type}
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(leave.start_date)}</TableCell>
                      <TableCell>{formatDate(leave.end_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={calculateLeaveDays(leave.start_date, leave.end_date)}
                          color="primary"
                          size="small"
                          sx={{ borderRadius: 1, fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={leave.status}
                          color={getStatusColor(leave.status)}
                          size="small"
                          sx={{
                            borderRadius: 1,
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {leave.approved_by_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            color="info"
                            size="small"
                            onClick={() => handleView(leave)}
                            sx={{
                              backgroundColor: 'rgba(33,150,243,0.1)',
                              '&:hover': { backgroundColor: 'rgba(33,150,243,0.2)' }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>

                          {leave.status === 'PENDING' && (
                            <>
                              <IconButton
                                color="success"
                                size="small"
                                onClick={() => handleStatusUpdate(leave, 'APPROVED')}
                                sx={{
                                  backgroundColor: 'rgba(56,142,60,0.1)',
                                  '&:hover': { backgroundColor: 'rgba(56,142,60,0.2)' }
                                }}
                              >
                                <Check fontSize="small" />
                              </IconButton>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleStatusUpdate(leave, 'REJECTED')}
                                sx={{
                                  backgroundColor: 'rgba(211,47,47,0.1)',
                                  '&:hover': { backgroundColor: 'rgba(211,47,47,0.2)' }
                                }}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </>
                          )}

                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(leave.leave_id)}
                            sx={{
                              backgroundColor: 'rgba(211,47,47,0.1)',
                              '&:hover': { backgroundColor: 'rgba(211,47,47,0.2)' }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </MotionTableRow>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </TableContainer>
      </MotionPaper>

      {/* View Leave Details Dialog */}
      <Dialog
        open={viewDialog.open}
        onClose={handleCloseView}
        maxWidth="md"
        fullWidth
        TransitionComponent={Slide}
        transitionDuration={500}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Visibility />
            Leave Details - #{viewDialog.leave?.leave_id}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {viewDialog.leave && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <MotionCard
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(102,126,234,0.1)' }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Person color="primary" sx={{ mr: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Employee Information
                      </Typography>
                    </Box>
                    <Box sx={{ pl: 4 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Name
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {viewDialog.leave.employee_name}
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        Email
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {viewDialog.leave.employee_email}
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        Department
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {viewDialog.leave.department_name}
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        Designation
                      </Typography>
                      <Typography variant="body1">
                        {viewDialog.leave.designation}
                      </Typography>
                    </Box>
                  </CardContent>
                </MotionCard>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <MotionCard
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(118,75,162,0.1)' }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarToday color="primary" sx={{ mr: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Leave Information
                      </Typography>
                    </Box>
                    <Box sx={{ pl: 4 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Leave Type
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={viewDialog.leave.type}
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        Start Date
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {formatDate(viewDialog.leave.start_date)}
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        End Date
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {formatDate(viewDialog.leave.end_date)}
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        Total Days
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {calculateLeaveDays(viewDialog.leave.start_date, viewDialog.leave.end_date)} days
                      </Typography>
                    </Box>
                  </CardContent>
                </MotionCard>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(255,107,107,0.1)' }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Work color="primary" sx={{ mr: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Status Information
                      </Typography>
                    </Box>
                    <Box sx={{ pl: 4 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Status
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={viewDialog.leave.status}
                          color={getStatusColor(viewDialog.leave.status)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                      {viewDialog.leave.approved_by_name && (
                        <>
                          <Typography variant="subtitle2" color="textSecondary">
                            Approved By
                          </Typography>
                          <Typography variant="body1">
                            {viewDialog.leave.approved_by_name}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </MotionCard>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseView}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={handleStatusCancel}
        maxWidth="sm"
        TransitionComponent={Slide}
        transitionDuration={300}
      >
        <DialogTitle
          sx={{
            background: statusDialog.action === 'APPROVED'
              ? 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)'
              : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {statusDialog.action === 'APPROVED' ? <Check /> : <Close />}
            {statusDialog.action === 'APPROVED' ? 'Approve Leave' : 'Reject Leave'}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <DialogContentText>
            Are you sure you want to {statusDialog.action.toLowerCase()} this leave request?
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Employee:</strong> {statusDialog.leave?.employee_name}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Duration:</strong> {statusDialog.leave &&
                `${formatDate(statusDialog.leave.start_date)} to ${formatDate(statusDialog.leave.end_date)}`
              }
            </Typography>
            <Typography variant="body2">
              <strong>Days:</strong> {statusDialog.leave &&
                calculateLeaveDays(statusDialog.leave.start_date, statusDialog.leave.end_date)
              } days
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleStatusCancel}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <MotionButton
            onClick={handleStatusConfirm}
            color={statusDialog.action === 'APPROVED' ? 'success' : 'error'}
            variant="contained"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            sx={{ borderRadius: 2 }}
          >
            {statusDialog.action === 'APPROVED' ? 'Approve' : 'Reject'}
          </MotionButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveList;