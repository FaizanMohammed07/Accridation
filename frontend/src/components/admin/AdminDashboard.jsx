import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  FileText, 
  UserCheck, 
  ClipboardCheck,
  BarChart3,
  Activity
} from 'lucide-react';
import Layout from '../common/Layout';
import AdminOverview from './AdminOverview';
import InstitutesManagement from './InstitutesManagement';
import UsersManagement from './UsersManagement';
import DocumentsManagement from './DocumentsManagement';
import ReviewersManagement from './ReviewersManagement';
import AuditorsManagement from './AuditorsManagement';
import ReportsView from './ReportsView';
import ActivityLogs from './ActivityLogs';

function AdminDashboard() {
  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Institutes', path: '/admin/institutes', icon: Building },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Documents', path: '/admin/documents', icon: FileText },
    { name: 'Reviewers', path: '/admin/reviewers', icon: UserCheck },
    { name: 'Auditors', path: '/admin/auditors', icon: ClipboardCheck },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Activity Logs', path: '/admin/logs', icon: Activity },
  ];

  return (
    <Layout navigation={navigation}>
      <Routes>
        <Route path="/" element={<AdminOverview />} />
        <Route path="/institutes" element={<InstitutesManagement />} />
        <Route path="/users" element={<UsersManagement />} />
        <Route path="/documents" element={<DocumentsManagement />} />
        <Route path="/reviewers" element={<ReviewersManagement />} />
        <Route path="/auditors" element={<AuditorsManagement />} />
        <Route path="/reports" element={<ReportsView />} />
        <Route path="/logs" element={<ActivityLogs />} />
      </Routes>
    </Layout>
  );
}

export default AdminDashboard;