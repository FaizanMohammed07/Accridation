import React, { useState, useEffect } from "react";
import {
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import toast from "react-hot-toast";

function AuditHistory() {
  const [auditHistory, setAuditHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchAuditHistory();
  }, [searchTerm, outcomeFilter, dateRange]);

  const fetchAuditHistory = async () => {
    try {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(outcomeFilter && { outcome: outcomeFilter }),
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate }),
      });

      const response = await axios.get(`/api/audits/history?${params}`);
      setAuditHistory(response.data.data.audits || []);
    } catch (error) {
      toast.error("Failed to fetch audit history");
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeBadge = (outcome) => {
    const config = {
      approved: "bg-green-100 text-green-800",
      approved_with_conditions: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
      requires_revision: "bg-orange-100 text-orange-800",
    };
    return config[outcome] || "bg-gray-100 text-gray-800";
  };

  const getOutcomeIcon = (outcome) => {
    if (outcome === "approved" || outcome === "approved_with_conditions") {
      return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
    }
    if (outcome === "rejected") {
      return <XCircleIcon className="w-5 h-5 text-red-600" />;
    }
    return <ClockIcon className="w-5 h-5 text-gray-400" />;
  };

  const calculateAuditDuration = (startedAt, completedAt) => {
    if (!startedAt || !completedAt) return "N/A";
    const duration = new Date(completedAt) - new Date(startedAt);
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit History</h1>
        <p className="text-gray-600">
          View your completed audit assignments and outcomes
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search audits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Outcomes</option>
            <option value="approved">Approved</option>
            <option value="approved_with_conditions">
              Approved with Conditions
            </option>
            <option value="rejected">Rejected</option>
            <option value="requires_revision">Requires Revision</option>
          </select>
          <input
            type="date"
            placeholder="Start Date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <input
            type="date"
            placeholder="End Date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Audit History Cards */}
      <div className="space-y-4">
        {auditHistory.map((audit) => (
          <div
            key={audit._id}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <DocumentTextIcon className="w-8 h-8 text-gray-400 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {audit.document?.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {audit.institute?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {getOutcomeIcon(audit.finalDecision?.outcome)}
                <span
                  className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOutcomeBadge(
                    audit.finalDecision?.outcome
                  )}`}
                >
                  {audit.finalDecision?.outcome?.replace("_", " ") || "Pending"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Started:
                </span>
                <p className="text-sm text-gray-600">
                  {audit.timeline?.startedAt
                    ? new Date(audit.timeline.startedAt).toLocaleDateString()
                    : "Not started"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Completed:
                </span>
                <p className="text-sm text-gray-600">
                  {audit.timeline?.completedAt
                    ? new Date(audit.timeline.completedAt).toLocaleDateString()
                    : "Not completed"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Duration:
                </span>
                <p className="text-sm text-gray-600">
                  {calculateAuditDuration(
                    audit.timeline?.startedAt,
                    audit.timeline?.completedAt
                  )}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Final Score:
                </span>
                <p className="text-sm text-gray-600">
                  {audit.finalDecision?.finalScore || "N/A"}/100
                </p>
              </div>
            </div>

            {audit.finalDecision?.justification && (
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700">
                  Justification:
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  {audit.finalDecision.justification}
                </p>
              </div>
            )}

            {audit.auditData?.findings &&
              audit.auditData.findings.length > 0 && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">
                    Key Findings:
                  </span>
                  <div className="mt-2 space-y-2">
                    {audit.auditData.findings
                      .slice(0, 3)
                      .map((finding, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {finding.category}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                finding.category === "critical"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {finding.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {finding.description}
                          </p>
                        </div>
                      ))}
                    {audit.auditData.findings.length > 3 && (
                      <p className="text-sm text-gray-500">
                        +{audit.auditData.findings.length - 3} more findings
                      </p>
                    )}
                  </div>
                </div>
              )}

            <div className="flex justify-end">
              <button
                onClick={() =>
                  (window.location.href = `/auditor/audit/${audit._id}`)
                }
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {auditHistory.length === 0 && (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No audit history
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't completed any audits yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default AuditHistory;
