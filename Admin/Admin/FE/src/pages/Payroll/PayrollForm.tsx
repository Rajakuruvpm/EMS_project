// src/pages/Admin/PayrollForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid, MenuItem, Alert,
  CircularProgress, Card, CardContent, Divider, useTheme, useMediaQuery,
  Fade
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Calculate, Save, Cancel, Person, AttachMoney, TrendingUp, TrendingDown } from '@mui/icons-material';
import axios from 'axios';
import { motion } from 'framer-motion';

interface Employee {
  user_id: number;
  username: string;
  email: string;
  department_name: string;
  designation: string;
  role: string;
}

interface PayrollFormData {
  emp_id: number | '';
  basic_salary: number | '';
  bonus: number | '';
  deduction: number | '';
  total: number | '';
  status: 'PENDING' | 'PAID';
  payroll_month: string;
}

interface CalculationResult {
  basic_salary: number;
  bonus: number;
  deduction: number;
  total: number;
}

const MotionPaper = motion(Paper);
const MotionButton = motion(Button);
const MotionCard = motion(Card);

const PayrollForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [formData, setFormData] = useState<PayrollFormData>({
    emp_id: '',
    basic_salary: '',
    bonus: '',
    deduction: '',
    total: '',
    status: 'PENDING',
    payroll_month: new Date().toISOString().slice(0, 7)
  });

  const isEditMode = Boolean(id);

  useEffect(() => {
    fetchEmployees();
    if (isEditMode) {
      fetchPayroll();
    }
  }, [id]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://admin-be-qe74.onrender.com/api/payroll/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const mappedEmployees = response.data.map((emp: { user_id: any; }) => ({
        ...emp,
        emp_id: emp.user_id
      }));

      console.log('🔍 DEBUG - Mapped employees:', mappedEmployees);
      setEmployees(mappedEmployees);
    } catch (err: any) {
      setError('Failed to fetch employees');
      console.error('Error fetching employees:', err);
    }
  };

  const fetchPayroll = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://admin-be-qe74.onrender.com/api/payroll/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payroll = response.data;
      setFormData({
        emp_id: payroll.emp_id,
        basic_salary: payroll.basic_salary,
        bonus: payroll.bonus,
        deduction: payroll.deduction,
        total: payroll.total,
        status: payroll.status,
        payroll_month: payroll.payroll_month
      });
    } catch (err: any) {
      setError('Failed to fetch payroll data');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('salary') || name.includes('bonus') || name.includes('deduction') || name.includes('total')
        ? value === '' ? '' : Number(value)
        : value
    }));
    setError('');
    setSuccess('');
  };

  const handleCalculate = async () => {
    if (!formData.emp_id || !formData.basic_salary || !formData.payroll_month) {
      setError('Please select employee, enter basic salary, and select month');
      return;
    }

    setCalculating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://admin-be-qe74.onrender.com/api/payroll/calculate',
        {
          emp_id: formData.emp_id,
          basic_salary: formData.basic_salary,
          month: new Date(formData.payroll_month).getMonth() + 1,
          year: new Date(formData.payroll_month).getFullYear()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = response.data;
      setCalculation(result);

      setFormData(prev => ({
        ...prev,
        bonus: result.bonus,
        deduction: result.deduction,
        total: result.total
      }));

      setSuccess('Salary calculated successfully!');
    } catch (err: any) {
      console.error('❌ Calculate error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to calculate salary');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.emp_id || !formData.basic_salary || !formData.total) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = isEditMode
        ? `https://admin-be-qe74.onrender.com/api/payroll/${id}`
        : 'https://admin-be-qe74.onrender.com/api/payroll';

      const method = isEditMode ? 'put' : 'post';

      const submitData = {
        emp_id: formData.emp_id,
        basic_salary: formData.basic_salary,
        bonus: formData.bonus || 0,
        deduction: formData.deduction || 0,
        total: formData.total,
        status: formData.status,
        payroll_month: formData.payroll_month + '-01'
      };

      await axios[method](url, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(isEditMode ? 'Payroll updated successfully!' : 'Payroll created successfully!');
      setTimeout(() => navigate('/admin/payroll'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const selectedEmployee = employees.find(emp => emp.user_id === formData.emp_id);

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {isEditMode ? 'Edit Payroll' : 'Create New Payroll'}
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              {isEditMode ? 'Update employee payroll information' : 'Generate payroll for team members'}
            </Typography>
          </Box>
          <MotionButton
            startIcon={<Cancel />}
            onClick={() => navigate('/admin/payroll')}
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

      <Grid container spacing={3}>
        {/* Form Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <MotionPaper
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              background: 'rgba(255,255,255,0.95)'
            }}
          >
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Employee Selection */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    select
                    label="Employee"
                    name="emp_id"
                    value={formData.emp_id}
                    onChange={handleChange}
                    required
                    disabled={isEditMode}
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
                  >
                    <MenuItem value="">Select Employee</MenuItem>
                    {employees.map((employee) => (
                      <MenuItem key={employee.user_id} value={employee.user_id}>
                        {employee.username} - {employee.designation} ({employee.department_name})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Payroll Month */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Payroll Month"
                    name="payroll_month"
                    type="month"
                    value={formData.payroll_month}
                    onChange={handleChange}
                    required
                    disabled={isEditMode}
                    InputLabelProps={{
                      shrink: true,
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

                {/* Basic Salary */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Basic Salary"
                    name="basic_salary"
                    type="number"
                    value={formData.basic_salary}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
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

                {/* Calculate Button */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <MotionButton
                    fullWidth
                    variant="outlined"
                    startIcon={calculating ? <CircularProgress size={20} /> : <Calculate />}
                    onClick={handleCalculate}
                    disabled={!formData.emp_id || !formData.basic_salary || calculating}
                    whileHover={{ scale: calculating ? 1 : 1.02 }}
                    whileTap={{ scale: calculating ? 1 : 0.98 }}
                    sx={{
                      height: '56px',
                      borderRadius: 2,
                      borderColor: 'primary.main',
                      color: 'primary.main'
                    }}
                  >
                    {calculating ? 'Calculating...' : 'Calculate Salary'}
                  </MotionButton>
                </Grid>

                {/* Bonus */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Bonus"
                    name="bonus"
                    type="number"
                    value={formData.bonus}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
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

                {/* Deduction */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Deduction"
                    name="deduction"
                    type="number"
                    value={formData.deduction}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: <TrendingDown sx={{ mr: 1, color: 'error.main' }} />
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

                {/* Total Salary */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Total Salary"
                    name="total"
                    type="number"
                    value={formData.total}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: <AttachMoney sx={{ mr: 1, color: 'primary.main' }} />,
                      readOnly: true
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(102,126,234,0.1)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontWeight: 'bold',
                        color: 'primary.main'
                      }
                    }}
                  />
                </Grid>

                {/* Status */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Status"
                    name="status"
                    value={formData.status}
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
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="PAID">Paid</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              {/* Action Buttons */}
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <MotionButton
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={() => navigate('/admin/payroll')}
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
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
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
                  {loading ? 'Saving...' : (isEditMode ? 'Update Payroll' : 'Create Payroll')}
                </MotionButton>
              </Box>
            </Box>
          </MotionPaper>
        </Grid>

        {/* Preview Section */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Employee Details Card */}
          <MotionCard
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            sx={{
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.95)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person color="primary" sx={{ mr: 2, fontSize: 32 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Employee Details
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {selectedEmployee ? (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Personal Information
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Name:</strong> {selectedEmployee.username}</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Email:</strong> {selectedEmployee.email}</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Department:</strong> {selectedEmployee.department_name}</Typography>
                  <Typography variant="body2"><strong>Designation:</strong> {selectedEmployee.designation}</Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                  Select an employee to view details
                </Typography>
              )}
            </CardContent>
          </MotionCard>

          {/* Salary Breakdown Card */}
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            sx={{
              mt: 2,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.95)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney color="primary" sx={{ mr: 2, fontSize: 32 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Salary Breakdown
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {calculation ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">Basic Salary:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(calculation.basic_salary)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="success.main">
                      <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                      Bonus:
                    </Typography>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      + {formatCurrency(calculation.bonus)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="error.main">
                      <TrendingDown sx={{ fontSize: 16, mr: 0.5 }} />
                      Deductions:
                    </Typography>
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      - {formatCurrency(calculation.deduction)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold">Net Salary:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {formatCurrency(calculation.total)}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                  Click "Calculate Salary" to see breakdown
                </Typography>
              )}
            </CardContent>
          </MotionCard>

          {/* Help Card */}
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            sx={{
              mt: 2,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
              color: 'white'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                💡 How it works
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                • Select employee and enter basic salary
                <br />
                • Click "Calculate" for automatic deductions & bonuses
                <br />
                • Manual adjustments allowed
                <br />
                • Review and save payroll record
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PayrollForm;