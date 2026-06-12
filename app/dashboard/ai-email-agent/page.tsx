"use client";
import { useState, useEffect } from "react";
import { Search, Mail, Sparkles, Check, X, RefreshCw, Loader2, Plus, Play, Pause, Trash2, Edit2, Target, Eye, FileText, Filter } from "lucide-react";
import Link from "next/link";

export default function AIEmailAgentPage() {
  const [activeTab, setActiveTab] = useState<"hub" | "pending">("hub");

  // Campaign Hub State
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [fetchingCampaigns, setFetchingCampaigns] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("All");

  const defaultCampaign = {
    name: "", campaignType: "Client Outreach", targetAudience: "", industry: "",
    offer: "", goal: "", tone: "Professional", language: "English", ctaType: "Book Discovery Call",
    ctaLink: "", senderName: "", agencyName: "", emailSignature: "", sendingMode: "Human Approval Mode"
  };
  const [newCampaign, setNewCampaign] = useState(defaultCampaign);

  // Pending Emails State
  const [pendingEmails, setPendingEmails] = useState<any[]>([]);
  const [fetchingEmails, setFetchingEmails] = useState(true);
  const [emailSearch, setEmailSearch] = useState("");
  const [emailFilter, setEmailFilter] = useState("All");

  const fetchCampaigns = async () => {
    setFetchingCampaigns(true);
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (data.campaigns) setCampaigns(data.campaigns);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingCampaigns(false);
    }
  };

  const fetchPendingEmails = async () => {
    setFetchingEmails(true);
    try {
      const res = await fetch("/api/email-sequences/pending-review");
      const data = await res.json();
      if (data.pendingEmails) setPendingEmails(data.pendingEmails);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingEmails(false);
    }
  };

  useEffect(() => {
    if (activeTab === "hub") fetchCampaigns();
    else fetchPendingEmails();
  }, [activeTab]);

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name) return;
    setCreating(true);
    try {
      const url = editingCampaignId ? `/api/campaigns/${editingCampaignId}` : "/api/campaigns";
      const method = editingCampaignId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCampaign),
      });
      if (res.ok) {
        setShowModal(false);
        setNewCampaign(defaultCampaign);
        setEditingCampaignId(null);
        fetchCampaigns();
      } else {
        alert("Failed to save campaign.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const deleteCampaign = async (id: string, emailsSent: number) => {
    if (emailsSent > 0) {
      if (!confirm("This campaign has sent emails. Deleting it may remove campaign history. Are you sure?")) return;
    } else {
      if (!confirm("Are you sure you want to delete this campaign?")) return;
    }
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateEmails = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/generate-email-sequence`, { method: "POST" });
      const data = await res.json();
      if (res.ok) alert(data.message || "Emails generated successfully!");
      else alert(data.error || "Failed to generate emails.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveEmail = async (id: string) => {
    try {
      const res = await fetch("/api/email/send-one", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequenceId: id })
      });
      if (res.ok) fetchPendingEmails();
      else alert("Failed to send/approve email.");
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (campaignFilter !== "All" && c.status !== campaignFilter) return false;
    if (campaignSearch) {
      const term = campaignSearch.toLowerCase();
      return (c.name?.toLowerCase().includes(term) || c.targetAudience?.toLowerCase().includes(term) || c.campaignType?.toLowerCase().includes(term));
    }
    return true;
  });

  const filteredEmails = pendingEmails.filter(e => {
    if (emailFilter !== "All" && e.approvalStatus !== emailFilter) return false;
    if (emailSearch) {
      const term = emailSearch.toLowerCase();
      return (e.campaign?.name?.toLowerCase().includes(term) || e.lead?.businessName?.toLowerCase().includes(term) || e.subject?.toLowerCase().includes(term));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">AI Email Agent</h2>
          <p className="text-slate-400 max-w-2xl">Create recruitment campaigns, generate personalized email sequences, review AI drafts, and manage replies from one place.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setActiveTab("hub")} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700">
            View All Campaigns
          </button>
          <button onClick={() => { setShowModal(true); setNewCampaign(defaultCampaign); setEditingCampaignId(null); }} className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/25">
            <Plus size={18} />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-800">
        <button onClick={() => setActiveTab("hub")} className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === "hub" ? "border-purple-500 text-purple-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}>
          Campaign Hub
        </button>
        <button onClick={() => setActiveTab("pending")} className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === "pending" ? "border-purple-500 text-purple-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}>
          Pending Email Reviews
        </button>
      </div>

      {/* Campaign Hub Tab */}
      {activeTab === "hub" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 w-full md:w-80">
              <Search size={16} className="text-slate-400" />
              <input type="text" value={campaignSearch} onChange={(e) => setCampaignSearch(e.target.value)} placeholder="Search campaigns..." className="bg-transparent border-none outline-none ml-2 w-full text-sm text-white placeholder-slate-500" />
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto">
              {["All", "Draft", "Active", "Paused", "Completed"].map(filter => (
                <button key={filter} onClick={() => setCampaignFilter(filter)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${campaignFilter === filter ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Campaign</th>
                    <th className="px-6 py-4 font-medium">Audience / Offer</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Performance</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {fetchingCampaigns ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-32 mb-2"></div><div className="h-3 bg-slate-800 rounded w-20"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-24 mb-2"></div><div className="h-3 bg-slate-800 rounded w-32"></div></td>
                        <td className="px-6 py-4"><div className="h-6 bg-slate-800 rounded-full w-16"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-full"></div></td>
                        <td className="px-6 py-4"><div className="h-8 bg-slate-800 rounded w-full"></div></td>
                      </tr>
                    ))
                  ) : filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-slate-800/50 text-slate-500 flex items-center justify-center rounded-full mb-4"><Target size={32} /></div>
                          <h3 className="text-lg font-medium text-white mb-2">No recruitment campaigns yet</h3>
                          <p className="text-slate-400 max-w-sm mb-6">Create your first AI-powered recruitment campaign to generate personalized email sequences.</p>
                          <button onClick={() => { setShowModal(true); setNewCampaign(defaultCampaign); setEditingCampaignId(null); }} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
                            Create Campaign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white mb-1">{camp.name}</div>
                          <div className="text-xs text-slate-500 flex items-center space-x-1">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">{camp.campaignType || "Outreach"}</span>
                            <span>• {new Date(camp.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-300">{camp.targetAudience || "General"}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">{camp.offer || "No specific offer"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            camp.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            camp.status === 'Paused' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            camp.status === 'Archived' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {camp.status || "Draft"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-4 text-xs">
                            <div className="flex flex-col"><span className="text-slate-500">Leads</span><span className="font-medium text-white">{camp._count?.leads || 0}</span></div>
                            <div className="flex flex-col"><span className="text-slate-500">Emails</span><span className="font-medium text-white">{camp._count?.emailSequences || 0}</span></div>
                            <div className="flex flex-col"><span className="text-slate-500">Replies</span><span className="font-medium text-white">{camp._count?.replies || 0}</span></div>
                            <div className="flex flex-col"><span className="text-green-500">Booked</span><span className="font-medium text-green-400">{camp._count?.bookedCalls || 0}</span></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            {camp.status !== 'Active' ? (
                              <button onClick={() => updateStatus(camp.id, 'Active')} className="p-1.5 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20" title="Resume/Start"><Play size={16} /></button>
                            ) : (
                              <button onClick={() => updateStatus(camp.id, 'Paused')} className="p-1.5 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20" title="Pause"><Pause size={16} /></button>
                            )}
                            <button onClick={() => handleGenerateEmails(camp.id)} className="p-1.5 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 flex items-center space-x-1" title="Generate Emails"><Sparkles size={16} /></button>
                            <Link href={`/dashboard/campaigns/${camp.id}`} className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20" title="Open Sequence"><FileText size={16} /></Link>
                            <button onClick={() => { setNewCampaign(camp); setEditingCampaignId(camp.id); setShowModal(true); }} className="p-1.5 bg-slate-800 text-slate-400 rounded hover:bg-slate-700" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={() => deleteCampaign(camp.id, camp._count?.emailSequences || 0)} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20" title="Delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pending Email Reviews Tab */}
      {activeTab === "pending" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 w-full md:w-80">
              <Search size={16} className="text-slate-400" />
              <input type="text" value={emailSearch} onChange={(e) => setEmailSearch(e.target.value)} placeholder="Search pending emails..." className="bg-transparent border-none outline-none ml-2 w-full text-sm text-white placeholder-slate-500" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">Filters:</span>
              {["All", "Pending", "Approved", "Draft", "Failed"].map(filter => (
                <button key={filter} onClick={() => setEmailFilter(filter)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${emailFilter === filter ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Business / Campaign</th>
                    <th className="px-6 py-4 font-medium">Email Preview</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {fetchingEmails ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-24 mb-2"></div><div className="h-3 bg-slate-800 rounded w-16"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-800 rounded w-full"></div></td>
                        <td className="px-6 py-4"><div className="h-6 bg-slate-800 rounded-full w-16"></div></td>
                        <td className="px-6 py-4"><div className="h-8 bg-slate-800 rounded w-full"></div></td>
                      </tr>
                    ))
                  ) : filteredEmails.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-slate-800/50 text-slate-500 flex items-center justify-center rounded-full mb-4"><Mail size={32} /></div>
                          <h3 className="text-lg font-medium text-white mb-2">No pending email reviews</h3>
                          <p className="text-slate-400 max-w-sm mb-6">Once AI generates campaign emails, pending drafts will appear here for human approval.</p>
                          <button onClick={() => setActiveTab("hub")} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg transition-colors">
                            View Campaigns
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEmails.map((email) => (
                      <tr key={email.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">{email.lead?.businessName || "Unknown"}</div>
                          <div className="text-xs text-slate-500">{email.campaign?.name || "Unknown"}</div>
                        </td>
                        <td className="px-6 py-4 max-w-xl">
                          <div className="font-semibold text-slate-200 mb-1">{email.subject}</div>
                          <div className="text-xs text-slate-400 line-clamp-2">{email.previewText || email.body}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            {email.approvalStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button className="p-1.5 bg-slate-800 text-slate-400 rounded hover:bg-slate-700" title="Review"><Eye size={16} /></button>
                            <button className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={() => handleApproveEmail(email.id)} className="p-1.5 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 flex items-center space-x-1" title="Approve">
                              <Check size={16} /> <span>Approve</span>
                            </button>
                            <Link href={`/dashboard/campaigns/${email.campaign?.id}`} className="p-1.5 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20" title="Open Sequence"><FileText size={16} /></Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass bg-slate-900 border border-slate-700/50 p-6 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{editingCampaignId ? "Edit Recruitment Campaign" : "Create Recruitment Campaign"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveCampaign} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Campaign Name</label>
                  <input type="text" required value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="e.g. Senior Tech Roles" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Campaign Type</label>
                  <select value={newCampaign.campaignType} onChange={e => setNewCampaign({...newCampaign, campaignType: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    {["Client Outreach", "Hiring Company Outreach", "Candidate Outreach", "Staffing Outreach", "Executive Search Outreach", "HR Consultancy Outreach", "Re-Engagement"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Target Audience</label>
                  <input type="text" value={newCampaign.targetAudience} onChange={e => setNewCampaign({...newCampaign, targetAudience: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="e.g. CTOs in Fintech" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Industry / Niche</label>
                  <input type="text" value={newCampaign.industry} onChange={e => setNewCampaign({...newCampaign, industry: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="e.g. Fintech, Healthcare" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Recruitment Service / Offer</label>
                  <input type="text" value={newCampaign.offer} onChange={e => setNewCampaign({...newCampaign, offer: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="e.g. 15% flat fee, exclusive senior candidates" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Tone</label>
                  <select value={newCampaign.tone} onChange={e => setNewCampaign({...newCampaign, tone: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    {["Friendly", "Professional", "Direct", "Premium", "Casual"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">CTA Type</label>
                  <select value={newCampaign.ctaType} onChange={e => setNewCampaign({...newCampaign, ctaType: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    {["Book Discovery Call", "Reply", "Candidate Screening Call", "Ask Hiring Need", "Share Candidate Requirement"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">CTA / Calendar Link</label>
                  <input type="url" value={newCampaign.ctaLink} onChange={e => setNewCampaign({...newCampaign, ctaLink: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="https://calendly.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Sending Mode</label>
                  <select value={newCampaign.sendingMode} onChange={e => setNewCampaign({...newCampaign, sendingMode: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    {["Human Approval Mode", "AI Auto-Send Mode"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center space-x-2">
                  {creating && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingCampaignId ? "Save Changes" : "Create Campaign"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
