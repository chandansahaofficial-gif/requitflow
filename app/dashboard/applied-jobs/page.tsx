"use client";

import { useState, useEffect } from 'react';
import { 
  Building, MapPin, Briefcase, Calendar, 
  Trash2, ExternalLink, AlertCircle, Loader2,
  CheckCircle2, KanbanSquare, Clock
} from 'lucide-react';
import Link from 'next/link';

export default function AppliedJobsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/applications');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch applications');
      setApplications(data.applications || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setApplications(applications.map(app => app.id === id ? { ...app, status: newStatus } : app));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied': return 'bg-blue-500/20 text-blue-400';
      case 'Interview': return 'bg-purple-500/20 text-purple-400';
      case 'Offer Received': return 'bg-green-500/20 text-green-400';
      case 'Hired': return 'bg-green-600/20 text-green-500';
      case 'Rejected': return 'bg-red-500/20 text-red-400';
      case 'Withdrawn': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Applied Jobs
        </h1>
        <p className="text-slate-400 mt-2">
          Track candidates applications and interview progress.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center space-x-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="glass rounded-2xl p-12 border border-slate-800 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <KanbanSquare className="text-slate-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No applications tracked yet</h3>
          <p className="text-slate-400 max-w-md mb-6">
            You haven't submitted or tracked any job applications. Match candidates and apply to start tracking.
          </p>
          <Link href="/dashboard/job-search">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25">
              Search Jobs
            </button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications.map((app) => (
          <div key={app.id} className="glass rounded-2xl p-6 border border-slate-800 flex flex-col hover:border-blue-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">{app.job?.title}</h3>
                <div className="flex items-center text-slate-400 mt-1 space-x-2">
                  <Building size={16} />
                  <span className="text-sm">{app.job?.company?.name || 'Unknown Company'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mt-2 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Status:</span>
                <select 
                  value={app.status} 
                  onChange={(e) => updateStatus(app.id, e.target.value)}
                  className={`text-sm font-medium rounded-full px-2 py-1 bg-slate-900 border border-slate-700 outline-none focus:ring-1 focus:ring-blue-500 ${getStatusColor(app.status)}`}
                >
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer Received">Offer Received</option>
                  <option value="Hired">Hired</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
              </div>

              {app.candidateProfile && (
                <div className="flex items-center justify-between border-t border-slate-800/50 pt-2">
                  <span className="text-slate-400 text-sm">Candidate:</span>
                  <span className="text-slate-300 text-sm font-medium">{app.candidateProfile.firstName} {app.candidateProfile.lastName}</span>
                </div>
              )}

              <div className="flex items-center text-slate-300 text-sm border-t border-slate-800/50 pt-2">
                <Clock size={16} className="text-slate-500 mr-2" />
                <span>Applied {new Date(app.applicationDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex space-x-3 mt-6 pt-6 border-t border-slate-800">
              <Link href={`/dashboard/jobs/${app.job?.id}`} className="flex-1">
                <button className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-sm font-medium transition-all">
                  View Job
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
