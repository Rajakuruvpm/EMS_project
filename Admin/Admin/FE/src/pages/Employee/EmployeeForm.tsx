// src/pages/Admin/EmployeeForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid, MenuItem, Alert,
  CircularProgress, FormControlLabel, Switch, useTheme, useMediaQuery,
  Fade, Card, CardContent
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Person, Email, Phone, Lock, Business, Work, CalendarToday, ArrowBack } from '@mui/icons-material';

interface Department {
  dept_id: number;
  name: string;
  description: string;
}

interface EmployeeFormData {
  username: string;
  email: string;
  phone: string;
  password?: string;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
  is_active: boolean;
  department_id?: number;
  designation?: string;
  join_date?: string;
}

interface User {
  id: number;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
}

const MotionPaper = motion(Paper);
const MotionButton = motion(Button);
const MotionCard = motion(Card);

const EmployeeForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [formData, setFormData] = useState<EmployeeFormData>({
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'EMPLOYEE',
    is_active: true,
    department_id: undefined,
    designation: '',
    join_date: new Date().toISOString().split('T')[0]
  });

  const isEditMode = Boolean(id);

  useEffect(() => {
    initializeData();
  }, [id]);

  const initializeData = async () => {
    try {
      const user = await fetchCurrentUser();
      console.log('🔍 Current user role:', user?.role);

      await fetchDepartments(user);

      if (isEditMode) {
        await fetchEmployee(user);
      } else if (user?.role === 'HR') {
        setFormData(prev => ({ ...prev, role: 'EMPLOYEE' }));
      }
    } catch (err) {
      console.error('Error initializing data:', err);
      setError('Failed to initialize form data');
    }
  };

  const fetchCurrentUser = async (): Promise<User> => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://admin-be-qe74.onrender.com/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
      return response.data;
    } catch (err) {
      console.error('❌ Failed to fetch current user:', err);
      const fallbackUser: User = {
        id: 0,
        role: 'EMPLOYEE'
      };
      setCurrentUser(fallbackUser);
      return fallbackUser;
    }
  };

  const fetchDepartments = async (user?: User) => {
    try {
      const token = localStorage.getItem('token');
      const userRole = user?.role || currentUser?.role;

      let url = 'https://admin-be-qe74.onrender.com/api/departments';

      try {
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDepartments(response.data);
        return;
      } catch (commonErr) {
        console.log('Common departments endpoint failed, trying role-specific...');
      }

      if (userRole === 'HR') {
        url = 'https://admin-be-qe74.onrender.com/api/hr/departments';
      } else {
        url = 'https://admin-be-qe74.onrender.com/api/admin/departments';
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data);
    } catch (err: any) {
      console.error('❌ Failed to fetch departments:', err);
      setError('Failed to load departments. Please refresh the page.');
    }
  };

  const fetchEmployee = async (user?: User) => {
    setFetchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userRole = user?.role || currentUser?.role;

      let url = '';
      if (userRole === 'HR') {
        url = `https://admin-be-qe74.onrender.com/api/hr/employees/${id}`;
      } else {
        url = `https://admin-be-qe74.onrender.com/api/admin/employees/${id}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const employee = response.data;

      setFormData({
        username: employee.username,
        email: employee.email,
        phone: employee.phone || '',
        password: '',
        role: employee.role,
        is_active: employee.is_active,
        department_id: employee.department_id || employee.hr_department_id,
        designation: employee.designation || '',
        join_date: employee.join_date ? employee.join_date.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      console.error('❌ Failed to fetch employee:', err);
      const errorMsg = err.response?.data?.message || 'Failed to fetch employee data';
      setError(errorMsg);

      if (err.response?.status === 403) {
        setError('Access denied. You may not have permission to view this employee.');
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const userRole = currentUser?.role;

      if (!userRole) {
        throw new Error('Unable to determine user role');
      }

      let url = '';
      if (userRole === 'HR') {
        url = isEditMode
          ? `https://admin-be-qe74.onrender.com/api/hr/employees/${id}`
          : 'https://admin-be-qe74.onrender.com/api/hr/employees';
      } else {
        url = isEditMode
          ? `https://admin-be-qe74.onrender.com/api/admin/employees/${id}`
          : 'https://admin-be-qe74.onrender.com/api/admin/employees';
      }

      let submitData: any = {};

      if (userRole === 'HR') {
        if (isEditMode) {
          submitData = {
            username: formData.username,
            phone: formData.phone,
            is_active: formData.is_active,
            department_id: formData.department_id,
            designation: formData.designation
          };
        } else {
          submitData = {
            username: formData.username,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            is_active: formData.is_active,
            department_id: formData.department_id,
            designation: formData.designation,
            join_date: formData.join_date,
            role: 'EMPLOYEE'
          };
        }
      } else {
        submitData = {
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          is_active: formData.is_active,
          department_id: formData.department_id,
          designation: formData.designation,
          join_date: formData.join_date
        };

        if (!isEditMode) {
          submitData.password = formData.password;
        }
      }

      if (isEditMode) {
        await axios.put(url, submitData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post(url, submitData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      setSuccess(isEditMode ? 'Employee updated successfully!' : 'Employee created successfully!');

      setTimeout(() => {
        navigate(-1);
      }, 1500);

    } catch (err: any) {
      console.error('❌ Operation Failed:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Operation failed';
      setError(`Server error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {isEditMode ? 'Edit Employee' :
                currentUser?.role === 'HR' ? 'Add New Employee' : 'Add New User'}
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              {isEditMode ? 'Update employee information' : 'Create a new team member'}
            </Typography>
          </Box>
          <MotionButton
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              },
              borderRadius: 2
            }}
          >
            Back
          </MotionButton>
        </Box>
      </MotionPaper>

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
          >
            {error}
          </Alert>
        </Fade>
      )}
      {success && (
        <Fade in>
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {success}
          </Alert>
        </Fade>
      )}

      {/* Form Section */}
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
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Personal Information Card */}
            <Grid size={{ xs: 12 }}>
              <MotionCard
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: 'rgba(102,126,234,0.1)',
                  border: '1px solid rgba(102,126,234,0.2)'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Person color="primary" sx={{ mr: 2, fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      Personal Information
                    </Typography>
                  </Box>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        InputProps={{
                          startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        InputProps={{
                          startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                          readOnly: isEditMode && currentUser?.role === 'HR'
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                            }
                          }
                        }}
                      />
                    </Grid>
                    {!isEditMode && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          InputProps={{
                            startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                              }
                            }
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </MotionCard>
            </Grid>

            {/* Professional Information Card */}
            <Grid size={{ xs: 12 }}>
              <MotionCard
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: 'rgba(118,75,162,0.1)',
                  border: '1px solid rgba(118,75,162,0.2)'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Work color="primary" sx={{ mr: 2, fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      Professional Information
                    </Typography>
                  </Box>
                  <Grid container spacing={3}>
                    {currentUser?.role === 'ADMIN' && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          select
                          label="Role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                              }
                            }
                          }}
                        >
                          <MenuItem value="EMPLOYEE">Employee</MenuItem>
                          <MenuItem value="HR">HR</MenuItem>
                          <MenuItem value="ADMIN">Admin</MenuItem>
                        </TextField>
                      </Grid>
                    )}

                    {(formData.role === 'EMPLOYEE' || formData.role === 'HR') && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          select
                          label="Department"
                          name="department_id"
                          value={formData.department_id || ''}
                          onChange={handleChange}
                          required
                          InputProps={{
                            startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                              }
                            }
                          }}
                        >
                          <MenuItem value="">Select Department</MenuItem>
                          {departments.map((dept) => (
                            <MenuItem key={dept.dept_id} value={dept.dept_id}>
                              {dept.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    )}

                    {formData.role === 'EMPLOYEE' && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Designation"
                          name="designation"
                          value={formData.designation}
                          onChange={handleChange}
                          required
                          InputProps={{
                            startAdornment: <Work sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                              }
                            }
                          }}
                        />
                      </Grid>
                    )}

                    {formData.role === 'EMPLOYEE' && !isEditMode && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Join Date"
                          name="join_date"
                          type="date"
                          value={formData.join_date}
                          onChange={handleChange}
                          InputLabelProps={{ shrink: true }}
                          required
                          InputProps={{
                            startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                              }
                            }
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </MotionCard>
            </Grid>

            {/* Status Card */}
            <Grid size={{ xs: 12 }}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,107,107,0.1)',
                  border: '1px solid rgba(255,107,107,0.2)'
                }}
              >
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Active Status
                      </Typography>
                    }
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {formData.is_active
                      ? 'This user will be able to access the system immediately.'
                      : 'This user will not be able to access the system until activated.'
                    }
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <MotionButton
              variant="outlined"
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              Cancel
            </MotionButton>
            <MotionButton
              type="submit"
              variant="contained"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.05 }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(102,126,234,0.4)',
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                isEditMode ? 'Update Employee' : currentUser?.role === 'HR' ? 'Create Employee' : 'Create User'
              )}
            </MotionButton>
          </Box>
        </Box>
      </MotionPaper>
    </Box>
  );
};

export default EmployeeForm;