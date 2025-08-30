import React, { useState, useEffect } from "react";
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import axios from "axios";
import toast from "react-hot-toast";

function InstituteReports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: "institute_performance",
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const response = await axios.get(`/api/institute/reports?${params}`);
      setReportData(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      const response = await axios.post(
        "/api/institute/export",
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          format,
        },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `institute-report-${new Date().toISOString().split("T")[0]}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  // Mock data for demonstration
  const mockData = {
    overview: {
      totalDocuments: 12,
      approvedDocuments: 8,
      rejectedDocuments: 1,
      pendingDocuments: 3,
      averageProcessingTime: 15.5,
      successRate: 88.9,
    },
    statusDistribution: [
      { name: "Approved", value: 8, color: "#10B981" },
      { name: "Under Review", value: 2, color: "#F59E0B" },
      { name: "Under Audit", value: 1, color: "#8B5CF6" },
      { name: "Rejected", value: 1, color: "#EF4444" },
    ],
    monthlySubmissions: [
      { month: "Jan", submissions: 2, approved: 2, rejected: 0 },
      { month: "Feb", submissions: 3, approved: 2, rejected: 1 },
      { month: "Mar", submissions: 4, approved: 3, rejected: 0 },
      { month: "Apr", submissions: 3, approved: 1, rejected: 0 },
    ],
    processingTimes: [
      { type: "Academic Program", avgDays: 12 },
      { type: "Quality Assurance", avgDays: 18 },
      { type: "Institutional Assessment", avgDays: 25 },
      { type: "Compliance Report", avgDays: 8 },
    ],
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
            Institute Reports
          </h1>
          <p className="text-gray-600">
            Track your accreditation progress and performance metrics
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => exportReport("csv")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Export CSV
          </button>
          <button
            onClick={() => exportReport("pdf")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={fetchReports}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <ChartBarIcon className="w-5 h-5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentArrowDownIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Submissions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {mockData.overview.totalDocuments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockData.overview.successRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Avg Processing Time
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {mockData.overview.averageProcessingTime} days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Document Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockData.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {mockData.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Submissions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Monthly Submissions
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockData.monthlySubmissions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="submissions" fill="#8884d8" name="Submissions" />
              <Bar dataKey="approved" fill="#82ca9d" name="Approved" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Processing Times by Document Type */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Average Processing Times by Document Type
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockData.processingTimes} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="type" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="avgDays" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Performance Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {mockData.overview.approvedDocuments}
            </div>
            <div className="text-sm text-gray-600">Approved Documents</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {mockData.overview.pendingDocuments}
            </div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {mockData.overview.rejectedDocuments}
            </div>
            <div className="text-sm text-gray-600">Rejected Documents</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {mockData.overview.successRate}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstituteReports;
