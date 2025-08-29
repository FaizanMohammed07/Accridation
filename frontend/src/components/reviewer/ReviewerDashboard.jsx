import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardList, 
  History, 
  BarChart3
} from 'lucide-react';
import Layout from '../common/Layout';
import ReviewerOverview from './ReviewerOverview';
import AssignedDocuments from './AssignedDocuments';
import ReviewsList from './ReviewsList';
import ReviewHistory from './ReviewHistory';
import ReviewerReports from './ReviewerReports';

function ReviewerDashboard() {
  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Assigned Documents', path: '/reviewer/assigned', icon: FileText },
    { name: 'My Reviews', path: '/reviewer/reviews', icon: ClipboardList },
    { name: 'History', path: '/reviewer/history', icon: History },
    { name: 'Reports', path: '/reviewer/reports', icon: BarChart3 },
  ];

  return (
    <Layout navigation={navigation}>
      <Routes>
        <Route path="/" element={<ReviewerOverview />} />
        <Route path="/assigned" element={<AssignedDocuments />} />
        <Route path="/reviews" element={<ReviewsList />} />
        <Route path="/history" element={<ReviewHistory />} />
        <Route path="/reports" element={<ReviewerReports />} />
      </Routes>
    </Layout>
  );
}

export default ReviewerDashboard;