// src/pages/Admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  People,
  Business,
  AttachMoney,
  CalendarToday,
  Assignment,
  VideoCall,
  TrendingUp,
  Notifications,
  Person,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../component/common/Sidebar';

// Types
interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  pendingRequests: number;
  totalPayroll: number;
  upcomingMeetings: number;
  totalLeaves: number;
  activeEmployees: number;
}

interface RecentActivity {
  id: number;
  type: 'request' | 'meeting' | 'payroll' | 'employee' | 'leave';
  title: string;
  description: string;
  time: string;
  status?: 'pending' | 'completed' | 'in-progress' | 'upcoming';
}

interface QuickStats {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  path: string;
  change?: number;
}

const MotionCard = motion(Card);
const MotionPaper = motion(Paper);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalDepartments: 0,
    pendingRequests: 0,
    totalPayroll: 0,
    upcomingMeetings: 0,
    totalLeaves: 0,
    activeEmployees: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
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

      // Fetch all data in parallel using your actual endpoints
      const [
        employeesRes, 
        departmentsRes, 
        requestsRes, 
        payrollRes, 
        meetingsRes,
        leavesRes
      ] = await Promise.all([
        // axios.get('http://localhost:5000/api/admin/employees', config).catch(_err => ({ data: [] })),
        // axios.get('http://localhost:5000/api/departments', config).catch(_err => ({ data: [] })),
        // axios.get('http://localhost:5000/api/requests', config).catch(_err => ({ data: [] })),
        // axios.get('http://localhost:5000/api/payroll', config).catch(_err => ({ data: [] })),
        // axios.get('http://localhost:5000/api/meetings', config).catch(_err => ({ data: [] })),
        // axios.get('http://localhost:5000/api/leaves', config).catch(_err => ({ data: [] }))
        axios.get('https://admin-be-qe74.onrender.com/api/admin/employees', config).catch(_err => ({ data: [] })),
        axios.get('https://admin-be-qe74.onrender.com/api/departments', config).catch(_err => ({ data: [] })),
        axios.get('https://admin-be-qe74.onrender.com/api/requests', config).catch(_err => ({ data: [] })),
        axios.get('https://admin-be-qe74.onrender.com/api/payroll', config).catch(_err => ({ data: [] })),
        axios.get('https://admin-be-qe74.onrender.com/meetings', config).catch(_err => ({ data: [] })),
        axios.get('https://admin-be-qe74.onrender.com/leaves', config).catch(_err => ({ data: [] }))
      ]);

      // Extract data from responses
      const employees = employeesRes.data || [];
      const departments = departmentsRes.data || [];
      const requests = Array.isArray(requestsRes.data) ? requestsRes.data : [];
      const payrolls = Array.isArray(payrollRes.data) ? payrollRes.data : [];
      const meetings = Array.isArray(meetingsRes.data) ? meetingsRes.data : [];
      const leaves = Array.isArray(leavesRes.data) ? leavesRes.data : [];

      console.log('Dashboard Data:', {
        employees: employees.length,
        departments: departments.length,
        requests: requests.length,
        payrolls: payrolls.length,
        meetings: meetings.length,
        leaves: leaves.length
      });

      // Calculate stats from real data
      const activeEmployees = employees.filter((emp: any) => emp.is_active !== false).length;
      const pendingRequests = requests.filter((req: any) => 
        req.status === 'PENDING' || req.status === 'pending'
      ).length;
      
      const totalPayroll = payrolls.reduce((sum: number, payroll: any) => 
        sum + (parseFloat(payroll.total_amount) || parseFloat(payroll.total) || 0), 0
      );
      
      const upcomingMeetings = meetings.filter((meeting: any) => {
        const meetingDate = meeting.date_time || meeting.meeting_date || meeting.date;
        return meetingDate && new Date(meetingDate) > new Date();
      }).length;

      setStats({
        totalEmployees: employees.length,
        totalDepartments: departments.length,
        pendingRequests,
        totalPayroll,
        upcomingMeetings,
        totalLeaves: leaves.length,
        activeEmployees
      });

      // Generate recent activities from real data
      const activities: RecentActivity[] = [];

      // Add recent requests (from /api/requests)
      requests.slice(0, 3).forEach((req: any) => {
        activities.push({
          id: req.request_id || req.id,
          type: 'request',
          title: `${req.request_type || req.category || 'General'} Request`,
          description: `From ${req.employee_name || req.requester_name || 'Employee'}`,
          time: formatTimeAgo(req.created_at || req.submission_date),
          status: (req.status === 'PENDING' || req.status === 'pending') ? 'pending' : 
                  (req.status === 'IN_PROGRESS' || req.status === 'in-progress') ? 'in-progress' : 'completed'
        });
      });

      // Add upcoming meetings (from /api/meetings)
      meetings.slice(0, 2).forEach((meeting: any) => {
        const meetingDate = meeting.date_time || meeting.meeting_date;
        if (meetingDate && new Date(meetingDate) > new Date()) {
          activities.push({
            id: meeting.meeting_id || meeting.id,
            type: 'meeting',
            title: meeting.title || meeting.meeting_title || 'Meeting',
            description: `Scheduled for ${formatDateTime(meetingDate)}`,
            time: formatTimeAgo(meeting.created_at || meeting.created_date),
            status: 'upcoming'
          });
        }
      });

      // Add recent payroll activities (from /api/payroll)
      if (payrolls.length > 0) {
        const recentPayroll = payrolls[0];
        activities.push({
          id: recentPayroll.payroll_id || recentPayroll.id,
          type: 'payroll',
          title: 'Payroll Processed',
          description: `Total: ₹${(recentPayroll.total_amount || recentPayroll.total || 0).toLocaleString()}`,
          time: formatTimeAgo(recentPayroll.created_at || recentPayroll.processed_date),
          status: 'completed'
        });
      }

      // Add leave requests (from /api/leaves)
      leaves.slice(0, 2).forEach((leave: any) => {
        if (leave.status === 'PENDING' || leave.status === 'pending') {
          activities.push({
            id: leave.leave_id || leave.id,
            type: 'leave',
            title: 'Leave Request',
            description: `${leave.employee_name || 'Employee'} - ${leave.leave_type || leave.type}`,
            time: formatTimeAgo(leave.created_at || leave.application_date),
            status: 'pending'
          });
        }
      });

      // Sort by time and limit to 6 activities
      const sortedActivities = activities
        .filter(activity => activity.time !== 'Invalid date')
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 6);

      setRecentActivities(sortedActivities);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return '1 day ago';
      return `${diffDays} days ago`;
    } catch {
      return 'Recently';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date not available';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const quickStats: QuickStats[] = [
    {
      label: 'Total Employees',
      value: stats.totalEmployees,
      icon: <People sx={{ fontSize: 24 }} />,
      color: '#667eea',
      path: '/employees',
      change: stats.totalEmployees > 0 ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100) : 0
    },
    {
      label: 'Departments',
      value: stats.totalDepartments,
      icon: <Business sx={{ fontSize: 24 }} />,
      color: '#764ba2',
      path: '/departments'
    },
    {
      label: 'Pending Requests',
      value: stats.pendingRequests,
      icon: <Assignment sx={{ fontSize: 24 }} />,
      color: '#f093fb',
      path: '/requests'
    },
    {
      label: 'Total Payroll',
      value: stats.totalPayroll,
      icon: <AttachMoney sx={{ fontSize: 24 }} />,
      color: '#4ecdc4',
      path: '/payroll'
    },
    {
      label: 'Upcoming Meetings',
      value: stats.upcomingMeetings,
      icon: <VideoCall sx={{ fontSize: 24 }} />,
      color: '#45b7d1',
      path: '/meetings'
    },
    {
      label: 'Leave Requests',
      value: stats.totalLeaves,
      icon: <CalendarToday sx={{ fontSize: 24 }} />,
      color: '#ff6b6b',
      path: '/leaves'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'request': return <Assignment color="primary" />;
      case 'meeting': return <VideoCall color="secondary" />;
      case 'payroll': return <AttachMoney color="success" />;
      case 'employee': return <Person color="info" />;
      case 'leave': return <CalendarToday color="warning" />;
      default: return <Notifications color="action" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'in-progress': return 'info';
      case 'upcoming': return 'secondary';
      default: return 'default';
    }
  };

  const handleQuickAction = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <Box>
        <Sidebar />
        <Box sx={{ flexGrow: 1, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: isMobile ? 2 : 3 }}>
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
                Admin Dashboard
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Welcome back! Here's what's happening today.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp sx={{ fontSize: 32, opacity: 0.9 }} />
              <Button 
                variant="outlined" 
                sx={{ color: 'white', borderColor: 'white' }}
                onClick={fetchDashboardData}
              >
                Refresh Data
              </Button>
            </Box>
          </Box>
        </MotionPaper>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Quick Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickStats.map((stat, index) => (
            <Grid size={{ xs:12,sm:6, md:4, lg:2}} key={stat.label}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                sx={{
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  }
                }}
                onClick={() => handleQuickAction(stat.path)}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}99 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      color: 'white'
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stat.label === 'Total Payroll' ? formatCurrency(stat.value) : stat.value.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {stat.label}
                  </Typography>
                  {stat.change !== undefined && stat.change > 0 && (
                    <Chip
                      label={`${stat.change}% active`}
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Activities */}
          <Grid size={{ xs:12,lg:8}}>
            <MotionPaper
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Recent Activities
                </Typography>
              </Box>

              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <MotionPaper
                      key={`${activity.id}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}
                    >
                      <ListItem sx={{ py: 2 }}>
                        <ListItemIcon>
                          {getActivityIcon(activity.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              <Typography variant="subtitle1" fontWeight="500">
                                {activity.title}
                              </Typography>
                              {activity.status && (
                                <Chip
                                  label={activity.status.replace('-', ' ').toUpperCase()}
                                  color={getStatusColor(activity.status) as any}
                                  size="small"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="textSecondary">
                                {activity.description}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {activity.time}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    </MotionPaper>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      No recent activities
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Activities will appear here as they happen
                    </Typography>
                  </Box>
                )}
              </List>
            </MotionPaper>
          </Grid>

          {/* System Overview */}
          <Grid size={{ xs:12,lg:4}}>
            <MotionPaper
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #a8e6cf 0%, #3d5a80 100%)',
                color: 'white'
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                System Overview
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">System Health</Typography>
                  <Typography variant="body2" fontWeight="bold">95%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={95} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'white'
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Storage Usage</Typography>
                  <Typography variant="body2" fontWeight="bold">72%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={72} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'white'
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Active Users</Typography>
                  <Typography variant="body2" fontWeight="bold">{stats.activeEmployees}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalEmployees > 0 ? (stats.activeEmployees / stats.totalEmployees) * 100 : 0} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'white'
                    }
                  }}
                />
              </Box>

              <Box sx={{ mt: 4, p: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => handleQuickAction('/employees/new')}
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      color: 'primary.main',
                      '&:hover': { backgroundColor: 'white' }
                    }}
                  >
                    Add Employee
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => handleQuickAction('/meetings/create')}
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      color: 'primary.main',
                      '&:hover': { backgroundColor: 'white' }
                    }}
                  >
                    Schedule Meeting
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => handleQuickAction('/payroll/new')}
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      color: 'primary.main',
                      '&:hover': { backgroundColor: 'white' }
                    }}
                  >
                    Process Payroll
                  </Button>
                </Box>
              </Box>
            </MotionPaper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminDashboard;