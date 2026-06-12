"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, Loader2, 
  User, Briefcase, Zap, X
} from 'lucide-react';
import Link from 'next/link';

export default function ResumeMatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 30 * 1024 * 1024) {
        setError('File size exceeds 30MB limit.');
        return;
      }
      setFile(selected);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setSuccess(true);
      setProfileId(data.candidateProfileId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
          Resume Match
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Upload a candidate resume to automatically extract their profile and find the best matching active job opportunities.
        </p>
      </div>

      <div className="glass rounded-3xl p-10 border border-slate-800 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

        <div className="relative z-10">
          {!file && !success && (
            <div 
              className="border-2 border-dashed border-slate-700 rounded-2xl p-12 transition-all hover:border-blue-500 hover:bg-slate-800/50 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload size={32} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Click to Upload Resume</h3>
              <p className="text-slate-400 mb-6">PDF or DOCX (max 30MB)</p>
              <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all">
                Browse Files
              </button>
            </div>
          )}

          {file && !success && !uploading && (
            <div className="bg-slate-900/80 rounded-2xl p-8 border border-slate-700 inline-block w-full max-w-md mx-auto text-left">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <FileText size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button onClick={clearSelection} className="text-slate-500 hover:text-slate-300">
                  <X size={20} />
                </button>
              </div>
              
              <button 
                onClick={handleUpload}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center space-x-2"
              >
                <Zap size={20} />
                <span>Process with AI</span>
              </button>
            </div>
          )}

          {uploading && (
            <div className="py-12">
              <Loader2 size={48} className="animate-spin text-purple-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-2">Extracting Profile</h3>
              <p className="text-slate-400">Our AI is parsing the resume and extracting structured data...</p>
            </div>
          )}

          {success && (
            <div className="py-8">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Profile Extracted Successfully!</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                We've extracted the skills, experience, and contact details from the resume. You can now use this profile to match with active jobs.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={clearSelection} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-all">
                  Upload Another
                </button>
                <Link href={`/dashboard/ai-match-results?candidateId=${profileId}`} className="w-full sm:w-auto">
                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2">
                    <Briefcase size={20} />
                    <span>Find Matching Jobs</span>
                  </button>
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start space-x-3 text-left">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="glass p-6 rounded-2xl border border-slate-800">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
            <User size={24} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Smart Extraction</h3>
          <p className="text-slate-400 text-sm">AI identifies names, contacts, skills, education, and past roles to build a rich candidate profile instantly.</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-slate-800">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
            <Zap size={24} className="text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Automated Matching</h3>
          <p className="text-slate-400 text-sm">Compare candidate skills against active job requirements to find the perfect fit and calculate a Match Score.</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-slate-800">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
            <Briefcase size={24} className="text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Client Outreach</h3>
          <p className="text-slate-400 text-sm">Identify highly matched candidates for active jobs and instantly pitch them to the hiring companies.</p>
        </div>
      </div>
    </div>
  );
}
