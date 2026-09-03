import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from '../../component/common/Sidebar';
import EmployeeList from '../Employee/EmployeeList';
import EmployeeForm from '../Employee/EmployeeForm';
import DepartmentList from '../Departments/DepartmentList';
import PayrollList from '../Payroll/PayrollList';
import PayrollForm from '../Payroll/PayrollForm';
import LeaveList from '../Leave/LeaveList';
import AdminRequests from '../Requests/AdminRequests';
import MeetingPage from '../Meeting/MeetingPage';
import MeetingList from '../Meeting/MeetingList';
import ProjectList from '../Project/ProjectList';
import ProjectForm from '../Project/ProjectForm';
import ProjectDetails from '../Project/ProjectDetails';
import ProjectAssignment from '../Project/ProjectAssignment';
import AdminAttendance from '../Attendance/AdminAttendance';
import AdminDashboard from './AdminDashboard';
import ProfilePage from '../Profile/ProfilePage';


const Dashboard: React.FC = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/employees/new" element={<EmployeeForm />} />
          <Route path="/employees/edit/:id" element={<EmployeeForm />} />
          <Route path="/departments" element={<DepartmentList />} />
          <Route path="/payroll" element={<PayrollList />} />
          <Route path="/payroll/new" element={<PayrollForm />} />
          <Route path="/payroll/edit/:id" element={<PayrollForm />} />
          <Route path="/attendance" element={<AdminAttendance/>} />
          <Route path="/leaves" element={<LeaveList />} />
          <Route path="/requests" element={<AdminRequests />} />
          <Route path="/meetings" element={<MeetingList />} />
          <Route path="/meetings/create" element={<MeetingPage />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/add" element={<ProjectForm />} />
          <Route path="/projects/edit/:id" element={<ProjectForm />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/projects/:id/assign" element={<ProjectAssignment />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default Dashboard;