import React, { useState, useEffect } from "react";
import {
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import toast from "react-hot-toast";

function DocumentHistory() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentHistory, setDocumentHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get("/api/documents");
      setDocuments(response.data.data.documents);
    } catch (error) {
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentHistory = async (documentId) => {
    try {
      setHistoryLoading(true);
      const response = await axios.get(`/api/documents/${documentId}/history`);
      setDocumentHistory(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch document history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDocumentSelect = (document) => {
    setSelectedDocument(document);
    fetchDocumentHistory(document._id);
  };

  const getStatusBadge = (status) => {
    const config = {
      uploaded: "bg-blue-100 text-blue-800",
      assigned_for_review: "bg-yellow-100 text-yellow-800",
      under_review: "bg-orange-100 text-orange-800",
      review_completed: "bg-purple-100 text-purple-800",
      assigned_for_audit: "bg-indigo-100 text-indigo-800",
      under_audit: "bg-pink-100 text-pink-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return config[status] || "bg-gray-100 text-gray-800";
  };

  const getWorkflowStageIcon = (stage) => {
    const icons = {
      upload: DocumentTextIcon,
      review_assignment: UserIcon,
      review: ClockIcon,
      audit_assignment: UserIcon,
      audit: ClockIcon,
      final_decision: CheckCircleIcon,
    };
    const IconComponent = icons[stage] || ClockIcon;
    return <IconComponent className="w-5 h-5" />;
  };

  const getWorkflowStageColor = (status) => {
    const colors = {
      completed: "text-green-600 bg-green-100",
      in_progress: "text-blue-600 bg-blue-100",
      pending: "text-gray-600 bg-gray-100",
    };
    return colors[status] || "text-gray-600 bg-gray-100";
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
        <h1 className="text-2xl font-bold text-gray-900">Document History</h1>
        <p className="text-gray-600">
          Track the progress and history of your submitted documents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Your Documents
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {documents.map((document) => (
                <div
                  key={document._id}
                  onClick={() => handleDocumentSelect(document)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedDocument?._id === document._id
                      ? "bg-indigo-50 border-indigo-200"
                      : ""
                  }`}
                >
                  <div className="flex items-center">
                    <DocumentTextIcon className="w-6 h-6 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {document.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(document.createdAt).toLocaleDateString()}
                      </p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusBadge(
                          document.status
                        )}`}
                      >
                        {document.status?.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Document History Details */}
        <div className="lg:col-span-2">
          {selectedDocument ? (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Document Timeline
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedDocument.title}
                </p>
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : documentHistory ? (
                <div className="p-6">
                  {/* Workflow Stages */}
                  <div className="space-y-4 mb-6">
                    <h3 className="text-md font-medium text-gray-900">
                      Workflow Progress
                    </h3>
                    <div className="space-y-3">
                      {documentHistory.document.workflow?.stages?.map(
                        (stage, index) => (
                          <div key={index} className="flex items-center">
                            <div
                              className={`p-2 rounded-full ${getWorkflowStageColor(
                                stage.status
                              )}`}
                            >
                              {getWorkflowStageIcon(stage.name)}
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 capitalize">
                                  {stage.name.replace("_", " ")}
                                </p>
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getWorkflowStageColor(
                                    stage.status
                                  )}`}
                                >
                                  {stage.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {stage.startedAt &&
                                  `Started: ${new Date(
                                    stage.startedAt
                                  ).toLocaleString()}`}
                                {stage.completedAt &&
                                  ` | Completed: ${new Date(
                                    stage.completedAt
                                  ).toLocaleString()}`}
                              </p>
                              {stage.notes && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {stage.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Reviews */}
                  {documentHistory.reviews &&
                    documentHistory.reviews.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-md font-medium text-gray-900 mb-3">
                          Reviews
                        </h3>
                        <div className="space-y-3">
                          {documentHistory.reviews.map((review) => (
                            <div
                              key={review._id}
                              className="bg-gray-50 p-4 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-900">
                                  Reviewer: {review.reviewer?.user?.name}
                                </p>
                                <span className="text-sm text-gray-500">
                                  {new Date(
                                    review.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {review.reviewData?.overallScore && (
                                <p className="text-sm text-gray-600">
                                  Overall Score:{" "}
                                  {review.reviewData.overallScore}/100
                                </p>
                              )}
                              {review.reviewData?.summary && (
                                <p className="text-sm text-gray-600 mt-2">
                                  {review.reviewData.summary}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Audits */}
                  {documentHistory.audits &&
                    documentHistory.audits.length > 0 && (
                      <div>
                        <h3 className="text-md font-medium text-gray-900 mb-3">
                          Audits
                        </h3>
                        <div className="space-y-3">
                          {documentHistory.audits.map((audit) => (
                            <div
                              key={audit._id}
                              className="bg-gray-50 p-4 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-900">
                                  Auditor: {audit.auditor?.user?.name}
                                </p>
                                <span className="text-sm text-gray-500">
                                  {new Date(
                                    audit.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {audit.finalDecision?.outcome && (
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-gray-600">
                                    Outcome:{" "}
                                    <span className="font-medium">
                                      {audit.finalDecision.outcome.replace(
                                        "_",
                                        " "
                                      )}
                                    </span>
                                  </p>
                                  {audit.finalDecision.finalScore && (
                                    <p className="text-sm text-gray-600">
                                      Final Score:{" "}
                                      {audit.finalDecision.finalScore}/100
                                    </p>
                                  )}
                                </div>
                              )}
                              {audit.finalDecision?.justification && (
                                <p className="text-sm text-gray-600 mt-2">
                                  {audit.finalDecision.justification}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No history available for this document
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Select a Document
              </h3>
              <p className="text-gray-600">
                Choose a document from the list to view its history and timeline
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentHistory;
