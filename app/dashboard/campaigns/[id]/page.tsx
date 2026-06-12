"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Mail, Users, BarChart3, Settings, MessageSquare, Check, RefreshCw, Save, Send, AlertTriangle, Calendar, Clock, Edit3, BookOpen } from "lucide-react";

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  
  const [activeTab, setActiveTab] = useState("Seven-Step Sequence");
  const [loading, setLoading] = useState(true);
  const [campaignLeads, setCampaignLeads] = useState<any[]>([]);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState("");
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const fetchCampaignData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/email-sequences`);
      const data = await res.json();
      if (data.campaignLeads) {
        setCampaignLeads(data.campaignLeads);
      }
      
      const campRes = await fetch(`/api/campaigns`); // We need campaign details. Or maybe just use local state for settings
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaignData();
  }, [campaignId]);

  const handleGenerateSequences = async () => {
    const leadsWithoutEmails = campaignLeads.filter(cl => !cl.lead.emailSequences || cl.lead.emailSequences.length < 7).map(cl => cl.leadId);
    
    if (leadsWithoutEmails.length === 0) {
      return alert("All leads already have 7-step email sequences.");
    }

    setGenerating(true);
    
    const batchSize = 10;
    for (let i = 0; i < leadsWithoutEmails.length; i += batchSize) {
      const batch = leadsWithoutEmails.slice(i, i + batchSize);
      setGenProgress(`Generating 7-step sequences for leads ${i + 1} to ${Math.min(i + batchSize, leadsWithoutEmails.length)} of ${leadsWithoutEmails.length}...`);
      
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/generate-seven-step-sequence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadIds: batch })
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Generation failed for this batch.");
          break;
        }
      } catch (err: any) {
        console.error("Batch failed", err);
        alert(err.message || "Failed to generate sequence.");
        break;
      }
    }

    setGenProgress("Completed!");
    await fetchCampaignData();
    setGenerating(false);
  };

  const handleRegenerate = async (emailId: string) => {
    try {
      const res = await fetch(`/api/email-sequences/${emailId}/regenerate`, { method: "POST" });
      if (res.ok) await fetchCampaignData();
    } catch (e) { console.error(e); }
  };

  const handleSave = async (emailId: string, subject: string, body: string, delayAmount: number, delayUnit: string) => {
    try {
      const res = await fetch(`/api/email-sequences/${emailId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, delayAmount, delayUnit })
      });
      if (res.ok) alert("Saved successfully!");
    } catch (e) { console.error(e); }
  };

  const handleApprove = async (emailId: string) => {
    try {
      const res = await fetch(`/api/email-sequences/${emailId}/approve`, { method: "POST" });
      if (res.ok) await fetchCampaignData();
    } catch (e) { console.error(e); }
  };

  const handleApproveAllForLead = async (leadId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/approve-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId })
      });
      if (res.ok) await fetchCampaignData();
    } catch (e) { console.error(e); }
  };

  const tabs = ["Overview", "Leads", "Seven-Step Sequence", "Timing", "Replies", "Analytics", "Settings"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Campaign Details</h2>
          <p className="text-slate-400">Review leads, manage AI 7-step sequences, and track performance.</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-slate-800 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-500' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-purple-500" size={40} />
        </div>
      ) : activeTab === "Seven-Step Sequence" ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Mail className="text-purple-400" size={20} /> Seven-Step AI Sequences
              </h3>
              <p className="text-sm text-slate-400">AI generates a full 7-step sequence leveraging your Knowledge Base.</p>
            </div>
            <div className="flex space-x-3 items-center">
              <button 
                onClick={handleGenerateSequences} 
                disabled={generating}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shadow-lg shadow-purple-500/25 flex items-center space-x-2 disabled:opacity-50"
              >
                {generating ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                <span>{generating ? "Generating Sequences..." : "Generate Missing 7-Step Sequences"}</span>
              </button>
            </div>
          </div>

          {generating && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 text-sm font-medium animate-pulse text-center">
              {genProgress}
            </div>
          )}

          {campaignLeads.length === 0 ? (
            <div className="glass p-12 rounded-2xl border border-slate-700/50 text-center">
              <p className="text-slate-400 mb-4">No leads in this campaign yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaignLeads.map((cl, i) => {
                const lead = cl.lead;
                const emails = lead.emailSequences || [];
                const isExpanded = expandedLead === lead.id;
                const hasEmails = emails.length > 0;

                return (
                  <div key={lead.id} className="glass rounded-xl border border-slate-700/50 overflow-hidden">
                    <div 
                      className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-800/30 transition-colors"
                      onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">{lead.businessName || lead.name}</h4>
                          <div className="flex space-x-3 text-xs text-slate-400 mt-1">
                            <span>{lead.location || 'Unknown Location'}</span>
                            <span>•</span>
                            <span className="text-blue-400">Score: {lead.leadScore}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {!hasEmails ? (
                          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-400">0 / 7 Steps</span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {emails.filter((e: any) => e.approvalStatus === 'Approved').length} / {emails.length} Approved
                          </span>
                        )}
                        <button className="text-sm text-slate-400 hover:text-white px-3 py-1 rounded border border-slate-700">
                          {isExpanded ? 'Collapse' : 'Review Sequence'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-6 border-t border-slate-800 bg-slate-900/30">
                        {!hasEmails ? (
                          <div className="text-center py-10">
                            <h3 className="text-lg text-white mb-2">No 7-step sequence generated yet.</h3>
                            <p className="text-slate-400 text-sm">Click the "Generate Missing 7-Step Sequences" button.</p>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                              <h4 className="text-white font-bold">Email Steps ({emails.length})</h4>
                              <button onClick={() => handleApproveAllForLead(lead.id)} className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded transition-colors flex items-center space-x-1">
                                <Check size={14} /> <span>Approve All for Lead</span>
                              </button>
                            </div>
                            
                            {emails.sort((a: any, b: any) => a.sequenceStep - b.sequenceStep).map((email: any, idx: number) => (
                              <EmailEditorBlock 
                                key={email.id} 
                                email={email} 
                                onSave={handleSave} 
                                onApprove={handleApprove} 
                                onRegenerate={handleRegenerate}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === "Timing" ? (
         <div className="space-y-6">
            <div className="glass p-8 rounded-2xl border border-slate-700/50">
               <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Clock className="text-purple-400" /> AI Recommended Timing</h3>
               <p className="text-slate-400 text-sm mb-6">
                 AI recommends email timing using campaign settings, recipient time zone, and engagement history. Recommendations do not guarantee replies or bookings.
               </p>

               <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                 <h4 className="text-white font-bold mb-4">Upcoming Scheduled Deliveries</h4>
                 <div className="space-y-3">
                   {/* We would map through scheduled emails here */}
                   <p className="text-slate-500 text-sm italic">All emails are currently waiting for human approval before entering the scheduler queue.</p>
                 </div>
               </div>
            </div>
         </div>
      ) : activeTab === "Settings" ? (
         <div className="space-y-6">
            <div className="glass p-8 rounded-2xl border border-slate-700/50">
               <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Settings className="text-slate-400" /> Follow-Up & Call Booking Settings</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                   <h4 className="text-white font-semibold">Timing Strategy</h4>
                   <label className="block text-sm text-slate-400">Timing Mode</label>
                   <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                     <option>AI Recommended Timing</option>
                     <option>Custom Timing</option>
                     <option>Fixed Template</option>
                   </select>

                   <label className="block text-sm text-slate-400">B2B Sending Window</label>
                   <div className="flex gap-2">
                     <input type="time" defaultValue="09:00" className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
                     <input type="time" defaultValue="16:00" className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
                   </div>
                 </div>

                 <div className="space-y-4">
                   <h4 className="text-white font-semibold">AI Automation Modes</h4>
                   <label className="block text-sm text-slate-400">Email Approval Rule</label>
                   <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                     <option>Require Human Approval (Default)</option>
                     <option>Auto-approve AI Emails</option>
                   </select>

                   <label className="block text-sm text-slate-400">Booking Automation</label>
                   <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                     <option>Manual Booking</option>
                     <option>AI Suggests Slots in Reply</option>
                     <option>AI Auto-Books Calendar</option>
                   </select>
                 </div>
               </div>
            </div>
         </div>
      ) : (
        <div className="glass p-12 rounded-2xl border border-slate-700/50 text-center min-h-[50vh] flex items-center justify-center">
          <p className="text-slate-400 text-lg">{activeTab} tab is under construction.</p>
        </div>
      )}
    </div>
  );
}

function EmailEditorBlock({ email, onSave, onApprove, onRegenerate }: { email: any, onSave: any, onApprove: any, onRegenerate: any }) {
  const [subject, setSubject] = useState(email.subject || '');
  const [body, setBody] = useState(email.body || '');
  const [delayAmount, setDelayAmount] = useState(email.delayAmount || 0);
  const [delayUnit, setDelayUnit] = useState(email.delayUnit || 'business_days');

  const isApproved = email.approvalStatus === "Approved";
  
  const kbSources = email.knowledgeBaseSources ? JSON.parse(email.knowledgeBaseSources) : [];

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
      <div className="bg-slate-800/80 px-4 py-3 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <span className="w-6 h-6 rounded bg-purple-600 text-white flex items-center justify-center text-xs font-bold">{email.sequenceStep}</span>
          <span className="text-white font-medium">{email.name || `Step ${email.sequenceStep}`}</span>
          
          <div className="flex items-center space-x-1 ml-4 bg-slate-900 p-1 rounded border border-slate-700">
            <Clock size={12} className="text-slate-400 ml-1" />
            <input 
              type="number" 
              value={delayAmount} 
              onChange={e => setDelayAmount(parseInt(e.target.value))} 
              className="w-12 bg-transparent text-white text-xs border-none outline-none text-right"
              disabled={isApproved}
            />
            <select 
              value={delayUnit} 
              onChange={e => setDelayUnit(e.target.value)} 
              className="bg-transparent text-white text-xs border-none outline-none mr-1"
              disabled={isApproved}
            >
              <option value="hours">Hours</option>
              <option value="business_days">Business Days</option>
              <option value="calendar_days">Calendar Days</option>
              <option value="weeks">Weeks</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isApproved ? (
             <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30 flex items-center space-x-1">
               <Check size={12} /> <span>Approved</span>
             </span>
          ) : (
             <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/30">
               Pending Approval
             </span>
          )}
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        {email.timingReason && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 text-xs text-blue-300 flex items-start gap-2">
            <Calendar size={14} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold block mb-0.5">AI Schedule Recommendation (Estimated: {new Date(email.scheduledAt || email.recommendedSendAt).toLocaleString()})</span>
              {email.timingReason}
            </div>
          </div>
        )}
        
        {kbSources.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <BookOpen size={12} /> Knowledge Base Applied: {kbSources.join(', ')}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Subject</label>
          <input 
            type="text" 
            value={subject} 
            onChange={e => setSubject(e.target.value)}
            disabled={isApproved}
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-sm focus:border-purple-500 outline-none disabled:opacity-50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Body</label>
          <textarea 
            value={body} 
            onChange={e => setBody(e.target.value)}
            disabled={isApproved}
            rows={7}
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-sm focus:border-purple-500 outline-none disabled:opacity-50"
          />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            {!isApproved && (
               <>
                 <button onClick={() => onRegenerate(email.id)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded transition-colors flex items-center space-x-1 border border-slate-700">
                   <RefreshCw size={12} /> <span>Regenerate</span>
                 </button>
                 <button className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded transition-colors flex items-center space-x-1 border border-slate-700">
                   <Edit3 size={12} /> <span>Make Shorter</span>
                 </button>
               </>
            )}
          </div>
          
          <div className="flex space-x-2">
            {!isApproved && (
              <>
                <button onClick={() => onSave(email.id, subject, body, delayAmount, delayUnit)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded transition-colors flex items-center space-x-1 border border-slate-700">
                  <Save size={14} /> <span>Save Draft</span>
                </button>
                <button onClick={() => onApprove(email.id)} className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-green-500/20 flex items-center gap-1">
                  <Check size={14} /> Approve
                </button>
              </>
            )}
            <button disabled={!isApproved} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded transition-colors flex items-center space-x-1">
              <Send size={14} /> <span>Send Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
