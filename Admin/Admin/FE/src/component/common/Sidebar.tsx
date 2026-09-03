import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box,
  Chip,
  Avatar
} from '@mui/material';
import {
  Dashboard,
  People,
  Business,
  AttachMoney,
  Work,
  MeetingRoom,
  RequestPage,
  AccessTime,
  EventNote,
  Person // Add this import for profile icon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const MotionListItem = motion(ListItem);

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const drawerWidth = 260;

  if (!user) return null;

  let menuItems = [];

  if (user.role === 'EMPLOYEE') {
    menuItems = [
      { text: 'Dashboard', icon: <Dashboard />, path: '/employee/dashboard' },
      { text: 'Projects', icon: <Work />, path: '/employee/projects' },
      { text: 'Attendance', icon: <AccessTime />, path: '/employee/attendance' },
      { text: 'Leaves', icon: <EventNote />, path: '/employee/leaves' },
    ];
  } else if (user.role === 'HR') {
    menuItems = [
      { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
      { text: 'Employees', icon: <People />, path: '/admin/employees' },
      { text: 'Payroll', icon: <AttachMoney />, path: '/admin/payroll' },
      { text: 'Attendance', icon: <AccessTime />, path: '/admin/attendance' },
      { text: 'Leaves', icon: <EventNote />, path: '/admin/leaves' },
      { text: 'Meetings', icon: <MeetingRoom />, path: '/admin/meetings' },
      { text: 'Manage Requests', icon: <RequestPage />, path: '/admin/requests' },
    ];
  } else {
    // ADMIN menu items
    menuItems = [
      { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
      { text: 'Employees', icon: <People />, path: '/admin/employees' },
      { text: 'Departments', icon: <Business />, path: '/admin/departments' },
      { text: 'Payroll', icon: <AttachMoney />, path: '/admin/payroll' },
      { text: 'Projects', icon: <Work />, path: '/admin/projects' },
      { text: 'Attendance', icon: <AccessTime />, path: '/admin/attendance' },
      { text: 'Leaves', icon: <EventNote />, path: '/admin/leaves' },
      { text: 'Meetings', icon: <MeetingRoom />, path: '/admin/meetings' },
      { text: 'Manage Requests', icon: <RequestPage />, path: '/admin/requests' },
    ];
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'HR': return 'warning';
      case 'EMPLOYEE': return 'success';
      default: return 'primary';
    }
  };

  // Fix for dropdown display state
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const handleProfileNavigation = () => {
    navigate('/admin/profile');
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setDropdownOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #2c3e50 0%, #3498db 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          border: 'none',
          boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
        },
      }}
    >
      {/* Header Section */}
      <Box sx={{ p: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h5"
            sx={{
              textAlign: 'center',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #fff, #bdc3c7)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              mb: 2
            }}
          >
            Company Tool
          </Typography>

          {/* User Info with Dropdown */}
          <Box
            sx={{
              textAlign: 'center',
              mb: 2,
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={handleProfileClick}
          >
            <Avatar
              sx={{
                width: 60,
                height: 60,
                mx: 'auto',
                mb: 1,
                border: '3px solid rgba(255,255,255,0.2)',
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  borderColor: 'rgba(255,255,255,0.4)'
                }
              }}
            >
              {user.name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {user.name || user.username || 'User'}
            </Typography>
            <Chip
              label={user.role}
              size="small"
              color={getRoleColor(user.role) as any}
              sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }}
            />

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '160px',
                  backgroundColor: '#2c3e50',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                  zIndex: 1000,
                  mt: 1,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <List sx={{ p: 0 }}>
                  <ListItem
                    component="div"
                    onClick={handleProfileNavigation}
                    sx={{
                      cursor: 'pointer',
                      py: 1.5,
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 35, color: 'white' }}>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Profile"
                      sx={{
                        '& .MuiTypography-root': {
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          color: 'white'
                        }
                      }}
                    />
                  </ListItem>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                  <ListItem
                    component="div"
                    onClick={handleLogout}
                    sx={{
                      cursor: 'pointer',
                      py: 1.5,
                      color: '#ff6b6b',
                      '&:hover': {
                        backgroundColor: 'rgba(255,107,107,0.1)'
                      }
                    }}
                  >
                    <ListItemText
                      primary="Logout"
                      sx={{
                        textAlign: 'center',
                        '& .MuiTypography-root': {
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          color: '#ff6b6b'
                        }
                      }}
                    />
                  </ListItem>
                </List>
              </Box>
            )}
          </Box>
        </motion.div>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'hidden', px: 1 }}>
        <List sx={{
          height: '100%',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}>
          <AnimatePresence>
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <MotionListItem
                  key={index}
                  onClick={() => navigate(item.path)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                    border: isActive ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    },
                    mb: 1,
                    borderRadius: 2,
                    py: 1.5,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? '#4ecdc4' : 'white',
                      minWidth: 40,
                      transition: 'color 0.3s ease'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      '& .MuiTypography-root': {
                        fontWeight: isActive ? 600 : 400,
                        color: 'white',
                        fontSize: '0.95rem'
                      }
                    }}
                  />
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#4ecdc4'
                      }}
                    />
                  )}
                </MotionListItem>
              );
            })}
          </AnimatePresence>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;