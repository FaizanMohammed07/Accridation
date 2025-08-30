import React, { useState, useEffect } from "react";
import {
  ShieldCheckIcon,
  StarIcon,
  ClockIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import toast from "react-hot-toast";

function AuditorsManagement() {
  const [auditors, setAuditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");

  useEffect(() => {
    fetchAuditors();
  }, [searchTerm, availabilityFilter]);

  const fetchAuditors = async () => {
    try {
      const response = await axios.get("/api/admin/auditors");
      let filteredAuditors = response.data.data.auditors;

      if (searchTerm) {
        filteredAuditors = filteredAuditors.filter(
          (auditor) =>
            auditor.user.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            auditor.licenseNumber
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        );
      }

      if (availabilityFilter) {
        filteredAuditors = filteredAuditors.filter(
          (auditor) => auditor.availability === availabilityFilter
        );
      }

      setAuditors(filteredAuditors);
    } catch (error) {
      toast.error("Failed to fetch auditors");
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
            Auditors Management
          </h1>
          <p className="text-gray-600">
            Manage auditor assignments and workload distribution
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search auditors..."
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

      {/* Auditors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auditors.map((auditor) => (
          <div
            key={auditor._id}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="w-10 h-10 text-orange-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {auditor.user.name}
                </h3>
                <p className="text-sm text-gray-500">{auditor.user.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  License Number:
                </span>
                <p className="text-sm text-gray-600 font-mono">
                  {auditor.licenseNumber}
                </p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">
                  Specialization:
                </span>
                <p className="text-sm text-gray-600">
                  {auditor.specialization}
                </p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">
                  Experience:
                </span>
                <div className="flex items-center text-sm text-gray-600">
                  <AcademicCapIcon className="w-4 h-4 mr-1" />
                  {auditor.experience} years
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Rating:
                </span>
                <div className="flex items-center">
                  <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">
                    {auditor.rating}/5
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Availability:
                </span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAvailabilityBadge(
                    auditor.availability
                  )}`}
                >
                  {auditor.availability}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Workload:
                </span>
                <span
                  className={`text-sm font-medium ${getWorkloadColor(
                    auditor.workloadPercentage
                  )}`}
                >
                  {auditor.workloadPercentage}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Current Assignments:
                </span>
                <span className="text-sm text-gray-600">
                  {auditor.workload.current}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Completed Audits:
                </span>
                <span className="text-sm text-gray-600">
                  {auditor.completedAudits}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Avg Audit Time:
                </span>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {auditor.averageAuditTime}h
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Performance:
                </span>
                <span className="text-sm text-gray-600">
                  {auditor.overallPerformance}/100
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {auditors.length === 0 && (
        <div className="text-center py-12">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No auditors found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            No auditors match your current filters.
          </p>
        </div>
      )}
    </div>
  );
}

export default AuditorsManagement;
