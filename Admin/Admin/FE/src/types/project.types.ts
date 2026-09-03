// src/types/project.types.ts
export type ProjectStatus = "active" | "completed" | "upcoming";

export interface Project {
  project_id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
}

export interface Employee {
  emp_id: number;
  user_id: number;
  department_id: number;
  designation: string;
  join_date: string;
  username: string;
  email: string;
  role: string;
}

export interface Department {
  dept_id: number;
  name: string;
  description: string;
}

export interface Assignment {
  assign_id: number;
  project_id: number;
  emp_id: number;
  role: string;
  progress: string;
  remarks: string;
  project_name?: string;
  employee_name?: string;
  designation?: string;
  username?: string;
  email?: string;
  department_name?: string;
}