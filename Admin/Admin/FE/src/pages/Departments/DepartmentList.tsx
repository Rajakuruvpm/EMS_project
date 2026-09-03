// src/pages/Admin/DepartmentList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, CircularProgress, Alert, Dialog,
  DialogActions, DialogContent, DialogContentText, DialogTitle, Tooltip,
  TextField, useTheme, useMediaQuery, Fade, Slide
} from '@mui/material';
import { Add, Edit, Delete, Business, Groups, Description } from '@mui/icons-material';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface Department {
  dept_id: number;
  name: string;
  description: string;
  employee_count: number;
  hr_count: number;
}

interface DepartmentFormData {
  name: string;
  description: string;
}

const MotionPaper = motion(Paper);
const MotionButton = motion(Button);
const MotionTableRow = motion(TableRow);

const DepartmentList: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [deleteDialog, setDeleteDialog] = useState({ 
    open: false, 
    department: null as Department | null 
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [addDialog, setAddDialog] = useState({ 
    open: false, 
    loading: false 
  });

  const [editDialog, setEditDialog] = useState({ 
    open: false, 
    loading: false,
    department: null as Department | null
  });

  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: ''
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://admin-be-qe74.onrender.com/api/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Delete Department Functions
  const handleDeleteClick = (department: Department) => {
    setDeleteDialog({ open: true, department });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.department) return;

    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://admin-be-qe74.onrender.com/api/departments/${deleteDialog.department.dept_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Department deleted successfully!');
      setDeleteDialog({ open: false, department: null });
      fetchDepartments();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete department');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, department: null });
  };

  // Add Department Functions
  const handleAddClick = () => {
    setAddDialog({ open: true, loading: false });
    setFormData({ name: '', description: '' });
  };

  const handleAddClose = () => {
    setAddDialog({ open: false, loading: false });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddDialog(prev => ({ ...prev, loading: true }));
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post('https://admin-be-qe74.onrender.com/api/departments', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Department created successfully!');
      setAddDialog({ open: false, loading: false });
      setFormData({ name: '', description: '' });
      fetchDepartments();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create department');
    } finally {
      setAddDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // Edit Department Functions
  const handleEditClick = (department: Department) => {
    setEditDialog({ open: true, loading: false, department });
    setFormData({
      name: department.name,
      description: department.description || ''
    });
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, loading: false, department: null });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDialog.department) return;

    setEditDialog(prev => ({ ...prev, loading: true }));
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://admin-be-qe74.onrender.com/api/departments/${editDialog.department.dept_id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Department updated successfully!');
      setEditDialog({ open: false, loading: false, department: null });
      setFormData({ name: '', description: '' });
      fetchDepartments();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update department');
    } finally {
      setEditDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              Department Management
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Manage your organizational departments and teams
            </Typography>
          </Box>
          <MotionButton
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddClick}
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
            Add Department
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
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        </Fade>
      )}

      {success && (
        <Fade in>
          <Alert 
            severity="success" 
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        </Fade>
      )}

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
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Department Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total Staff</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {departments.map((department, index) => {
                  const totalStaff = department.employee_count + department.hr_count;
                  const hasStaff = totalStaff > 0;
                  const deleteTooltip = hasStaff 
                    ? 'Cannot delete department with assigned staff' 
                    : 'Delete department';

                  return (
                    <MotionTableRow
                      key={department.dept_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{
                        backgroundColor: 'rgba(0,0,0,0.02)',
                      }}
                      sx={{ transition: 'all 0.3s ease' }}
                    >
                      <TableCell>{department.dept_id}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business color="primary" />
                          <Typography variant="subtitle1" fontWeight="bold">
                            {department.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Description color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {department.description || 'No description'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={totalStaff} 
                          color={hasStaff ? "success" : "default"}
                          size="small"
                          icon={<Groups />}
                          sx={{ 
                            fontWeight: 'bold',
                            borderRadius: 1
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => handleEditClick(department)}
                            sx={{
                              backgroundColor: 'rgba(25,118,210,0.1)',
                              '&:hover': { backgroundColor: 'rgba(25,118,210,0.2)' }
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          
                          <Tooltip title={deleteTooltip}>
                            <span>
                              <IconButton 
                                color="error" 
                                size="small"
                                onClick={() => !hasStaff && handleDeleteClick(department)}
                                disabled={hasStaff}
                                sx={{
                                  backgroundColor: 'rgba(211,47,47,0.1)',
                                  '&:hover': { backgroundColor: 'rgba(211,47,47,0.2)' },
                                  '&:disabled': { backgroundColor: 'rgba(0,0,0,0.04)' }
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </MotionTableRow>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </TableContainer>
      </MotionPaper>

      {/* Empty State */}
      {departments.length === 0 && !loading && (
        <MotionPaper
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          sx={{ 
            p: 6, 
            textAlign: 'center', 
            mt: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}
        >
          <Business sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" color="textSecondary" gutterBottom>
            No departments found
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Get started by creating your first department to organize your teams.
          </Typography>
          <MotionButton
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            Create First Department
          </MotionButton>
        </MotionPaper>
      )}

      {/* Add Department Dialog */}
      <Dialog
        open={addDialog.open}
        onClose={handleAddClose}
        maxWidth="sm"
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
            <Add />
            Add New Department
          </Box>
        </DialogTitle>
        <form onSubmit={handleAddSubmit}>
          <DialogContent sx={{ p: 4 }}>
            <TextField
              autoFocus
              fullWidth
              label="Department Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              multiline
              rows={4}
              InputProps={{
                startAdornment: <Description sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleAddClose} 
              disabled={addDialog.loading}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <MotionButton
              type="submit"
              variant="contained" 
              disabled={addDialog.loading}
              whileHover={{ scale: addDialog.loading ? 1 : 1.02 }}
              whileTap={{ scale: addDialog.loading ? 1 : 0.98 }}
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              {addDialog.loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Create Department'
              )}
            </MotionButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={handleEditClose}
        maxWidth="sm"
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
            <Edit />
            Edit Department
          </Box>
        </DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent sx={{ p: 4 }}>
            <TextField
              autoFocus
              fullWidth
              label="Department Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              multiline
              rows={4}
              InputProps={{
                startAdornment: <Description sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleEditClose} 
              disabled={editDialog.loading}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <MotionButton
              type="submit"
              variant="contained" 
              disabled={editDialog.loading}
              whileHover={{ scale: editDialog.loading ? 1 : 1.02 }}
              whileTap={{ scale: editDialog.loading ? 1 : 0.98 }}
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              {editDialog.loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Update Department'
              )}
            </MotionButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        TransitionComponent={Slide}
        transitionDuration={500}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Delete />
            Delete Department
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <DialogContentText>
            Are you sure you want to delete the department <strong>"{deleteDialog.department?.name}"</strong>? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleDeleteCancel} 
            disabled={deleteLoading}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <MotionButton
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
            whileHover={{ scale: deleteLoading ? 1 : 1.02 }}
            whileTap={{ scale: deleteLoading ? 1 : 0.98 }}
            sx={{ borderRadius: 2 }}
          >
            {deleteLoading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Delete Department'
            )}
          </MotionButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentList;