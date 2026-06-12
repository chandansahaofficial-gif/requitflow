"use client";
import { useState } from "react";
import { Search, MapPin, Briefcase, Star, Users, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SearchCandidatesPage() {
  const [formData, setFormData] = useState({
    jobTitle: "",
    skills: "",
    location: "",
    country: "US",
    experienceLevel: "Any",
    workPreference: "Any",
    maxResults: "10"
  });
  
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch("/api/candidates/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to search candidates");
      }
      
      setSuccess(`Successfully found and scored ${data.candidatesFound || 0} candidates!`);
      // Reset form on success if needed, or keep for tweaking
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Search Candidates</h2>
          <p className="text-slate-400">Source top talent globally from integrated job boards and score them with AI.</p>
        </div>
        <Link 
          href="/dashboard/candidates"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 flex items-center space-x-2"
        >
          <Users size={18} />
          <span>View Saved Candidates</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 text-red-400">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start space-x-3 text-green-400">
          <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">{success}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass rounded-2xl border border-slate-700/50 p-6 md:p-8 space-y-8 relative overflow-hidden">
        {searching && (
          <div className="absolute inset-0 z-10 bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
            <Loader2 size={40} className="animate-spin text-purple-500 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2 flex items-center space-x-2">
              <Sparkles size={20} className="text-blue-400" />
              <span>Sourcing & Scoring Candidates...</span>
            </h3>
            <p className="text-slate-400">This may take a minute depending on max results.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Job Title</label>
              <div className="relative">
                <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  required
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Target Skills (comma separated)</label>
              <div className="relative">
                <Star size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  placeholder="e.g. React, TypeScript, Next.js"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Location</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="City or Region"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Country</label>
                <select 
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="IN">India</option>
                  <option value="GLOBAL">Global / Remote</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Experience Level</label>
              <select 
                value={formData.experienceLevel}
                onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="Any">Any Experience</option>
                <option value="Entry Level">Entry Level (0-2 years)</option>
                <option value="Mid Level">Mid Level (3-5 years)</option>
                <option value="Senior">Senior (5+ years)</option>
                <option value="Director">Director / Executive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Work Preference</label>
              <select 
                value={formData.workPreference}
                onChange={(e) => setFormData({...formData, workPreference: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="Any">Any</option>
                <option value="Remote">Remote Only</option>
                <option value="On-site">On-site Only</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Max Results</label>
              <select 
                value={formData.maxResults}
                onChange={(e) => setFormData({...formData, maxResults: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="5">5 profiles (Fast)</option>
                <option value="10">10 profiles</option>
                <option value="25">25 profiles</option>
                <option value="50">50 profiles (Slower AI Scoring)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex justify-end">
          <button 
            type="submit" 
            disabled={searching}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50"
          >
            <Search size={18} />
            <span>Search Candidates</span>
          </button>
        </div>
      </form>
    </div>
  );
}
