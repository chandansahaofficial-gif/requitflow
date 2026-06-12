"use client";

import { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Search, Briefcase, Zap, 
  FileText, Activity, Server, AlertCircle, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [usage, setUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usageRes] = await Promise.all([
        fetch('/api/admin/job-analytics'),
        fetch('/api/admin/api-usage')
      ]);

      const statsData = await statsRes.json();
      const usageData = await usageRes.json();

      if (!statsRes.ok) throw new Error(statsData.error || 'Failed to fetch analytics');
      if (!usageRes.ok) throw new Error(usageData.error || 'Failed to fetch API usage');

      setStats(statsData);
      setUsage(usageData.usage || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-12 border border-slate-800 text-center max-w-2xl mx-auto mt-12">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-white mb-2">Access Error</h2>
        <p className="text-slate-400">{error}</p>
        <Link href="/dashboard">
          <button className="mt-6 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-xl transition-all">
            Return to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Admin Analytics
        </h1>
        <p className="text-slate-400 mt-2">
          Monitor Job & Hiring Research module usage and API performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6 border border-slate-800 relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-slate-400 font-medium">Total Users</h3>
            <div className="p-2 bg-slate-800 rounded-lg"><Users size={20} className="text-blue-400" /></div>
          </div>
          <div className="text-3xl font-bold text-white relative z-10">{stats.totalUsers}</div>
        </div>

        <div className="glass rounded-2xl p-6 border border-slate-800 relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-purple-500/20"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-slate-400 font-medium">Job Searches (Today)</h3>
            <div className="p-2 bg-slate-800 rounded-lg"><Search size={20} className="text-purple-400" /></div>
          </div>
          <div className="text-3xl font-bold text-white relative z-10">{stats.searchesToday}</div>
        </div>

        <div className="glass rounded-2xl p-6 border border-slate-800 relative overflow-hidden group hover:border-green-500/50 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-green-500/20"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-slate-400 font-medium">Jobs Fetched</h3>
            <div className="p-2 bg-slate-800 rounded-lg"><Briefcase size={20} className="text-green-400" /></div>
          </div>
          <div className="text-3xl font-bold text-white relative z-10">{stats.totalJobsFetched}</div>
        </div>

        <div className="glass rounded-2xl p-6 border border-slate-800 relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-amber-500/20"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-slate-400 font-medium">Jobs Analyzed (AI)</h3>
            <div className="p-2 bg-slate-800 rounded-lg"><Zap size={20} className="text-amber-400" /></div>
          </div>
          <div className="text-3xl font-bold text-white relative z-10">{stats.totalJobsAnalyzed}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 border border-slate-800">
           <div className="flex items-center space-x-3 mb-6">
             <FileText className="text-blue-400" size={24} />
             <h2 className="text-xl font-bold text-white">System Data</h2>
           </div>
           <div className="space-y-4">
             <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
               <span className="text-slate-400">Resume Uploads</span>
               <span className="text-white font-medium">{stats.resumeUploads}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
               <span className="text-slate-400">Applications Tracked</span>
               <span className="text-white font-medium">{stats.applicationsTracked}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
               <span className="text-slate-400">Active Hiring Companies</span>
               <span className="text-white font-medium">{stats.activeCompanies}</span>
             </div>
           </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-slate-800 md:col-span-2">
           <div className="flex items-center space-x-3 mb-6">
             <Server className="text-purple-400" size={24} />
             <h2 className="text-xl font-bold text-white">API Usage Trends</h2>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-300">
               <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 border-b border-slate-800">
                 <tr>
                   <th className="px-4 py-3 font-medium">Provider</th>
                   <th className="px-4 py-3 font-medium">Endpoint</th>
                   <th className="px-4 py-3 font-medium text-right">Requests</th>
                   <th className="px-4 py-3 font-medium text-right">Est. Tokens</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/50">
                 {usage.map((u, i) => (
                   <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                     <td className="px-4 py-3 font-medium text-white">{u.provider}</td>
                     <td className="px-4 py-3 text-slate-400">{u.endpoint}</td>
                     <td className="px-4 py-3 text-right">{u._sum.requestCount}</td>
                     <td className="px-4 py-3 text-right">{u._sum.tokenUsage || '-'}</td>
                   </tr>
                 ))}
                 {usage.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No API usage recorded yet.</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
}
