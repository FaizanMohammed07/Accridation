import React, { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  Calendar,
  TrendingUp,
  Award,
} from "lucide-react";
import { auditAPI, documentAPI } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

function AuditorOverview() {
  const [dashboardData, setDashboardData] = useState({});
  const [assignedDocuments, setAssignedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashboardResponse, documentsResponse] = await Promise.all([
        auditAPI.getDashboard(),
        documentAPI.getAssignedDocuments(),
      ]);

      setDashboardData(dashboardResponse.data);
      setAssignedDocuments(documentsResponse.data.documents || []);
    } catch (error) {
      showError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: "Assigned Audits",
      value: assignedDocuments.length || 0,
      icon: FileText,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      name: "Pending Audits",
      value:
        assignedDocuments.filter((doc) => doc.auditStatus === "pending")
          .length || 0,
      icon: Clock,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
    },
    {
      name: "Completed Audits",
      value: dashboardData.completedAudits || 0,
      icon: CheckCircle,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    },
    {
      name: "Compliance Rate",
      value: `${dashboardData.complianceRate || 0}%`,
      icon: Award,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
    },
  ];

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };
    return badges[severity] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}
        </h1>
        <p className="mt-2 text-gray-600">
          Conduct final audits and provide accreditation decisions for
          educational institutions.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon
                  className={`h-6 w-6 ${stat.color.replace("bg-", "text-")}`}
                />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className={`text-sm font-medium ${stat.textColor}`}>
                {stat.name}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assigned Audits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Audit Assignments
                </h3>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {assignedDocuments.slice(0, 5).map((doc) => (
                <div
                  key={doc._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {doc.title}
                    </h4>
                    <div className="flex space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getSeverityBadge(
                          doc.severity || "medium"
                        )}`}
                      >
                        {doc.severity || "Medium"}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(
                          doc.auditStatus || "pending"
                        )}`}
                      >
                        {doc.auditStatus?.replace("_", " ") || "Pending"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {doc.institute?.name}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Assigned: {new Date(doc.assignedAt).toLocaleDateString()}
                    </span>
                    <span>Review Score: {doc.reviewScore || "N/A"}</span>
                  </div>
                </div>
              ))}
              {assignedDocuments.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No audits assigned yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Audit Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Audit Performance
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Audits Completed This Month
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {dashboardData.monthlyAudits || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Average Audit Time
                </span>
                <span className="text-sm font-medium text-green-600">
                  {dashboardData.avgAuditTime || "0"} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Accuracy Rating</span>
                <span className="text-sm font-medium text-purple-600">
                  {dashboardData.accuracyRating || "0.0"}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Findings Identified
                </span>
                <span className="text-sm font-medium text-orange-600">
                  {dashboardData.findingsIdentified || 0}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button className="w-full bg-purple-600 text-white p-3 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Audit Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Issues */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Critical Issues Requiring Attention
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedDocuments
              .filter(
                (doc) => doc.severity === "critical" || doc.priority === "high"
              )
              .slice(0, 3)
              .map((doc) => (
                <div
                  key={doc._id}
                  className="border border-red-200 rounded-lg p-4 bg-red-50"
                >
                  <h4 className="font-medium text-gray-900 mb-2">
                    {doc.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {doc.institute?.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Assigned: {new Date(doc.assignedAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                      Critical
                    </span>
                  </div>
                </div>
              ))}
            {assignedDocuments.filter(
              (doc) => doc.severity === "critical" || doc.priority === "high"
            ).length === 0 && (
              <p className="text-gray-500 text-sm col-span-full text-center py-4">
                No critical issues at this time
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compliance Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-green-900">
                    {dashboardData.compliantInstitutes || 0}
                  </h4>
                  <p className="text-sm text-green-700">Fully Compliant</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-yellow-900">
                    {dashboardData.partiallyCompliant || 0}
                  </h4>
                  <p className="text-sm text-yellow-700">Partially Compliant</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-red-900">
                    {dashboardData.nonCompliant || 0}
                  </h4>
                  <p className="text-sm text-red-700">Non-Compliant</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditorOverview;
