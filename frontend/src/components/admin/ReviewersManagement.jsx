import React, { useState, useEffect } from "react";
import {
  UserGroupIcon,
  StarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import toast from "react-hot-toast";

function ReviewersManagement() {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");

  useEffect(() => {
    fetchReviewers();
  }, [searchTerm, availabilityFilter]);

  const fetchReviewers = async () => {
    try {
      const response = await axios.get("/api/admin/reviewers");
      let filteredReviewers = response.data.data.reviewers;

      if (searchTerm) {
        filteredReviewers = filteredReviewers.filter(
          (reviewer) =>
            reviewer.user.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            reviewer.specialization
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        );
      }

      if (availabilityFilter) {
        filteredReviewers = filteredReviewers.filter(
          (reviewer) => reviewer.availability === availabilityFilter
        );
      }

      setReviewers(filteredReviewers);
    } catch (error) {
      toast.error("Failed to fetch reviewers");
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityBadge = (availability) => {
    const config = {
      available: "bg-green-100 text-green-800",
      busy: "bg-yellow-100 text-yellow-800",
      unavailable: "bg-red-100 text-red-800",
    };
    return config[availability] || "bg-gray-100 text-gray-800";
  };

  const getWorkloadColor = (percentage) => {
    if (percentage < 50) return "text-green-600";
    if (percentage < 80) return "text-yellow-600";
    return "text-red-600";
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
            Reviewers Management
          </h1>
          <p className="text-gray-600">
            Manage reviewer assignments and workload distribution
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search reviewers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Availability</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Reviewers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviewers.map((reviewer) => (
          <div
            key={reviewer._id}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <UserGroupIcon className="w-10 h-10 text-indigo-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {reviewer.user.name}
                </h3>
                <p className="text-sm text-gray-500">{reviewer.user.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Specialization:
                </span>
                <p className="text-sm text-gray-600">
                  {reviewer.specialization}
                </p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">
                  Experience:
                </span>
                <p className="text-sm text-gray-600">
                  {reviewer.experience} years
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Rating:
                </span>
                <div className="flex items-center">
                  <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">
                    {reviewer.rating}/5
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Availability:
                </span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAvailabilityBadge(
                    reviewer.availability
                  )}`}
                >
                  {reviewer.availability}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Workload:
                </span>
                <span
                  className={`text-sm font-medium ${getWorkloadColor(
                    reviewer.workloadPercentage
                  )}`}
                >
                  {reviewer.workloadPercentage}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Current Assignments:
                </span>
                <span className="text-sm text-gray-600">
                  {reviewer.workload.current}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Completed Reviews:
                </span>
                <span className="text-sm text-gray-600">
                  {reviewer.completedReviews}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Avg Review Time:
                </span>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {reviewer.averageReviewTime}h
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reviewers.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No reviewers found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            No reviewers match your current filters.
          </p>
        </div>
      )}
    </div>
  );
}

export default ReviewersManagement;
