import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  History, 
  BarChart3
} from 'lucide-react';
import Layout from '../common/Layout';
import InstituteOverview from './InstituteOverview';
import DocumentUpload from './DocumentUpload';
import DocumentsList from './DocumentsList';
import DocumentHistory from './DocumentHistory';
import InstituteReports from './InstituteReports';

function InstituteDashboard() {
  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Document', path: '/institute/upload', icon: Upload },
    { name: 'My Documents', path: '/institute/documents', icon: FileText },
    { name: 'History', path: '/institute/history', icon: History },
    { name: 'Reports', path: '/institute/reports', icon: BarChart3 },
  ];

  return (
    <Layout navigation={navigation}>
      <Routes>
        <Route path="/" element={<InstituteOverview />} />
        <Route path="/upload" element={<DocumentUpload />} />
        <Route path="/documents" element={<DocumentsList />} />
        <Route path="/history" element={<DocumentHistory />} />
        <Route path="/reports" element={<InstituteReports />} />
      </Routes>
    </Layout>
  );
}

export default InstituteDashboard;