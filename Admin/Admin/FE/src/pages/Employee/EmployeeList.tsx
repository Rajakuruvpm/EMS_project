// src/pages/Admin/EmployeeList.tsx
import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Chip, CircularProgress, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Card, CardContent, Grid, useTheme, useMediaQuery,
    Fade, Slide, TextField, MenuItem, Collapse, InputAdornment
} from '@mui/material';
import {
    Add, Edit, Delete, Visibility, Person, Work, CalendarToday,
    FilterList, Search, Clear, Check
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Employee {
    designation: string;
    department_name: string;
    id: number;
    username: string;
    email: string;
    phone: string;
    role: 'ADMIN' | 'HR' | 'EMPLOYEE';
    is_active: boolean;
    created_at: string;
    emp_id?: number;
    join_date?: string;
}

interface User {
    id?: number;
    role: 'ADMIN' | 'HR' | 'EMPLOYEE';
}

interface FilterState {
    username: string;
    department: string;
    status: string;
}

interface TempFilterState {
    username: string;
    department: string;
    status: string;
}

const MotionPaper = motion(Paper);
const MotionButton = motion(Button);
const MotionTableRow = motion(TableRow);

const EmployeeList: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [viewDialog, setViewDialog] = useState({ open: false, employee: null as Employee | null });
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        username: '',
        department: '',
        status: ''
    });
    const [tempFilters, setTempFilters] = useState<TempFilterState>({
        username: '',
        department: '',
        status: ''
    });

    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Get unique values for filter dropdowns
    const departments = Array.from(new Set(employees.map(emp => emp.department_name).filter(Boolean)));

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('https://admin-be-qe74.onrender.com/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentUser(response.data);
            return response.data;
        } catch (err) {
            console.error('Failed to fetch current user:', err);
            const fallbackUser: User = {
                id: 0,
                role: 'EMPLOYEE'
            };
            setCurrentUser(fallbackUser);
            return fallbackUser;
        }
    };

    const fetchEmployees = async () => {
        try {
            const user = await fetchCurrentUser();
            if (!user) return;

            const token = localStorage.getItem('token');
            let url = 'https://admin-be-qe74.onrender.com/api/admin/employees';

            if (user.role === 'HR') {
                url = 'https://admin-be-qe74.onrender.com/api/hr/employees';
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let filteredEmployees = response.data;
            if (user.role === 'HR') {
                filteredEmployees = response.data.filter((emp: Employee) =>
                    emp.role === 'EMPLOYEE'
                );
            }

            setEmployees(filteredEmployees);
            setFilteredEmployees(filteredEmployees);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // Apply filters whenever filters state changes
    useEffect(() => {
        applyFilters();
    }, [filters, employees]);

    const applyFilters = () => {
        let filtered = employees;

        if (filters.username) {
            filtered = filtered.filter(emp =>
                emp.username.toLowerCase().includes(filters.username.toLowerCase()) ||
                emp.email.toLowerCase().includes(filters.username.toLowerCase())
            );
        }

        if (filters.department) {
            filtered = filtered.filter(emp =>
                emp.department_name === filters.department
            );
        }

        if (filters.status) {
            const isActive = filters.status === 'active';
            filtered = filtered.filter(emp =>
                emp.is_active === isActive
            );
        }

        setFilteredEmployees(filtered);
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
            username: '',
            department: '',
            status: ''
        };
        setTempFilters(emptyFilters);
        setFilters(emptyFilters);
        setFilteredEmployees(employees);
        setSuccess('All filters cleared');
    };

    const handleView = (employee: Employee) => {
        setViewDialog({ open: true, employee });
    };

    const handleAddEmployee = () => {
        navigate('new');
    };

    const handleEdit = (id: number) => {
        navigate(`edit/${id}`);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this employee?')) return;

        try {
            const token = localStorage.getItem('token');
            let url = `https://admin-be-qe74.onrender.com/api/admin/employees/${id}`;

            if (currentUser?.role === 'HR') {
                url = `https://admin-be-qe74.onrender.com/api/hr/employees/${id}`;
            }

            await axios.delete(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Employee deleted successfully');
            fetchEmployees();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete employee');
        }
    };

    const handleCloseView = () => {
        setViewDialog({ open: false, employee: null });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const canDelete = (employee: Employee) => {
        if (currentUser?.role === 'ADMIN') return true;
        if (currentUser?.role === 'HR' && employee.role === 'EMPLOYEE') return true;
        return false;
    };

    const canEdit = (employee: Employee) => {
        if (currentUser?.role === 'ADMIN') return true;
        if (currentUser?.role === 'HR' && employee.role === 'EMPLOYEE') return true;
        return false;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    return (
        <Box sx={{
            p: isMobile ? 1 : 3,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header Section - Fixed */}
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
                            {currentUser?.role === 'HR' ? 'Employee Management' : 'User Management'}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                            Manage your team members and their roles
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
                            onClick={handleAddEmployee}
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
                            {currentUser?.role === 'HR' ? 'Add Employee' : 'Add User'}
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
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        flexShrink: 0
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
                            label={`${filteredEmployees.length} records`}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                        />
                    </Box>

                    <Grid container spacing={2} alignItems="center">
                        {/* Username/Email Search */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                fullWidth
                                label="Search Username/Email"
                                value={tempFilters.username}
                                onChange={(e) => handleTempFilterChange('username', e.target.value)}
                                placeholder="Enter username or email..."
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
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
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
                    {(filters.department || filters.status || filters.username) && (
                        <Fade in>
                            <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2 }}>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    Active Filters:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {filters.username && (
                                        <Chip
                                            label={`Search: ${filters.username}`}
                                            size="small"
                                            onDelete={() => {
                                                setTempFilters(prev => ({ ...prev, username: '' }));
                                                const newFilters = { ...filters, username: '' };
                                                setFilters(newFilters);
                                                let filtered = [...employees];
                                                if (newFilters.department) {
                                                    filtered = filtered.filter(p => p.department_name === newFilters.department);
                                                }
                                                if (newFilters.status) {
                                                    const isActive = newFilters.status === 'active';
                                                    filtered = filtered.filter(p => p.is_active === isActive);
                                                }
                                                setFilteredEmployees(filtered);
                                            }}
                                            color="primary"
                                        />
                                    )}
                                    {filters.department && (
                                        <Chip
                                            label={`Department: ${filters.department}`}
                                            size="small"
                                            onDelete={() => {
                                                setTempFilters(prev => ({ ...prev, department: '' }));
                                                const newFilters = { ...filters, department: '' };
                                                setFilters(newFilters);
                                                let filtered = [...employees];
                                                if (newFilters.username) {
                                                    filtered = filtered.filter(p =>
                                                        p.username.toLowerCase().includes(newFilters.username.toLowerCase()) ||
                                                        p.email.toLowerCase().includes(newFilters.username.toLowerCase())
                                                    );
                                                }
                                                if (newFilters.status) {
                                                    const isActive = newFilters.status === 'active';
                                                    filtered = filtered.filter(p => p.is_active === isActive);
                                                }
                                                setFilteredEmployees(filtered);
                                            }}
                                            color="secondary"
                                        />
                                    )}
                                    {filters.status && (
                                        <Chip
                                            label={`Status: ${filters.status}`}
                                            size="small"
                                            onDelete={() => {
                                                setTempFilters(prev => ({ ...prev, status: '' }));
                                                const newFilters = { ...filters, status: '' };
                                                setFilters(newFilters);
                                                let filtered = [...employees];
                                                if (newFilters.username) {
                                                    filtered = filtered.filter(p =>
                                                        p.username.toLowerCase().includes(newFilters.username.toLowerCase()) ||
                                                        p.email.toLowerCase().includes(newFilters.username.toLowerCase())
                                                    );
                                                }
                                                if (newFilters.department) {
                                                    filtered = filtered.filter(p => p.department_name === newFilters.department);
                                                }
                                                setFilteredEmployees(filtered);
                                            }}
                                            color={filters.status === 'active' ? 'success' : 'default'}
                                        />
                                    )}
                                </Box>
                            </Box>
                        </Fade>
                    )}
                </MotionPaper>
            </Collapse>

            {/* Alerts Section */}
            <Box sx={{ flexShrink: 0, mb: 2 }}>
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

            {/* Table Section - Fixed Table Header Background */}
            <MotionPaper
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
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
                                <TableCell>ID</TableCell>
                                <TableCell>Username</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Designation</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <AnimatePresence>
                                {filteredEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                            <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                                                No employees found matching your filters
                                            </Typography>
                                            <Button
                                                onClick={clearFilters}
                                                variant="contained"
                                                startIcon={<Clear />}
                                            >
                                                Clear Filters
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredEmployees.map((employee, index) => (
                                        <MotionTableRow
                                            key={employee.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{
                                                backgroundColor: 'rgba(0,0,0,0.02)',
                                            }}
                                            sx={{ transition: 'all 0.3s ease' }}
                                        >
                                            <TableCell>{employee.id}</TableCell>
                                            <TableCell sx={{ fontWeight: '500' }}>{employee.username}</TableCell>
                                            <TableCell>{employee.email}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={employee.department_name || 'N/A'}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ borderRadius: 1 }}
                                                />
                                            </TableCell>
                                            <TableCell>{employee.designation || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={employee.role}
                                                    color={
                                                        employee.role === 'ADMIN' ? 'error' :
                                                            employee.role === 'HR' ? 'warning' : 'primary'
                                                    }
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        borderRadius: 1
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={employee.is_active ? 'Active' : 'Inactive'}
                                                    color={employee.is_active ? 'success' : 'default'}
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
                                                        color="info"
                                                        size="small"
                                                        onClick={() => handleView(employee)}
                                                        sx={{
                                                            backgroundColor: 'rgba(33,150,243,0.1)',
                                                            '&:hover': { backgroundColor: 'rgba(33,150,243,0.2)' }
                                                        }}
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                    {canEdit(employee) && (
                                                        <IconButton
                                                            color="primary"
                                                            size="small"
                                                            onClick={() => handleEdit(employee.id)}
                                                            sx={{
                                                                backgroundColor: 'rgba(25,118,210,0.1)',
                                                                '&:hover': { backgroundColor: 'rgba(25,118,210,0.2)' }
                                                            }}
                                                        >
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                    {canDelete(employee) && (
                                                        <IconButton
                                                            color="error"
                                                            size="small"
                                                            onClick={() => handleDelete(employee.id)}
                                                            sx={{
                                                                backgroundColor: 'rgba(211,47,47,0.1)',
                                                                '&:hover': { backgroundColor: 'rgba(211,47,47,0.2)' }
                                                            }}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    )}
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

            {/* View Employee Dialog */}
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
                        <Person />
                        {currentUser?.role === 'HR' ? 'Employee Details' : 'User Details'} - {viewDialog.employee?.username}
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 4 }}>
                    {viewDialog.employee && (
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Card sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(102,126,234,0.1)' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Person color="primary" sx={{ mr: 2 }} />
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                Personal Information
                                            </Typography>
                                        </Box>
                                        <Box sx={{ pl: 4 }}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Username
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {viewDialog.employee.username}
                                            </Typography>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Email
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {viewDialog.employee.email}
                                            </Typography>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Phone
                                            </Typography>
                                            <Typography variant="body1">
                                                {viewDialog.employee.phone || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Card sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(118,75,162,0.1)' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Work color="primary" sx={{ mr: 2 }} />
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                Professional Information
                                            </Typography>
                                        </Box>
                                        <Box sx={{ pl: 4 }}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Role
                                            </Typography>
                                            <Box sx={{ mb: 2 }}>
                                                <Chip
                                                    label={viewDialog.employee.role}
                                                    color={
                                                        viewDialog.employee.role === 'ADMIN' ? 'error' :
                                                            viewDialog.employee.role === 'HR' ? 'warning' : 'primary'
                                                    }
                                                    size="small"
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </Box>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Department
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {viewDialog.employee.department_name || 'N/A'}
                                            </Typography>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Designation
                                            </Typography>
                                            <Typography variant="body1">
                                                {viewDialog.employee.designation || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Card sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(255,107,107,0.1)' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <CalendarToday color="primary" sx={{ mr: 2 }} />
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                Status & Timeline
                                            </Typography>
                                        </Box>
                                        <Box sx={{ pl: 4 }}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Status
                                            </Typography>
                                            <Box sx={{ mb: 2 }}>
                                                <Chip
                                                    label={viewDialog.employee.is_active ? 'Active' : 'Inactive'}
                                                    color={viewDialog.employee.is_active ? 'success' : 'default'}
                                                    size="small"
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </Box>
                                            {viewDialog.employee.role === 'EMPLOYEE' && viewDialog.employee.join_date && (
                                                <>
                                                    <Typography variant="subtitle2" color="textSecondary">
                                                        Join Date
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {formatDate(viewDialog.employee.join_date)}
                                                    </Typography>
                                                </>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
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
                    {viewDialog.employee && canEdit(viewDialog.employee) && (
                        <Button
                            variant="contained"
                            onClick={() => {
                                handleCloseView();
                                handleEdit(viewDialog.employee!.id);
                            }}
                            sx={{ borderRadius: 2 }}
                        >
                            Edit
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeeList;