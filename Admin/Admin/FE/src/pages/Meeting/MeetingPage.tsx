// src/pages/Meeting/MeetingPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Fade
} from '@mui/material';
import { Schedule, VideoCall, Business, ArrowBack } from '@mui/icons-material';
import axios from 'axios';
// import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Department {
  dept_id: number;
  name: string;
}

interface MeetingFormData {
  title: string;
  date_time: string;
  link: string;
  department_id: number | '';
}

const MotionPaper = motion(Paper);
const MotionCard = motion(Card);
const MotionButton = motion(Button);

const MeetingPage: React.FC = () => {
  // const { user } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<MeetingFormData>({
    title: '',
    date_time: '',
    link: '',
    department_id: ''
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://admin-be-qe74.onrender.com/api/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data);
    } catch (err: any) {
      setError('Failed to fetch departments');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title || !formData.date_time || !formData.link || !formData.department_id) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    // Date validation
    const meetingDate = new Date(formData.date_time);
    const now = new Date();
    if (meetingDate <= now) {
      setError('Meeting date must be in the future');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      await axios.post('https://admin-be-qe74.onrender.com/api/meetings', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Meeting created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        date_time: formatDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
        link: '',
        department_id: ''
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Set default time to next hour
  const defaultDateTime = formatDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000));

  // Handle back navigation
  const handleBackClick = () => {
    navigate(-1);
  };

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Header Section with Back Button */}
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
          position: 'relative'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 2
        }}>
          <Box sx={{ textAlign: isMobile ? 'center' : 'left', width: isMobile ? '100%' : 'auto' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              Schedule Meeting
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Create and schedule meetings for your teams
            </Typography>
          </Box>
          
          {/* Back Button - Positioned on the right */}
          <MotionButton
            startIcon={<ArrowBack />}
            onClick={handleBackClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              borderRadius: 2,
              px: 3,
              py: 1,
              minWidth: 'auto',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              }
            }}
          >
            {!isMobile && 'Back'}
          </MotionButton>
        </Box>
      </MotionPaper>

      <Grid container spacing={3}>
        {/* Form Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <MotionPaper
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              background: 'rgba(255,255,255,0.95)'
            }}
          >
            {/* Alerts */}
            {error && (
              <Fade in>
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
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
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>
                  {success}
                </Alert>
              </Fade>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Meeting Title */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Meeting Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter meeting title"
                    InputProps={{
                      startAdornment: <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>

                {/* Meeting Link */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Meeting Link"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    required
                    placeholder="https://meet.google.com/xxx-xxxx-xxx or Zoom link"
                    helperText="Enter Google Meet, Zoom, or other video conference link"
                    InputProps={{
                      startAdornment: <VideoCall sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>

                {/* Date & Time */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Meeting Date & Time"
                    name="date_time"
                    type="datetime-local"
                    value={formData.date_time || defaultDateTime}
                    onChange={handleChange}
                    required
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>

                {/* Department */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Department"
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  >
                    <MenuItem value="">Select Department</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.dept_id} value={dept.dept_id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business fontSize="small" />
                          {dept.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <MotionButton
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  size="large"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  sx={{
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    px: 4,
                    py: 1.5,
                    minWidth: '200px'
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} sx={{ color: 'white' }} />
                      Creating Meeting...
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule />
                      Schedule Meeting
                    </Box>
                  )}
                </MotionButton>
                <MotionButton
                  variant="outlined"
                  onClick={() => setFormData({
                    title: '',
                    date_time: defaultDateTime,
                    link: '',
                    department_id: ''
                  })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    minWidth: '140px'
                  }}
                >
                  Clear Form
                </MotionButton>
              </Box>
            </Box>
          </MotionPaper>
        </Grid>

        {/* Help Section */}
        <Grid size={{ xs: 12, md: 4 }}>
          <MotionCard
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              mb: 2
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Schedule color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Meeting Guidelines
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Create scheduled meetings for specific departments with proper planning and coordination.
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Schedule fontSize="small" color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Meeting Title
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                  Clear, descriptive title that explains the meeting purpose
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <VideoCall fontSize="small" color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Meeting Link
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                  Google Meet, Zoom, Teams, or other platform link
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Business fontSize="small" color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Department
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ pl: 3 }}>
                  Select which department this meeting is intended for
                </Typography>
              </Box>
            </CardContent>
          </MotionCard>

          {/* Department Info */}
          <MotionCard
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            sx={{
              borderRadius: 3,
              mt: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Business sx={{ color: 'white' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Available Departments
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                You can schedule meetings for {departments.length} departments
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {departments.slice(0, 4).map((dept) => (
                  <Box
                    key={dept.dept_id}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.5,
                      fontSize: '0.75rem',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {dept.name}
                  </Box>
                ))}
                {departments.length > 4 && (
                  <Box
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.5,
                      fontSize: '0.75rem',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    +{departments.length - 4} more
                  </Box>
                )}
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MeetingPage;