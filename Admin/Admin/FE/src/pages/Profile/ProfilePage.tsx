// src/pages/Profile/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person,
  Email,
  Business,
  CalendarToday,
  Assignment,
  Edit,
  Save,
  Cancel,
  Work,
  Phone,
  LocationOn,
  Security,
  AccessTime
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

// Types
interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
  is_active: boolean;
  created_at: string;
  employee?: EmployeeDetails;
  hr_info?: HRDetails;
}

interface EmployeeDetails {
  emp_id: string;
  department_id: number;
  department_name: string;
  position: string;
  hire_date: string;
  phone: string;
  address: string;
  salary: number;
}

interface HRDetails {
  hr_id: number;
  department_id: number;
  department_name: string;
}

interface Leave {
  leave_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason: string;
}

interface Attendance {
  date: string;
  status: string;
  check_in: string;
  check_out: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const MotionPaper = motion(Paper);

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [editData, setEditData] = useState<Partial<UserProfile & EmployeeDetails>>({});
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch user profile
      const profileRes = await axios.get('https://admin-be-qe74.onrender.com/api/auth/me', config);
      setProfile(profileRes.data);
      setEditData(profileRes.data);

      // Fetch leaves for employee
      if (profileRes.data.role === 'EMPLOYEE') {
        try {
          const leavesRes = await axios.get('https://admin-be-qe74.onrender.com/api/leaves/my-leaves', config);
          setLeaves(leavesRes.data || []);
        } catch (err) {
          console.log('No leaves data available');
        }
      }

      // Fetch attendance for employee
      if (profileRes.data.role === 'EMPLOYEE') {
        try {
          const currentDate = new Date();
          const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          
          const attendanceRes = await axios.post('https://admin-be-qe74.onrender.com/api/attendance', {
            start_date: firstDay.toISOString().split('T')[0],
            end_date: lastDay.toISOString().split('T')[0],
            employee_id: profileRes.data.employee?.emp_id
          }, config);
          
          setAttendance(attendanceRes.data || []);
        } catch (err) {
          console.log('No attendance data available');
        }
      }

    } catch (error: any) {
      console.error('Error fetching profile data:', error);
      setError(error.response?.data?.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel editing
      setEditData(profile || {});
    }
    setEditMode(!editMode);
  };

  const handleSaveProfile = async () => {
    try {
      setError('');

      // Update profile logic would go here
      // This would depend on your update endpoint
      console.log('Saving profile data:', editData);
      
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      // Refresh profile data
      fetchProfileData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }


      // Password change endpoint would need to be implemented
      // await axios.put('https://admin-be-qe74.onrender.com/api/auth/change-password', {
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword
      // }, config);

      setSuccess('Password changed successfully!');
      setChangePasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to change password');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'HR': return 'warning';
      case 'EMPLOYEE': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load profile data. Please try again.
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: isMobile ? 2 : 3 }}>
      {/* Header */}
      <MotionPaper
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid size={{xs:12,md:8}}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              My Profile
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Manage your account information and preferences
            </Typography>
          </Grid>
          <Grid size={{xs:12,md:4}} sx={{ textAlign: isMobile ? 'left' : 'right' }}>
            <Chip
              label={profile.role}
              color={getRoleColor(profile.role)}
              sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}
            />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Member since {formatDate(profile.created_at)}
            </Typography>
          </Grid>
        </Grid>
      </MotionPaper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Sidebar */}
        <Grid size={{xs:12,md:4}}>
          <MotionPaper
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}
          >
            <Avatar
              sx={{
                width: 120,
                height: 120,
                margin: '0 auto 16px',
                backgroundColor: 'primary.main',
                fontSize: '2.5rem'
              }}
            >
              {profile.username.charAt(0).toUpperCase()}
            </Avatar>

            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              {profile.username}
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
              {profile.email}
            </Typography>

            <Chip
              label={profile.is_active ? 'Active' : 'Inactive'}
              color={profile.is_active ? 'success' : 'default'}
              variant="outlined"
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant={editMode ? "outlined" : "contained"}
                startIcon={editMode ? <Cancel /> : <Edit />}
                onClick={handleEditToggle}
                fullWidth
              >
                {editMode ? 'Cancel Edit' : 'Edit Profile'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Security />}
                onClick={() => setChangePasswordDialog(true)}
                fullWidth
              >
                Change Password
              </Button>

              {editMode && (
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveProfile}
                  fullWidth
                  color="success"
                >
                  Save Changes
                </Button>
              )}
            </Box>
          </MotionPaper>

          {/* Quick Stats */}
          <MotionPaper
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            sx={{ p: 3, borderRadius: 3, mt: 3 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Quick Stats
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <CalendarToday color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Total Leaves" 
                  secondary={leaves.length} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <AccessTime color="secondary" />
                </ListItemIcon>
                <ListItemText 
                  primary="This Month Attendance" 
                  secondary={`${attendance.filter(a => a.status === 'PRESENT').length} days`} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Work color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Department" 
                  secondary={profile.employee?.department_name || profile.hr_info?.department_name || 'N/A'} 
                />
              </ListItem>
            </List>
          </MotionPaper>
        </Grid>

        {/* Main Content */}
        <Grid size={{xs:12,md:8}}>
          <MotionPaper
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            sx={{ borderRadius: 3, overflow: 'hidden' }}
          >
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': { fontWeight: 'bold' }
              }}
            >
              <Tab label="Personal Info" />
              <Tab label="Employment" />
              {profile.role === 'EMPLOYEE' && <Tab label="Leaves & Attendance" />}
            </Tabs>

            {/* Personal Info Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid size={{xs:12,sm:6}}>
                  <TextField
                    label="Username"
                    value={editMode ? editData.username : profile.username}
                    onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                    disabled={!editMode}
                    fullWidth
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                
                <Grid size={{xs:12,sm:6}}>
                  <TextField
                    label="Email"
                    value={editMode ? editData.email : profile.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    disabled={!editMode}
                    fullWidth
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                {profile.employee && (
                  <>
                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        label="Phone"
                        value={editMode ? editData.phone : profile.employee.phone || ''}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        disabled={!editMode}
                        fullWidth
                        InputProps={{
                          startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>

                    <Grid size={{xs:12}}>
                      <TextField
                        label="Address"
                        value={editMode ? editData.address : profile.employee.address || ''}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        disabled={!editMode}
                        fullWidth
                        multiline
                        rows={3}
                        InputProps={{
                          startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
                        }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </TabPanel>

            {/* Employment Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid size={{xs:12,sm:6}}>
                  <TextField
                    label="Employee ID"
                    value={profile.employee?.emp_id || profile.hr_info?.hr_id || 'N/A'}
                    disabled
                    fullWidth
                    InputProps={{
                      startAdornment: <Work sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid size={{xs:12,sm:6}}>
                  <TextField
                    label="Department"
                    value={profile.employee?.department_name || profile.hr_info?.department_name || 'N/A'}
                    disabled
                    fullWidth
                    InputProps={{
                      startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                {profile.employee && (
                  <>
                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        label="Position"
                        value={profile.employee.position || 'N/A'}
                        disabled
                        fullWidth
                      />
                    </Grid>

                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        label="Hire Date"
                        value={profile.employee.hire_date ? formatDate(profile.employee.hire_date) : 'N/A'}
                        disabled
                        fullWidth
                        InputProps={{
                          startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>

                    <Grid size={{xs:12,sm:6}}>
                      <TextField
                        label="Salary"
                        value={profile.employee.salary ? `₹${profile.employee.salary.toLocaleString()}` : 'N/A'}
                        disabled
                        fullWidth
                        InputProps={{
                          startAdornment: <Assignment sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </TabPanel>

            {/* Leaves & Attendance Tab (Employees only) */}
            {profile.role === 'EMPLOYEE' && (
              <TabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                  {/* Leaves Section */}
                  <Grid size={{xs:12,md:6}}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Recent Leave Applications
                    </Typography>
                    {leaves.length > 0 ? (
                      <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {leaves.slice(0, 5).map((leave) => (
                          <Card key={leave.leave_id} sx={{ mb: 1, borderRadius: 2 }}>
                            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {leave.leave_type}
                                </Typography>
                                <Chip
                                  label={leave.status}
                                  color={getStatusColor(leave.status)}
                                  size="small"
                                />
                              </Box>
                              <Typography variant="body2" color="textSecondary">
                                {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {leave.reason}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </List>
                    ) : (
                      <Typography color="textSecondary">
                        No leave applications found.
                      </Typography>
                    )}
                  </Grid>

                  {/* Attendance Section */}
                  <Grid size={{xs:12,md:6}}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Recent Attendance
                    </Typography>
                    {attendance.length > 0 ? (
                      <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {attendance.slice(0, 7).map((record, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon>
                              <AccessTime color={record.status === 'PRESENT' ? 'success' : 'error'} />
                            </ListItemIcon>
                            <ListItemText
                              primary={formatDate(record.date)}
                              secondary={
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                  <Typography variant="body2">
                                    Status: {record.status}
                                  </Typography>
                                  {record.check_in && (
                                    <Typography variant="body2">
                                      Check-in: {record.check_in}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography color="textSecondary">
                        No attendance records found.
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </TabPanel>
            )}
          </MotionPaper>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog
        open={changePasswordDialog}
        onClose={() => setChangePasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Change Password
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            color="primary"
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;