import React from "react";
import { Routes, Route } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  History,
  BarChart3,
} from "lucide-react";
import Layout from "../common/Layout";
import AuditorOverview from "./AuditorOverview";
import AssignedAudits from "./AssignedAudits";
import AuditsList from "./AuditsList";
import AuditHistory from "./AuditHistory";
import AuditorReports from "./AuditorReports";

function AuditorDashboard() {
  const navigation = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Assigned Audits", path: "/auditor/assigned", icon: FileText },
    { name: "My Audits", path: "/auditor/audits", icon: ClipboardCheck },
    { name: "History", path: "/auditor/history", icon: History },
    { name: "Reports", path: "/auditor/reports", icon: BarChart3 },
  ];

  return (
    <Layout navigation={navigation}>
      <Routes>
        <Route path="/" element={<AuditorOverview />} />
        <Route path="/assigned" element={<AssignedAudits />} />
        <Route path="/audits" element={<AuditsList />} />
        <Route path="/history" element={<AuditHistory />} />
        <Route path="/reports" element={<AuditorReports />} />
      </Routes>
    </Layout>
  );
}

export default AuditorDashboard;
