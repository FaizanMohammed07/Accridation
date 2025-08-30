import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  ClockIcon,
  PlayIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import toast from "react-hot-toast";

function AssignedAudits() {
  const [assignedDocuments, setAssignedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchAssignedDocuments();
  }, [searchTerm, statusFilter]);

  const fetchAssignedDocuments = async () => {
    try {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await axios.get(`/api/documents/assigned?${params}`);
      setAssignedDocuments(response.data.data.documents);
    } catch (error) {
      toast.error("Failed to fetch assigned documents");
    } finally {
      setLoading(false);
    }
  };

  const startAudit = async (documentId) => {
    try {
      await axios.post(`/api/audits/start/${documentId}`);
      toast.success("Audit started successfully");
      fetchAssignedDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start audit");
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      assigned_for_audit: "bg-yellow-100 text-yellow-800",
      under_audit: "bg-blue-100 text-blue-800",
    };
    return config[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityBadge = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return "bg-red-100 text-red-800";
    if (daysLeft <= 2) return "bg-orange-100 text-orange-800";
    if (daysLeft <= 7) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getDaysLeft = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`;
    if (daysLeft === 0) return "Due today";
    return `${daysLeft} days left`;
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
        <h1 className="text-2xl font-bold text-gray-900">Assigned Audits</h1>
        <p className="text-gray-600">
          Documents assigned to you for audit review
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="assigned_for_audit">Assigned for Audit</option>
            <option value="under_audit">Under Audit</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {assignedDocuments.map((document) => (
          <div
            key={document._id}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <DocumentTextIcon className="w-8 h-8 text-gray-400 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {document.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {document.institute?.name}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                  document.status
                )}`}
              >
                {document.status?.replace("_", " ")}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <p className="text-sm text-gray-600 capitalize">
                  {document.type?.replace("_", " ")}
                </p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">
                  Description:
                </span>
                <p className="text-sm text-gray-600">{document.description}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Due Date:
                </span>
                <div className="text-right">
                  <p className="text-sm text-gray-900">
                    {document.dueDates?.audit
                      ? new Date(document.dueDates.audit).toLocaleDateString()
                      : "Not set"}
                  </p>
                  {document.dueDates?.audit && (
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(
                        document.dueDates.audit
                      )}`}
                    >
                      {getDaysLeft(document.dueDates.audit)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">
                  Assigned Reviewer:
                </span>
                <p className="text-sm text-gray-600">
                  {document.assignedReviewer?.user?.name || "Not assigned"}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() =>
                  window.open(
                    `/api/documents/${document._id}/download`,
                    "_blank"
                  )
                }
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <EyeIcon className="w-4 h-4" />
                View Document
              </button>
              <button
                onClick={() => startAudit(document._id)}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <PlayIcon className="w-4 h-4" />
                {document.status === "under_audit"
                  ? "Continue Audit"
                  : "Start Audit"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {assignedDocuments.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No assigned audits
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any documents assigned for audit at the moment.
          </p>
        </div>
      )}
    </div>
  );
}

export default AssignedAudits;
