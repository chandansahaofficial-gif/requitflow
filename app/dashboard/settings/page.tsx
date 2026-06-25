"use client";
import { useState, useEffect } from "react";
import { Check, Server, Loader2, AlertCircle, Mail, Save, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [jobSettings, setJobSettings] = useState<any>(null);
  
  // SMTP Settings State
  const [smtpData, setSmtpData] = useState({
    smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '', 
    fromName: '', fromEmail: '', secure: true, dailyLimit: 10, delayBetweenEmailsSeconds: 120
  });
  const [hasPassword, setHasPassword] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(true);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<any>({ isVerified: false, status: 'Unknown' });

  useEffect(() => {
    fetch("/api/settings/job-api")
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setJobSettings(data.settings);
        }
      })
      .catch(console.error);

    fetch("/api/settings/smtp")
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSmtpData({
            smtpHost: data.smtpHost || '',
            smtpPort: data.smtpPort ? data.smtpPort.toString() : '',
            smtpUser: data.smtpUser || '',
            smtpPass: '',
            fromName: data.fromName || '',
            fromEmail: data.fromEmail || '',
            secure: data.secure !== undefined ? data.secure : true,
            dailyLimit: data.dailyLimit || 10,
            delayBetweenEmailsSeconds: data.delayBetweenEmailsSeconds || 120
          });
          setHasPassword(data.hasPassword);
          setSmtpStatus({ isVerified: data.isVerified, status: data.status });
        }
      })
      .catch(console.error)
      .finally(() => setSmtpLoading(false));
  }, []);

  const handleSaveSmtp = async () => {
    setSmtpSaving(true);
    try {
      const res = await fetch("/api/settings/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpData)
      });
      const data = await res.json();
      if (res.ok) {
        alert("SMTP settings saved!");
        setHasPassword(true);
        setSmtpData(prev => ({ ...prev, smtpPass: '' }));
      } else {
        alert(data.error || "Failed to save SMTP settings.");
      }
    } catch (e) {
      alert("An error occurred.");
    }
    setSmtpSaving(false);
  };

  const handleTestSmtp = async () => {
    setSmtpTesting(true);
    try {
      const res = await fetch("/api/settings/smtp/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert("Success: " + data.message);
        setSmtpStatus({ isVerified: true, status: 'Active' });
      } else {
        alert("Error: " + data.error);
        setSmtpStatus({ isVerified: false, status: 'Failed' });
      }
    } catch (e) {
      alert("An error occurred while testing connection.");
    }
    setSmtpTesting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
        <p className="text-slate-400">Configure your email provider and outreach limits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SMTP Settings */}
        <div id="smtp" className="glass p-8 rounded-2xl border border-slate-700/50 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <Mail className="text-purple-400" size={24} />
              <h3 className="text-xl font-bold text-white">SMTP Settings</h3>
            </div>
            {smtpStatus.isVerified && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30 flex items-center space-x-1">
                <Check size={14} /> <span>Verified</span>
              </span>
            )}
            {!smtpStatus.isVerified && smtpStatus.status === 'Failed' && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30">
                Connection Failed
              </span>
            )}
          </div>
          
          <p className="text-sm text-slate-400">
            Connect your own SMTP sender. For safety, campaigns can send maximum 10 emails per day by default, with at least 1 minute delay between emails.
          </p>

          {smtpLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-purple-500" /></div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-400">Sender Name</label>
                  <input type="text" value={smtpData.fromName} onChange={e => setSmtpData({...smtpData, fromName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-purple-500" placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-400">Sender Email</label>
                  <input type="email" value={smtpData.fromEmail} onChange={e => setSmtpData({...smtpData, fromEmail: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-purple-500" placeholder="john@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-sm font-medium text-slate-400">SMTP Host</label>
                  <input type="text" value={smtpData.smtpHost} onChange={e => setSmtpData({...smtpData, smtpHost: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-purple-500" placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-400">Port</label>
                  <input type="text" value={smtpData.smtpPort} onChange={e => setSmtpData({...smtpData, smtpPort: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-purple-500" placeholder="587" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-400">SMTP Username</label>
                  <input type="text" value={smtpData.smtpUser} onChange={e => setSmtpData({...smtpData, smtpUser: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-purple-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-400">SMTP Password</label>
                  <input type="password" value={smtpData.smtpPass} onChange={e => setSmtpData({...smtpData, smtpPass: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-purple-500" placeholder={hasPassword ? "•••••••• (Saved)" : ""} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 pt-6">
                  <input type="checkbox" id="secure" checked={smtpData.secure} onChange={e => setSmtpData({...smtpData, secure: e.target.checked})} className="w-4 h-4 rounded border-slate-600 bg-slate-900 cursor-pointer" />
                  <label htmlFor="secure" className="text-sm font-medium text-slate-400 cursor-pointer">Use Secure / TLS</label>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-400">Daily Sending Limit</label>
                  <input type="number" min="1" max="10" value={smtpData.dailyLimit} onChange={e => {
                    let val = parseInt(e.target.value) || 0;
                    if (val > 10) val = 10;
                    setSmtpData({...smtpData, dailyLimit: val});
                  }} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-purple-500" />
                  <p className="text-xs text-slate-500">Maximum 10 emails per day for safe warm-up.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-start-2">
                  <label className="text-sm font-medium text-slate-400">Delay between emails</label>
                  <select value={smtpData.delayBetweenEmailsSeconds} onChange={e => setSmtpData({...smtpData, delayBetweenEmailsSeconds: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-purple-500">
                    <option value="60">1 minute</option>
                    <option value="120">2 minutes recommended</option>
                    <option value="300">5 minutes</option>
                    <option value="600">10 minutes</option>
                    <option value="900">15 minutes</option>
                  </select>
                  <p className="text-xs text-slate-500">Recommended: 2–5 minutes between emails.</p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button onClick={handleSaveSmtp} disabled={smtpSaving} className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors shadow-lg flex items-center justify-center gap-2">
                  {smtpSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save SMTP Settings
                </button>
                <button onClick={handleTestSmtp} disabled={smtpTesting || (!hasPassword && !smtpData.smtpPass)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700 flex items-center justify-center gap-2">
                  {smtpTesting ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />} Send Test Email
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="glass p-8 rounded-2xl border border-slate-700/50 space-y-6 opacity-75">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white">Outreach Limits & AI Behaviors</h3>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20">
              Coming Soon
            </span>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400">Daily Email Limit</label>
                <input disabled type="number" placeholder="100" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400">Delay between emails (min)</label>
                <input disabled type="number" placeholder="5" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed outline-none" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-300">Human Handle Default</h4>
                  <p className="text-xs text-slate-500">Wait for human review before sending AI drafted replies.</p>
                </div>
                <div className="w-10 h-6 bg-slate-800 rounded-full relative cursor-not-allowed">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-slate-600 rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-300">AI Auto-Reply</h4>
                  <p className="text-xs text-slate-500">Allow AI to autonomously reply to objections.</p>
                </div>
                <div className="w-10 h-6 bg-slate-800 rounded-full relative cursor-not-allowed">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-slate-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass p-8 rounded-2xl border border-slate-700/50 space-y-6 mt-6 max-w-2xl">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <Server className="text-green-500" size={24} />
          <h3 className="text-xl font-bold text-white">Job & Hiring Research Settings</h3>
        </div>
        
        {jobSettings ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
              <span className="text-slate-400 font-medium">Apify Actor Configured</span>
              <span className={`flex items-center space-x-1 text-green-400`}>
                <Check size={16} />
                <span>Yes</span>
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
              <span className="text-slate-400 font-medium">OpenRouter API Configured</span>
              <span className={`flex items-center space-x-1 ${jobSettings.openRouterConfigured ? 'text-green-400' : 'text-red-400'}`}>
                {jobSettings.openRouterConfigured ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{jobSettings.openRouterConfigured ? 'Yes' : 'No'}</span>
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Default Country</p>
                <p className="text-white font-medium uppercase">{jobSettings.defaultCountry}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Cache Duration</p>
                <p className="text-white font-medium">{jobSettings.cacheDuration} minutes</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Daily Search Limit</p>
                <p className="text-white font-medium">{jobSettings.dailyLimit}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">AI Batch Size</p>
                <p className="text-white font-medium">{jobSettings.aiBatchSize}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-slate-400 py-4">
            <Loader2 className="animate-spin" size={20} />
            <span>Loading settings...</span>
          </div>
        )}
      </div>
    </div>
  );
}
