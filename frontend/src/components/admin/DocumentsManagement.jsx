import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import toast from "react-hot-toast";

function DocumentsManagement() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [assignmentType, setAssignmentType] = useState("reviewer");
  const [reviewers, setReviewers] = useState([]);
  const [auditors, setAuditors] = useState([]);

  useEffect(() => {
    fetchDocuments();
    fetchReviewers();
    fetchAuditors();
  }, [pagination.page, searchTerm, statusFilter, typeFilter]);

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      });

      const response = await axios.get(`/api/documents?${params}`);
      setDocuments(response.data.data.documents);
      setPagination((prev) => ({ ...prev, ...response.data.data.pagination }));
    } catch (error) {
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewers = async () => {
    try {
      const response = await axios.get("/api/admin/reviewers");
      setReviewers(response.data.data.reviewers);
    } catch (error) {
      console.error("Failed to fetch reviewers");
    }
  };

  const fetchAuditors = async () => {
    try {
      const response = await axios.get("/api/admin/auditors");
      setAuditors(response.data.data.auditors);
    } catch (error) {
      console.error("Failed to fetch auditors");
    }
  };

  const handleAssignment = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const assigneeId = formData.get("assigneeId");
    const dueDate = formData.get("dueDate");

    try {
      const endpoint =
        assignmentType === "reviewer" ? "assign-reviewer" : "assign-auditor";
      await axios.post(`/api/admin/${endpoint}`, {
        documentId: selectedDocument._id,
        [`${assignmentType}Id`]: assigneeId,
        dueDate,
      });

      toast.success(`${assignmentType} assigned successfully`);
      setShowAssignModal(false);
      setSelectedDocument(null);
      fetchDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Assignment failed");
    }
  };

  const updateDocumentStatus = async (documentId, newStatus) => {
    try {
      await axios.put(`/api/documents/${documentId}/status`, {
        status: newStatus,
      });
      toast.success("Document status updated successfully");
      fetchDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      uploaded: "bg-blue-100 text-blue-800",
      assigned_for_review: "bg-yellow-100 text-yellow-800",
      under_review: "bg-orange-100 text-orange-800",
      review_completed: "bg-purple-100 text-purple-800",
      assigned_for_audit: "bg-indigo-100 text-indigo-800",
      under_audit: "bg-pink-100 text-pink-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return statusConfig[status] || "bg-gray-100 text-gray-800";
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Documents Management
          </h1>
          <p className="text-gray-600">
            Manage documents, assignments, and review workflow
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <option value="uploaded">Uploaded</option>
            <option value="assigned_for_review">Assigned for Review</option>
            <option value="under_review">Under Review</option>
            <option value="review_completed">Review Completed</option>
            <option value="assigned_for_audit">Assigned for Audit</option>
            <option value="under_audit">Under Audit</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="academic_program">Academic Program</option>
            <option value="institutional_assessment">
              Institutional Assessment
            </option>
            <option value="quality_assurance">Quality Assurance</option>
            <option value="compliance_report">Compliance Report</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institute
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((document) => (
                <tr key={document._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-8 h-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {document.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(document.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {document.institute?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {document.type?.replace("_", " ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                        document.status
                      )}`}
                    >
                      {document.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {document.assignedReviewer?.user?.name ||
                      document.assignedAuditor?.user?.name ||
                      "Unassigned"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          window.open(
                            `/api/documents/${document._id}/download`,
                            "_blank"
                          )
                        }
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDocument(document);
                          setAssignmentType("reviewer");
                          setShowAssignModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Assign Reviewer"
                      >
                        <UserPlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.pages, prev.page + 1),
                    }))
                  }
                  disabled={pagination.page === pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign {assignmentType === "reviewer" ? "Reviewer" : "Auditor"}
              </h3>
              <form onSubmit={handleAssignment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document
                  </label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {selectedDocument.title}
                  </p>
                </div>

                <div className="flex space-x-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setAssignmentType("reviewer")}
                    className={`px-4 py-2 rounded-lg ${
                      assignmentType === "reviewer"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Assign Reviewer
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentType("auditor")}
                    className={`px-4 py-2 rounded-lg ${
                      assignmentType === "auditor"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Assign Auditor
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select{" "}
                    {assignmentType === "reviewer" ? "Reviewer" : "Auditor"}
                  </label>
                  <select
                    name="assigneeId"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Choose {assignmentType}...</option>
                    {(assignmentType === "reviewer" ? reviewers : auditors).map(
                      (person) => (
                        <option key={person._id} value={person._id}>
                          {person.user.name} - {person.specialization}{" "}
                          (Workload: {person.workloadPercentage}%)
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedDocument(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Assign {assignmentType}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentsManagement;
