"use client";
import { useState, useEffect } from "react";
import { Search, Filter, Download, Plus, Trash2, Loader2, Users } from "lucide-react";

export default function LeadDatabasePage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch("/api/leads");
        const data = await res.json();
        if (data.leads) {
          setLeads(data.leads.map((l: any) => ({
            id: l.id,
            name: l.businessName,
            phone: l.phone,
            website: l.website,
            score: l.leadScore || 0,
            tier: l.leadTier || "Cold",
            status: "New",
            created: new Date(l.createdAt).toLocaleDateString()
          })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Client Lead Database</h2>
          <p className="text-slate-400">View and manage all generated client leads across recruitment campaigns.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/25">
            <Plus size={16} />
            <span>Add to Campaign</span>
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 w-80">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, website, phone..." 
              className="bg-transparent border-none outline-none ml-2 w-full text-sm text-white placeholder-slate-500"
            />
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center space-x-2 px-3 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors text-sm">
              <Filter size={16} />
              <span>Filter: All Tiers</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors text-sm">
              <Filter size={16} />
              <span>Filter: All Status</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input type="checkbox" className="rounded border-slate-700 bg-slate-900" />
                </th>
                <th className="px-6 py-4 font-medium">Business Name</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Score / Tier</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date Added</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-800/50 text-slate-500 flex items-center justify-center rounded-full mb-4">
                        <Users size={32} />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">No client leads found yet</h3>
                      <p className="text-slate-400 max-w-sm">
                        Start by using Find Client Leads to generate your first list.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-slate-700 bg-slate-900" />
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{lead.name}</td>
                    <td className="px-6 py-4">
                      <div>{lead.phone}</div>
                      <div className="text-xs text-slate-500">{lead.website || 'No website'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-blue-400">{lead.score}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                          lead.tier === 'Hot' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          lead.tier === 'Warm' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {lead.tier}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium ${
                        lead.status === 'Call Booked' ? 'text-green-400' :
                        lead.status === 'Not Interested' ? 'text-red-400' :
                        lead.status === 'Added to Campaign' ? 'text-purple-400' :
                        'text-slate-400'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{lead.created}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-500 hover:text-red-400 transition-colors p-1">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {leads.length > 0 && !loading && (
          <div className="p-4 border-t border-slate-800 flex justify-between items-center text-sm text-slate-500">
            <div>Showing 1 to {leads.length} of {leads.length} entries</div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-slate-700 rounded hover:bg-slate-800 disabled:opacity-50">Prev</button>
              <button className="px-3 py-1 border border-slate-700 rounded hover:bg-slate-800 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
