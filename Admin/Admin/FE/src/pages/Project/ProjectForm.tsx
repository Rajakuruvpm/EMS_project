// src/pages/Projects/ProjectForm.tsx
import React, { useState, useEffect } from "react";
import {
    Box, Paper, Typography, Button, TextField, Alert,
    CircularProgress, Grid, Card, CardContent, useTheme,
    useMediaQuery
} from "@mui/material";
import {
    Save as SaveIcon,
    ArrowBack as BackIcon} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from 'framer-motion';

interface ProjectFormData {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
}

const MotionPaper = motion(Paper);
const MotionButton = motion(Button);
const MotionCard = motion(Card);

const ProjectForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [formData, setFormData] = useState<ProjectFormData>({
        name: "",
        description: "",
        start_date: "",
        end_date: ""
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isEdit && id) {
            fetchProject(parseInt(id));
        }
    }, [isEdit, id]);

    const fetchProject = async (projectId: number) => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await fetch(`https://admin-be-qe74.onrender.com/api/projects/${projectId}`, {
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
                const project = result.data;
                setFormData({
                    name: project.name,
                    description: project.description || "",
                    start_date: project.start_date ? project.start_date.split('T')[0] : "",
                    end_date: project.end_date ? project.end_date.split('T')[0] : ""
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error("Error fetching project:", error);
            setError(error instanceof Error ? error.message : "Failed to load project data");
            setTimeout(() => {
                navigate("/admin/projects");
            }, 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            setError("Project name is required");
            return;
        }

        if (!formData.start_date || !formData.end_date) {
            setError("Start date and end date are required");
            return;
        }

        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            setError("Please enter valid dates");
            return;
        }

        if (endDate <= startDate) {
            setError("End date must be after start date");
            return;
        }

        if (startDate < today && !isEdit) {
            setError("Start date cannot be in the past for new projects");
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            const token = localStorage.getItem("token");
            const url = isEdit
                ? `https://admin-be-qe74.onrender.com/api/projects/${id}`
                : "https://admin-be-qe74.onrender.com/api/projects";

            const method = isEdit ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    start_date: formData.start_date,
                    end_date: formData.end_date
                })
            });

            const result = await response.json();

            if (result.success) {
                setSuccess(isEdit ? "Project updated successfully!" : "Project created successfully!");
                setTimeout(() => {
                    navigate("/admin/projects");
                }, 1500);
            } else {
                throw new Error(result.message || `Failed to ${isEdit ? 'update' : 'create'} project`);
            }
        } catch (error) {
            console.error("Error saving project:", error);
            setError(
                error instanceof Error ? error.message : 
                (isEdit ? "Failed to update project" : "Failed to create project")
            );
        } finally {
            setSubmitting(false);
        }
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
                            {isEdit ? 'Edit Project' : 'Create New Project'}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                            {isEdit ? 'Update project details' : 'Add a new project to the system'}
                        </Typography>
                    </Box>
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

            {/* Form Section */}
            <MotionCard
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
                    flexDirection: 'column'
                }}
            >
                <CardContent sx={{ p: 4, flex: 1 }}>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Project Name */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Project Name *"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter project name"
                                    variant="outlined"
                                    error={!formData.name.trim()}
                                    helperText={!formData.name.trim() ? "Project name is required" : ""}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                        }
                                    }}
                                />
                            </Grid>

                            {/* Description */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    multiline
                                    rows={4}
                                    placeholder="Describe the project scope, objectives, and deliverables..."
                                    variant="outlined"
                                    helperText="Provide a clear description of what this project involves"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                        }
                                    }}
                                />
                            </Grid>

                            {/* Date Fields */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Start Date *"
                                    name="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    required
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    variant="outlined"
                                    inputProps={{
                                        min: isEdit ? undefined : new Date().toISOString().split('T')[0]
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                        }
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="End Date *"
                                    name="end_date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    required
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    variant="outlined"
                                    inputProps={{
                                        min: formData.start_date || new Date().toISOString().split('T')[0]
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                        }
                                    }}
                                />
                            </Grid>

                            {/* Action Buttons */}
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ 
                                    display: "flex", 
                                    gap: 2, 
                                    justifyContent: "flex-end", 
                                    mt: 4,
                                    flexWrap: 'wrap'
                                }}>
                                    <MotionButton
                                        variant="outlined"
                                        onClick={() => navigate("/admin/projects")}
                                        disabled={submitting}
                                        startIcon={<BackIcon />}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        sx={{ 
                                            borderRadius: 2,
                                            px: 4,
                                            py: 1
                                        }}
                                    >
                                        Cancel
                                    </MotionButton>
                                    <MotionButton
                                        type="submit"
                                        variant="contained"
                                        disabled={submitting}
                                        startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        sx={{ 
                                            borderRadius: 2,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            px: 4,
                                            py: 1
                                        }}
                                    >
                                        {submitting
                                            ? (isEdit ? 'Updating...' : 'Creating...')
                                            : (isEdit ? 'Update Project' : 'Create Project')
                                        }
                                    </MotionButton>
                                </Box>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </MotionCard>
        </Box>
    );
};

export default ProjectForm;