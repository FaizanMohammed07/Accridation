import React, { useState, useEffect } from "react";
import {
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import toast from "react-hot-toast";

function ReviewHistory() {
  const [reviewHistory, setReviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchReviewHistory();
  }, [searchTerm, scoreFilter, dateRange]);

  const fetchReviewHistory = async () => {
    try {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(scoreFilter && { scoreRange: scoreFilter }),
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate }),
      });

      const response = await axios.get(`/api/reviews/history?${params}`);
      setReviewHistory(response.data.data.reviews || []);
    } catch (error) {
      toast.error("Failed to fetch review history");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const calculateReviewDuration = (startedAt, completedAt) => {
    if (!startedAt || !completedAt) return "N/A";
    const duration = new Date(completedAt) - new Date(startedAt);
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h`;
  };

  // Mock data for demonstration
  const mockReviewHistory = [
    {
      _id: "1",
      document: {
        title: "Academic Program Assessment 2024",
        type: "academic_program",
      },
      institute: { name: "Tech University" },
      timeline: {
        startedAt: new Date(Date.now() - 86400000 * 5),
        completedAt: new Date(Date.now() - 86400000 * 3),
      },
      reviewData: {
        overallScore: 85,
        summary:
          "Comprehensive assessment with strong academic standards and faculty qualifications.",
      },
      status: "submitted",
    },
    {
      _id: "2",
      document: {
        title: "Quality Assurance Framework",
        type: "quality_assurance",
      },
      institute: { name: "Science College" },
      timeline: {
        startedAt: new Date(Date.now() - 86400000 * 10),
        completedAt: new Date(Date.now() - 86400000 * 8),
      },
      reviewData: {
        overallScore: 92,
        summary:
          "Excellent quality assurance processes with clear documentation and implementation.",
      },
      status: "submitted",
    },
    {
      _id: "3",
      document: {
        title: "Institutional Assessment Report",
        type: "institutional_assessment",
      },
      institute: { name: "Business School" },
      timeline: {
        startedAt: new Date(Date.now() - 86400000 * 15),
        completedAt: new Date(Date.now() - 86400000 * 12),
      },
      reviewData: {
        overallScore: 78,
        summary:
          "Good institutional framework with some areas for improvement in resource allocation.",
      },
      status: "submitted",
    },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Review History</h1>
        <p className="text-gray-600">
          View your completed review assignments and outcomes
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Scores</option>
            <option value="80-100">Excellent (80-100)</option>
            <option value="60-79">Good (60-79)</option>
            <option value="0-59">Needs Improvement (0-59)</option>
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

      {/* Review History Cards */}
      <div className="space-y-4">
        {mockReviewHistory.map((review) => (
          <div
            key={review._id}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <DocumentTextIcon className="w-8 h-8 text-gray-400 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {review.document?.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {review.institute?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
                <span
                  className={`text-lg font-bold ${getScoreColor(
                    review.reviewData?.overallScore
                  )}`}
                >
                  {review.reviewData?.overallScore}/100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <p className="text-sm text-gray-600 capitalize">
                  {review.document?.type?.replace("_", " ")}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Started:
                </span>
                <p className="text-sm text-gray-600">
                  {review.timeline?.startedAt
                    ? new Date(review.timeline.startedAt).toLocaleDateString()
                    : "Not started"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Completed:
                </span>
                <p className="text-sm text-gray-600">
                  {review.timeline?.completedAt
                    ? new Date(review.timeline.completedAt).toLocaleDateString()
                    : "Not completed"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Duration:
                </span>
                <p className="text-sm text-gray-600">
                  {calculateReviewDuration(
                    review.timeline?.startedAt,
                    review.timeline?.completedAt
                  )}
                </p>
              </div>
            </div>

            {review.reviewData?.summary && (
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700">
                  Summary:
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  {review.reviewData.summary}
                </p>
              </div>
            )}

            {review.reviewData?.criteria &&
              review.reviewData.criteria.length > 0 && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">
                    Key Criteria Scores:
                  </span>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {review.reviewData.criteria
                      .slice(0, 6)
                      .map((criteria, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded">
                          <p className="text-xs font-medium text-gray-700">
                            {criteria.name}
                          </p>
                          <p
                            className={`text-sm font-bold ${getScoreColor(
                              criteria.score
                            )}`}
                          >
                            {criteria.score}/100
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            <div className="flex items-center justify-between">
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getScoreBadge(
                  review.reviewData?.overallScore
                )}`}
              >
                {review.reviewData?.overallScore >= 80
                  ? "Excellent"
                  : review.reviewData?.overallScore >= 60
                  ? "Good"
                  : "Needs Improvement"}
              </span>
              <button
                onClick={() =>
                  (window.location.href = `/reviewer/review/${review._id}`)
                }
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {mockReviewHistory.length === 0 && (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No review history
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't completed any reviews yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default ReviewHistory;
