// src/pages/Admin/PayrollList.tsx
import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Chip, CircularProgress, Alert,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    Card, CardContent, Grid, useTheme, useMediaQuery,
    Fade, Slide, TextField, MenuItem, Collapse
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Paid, AttachMoney, FilterList, Clear } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Payroll {
    payroll_id: number;
    emp_id: number;
    employee_name: string;
    employee_email: string;
    department_name: string;
    designation: string;
    basic_salary: number;
    bonus: number;
    deduction: number;
    total: number;
    status: 'PENDING' | 'PAID';
    processed_by: string;
    created_at: string;
}

const MotionPaper = motion(Paper);
const MotionButton = motion(Button);
const MotionTableRow = motion(TableRow);

const PayrollList: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [filteredPayrolls, setFilteredPayrolls] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [markPaidDialog, setMarkPaidDialog] = useState({ open: false, payroll: null as Payroll | null });
    const [viewDialog, setViewDialog] = useState({ open: false, payroll: null as Payroll | null });
    const [filtersOpen, setFiltersOpen] = useState(false); // New state for filter panel

    // Filter states
    const [filters, setFilters] = useState({
        department: '',
        processedBy: '',
        status: ''
    });

    const [tempFilters, setTempFilters] = useState({
        department: '',
        processedBy: '',
        status: ''
    });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isAdmin = user?.role === 'ADMIN';
    // const isHR = user?.role === 'HR';

    const fetchPayrolls = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('https://admin-be-qe74.onrender.com/api/payroll', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayrolls(response.data);
            setFilteredPayrolls(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch payroll records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayrolls();
    }, []);

    // Get unique values for filters
    const departments = Array.from(new Set(payrolls.map(p => p.department_name))).filter(Boolean);
    const processedBys = Array.from(new Set(payrolls.map(p => p.processed_by || 'System'))).filter(Boolean);
    const statuses = ['PENDING', 'PAID'];

    // Apply filters
    const applyFilters = () => {
        let filtered = [...payrolls];

        if (tempFilters.department) {
            filtered = filtered.filter(p => p.department_name === tempFilters.department);
        }

        if (tempFilters.processedBy) {
            filtered = filtered.filter(p => (p.processed_by || 'System') === tempFilters.processedBy);
        }

        if (tempFilters.status) {
            filtered = filtered.filter(p => p.status === tempFilters.status);
        }

        setFilteredPayrolls(filtered);
        setFilters({ ...tempFilters });
    };

    // Clear filters
    const clearFilters = () => {
        setTempFilters({
            department: '',
            processedBy: '',
            status: ''
        });
        setFilters({
            department: '',
            processedBy: '',
            status: ''
        });
        setFilteredPayrolls(payrolls);
    };

    const handleTempFilterChange = (field: string, value: string) => {
        setTempFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleView = (payroll: Payroll) => {
        setViewDialog({ open: true, payroll });
    };

    const handleCloseView = () => {
        setViewDialog({ open: false, payroll: null });
    };

    const handleMarkPaid = (payroll: Payroll) => {
        setMarkPaidDialog({ open: true, payroll });
    };

    const handleMarkPaidConfirm = async () => {
        if (!markPaidDialog.payroll) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `https://admin-be-qe74.onrender.com/api/payroll/${markPaidDialog.payroll.payroll_id}/status`,
                { status: 'PAID' },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSuccess('Payroll marked as paid successfully!');
            setMarkPaidDialog({ open: false, payroll: null });
            fetchPayrolls();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update payroll status');
        }
    };

    const handleMarkPaidCancel = () => {
        setMarkPaidDialog({ open: false, payroll: null });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this payroll record?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`https://admin-be-qe74.onrender.com/api/payroll/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setSuccess('Payroll record deleted successfully!');
            fetchPayrolls();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete payroll record');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
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
                            Payroll Management
                        </Typography>
                        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                            {isAdmin ? "All Payroll Records" : "My Processed Payroll Records"}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {/* Filter Toggle Button */}
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
                            onClick={() => navigate('/admin/payroll/new')}
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
                            Add Payroll
                        </MotionButton>
                    </Box>
                </Box>
            </MotionPaper>

            {/* Filters Section - Now Collapsible */}
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
                            label={`${filteredPayrolls.length} records`}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                        />
                    </Box>
                    <Grid container spacing={2} alignItems="center">
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

                        {/* Processed By Filter - Only for Admin */}
                        {isAdmin && (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Processed By"
                                    value={tempFilters.processedBy}
                                    onChange={(e) => handleTempFilterChange('processedBy', e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="">All Processors</MenuItem>
                                    {processedBys.map((processor) => (
                                        <MenuItem key={processor} value={processor}>
                                            {processor}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        )}

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
                                {statuses.map((status) => (
                                    <MenuItem key={status} value={status}>
                                        {status}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* Action Buttons */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap' }}>
                                <MotionButton
                                    variant="contained"
                                    onClick={applyFilters}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    sx={{
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        flex: 1,
                                        minWidth: 'auto'
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
                    {(filters.department || filters.processedBy || filters.status) && (
                        <Fade in>
                            <Box sx={{ mt: 2, p: 1, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }}>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                    Active Filters:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {filters.department && (
                                        <Chip
                                            label={`Department: ${filters.department}`}
                                            size="small"
                                            onDelete={() => {
                                                setTempFilters(prev => ({ ...prev, department: '' }));
                                                const newFilters = { ...filters, department: '' };
                                                setFilters(newFilters);
                                                let filtered = [...payrolls];
                                                if (newFilters.processedBy) {
                                                    filtered = filtered.filter(p => (p.processed_by || 'System') === newFilters.processedBy);
                                                }
                                                if (newFilters.status) {
                                                    filtered = filtered.filter(p => p.status === newFilters.status);
                                                }
                                                setFilteredPayrolls(filtered);
                                            }}
                                        />
                                    )}
                                    {filters.processedBy && (
                                        <Chip
                                            label={`Processed By: ${filters.processedBy}`}
                                            size="small"
                                            onDelete={() => {
                                                setTempFilters(prev => ({ ...prev, processedBy: '' }));
                                                const newFilters = { ...filters, processedBy: '' };
                                                setFilters(newFilters);
                                                let filtered = [...payrolls];
                                                if (newFilters.department) {
                                                    filtered = filtered.filter(p => p.department_name === newFilters.department);
                                                }
                                                if (newFilters.status) {
                                                    filtered = filtered.filter(p => p.status === newFilters.status);
                                                }
                                                setFilteredPayrolls(filtered);
                                            }}
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
                                                let filtered = [...payrolls];
                                                if (newFilters.department) {
                                                    filtered = filtered.filter(p => p.department_name === newFilters.department);
                                                }
                                                if (newFilters.processedBy) {
                                                    filtered = filtered.filter(p => (p.processed_by || 'System') === newFilters.processedBy);
                                                }
                                                setFilteredPayrolls(filtered);
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>
                        </Fade>
                    )}
                </MotionPaper>
            </Collapse>

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

            {/* Table Section */}
            <MotionPaper
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
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
                                {isAdmin && <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Processed By</TableCell>}
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Basic Salary</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Bonus</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Deduction</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <AnimatePresence>
                                {filteredPayrolls.length > 0 ? (
                                    filteredPayrolls.map((payroll, index) => (
                                        <MotionTableRow
                                            key={payroll.payroll_id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{
                                                backgroundColor: 'rgba(0,0,0,0.02)',
                                            }}
                                            sx={{ transition: 'all 0.3s ease' }}
                                        >
                                            <TableCell>{payroll.payroll_id}</TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="500">
                                                        {payroll.employee_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {payroll.designation}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{payroll.department_name}</TableCell>
                                            {isAdmin && (
                                                <TableCell>
                                                    <Chip
                                                        label={payroll.processed_by || 'System'}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ borderRadius: 1 }}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell>{formatCurrency(payroll.basic_salary)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={formatCurrency(payroll.bonus)}
                                                    color="success"
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ borderRadius: 1, fontWeight: 'bold' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={formatCurrency(payroll.deduction)}
                                                    color="error"
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ borderRadius: 1, fontWeight: 'bold' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                                    {formatCurrency(payroll.total)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={payroll.status}
                                                    color={payroll.status === 'PAID' ? 'success' : 'warning'}
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
                                                        onClick={() => handleView(payroll)}
                                                        sx={{
                                                            backgroundColor: 'rgba(33,150,243,0.1)',
                                                            '&:hover': { backgroundColor: 'rgba(33,150,243,0.2)' }
                                                        }}
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => navigate(`/admin/payroll/edit/${payroll.payroll_id}`)}
                                                        sx={{
                                                            backgroundColor: 'rgba(25,118,210,0.1)',
                                                            '&:hover': { backgroundColor: 'rgba(25,118,210,0.2)' }
                                                        }}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    {payroll.status === 'PENDING' && (
                                                        <IconButton
                                                            color="success"
                                                            size="small"
                                                            onClick={() => handleMarkPaid(payroll)}
                                                            sx={{
                                                                backgroundColor: 'rgba(56,142,60,0.1)',
                                                                '&:hover': { backgroundColor: 'rgba(56,142,60,0.2)' }
                                                            }}
                                                        >
                                                            <Paid fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        onClick={() => handleDelete(payroll.payroll_id)}
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
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={isAdmin ? 10 : 9} align="center" sx={{ py: 6 }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <AttachMoney sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                                <Typography variant="h6" color="textSecondary" gutterBottom>
                                                    No payroll records found
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                                    {Object.values(filters).some(f => f)
                                                        ? 'No records match your filters. Try clearing filters.'
                                                        : 'Get started by creating your first payroll record.'
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
                                                        onClick={() => navigate('/admin/payroll/new')}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        sx={{
                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            borderRadius: 2
                                                        }}
                                                    >
                                                        Create First Payroll
                                                    </MotionButton>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </TableContainer>
            </MotionPaper>

            {/* View Payroll Details Dialog - Made Smaller */}
            <Dialog
                open={viewDialog.open}
                onClose={handleCloseView}
                maxWidth="sm" // Changed from md to sm
                fullWidth
                TransitionComponent={Slide}
                transitionDuration={300}
            >
                <DialogTitle
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontWeight: 'bold',
                        py: 2 // Reduced padding
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Visibility fontSize="small" />
                        <Typography variant="h6">
                            Payroll #{viewDialog.payroll?.payroll_id}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 2 }}> {/* Reduced padding */}
                    {viewDialog.payroll && (
                        <Grid container spacing={1}> {/* Reduced spacing */}
                            {/* Employee Information */}
                            <Grid size={{ xs: 12 }}>
                                <Card variant="outlined" sx={{ mb: 1 }}>
                                    <CardContent sx={{ p: 2 }}> {/* Reduced padding */}
                                        <Typography variant="subtitle2" color="primary" gutterBottom>
                                            Employee Information
                                        </Typography>
                                        <Box sx={{ display: 'grid', gap: 0.5 }}> {/* Reduced gap */}
                                            <Typography variant="body2">
                                                <strong>Name:</strong> {viewDialog.payroll.employee_name}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Department:</strong> {viewDialog.payroll.department_name}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Designation:</strong> {viewDialog.payroll.designation}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Salary Breakdown */}
                            <Grid size={{ xs: 12 }}>
                                <Card variant="outlined" sx={{ mb: 1 }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" color="primary" gutterBottom>
                                            Salary Breakdown
                                        </Typography>
                                        <Box sx={{ display: 'grid', gap: 0.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Basic Salary:</Typography>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {formatCurrency(viewDialog.payroll.basic_salary)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="success.main">Bonus:</Typography>
                                                <Typography variant="body2" color="success.main" fontWeight="bold">
                                                    + {formatCurrency(viewDialog.payroll.bonus)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="error.main">Deductions:</Typography>
                                                <Typography variant="body2" color="error.main" fontWeight="bold">
                                                    - {formatCurrency(viewDialog.payroll.deduction)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                                <Typography variant="body1" fontWeight="bold">Net Salary:</Typography>
                                                <Typography variant="body1" fontWeight="bold" color="primary">
                                                    {formatCurrency(viewDialog.payroll.total)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Status Information */}
                            <Grid size={{ xs: 12 }}>
                                <Card variant="outlined">
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" color="primary" gutterBottom>
                                            Payroll Information
                                        </Typography>
                                        <Box sx={{ display: 'grid', gap: 0.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2">Status:</Typography>
                                                <Chip
                                                    label={viewDialog.payroll.status}
                                                    color={viewDialog.payroll.status === 'PAID' ? 'success' : 'warning'}
                                                    size="small"
                                                />
                                            </Box>
                                            {isAdmin && (
                                                <Typography variant="body2">
                                                    <strong>Processed By:</strong> {viewDialog.payroll.processed_by || 'System'}
                                                </Typography>
                                            )}
                                            {viewDialog.payroll.created_at && (
                                                <Typography variant="body2">
                                                    <strong>Created:</strong> {formatDate(viewDialog.payroll.created_at)}
                                                </Typography>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}> {/* Reduced padding */}
                    <Button
                        onClick={handleCloseView}
                        size="small"
                        sx={{ borderRadius: 1 }}
                    >
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            handleCloseView();
                            navigate(`/admin/payroll/edit/${viewDialog.payroll?.payroll_id}`);
                        }}
                        sx={{
                            borderRadius: 1,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}
                    >
                        Edit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Mark as Paid Dialog - Made Smaller */}
            <Dialog
                open={markPaidDialog.open}
                onClose={handleMarkPaidCancel}
                maxWidth="xs" // Made extra small
                TransitionComponent={Slide}
                transitionDuration={300}
            >
                <DialogTitle
                    sx={{
                        background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                        color: 'white',
                        fontWeight: 'bold',
                        py: 2
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Paid fontSize="small" />
                        <Typography variant="h6">
                            Mark as Paid
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                    <DialogContentText>
                        Are you sure you want to mark this payroll as paid?
                    </DialogContentText>
                    <Box sx={{ mt: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2">
                            <strong>Employee:</strong> {markPaidDialog.payroll?.employee_name}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Amount:</strong> {markPaidDialog.payroll && formatCurrency(markPaidDialog.payroll.total)}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={handleMarkPaidCancel}
                        size="small"
                        sx={{ borderRadius: 1 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleMarkPaidConfirm}
                        color="success"
                        variant="contained"
                        size="small"
                        sx={{ borderRadius: 1 }}
                    >
                        Mark as Paid
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PayrollList;