// src/pages/Requests/AdminRequests.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Button,
  useTheme,
  useMediaQuery,
  Collapse,

} from "@mui/material";
import { 
  FilterList,  
  Clear, 
  Check, 
  Business, 
  Person, 
  Assignment,
  ExpandMore,
  ExpandLess 
} from "@mui/icons-material";
import axios from "axios";
// import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../component/common/Sidebar";
import { motion, AnimatePresence } from 'framer-motion';

interface InternalRequest {
  request_id: number;
  employee_name: string;
  category: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  hr_handler_name: string;
}

const MotionPaper = motion(Paper);
const MotionCard = motion(Card);
const MotionButton = motion(Button);
const MotionTableRow = motion(TableRow);

const AdminRequests: React.FC = () => {
  // const { user } = useAuth();
  const [requests, setRequests] = useState<InternalRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<InternalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    request_id: "",
    employee_name: "",
    category: "",
    status: "",
    hr_handler_name: ""
  });

  const [tempFilters, setTempFilters] = useState({
    request_id: "",
    employee_name: "",
    category: "",
    status: "",
    hr_handler_name: ""
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get("https://admin-be-qe74.onrender.com/api/requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data.data);
      setFilteredRequests(res.data.data);
      setError("");
    } catch (error: any) {
      console.log("Error fetching requests:", error);
      setError(error.response?.data?.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://admin-be-qe74.onrender.com/api/requests/${id}/status`, {
        status: newStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`Request #${id} status updated to ${newStatus}`);
      fetchRequests();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.log("Error updating status:", error);
      setError(error.response?.data?.message || "Failed to update status");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Apply filters on change
  useEffect(() => {
    let result = requests;

    if (filters.request_id.trim() !== "") {
      result = result.filter(r => r.request_id.toString().includes(filters.request_id));
    }

    if (filters.employee_name.trim() !== "") {
      result = result.filter(r =>
        (r.employee_name || "").toLowerCase().includes(filters.employee_name.toLowerCase())
      );
    }

    if (filters.category.trim() !== "") {
      result = result.filter(r =>
        (r.category || "").toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.status.trim() !== "") {
      result = result.filter(r => r.status === filters.status);
    }

    if (filters.hr_handler_name.trim() !== "") {
      result = result.filter(r =>
        (r.hr_handler_name || "").toLowerCase().includes(filters.hr_handler_name.toLowerCase())
      );
    }

    setFilteredRequests(result);
  }, [filters, requests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'IN_PROGRESS': return 'info';
      case 'RESOLVED': return 'success';
      default: return 'default';
    }
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setSuccess('Filters applied successfully');
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      request_id: "",
      employee_name: "",
      category: "",
      status: "",
      hr_handler_name: ""
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setFilteredRequests(requests);
    setSuccess('All filters cleared');
  };

  const handleTempFilterChange = (field: string, value: string) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(requests.map(req => req.category).filter(Boolean)));
  const hrHandlers = Array.from(new Set(requests.map(req => req.hr_handler_name).filter(Boolean)));

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
    <Box >
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: isMobile ? 2 : 3 }}>
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
                Internal Requests
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage and track employee requests
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <MotionButton
                variant="outlined"
                startIcon={filtersOpen ? <ExpandLess /> : <ExpandMore />}
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
            </Box>
          </Box>
        </MotionPaper>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{xs:12, sm:6, md:3}}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              sx={{ borderRadius: 3, overflow: 'hidden' }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Requests
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {requests.length}
                    </Typography>
                  </Box>
                  <Assignment sx={{ fontSize: 40, color: 'primary.main', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
          <Grid size={{xs:12, sm:6, md:3}}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              sx={{ borderRadius: 3, overflow: 'hidden' }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Pending
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      {requests.filter(r => r.status === 'PENDING').length}
                    </Typography>
                  </Box>
                  <Business sx={{ fontSize: 40, color: 'warning.main', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
          <Grid size={{xs:12, sm:6, md:3}}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              sx={{ borderRadius: 3, overflow: 'hidden' }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      In Progress
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                      {requests.filter(r => r.status === 'IN_PROGRESS').length}
                    </Typography>
                  </Box>
                  <Person sx={{ fontSize: 40, color: 'info.main', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
          <Grid size={{xs:12, sm:6, md:3}}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              sx={{ borderRadius: 3, overflow: 'hidden' }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Resolved
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {requests.filter(r => r.status === 'RESOLVED').length}
                    </Typography>
                  </Box>
                  <Check sx={{ fontSize: 40, color: 'success.main', opacity: 0.8 }} />
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>

        {/* Alerts */}
        <Box sx={{ mb: 2 }}>
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
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}
        </Box>

        {/* FILTERS SECTION */}
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
                label={`${filteredRequests.length} records`}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>

            <Grid container spacing={2} alignItems="center">
              {/* Request ID Filter */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  label="Request ID"
                  value={tempFilters.request_id}
                  onChange={(e) => handleTempFilterChange('request_id', e.target.value)}
                  placeholder="Enter request ID..."
                  size="small"
                />
              </Grid>

              {/* Employee Name Filter */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  label="Employee Name"
                  value={tempFilters.employee_name}
                  onChange={(e) => handleTempFilterChange('employee_name', e.target.value)}
                  placeholder="Search employee..."
                  size="small"
                />
              </Grid>

              {/* Category Filter */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  select
                  label="Category"
                  value={tempFilters.category}
                  onChange={(e) => handleTempFilterChange('category', e.target.value)}
                  size="small"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
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
                  <MenuItem value="PENDING">PENDING</MenuItem>
                  <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                  <MenuItem value="RESOLVED">RESOLVED</MenuItem>
                </TextField>
              </Grid>

              {/* HR Handler Filter */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  select
                  label="HR Handler"
                  value={tempFilters.hr_handler_name}
                  onChange={(e) => handleTempFilterChange('hr_handler_name', e.target.value)}
                  size="small"
                >
                  <MenuItem value="">All Handlers</MenuItem>
                  {hrHandlers.map((handler) => (
                    <MenuItem key={handler} value={handler}>
                      {handler}
                    </MenuItem>
                  ))}
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
                    onClick={handleClearFilters}
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
            {(filters.request_id || filters.employee_name || filters.category || filters.status || filters.hr_handler_name) && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Active Filters:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {filters.request_id && (
                    <Chip
                      label={`ID: ${filters.request_id}`}
                      size="small"
                      onDelete={() => handleTempFilterChange('request_id', '')}
                      color="primary"
                    />
                  )}
                  {filters.employee_name && (
                    <Chip
                      label={`Employee: ${filters.employee_name}`}
                      size="small"
                      onDelete={() => handleTempFilterChange('employee_name', '')}
                      color="secondary"
                    />
                  )}
                  {filters.category && (
                    <Chip
                      label={`Category: ${filters.category}`}
                      size="small"
                      onDelete={() => handleTempFilterChange('category', '')}
                      color="default"
                    />
                  )}
                  {filters.status && (
                    <Chip
                      label={`Status: ${filters.status}`}
                      size="small"
                      onDelete={() => handleTempFilterChange('status', '')}
                      color={getStatusColor(filters.status) as any}
                    />
                  )}
                  {filters.hr_handler_name && (
                    <Chip
                      label={`Handler: ${filters.hr_handler_name}`}
                      size="small"
                      onDelete={() => handleTempFilterChange('hr_handler_name', '')}
                      color="default"
                    />
                  )}
                </Box>
              </Box>
            )}
          </MotionPaper>
        </Collapse>

        {/* TABLE SECTION */}
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
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Employee</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>HR Handler</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              <AnimatePresence>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          No requests found
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                          {Object.values(filters).some(f => f)
                            ? 'No requests match your filters. Try clearing filters.'
                            : 'No internal requests available.'
                          }
                        </Typography>
                        {Object.values(filters).some(f => f) && (
                          <MotionButton
                            variant="outlined"
                            startIcon={<Clear />}
                            onClick={handleClearFilters}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            sx={{ borderRadius: 2 }}
                          >
                            Clear Filters
                          </MotionButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((req, index) => (
                    <MotionTableRow
                      key={req.request_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{
                        backgroundColor: 'rgba(0,0,0,0.02)',
                      }}
                      sx={{ transition: 'all 0.3s ease' }}
                    >
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="500">
                          #{req.request_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {req.employee_name || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={req.category} 
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300 }}>
                          {req.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={req.status} 
                          color={getStatusColor(req.status)}
                          size="small"
                          sx={{
                            borderRadius: 1,
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {req.hr_handler_name || (
                          <Typography variant="body2" color="textSecondary">
                            Not assigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={req.status}
                          onChange={(e) => updateStatus(req.request_id, e.target.value)}
                          size="small"
                          sx={{ 
                            minWidth: 150,
                            borderRadius: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1,
                            }
                          }}
                        >
                          <MenuItem value="PENDING">PENDING</MenuItem>
                          <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                          <MenuItem value="RESOLVED">RESOLVED</MenuItem>
                        </Select>
                      </TableCell>
                    </MotionTableRow>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </MotionPaper>
      </Box>
    </Box>
  );
};

export default AdminRequests;