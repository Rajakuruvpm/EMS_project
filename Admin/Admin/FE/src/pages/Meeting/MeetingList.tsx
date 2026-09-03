// src/pages/Meeting/MeetingList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, CircularProgress, Alert,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Card, CardContent, Grid, useTheme, useMediaQuery,
  Fade, Slide, TextField, MenuItem, Collapse
} from '@mui/material';
import { 
  Delete, VideoCall, Add, People, FilterList, Clear, Check,
  Business, Schedule, Person, Groups 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Meeting {
  meeting_id: number;
  title: string;
  date_time: string;
  link: string;
  department_name: string;
  host_name: string;
  created_at: string;
}

interface AttendanceRecord {
  record_id: number;
  emp_id: number;
  user_id: number;
  employee_name: string;
  email: string;
  status: 'PRESENT' | 'ABSENT';
}

interface FilterState {
  department: string;
  status: string;
  search: string;
}

interface TempFilterState {
  department: string;
  status: string;
  search: string;
}

const MotionPaper = motion(Paper);
const MotionButton = motion(Button);
const MotionTableRow = motion(TableRow);
const MotionCard = motion(Card);

const MeetingList: React.FC = () => {
  const navigate = useNavigate();
  // const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attendanceDialog, setAttendanceDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    department: '',
    status: '',
    search: ''
  });
  const [tempFilters, setTempFilters] = useState<TempFilterState>({
    department: '',
    status: '',
    search: ''
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://admin-be-qe74.onrender.com/api/meetings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetings(response.data);
      setFilteredMeetings(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch meetings');
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
      const departmentNames = response.data.map((dept: any) => dept.name);
      setDepartments(departmentNames);
    } catch (err: any) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchAttendance = async (meetingId: number) => {
    setAttendanceLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://admin-be-qe74.onrender.com/api/meeting-attendance/${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendance(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch attendance');
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchDepartments();
  }, []);

  // Apply filters whenever filters state changes
  useEffect(() => {
    applyFilters();
  }, [filters, meetings]);

  const applyFilters = () => {
    let filtered = meetings;

    if (filters.search) {
      filtered = filtered.filter(meeting =>
        meeting.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        meeting.host_name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.department) {
      filtered = filtered.filter(meeting =>
        meeting.department_name === filters.department
      );
    }

    if (filters.status) {
      const isUpcoming = (dateString: string) => new Date(dateString) > new Date();
      if (filters.status === 'upcoming') {
        filtered = filtered.filter(meeting => isUpcoming(meeting.date_time));
      } else if (filters.status === 'completed') {
        filtered = filtered.filter(meeting => !isUpcoming(meeting.date_time));
      }
    }

    setFilteredMeetings(filtered);
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
      department: '',
      status: '',
      search: ''
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setFilteredMeetings(meetings);
    setSuccess('All filters cleared');
  };

  const handleDelete = async (meetingId: number) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://admin-be-qe74.onrender.com/api/meetings/${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Meeting deleted successfully!');
      fetchMeetings();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete meeting');
    }
  };

  const handleViewAttendance = async (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setAttendanceDialog(true);
    await fetchAttendance(meeting.meeting_id);
  };

  const handleCloseAttendance = () => {
    setAttendanceDialog(false);
    setSelectedMeeting(null);
    setAttendance([]);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  // Calculate attendance stats
  const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
  const absentCount = attendance.filter(a => a.status === 'ABSENT').length;
  const totalCount = attendance.length;

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
              Meeting Management
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Schedule and manage team meetings
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
              startIcon={<Add />}
              onClick={() => navigate('/admin/meetings/create')}
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
              Schedule Meeting
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
              label={`${filteredMeetings.length} records`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          <Grid container spacing={2} alignItems="center">
            {/* Search Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Search Meetings"
                value={tempFilters.search}
                onChange={(e) => handleTempFilterChange('search', e.target.value)}
                placeholder="Search by title or host..."
                size="small"
              />
            </Grid>

            {/* Department Filter */}
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
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
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
          {(filters.search || filters.department || filters.status) && (
            <Fade in>
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Active Filters:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {filters.search && (
                    <Chip
                      label={`Search: ${filters.search}`}
                      size="small"
                      onDelete={() => handleTempFilterChange('search', '')}
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

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            sx={{ borderRadius: 3, overflow: 'hidden' }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Meetings
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {meetings.length}
                  </Typography>
                </Box>
                <Business sx={{ fontSize: 40, color: 'primary.main', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            sx={{ borderRadius: 3, overflow: 'hidden' }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Upcoming
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {meetings.filter(m => isUpcoming(m.date_time)).length}
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 40, color: 'success.main', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            sx={{ borderRadius: 3, overflow: 'hidden' }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Completed
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    {meetings.filter(m => !isUpcoming(m.date_time)).length}
                  </Typography>
                </Box>
                <Groups sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Table Section */}
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
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
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Title</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date & Time</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Department</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Host</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {filteredMeetings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <VideoCall sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          No meetings found
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                          {Object.values(filters).some(f => f)
                            ? 'No meetings match your filters. Try clearing filters.'
                            : 'Get started by scheduling your first meeting.'
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
                            onClick={() => navigate('/admin/meetings/create')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            sx={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: 2
                            }}
                          >
                            Schedule First Meeting
                          </MotionButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMeetings.map((meeting, index) => (
                    <MotionTableRow
                      key={meeting.meeting_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{
                        backgroundColor: 'rgba(0,0,0,0.02)',
                      }}
                      sx={{ transition: 'all 0.3s ease' }}
                    >
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="500">
                          {meeting.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule color="action" fontSize="small" />
                          <Typography variant="body2">
                            {formatDateTime(meeting.date_time)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={meeting.department_name} 
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person color="action" fontSize="small" />
                          <Typography variant="body2">
                            {meeting.host_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={isUpcoming(meeting.date_time) ? 'Upcoming' : 'Completed'}
                          color={isUpcoming(meeting.date_time) ? 'primary' : 'default'}
                          size="small"
                          sx={{
                            borderRadius: 1,
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            color="primary"
                            onClick={() => window.open(meeting.link, '_blank')}
                            sx={{
                              backgroundColor: 'rgba(33,150,243,0.1)',
                              '&:hover': { backgroundColor: 'rgba(33,150,243,0.2)' }
                            }}
                          >
                            <VideoCall fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="secondary"
                            onClick={() => handleViewAttendance(meeting)}
                            sx={{
                              backgroundColor: 'rgba(156,39,176,0.1)',
                              '&:hover': { backgroundColor: 'rgba(156,39,176,0.2)' }
                            }}
                          >
                            <People fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(meeting.meeting_id)}
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

      {/* Attendance Dialog */}
      <Dialog
        open={attendanceDialog}
        onClose={handleCloseAttendance}
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
            <People />
            Attendance for: {selectedMeeting?.title}
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
            {selectedMeeting && formatDateTime(selectedMeeting.date_time)}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {attendanceLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={40} />
            </Box>
          ) : (
            <>
              {/* Attendance Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 4 }}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)', color: 'white' }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {presentCount}
                      </Typography>
                      <Typography variant="body2">
                        Present
                      </Typography>
                    </CardContent>
                  </MotionCard>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', color: 'white' }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {absentCount}
                      </Typography>
                      <Typography variant="body2">
                        Absent
                      </Typography>
                    </CardContent>
                  </MotionCard>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #a8e6cf 0%, #3d5a80 100%)', color: 'white' }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {totalCount}
                      </Typography>
                      <Typography variant="body2">
                        Total
                      </Typography>
                    </CardContent>
                  </MotionCard>
                </Grid>
              </Grid>

              {/* Attendance Table */}
              {attendance.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'primary.main' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Employee Name</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendance.map((record, index) => (
                        <MotionTableRow
                          key={record.record_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          hover
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="500">
                              {record.employee_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {record.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={record.status}
                              color={record.status === 'PRESENT' ? 'success' : 'error'}
                              size="small"
                              sx={{
                                borderRadius: 1,
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                        </MotionTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No attendance records
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    No attendance records found for this meeting.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseAttendance}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingList;