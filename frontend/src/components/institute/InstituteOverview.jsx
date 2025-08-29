import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { documentAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

function InstituteOverview() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await documentAPI.getDocuments();
      const docs = response.data.documents || [];
      setDocuments(docs);
      
      // Calculate stats
      const statsData = {
        total: docs.length,
        pending: docs.filter(doc => doc.status === 'pending').length,
        inReview: docs.filter(doc => doc.status === 'under_review').length,
        approved: docs.filter(doc => doc.status === 'approved').length,
        rejected: docs.filter(doc => doc.status === 'rejected').length,
      };
      setStats(statsData);
    } catch (error) {
      showError('Failed to load dashboard data');
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

  const statusCards = [
    {
      name: 'Total Documents',
      value: stats.total || 0,
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      name: 'Pending Review',
      value: stats.pending || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      name: 'In Review',
      value: stats.inReview || 0,
      icon: AlertCircle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      name: 'Approved',
      value: stats.approved || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
  ];

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      under_audit: 'bg-purple-100 text-purple-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
        <p className="mt-2 text-gray-600">
          Manage your accreditation documents and track their progress through the review process.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statusCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
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
        {/* Recent Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Documents</h3>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {documents.slice(0, 5).map((doc) => (
                <div key={doc._id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(doc.status)}`}>
                    {doc.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No documents uploaded yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <button className="w-full bg-blue-600 text-white p-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
                <Upload className="h-4 w-4 mr-2" />
                Upload New Document
              </button>
              <button className="w-full bg-green-600 text-white p-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center">
                <FileText className="h-4 w-4 mr-2" />
                View All Documents
              </button>
              <button className="w-full bg-purple-600 text-white p-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Review
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Accreditation Progress</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Documents Submitted</span>
              <span className="text-sm font-medium text-blue-600">{stats.total}/10 Required</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((stats.total / 10) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstituteOverview;