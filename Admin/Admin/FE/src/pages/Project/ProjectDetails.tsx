// src/pages/Projects/ProjectDetails.tsx
import React, { useState, useEffect } from "react";
import {
    Box, Paper, Typography, Button, Chip, Alert,
    CircularProgress, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, LinearProgress, Grid, Card, CardContent,
    useTheme, useMediaQuery
} from "@mui/material";
import {
    ArrowBack as BackIcon,
    Edit as EditIcon,
    PersonAdd as PersonAddIcon,
    People as PeopleIcon,
    Work as WorkIcon
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';

// Define types locally
interface Assignment {
    assign_id: number;
    project_id: number;
    emp_id: number;
    role: string;
    progress: string;
    remarks: string;
    username: string;
    designation: string;
    department_name: string;
}

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
const MotionCard = motion(Card);
const MotionTableRow = motion(TableRow);

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [assignmentsLoading, setAssignmentsLoading] = useState<boolean>(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const fetchProject = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await fetch(`https://admin-be-qe74.onrender.com/api/projects/${id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to fetch project");
            }

            const result = await response.json();
            
            if (result.success) {
                setProject(result.data);
            } else {
                throw new Error(result.message || "Failed to load project");
            }
        } catch (error) {
            console.error("Error fetching project:", error);
            setError(error instanceof Error ? error.message : "Failed to load project details");
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignments = async () => {
        try {
            setAssignmentsLoading(true);
            const token = localStorage.getItem("token");
            const response = await fetch(`https://admin-be-qe74.onrender.com/api/project-assignments/project/${id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.success) {
                    setAssignments(result.data || []);
                } else {
                    setAssignments([]);
                }
            } else {
                setAssignments([]);
            }
        } catch (error) {
            console.error("Error fetching assignments:", error);
            setAssignments([]);
        } finally {
            setAssignmentsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchProject();
            fetchAssignments();
        }
    }, [id]);

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
                sx={{
                    fontWeight: 'bold',
                    borderRadius: 1
                }}
            />
        );
    };

    const getProgressPercentage = (progress: string): number => {
        if (!progress) return 0;
        
        const match = progress.match(/(\d+)%/);
        return match ? parseInt(match[1]) : 0;
    };

    const getProjectDuration = () => {
        if (!project) return 0;
        try {
            const start = new Date(project.start_date);
            const end = new Date(project.end_date);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return 0;
            }
            
            const diffTime = Math.abs(end.getTime() - start.getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            console.error("Error calculating project duration:", error);
            return 0;
        }
    };

    const getDaysRemaining = () => {
        if (!project) return 0;
        
        const today = new Date();
        const endDate = new Date(project.end_date);
        
        if (isNaN(endDate.getTime())) return 0;
        
        const diffTime = endDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
        } catch (error) {
            return "Invalid Date";
        }
    };

    // Show loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    // Show error state if project not found
    if (!project) {
        return (
            <Box sx={{ p: isMobile ? 1 : 3 }}>
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    Project not found or failed to load. 
                    <Button 
                        onClick={() => navigate("/admin/projects")}
                        sx={{ ml: 2 }}
                    >
                        Return to projects list
                    </Button>
                </Alert>
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
                            {project.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            {getStatusChip(project.status)}
                            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                                Project ID: #{project.project_id}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <MotionButton
                            variant="outlined"
                            startIcon={<BackIcon />}
                            onClick={() => navigate("/admin/projects")}
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
                            Back to Projects
                        </MotionButton>
                        <MotionButton
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={() => navigate(`/admin/projects/${project.project_id}/assign`)}
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
                            Assign Team
                        </MotionButton>
                    </Box>
                </Box>
            </MotionPaper>

            {/* Alerts Section */}
            <Box sx={{ flexShrink: 0, mb: 3 }}>
                {error && (
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
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}
            </Box>

            <Grid container spacing={3}>
                {/* Project Information & Team Assignments */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    {/* Project Details Card */}
                    <MotionCard
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                            backdropFilter: 'blur(10px)',
                            background: 'rgba(255,255,255,0.95)',
                            mb: 3
                        }}
                    >
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    Project Details
                                </Typography>
                                <MotionButton
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={() => navigate(`/admin/projects/edit/${project.project_id}`)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Edit Project
                                </MotionButton>
                            </Box>

                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Start Date
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {formatDate(project.start_date)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            End Date
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {formatDate(project.end_date)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Duration
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {getProjectDuration()} days
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Status
                                        </Typography>
                                        {getStatusChip(project.status)}
                                    </Box>
                                </Grid>
                            </Grid>

                            {project.description && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Description
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                                        {project.description}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </MotionCard>

                    {/* Team Assignments Card */}
                    <MotionCard
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
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    Team Assignments
                                </Typography>
                                <Chip 
                                    label={`${assignments.length} member${assignments.length !== 1 ? 's' : ''}`} 
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 'bold' }}
                                />
                            </Box>

                            {assignmentsLoading ? (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                                    <CircularProgress size={24} />
                                    <Typography variant="body2" sx={{ ml: 2 }}>
                                        Loading assignments...
                                    </Typography>
                                </Box>
                            ) : assignments.length > 0 ? (
                                <TableContainer 
                                    sx={{ 
                                        borderRadius: 2,
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
                                    <Table>
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
                                                <TableCell>Employee</TableCell>
                                                <TableCell>Role</TableCell>
                                                <TableCell>Department</TableCell>
                                                <TableCell>Progress</TableCell>
                                                <TableCell>Remarks</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <AnimatePresence>
                                                {assignments.map((assignment, index) => {
                                                    const progressPercentage = getProgressPercentage(assignment.progress);
                                                    return (
                                                        <MotionTableRow
                                                            key={assignment.assign_id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.1 }}
                                                            whileHover={{
                                                                backgroundColor: 'rgba(0,0,0,0.02)',
                                                            }}
                                                            sx={{ transition: 'all 0.3s ease' }}
                                                        >
                                                            <TableCell>
                                                                <Box>
                                                                    <Typography variant="body1" fontWeight="medium">
                                                                        {assignment.username}
                                                                    </Typography>
                                                                    {assignment.designation && (
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {assignment.designation}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={assignment.role} 
                                                                    color="info" 
                                                                    size="small" 
                                                                    variant="outlined"
                                                                    sx={{ borderRadius: 1 }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                {assignment.department_name || "No Department"}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{ width: '100px' }}>
                                                                    <LinearProgress
                                                                        variant="determinate"
                                                                        value={progressPercentage}
                                                                        color={
                                                                            progressPercentage > 70 ? "success" :
                                                                            progressPercentage > 30 ? "warning" : "error"
                                                                        }
                                                                        sx={{ height: 8, borderRadius: 4 }}
                                                                    />
                                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                                                                        {assignment.progress || "Not started"}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography 
                                                                    variant="body2" 
                                                                    color="text.secondary"
                                                                    sx={{ 
                                                                        maxWidth: 200,
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap'
                                                                    }}
                                                                >
                                                                    {assignment.remarks || "-"}
                                                                </Typography>
                                                            </TableCell>
                                                        </MotionTableRow>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box sx={{ textAlign: "center", py: 4 }}>
                                    <PeopleIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        No team assignments
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Assign team members to this project to get started
                                    </Typography>
                                    <MotionButton
                                        onClick={() => navigate(`/admin/projects/${project.project_id}/assign`)}
                                        variant="contained"
                                        startIcon={<PersonAddIcon />}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        sx={{ mt: 2 }}
                                    >
                                        Assign Team Members
                                    </MotionButton>
                                </Box>
                            )}
                        </CardContent>
                    </MotionCard>
                </Grid>

                {/* Project Summary & Quick Stats */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    {/* Project Summary Card */}
                    <MotionCard
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                            backdropFilter: 'blur(10px)',
                            background: 'rgba(255,255,255,0.95)',
                            mb: 3
                        }}
                    >
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                            <WorkIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                {project.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Project Overview
                            </Typography>

                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 3 }}>
                                <MotionButton
                                    variant="outlined"
                                    onClick={() => navigate(`/admin/projects/${project.project_id}/assign`)}
                                    fullWidth
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Manage Team
                                </MotionButton>
                                <MotionButton
                                    variant="outlined"
                                    color="warning"
                                    onClick={() => navigate(`/admin/projects/edit/${project.project_id}`)}
                                    fullWidth
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Edit Details
                                </MotionButton>
                            </Box>
                        </CardContent>
                    </MotionCard>

                    {/* Quick Stats Card */}
                    <MotionCard
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                            backdropFilter: 'blur(10px)',
                            background: 'rgba(255,255,255,0.95)'
                        }}
                    >
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                                Quick Stats
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Team Size
                                    </Typography>
                                    <Typography variant="h5" color="primary" fontWeight="bold">
                                        {assignments.length} member{assignments.length !== 1 ? 's' : ''}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Project Status
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        {getStatusChip(project.status)}
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Time Status
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        color={
                                            project.status === 'completed' ? 'text.secondary' :
                                            project.status === 'upcoming' ? 'warning.main' : 'success.main'
                                        }
                                        fontWeight="bold"
                                    >
                                        {project.status === 'completed' ? 'Completed' :
                                         project.status === 'upcoming' ? 'Starting Soon' :
                                         `${Math.max(0, getDaysRemaining())} days remaining`}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </MotionCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProjectDetails;