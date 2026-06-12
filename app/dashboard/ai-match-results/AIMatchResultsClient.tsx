"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Briefcase, CheckCircle2, XCircle, AlertCircle, Loader2,
  Zap, Copy, Download, ExternalLink, User, FileText
} from 'lucide-react';
import Link from 'next/link';

export default function AIMatchResultsClient() {
  const searchParams = useSearchParams();
  const candidateId = searchParams.get('candidateId');
  const jobId = searchParams.get('jobId');

  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In a real implementation, we would fetch candidates and jobs to allow selection
  // For this implementation, we assume they are passed via URL or we show a message
  
  useEffect(() => {
    if (candidateId && jobId) {
      runMatch();
    }
  }, [candidateId, jobId]);

  const runMatch = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/ai/job-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateProfileId: candidateId, jobId: jobId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate match');
      setMatchData(data.match);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadTxt = (text: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!candidateId && !jobId) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div className="glass rounded-3xl p-12 text-center border border-slate-800">
          <Zap size={48} className="text-purple-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">AI Candidate Matching</h1>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Select a candidate from your database and match them with active jobs to instantly generate personalized applications and calculate fit scores.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard/resume-match">
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25">
                Upload Resume
              </button>
            </Link>
            <Link href="/dashboard/job-search">
              <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-all">
                Search Jobs
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-purple-500" size={64} />
        <h2 className="text-2xl font-bold text-white">Calculating Match Score...</h2>
        <p className="text-slate-400 text-center max-w-md">Our AI is analyzing skills, experience, and requirements to determine the exact fit and generating personalized application material.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-12 border border-slate-800 text-center max-w-2xl mx-auto mt-12">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-white mb-2">Matching Error</h2>
        <p className="text-slate-400">{error}</p>
        <button onClick={runMatch} className="mt-6 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-xl transition-all">
          Retry Match
        </button>
      </div>
    );
  }

  if (!matchData) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Match Results</h1>
        <p className="text-slate-400">Detailed analysis of candidate fit for this role.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-8 border border-slate-800 text-center md:col-span-1 flex flex-col items-center justify-center relative overflow-hidden">
           <div className={`absolute inset-0 opacity-10 blur-3xl ${matchData.matchScore >= 80 ? 'bg-green-500' : matchData.matchScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
           <div className="relative z-10">
             <div className="text-6xl font-black mb-2 flex items-center justify-center">
               <span className={getScoreColor(matchData.matchScore)}>{matchData.matchScore}</span>
               <span className="text-3xl text-slate-500 ml-1">%</span>
             </div>
             <h3 className="text-lg font-bold text-white mb-2">Match Score</h3>
             <p className="text-slate-400 text-sm leading-relaxed">{matchData.matchReason}</p>
           </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-slate-800 md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div>
              <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-4 flex items-center">
                <CheckCircle2 size={16} className="mr-2" /> Matching Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {JSON.parse(matchData.matchingSkills || '[]').map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm">{skill}</span>
                ))}
                {JSON.parse(matchData.matchingSkills || '[]').length === 0 && <span className="text-slate-500 text-sm">No specific matching skills found.</span>}
              </div>
            </div>
            <div>
               <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4 flex items-center">
                <XCircle size={16} className="mr-2" /> Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {JSON.parse(matchData.missingSkills || '[]').map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{skill}</span>
                ))}
                {JSON.parse(matchData.missingSkills || '[]').length === 0 && <span className="text-slate-500 text-sm">No missing skills identified.</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Outreach Material</h2>
        
        <div className="glass rounded-2xl border border-slate-800 overflow-hidden">
          <div className="bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-semibold text-white flex items-center">
              <Zap size={18} className="text-purple-400 mr-2" />
              Application Message
            </h3>
            <button onClick={() => copyToClipboard(matchData.applicationMessage)} className="text-slate-400 hover:text-white transition-colors flex items-center text-sm">
              <Copy size={14} className="mr-1" /> Copy
            </button>
          </div>
          <div className="p-6">
            <p className="text-slate-300 whitespace-pre-wrap">{matchData.applicationMessage}</p>
          </div>
        </div>

        <div className="glass rounded-2xl border border-slate-800 overflow-hidden">
          <div className="bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-semibold text-white flex items-center">
              <FileText size={18} className="text-blue-400 mr-2" />
              Tailored Cover Letter
            </h3>
            <div className="flex space-x-4">
              <button onClick={() => copyToClipboard(matchData.coverLetter)} className="text-slate-400 hover:text-white transition-colors flex items-center text-sm">
                <Copy size={14} className="mr-1" /> Copy
              </button>
              <button onClick={() => downloadTxt(matchData.coverLetter, 'Cover_Letter.txt')} className="text-slate-400 hover:text-white transition-colors flex items-center text-sm">
                <Download size={14} className="mr-1" /> Download
              </button>
            </div>
          </div>
          <div className="p-6">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{matchData.coverLetter}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
