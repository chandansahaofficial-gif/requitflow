"use client";
import { useState } from "react";
import { Search, Calendar, ExternalLink } from "lucide-react";

export default function BookedCallsPage() {
  const [calls] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Booked Discovery & Screening Calls</h2>
          <p className="text-slate-400">Track all client discovery and candidate screening calls booked through AI campaigns.</p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 w-80">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search booked calls..." 
              className="bg-transparent border-none outline-none ml-2 w-full text-sm text-white placeholder-slate-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Client/Candidate Details</th>
                <th className="px-6 py-4 font-medium">Campaign Source</th>
                <th className="px-6 py-4 font-medium">Call Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-800/50 text-slate-500 flex items-center justify-center rounded-full mb-4">
                        <Calendar size={32} />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">No booked calls</h3>
                      <p className="text-slate-400 max-w-sm">
                        No discovery or screening calls booked yet.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{call.lead}</div>
                      <div className="text-xs text-slate-500">{call.email} • {call.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{call.campaign}</td>
                    <td className="px-6 py-4 text-blue-400 flex items-center space-x-2 mt-2">
                      <Calendar size={14} />
                      <span>{call.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-400 text-xs font-medium uppercase">{call.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors flex items-center space-x-2 ml-auto">
                        <ExternalLink size={14} />
                        <span className="text-xs">View CRM</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
