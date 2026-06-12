"use client";
import { useState, useEffect } from "react";
import { Save, Check, Server, ShieldCheck, Mail, Loader2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);

  const [jobSettings, setJobSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings/smtp")
      .then(res => res.json())
      .then(data => {
        if (data.account) {
          setSmtpHost(data.account.smtpHost || "");
          setSmtpPort(data.account.smtpPort?.toString() || "465");
          setFromName(data.account.fromName || "");
          setFromEmail(data.account.fromEmail || "");
          setReplyToEmail(data.account.replyToEmail || "");
          setHasPassword(data.account.hasPassword);
        }
      })
      .catch(console.error);

    fetch("/api/settings/job-api")
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setJobSettings(data.settings);
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtpHost, smtpPort, smtpUser, smtpPass, fromName, fromEmail, replyToEmail })
      });
      if (res.ok) {
        alert("SMTP Settings saved successfully!");
        setHasPassword(true);
        setSmtpPass(""); // Clear field for security
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save settings");
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/settings/smtp/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert("SMTP Connection Successful! You are ready to send emails.");
      } else {
        alert(data.error || "SMTP connection failed. Check your credentials.");
      }
    } catch (e) { console.error(e); }
    setTesting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
        <p className="text-slate-400">Configure your email provider and outreach limits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-8 rounded-2xl border border-slate-700/50 space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <Server className="text-blue-500" size={24} />
            <h3 className="text-xl font-bold text-white">SMTP Configuration</h3>
          </div>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400">SMTP Host</label>
                <input required type="text" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="e.g. smtp.gmail.com" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400">SMTP Port</label>
                <input required type="number" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="465 or 587" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">SMTP Username</label>
              <input required type="text" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="your-email@gmail.com" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400 flex justify-between">
                <span>SMTP Password / App Password</span>
                {hasPassword && <span className="text-green-400 text-xs flex items-center"><ShieldCheck size={12} className="mr-1"/> Encrypted & Saved</span>}
              </label>
              <input type="password" required={!hasPassword} value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder={hasPassword ? "••••••••••••••••" : "Enter App Password"} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400">Sender Name</label>
                <input required type="text" value={fromName} onChange={e => setFromName(e.target.value)} placeholder="John Doe" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400">Sender Email</label>
                <input required type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="john@agency.com" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button 
                type="button"
                onClick={handleTest}
                disabled={testing || !hasPassword}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg transition-colors border border-slate-600 flex items-center space-x-2"
              >
                {testing ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
                <span>{testing ? "Testing..." : "Test Connection"}</span>
              </button>
              
              <button 
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/25 flex items-center space-x-2"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Save Settings</span>
              </button>
            </div>
          </form>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400">Daily SMS Limit</label>
                <input disabled type="number" placeholder="50" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400">Delay between SMS (min)</label>
                <input disabled type="number" placeholder="2" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed outline-none" />
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
              <span className="text-slate-400 font-medium">Adzuna API Configured</span>
              <span className={`flex items-center space-x-1 ${jobSettings.adzunaConfigured ? 'text-green-400' : 'text-red-400'}`}>
                {jobSettings.adzunaConfigured ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{jobSettings.adzunaConfigured ? 'Yes' : 'No'}</span>
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
