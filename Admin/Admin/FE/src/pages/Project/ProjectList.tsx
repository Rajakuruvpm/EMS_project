// src/pages/Projects/ProjectList.tsx
import React, { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Grid, useTheme, useMediaQuery,
  Fade, Slide, TextField, MenuItem, Collapse, InputAdornment
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  PersonAdd as AssignIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList,
  Clear,
  Check
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';

// Define Project type locally
interface Project {
  project_id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
}

const MotionPaper = motion(Paper);
const MotionButton = motion(Button);
const MotionTableRow = motion(TableRow);

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; project: Project | null }>({
    open: false,
    project: null
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });
  const [tempFilters, setTempFilters] = useState({
    search: '',
    status: 'all'
  });

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("https://admin-be-qe74.onrender.com/api/projects", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch projects");
      }

      const result = await response.json();
      
      if (result.success) {
        setProjects(result.data || []);
        setFilteredProjects(result.data || []);
      } else {
        throw new Error(result.message || "Failed to load projects");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Apply filters whenever filters state changes
  useEffect(() => {
    applyFilters();
  }, [filters, projects]);

  const applyFilters = () => {
    let filtered = projects;

    if (filters.search) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(project => project.status === filters.status);
    }

    setFilteredProjects(filtered);
  };

  const handleTempFilterChange = (field: string, value: string) => {
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
      search: '',
      status: 'all'
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setFilteredProjects(projects);
    setSuccess('All filters cleared');
  };

  const handleDelete = async (projectId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://admin-be-qe74.onrender.com/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (result.success) {
        setSuccess("Project deleted successfully!");
        fetchProjects();
        setDeleteDialog({ open: false, project: null });
      } else {
        setError(result.message || "Failed to delete project");
      }
    } catch (error) {
      setError("Error deleting project");
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      active: { color: "success", label: "ACTIVE" },
      completed: { color: "default", label: "COMPLETED" },
      upcoming: { color: "warning", label: "UPCOMING" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: "default", label: status.toUpperCase() };

    return (
      <Chip
        label={config.label}
        color={config.color as "success" | "default" | "warning"}
        size="small"
        sx={{
          fontWeight: 'bold',
          borderRadius: 1
        }}
      />
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === "active").length,
    upcoming: projects.filter(p => p.status === "upcoming").length,
    completed: projects.filter(p => p.status === "completed").length,
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
          borderRadius: 3,
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              Project Management
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Manage and track all projects
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
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/projects/add')}
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
              Add Project
            </MotionButton>
          </Box>
        </Box>
      </MotionPaper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            textAlign: "center", 
            bgcolor: 'primary.main', 
            color: "white",
            height: '100%',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" component="div" fontWeight="bold">
                {projectStats.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                Total Projects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            textAlign: "center", 
            bgcolor: 'success.main', 
            color: "white",
            height: '100%',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" component="div" fontWeight="bold">
                {projectStats.active}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            textAlign: "center", 
            bgcolor: 'warning.main', 
            color: "white",
            height: '100%',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" component="div" fontWeight="bold">
                {projectStats.upcoming}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                Upcoming
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            textAlign: "center", 
            bgcolor: 'info.main', 
            color: "white",
            height: '100%',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" component="div" fontWeight="bold">
                {projectStats.completed}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
              label={`${filteredProjects.length} records`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          
          <Grid container spacing={2} alignItems="center">
            {/* Search Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                label="Search Projects"
                value={tempFilters.search}
                onChange={(e) => handleTempFilterChange('search', e.target.value)}
                placeholder="Search by name or description..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>

            {/* Status Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                select
                label="Status"
                value={tempFilters.status}
                onChange={(e) => handleTempFilterChange('status', e.target.value)}
                size="small"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
            </Grid>

            {/* Action Buttons */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap' }}>
                <MotionButton
                  variant="contained"
                  startIcon={<Check />}
                  onClick={handleApplyFilters}
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
          {(filters.search || filters.status !== 'all') && (
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
                      onDelete={() => {
                        setTempFilters(prev => ({ ...prev, search: '' }));
                        const newFilters = { ...filters, search: '' };
                        setFilters(newFilters);
                        let filtered = [...projects];
                        if (newFilters.status !== 'all') {
                          filtered = filtered.filter(p => p.status === newFilters.status);
                        }
                        setFilteredProjects(filtered);
                      }}
                      color="primary"
                    />
                  )}
                  {filters.status !== 'all' && (
                    <Chip 
                      label={`Status: ${filters.status}`}
                      size="small"
                      onDelete={() => {
                        setTempFilters(prev => ({ ...prev, status: 'all' }));
                        const newFilters = { ...filters, status: 'all' };
                        setFilters(newFilters);
                        let filtered = [...projects];
                        if (newFilters.search) {
                          filtered = filtered.filter(p => 
                            p.name.toLowerCase().includes(newFilters.search.toLowerCase()) ||
                            (p.description && p.description.toLowerCase().includes(newFilters.search.toLowerCase()))
                          );
                        }
                        setFilteredProjects(filtered);
                      }}
                      color="secondary"
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
                <TableCell>Project Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                        No projects found matching your filters
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
                  filteredProjects.map((project, index) => (
                    <MotionTableRow
                      key={project.project_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{
                        backgroundColor: 'rgba(0,0,0,0.02)',
                      }}
                      sx={{ transition: 'all 0.3s ease' }}
                    >
                      <TableCell>
                        <Chip 
                          label={`#${project.project_id}`} 
                          variant="outlined" 
                          size="small" 
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: '500' }}>{project.name}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {project.description && project.description.length > 60
                            ? `${project.description.substring(0, 60)}...`
                            : project.description || "No description"}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(project.status)}</TableCell>
                      <TableCell>{formatDate(project.start_date)}</TableCell>
                      <TableCell>{formatDate(project.end_date)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            color="info"
                            size="small"
                            onClick={() => navigate(`/admin/projects/${project.project_id}`)}
                            sx={{
                              backgroundColor: 'rgba(33,150,243,0.1)',
                              '&:hover': { backgroundColor: 'rgba(33,150,243,0.2)' }
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => navigate(`/admin/projects/${project.project_id}/assign`)}
                            sx={{
                              backgroundColor: 'rgba(56,142,60,0.1)',
                              '&:hover': { backgroundColor: 'rgba(56,142,60,0.2)' }
                            }}
                          >
                            <AssignIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="warning"
                            size="small"
                            onClick={() => navigate(`/admin/projects/edit/${project.project_id}`)}
                            sx={{
                              backgroundColor: 'rgba(245,124,0,0.1)',
                              '&:hover': { backgroundColor: 'rgba(245,124,0,0.2)' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => setDeleteDialog({ open: true, project })}
                            sx={{
                              backgroundColor: 'rgba(211,47,47,0.1)',
                              '&:hover': { backgroundColor: 'rgba(211,47,47,0.2)' }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, project: null })}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Slide}
        transitionDuration={300}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography>
            Are you sure you want to delete project <strong>"{deleteDialog.project?.name}"</strong>?
            This action cannot be undone.
          </Typography>
          {deleteDialog.project && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Note: This project has team assignments that will also be removed.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, project: null })}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => deleteDialog.project && handleDelete(deleteDialog.project.project_id)}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Delete Project
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectList;