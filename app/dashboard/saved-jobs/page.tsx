"use client";

import { useState, useEffect } from 'react';
import { 
  BookOpen, Building, MapPin, Briefcase, Calendar, 
  Trash2, ExternalLink, AlertCircle, Loader2, DollarSign
} from 'lucide-react';
import Link from 'next/link';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/saved-jobs');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch saved jobs');
      setSavedJobs(data.savedJobs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeJob = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-jobs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove job');
      setSavedJobs(savedJobs.filter(job => job.id !== id));
    } catch (err: any) {
      alert(err.message);
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
          Saved Jobs
        </h1>
        <p className="text-slate-400 mt-2">
          Manage opportunities you have shortlisted for your candidates.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center space-x-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && savedJobs.length === 0 && (
        <div className="glass rounded-2xl p-12 border border-slate-800 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="text-slate-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No saved jobs yet</h3>
          <p className="text-slate-400 max-w-md mb-6">
            You haven't saved any jobs yet. Head over to the Job & Hiring Search to discover active opportunities.
          </p>
          <Link href="/dashboard/job-search">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25">
              Search Jobs
            </button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedJobs.map((item) => (
          <div key={item.id} className="glass rounded-2xl p-6 border border-slate-800 flex flex-col hover:border-purple-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">{item.job?.title}</h3>
                <div className="flex items-center text-slate-400 mt-1 space-x-2">
                  <Building size={16} />
                  <span className="text-sm">{item.job?.company?.name || 'Unknown Company'}</span>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded ${item.priority === 'High' ? 'bg-red-500/20 text-red-400' : item.priority === 'Low' ? 'bg-slate-500/20 text-slate-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {item.priority}
              </span>
            </div>
            
            <div className="space-y-2 mt-4 flex-1">
              <div className="flex items-center text-slate-300 text-sm">
                <MapPin size={16} className="text-slate-500 mr-2" />
                <span className="truncate">{item.job?.location || 'Not disclosed'}</span>
              </div>
              <div className="flex items-center text-slate-300 text-sm">
                <Briefcase size={16} className="text-slate-500 mr-2" />
                <span>{item.job?.jobType || 'Type not specified'}</span>
              </div>
              <div className="flex items-center text-slate-300 text-sm">
                <Calendar size={16} className="text-slate-500 mr-2" />
                <span>Saved {new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex space-x-3 mt-6 pt-6 border-t border-slate-800">
              <Link href={`/dashboard/jobs/${item.job?.id}`} className="flex-1">
                <button className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-sm font-medium transition-all">
                  View Job
                </button>
              </Link>
              <button 
                onClick={() => removeJob(item.id)}
                className="bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white p-2 rounded-xl transition-all"
                title="Remove Saved Job"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
