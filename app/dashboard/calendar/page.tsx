import { Calendar, Video, Clock, Power, ShieldAlert } from "lucide-react";

export default function CalendarPlaceholder() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-2">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <Calendar className="text-blue-400" size={24} />
        </div>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">Calendar & Scheduling</h1>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20">
              This feature is planned
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">Automate meeting bookings directly from your AI email campaigns.</p>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-slate-800 bg-blue-500/5">
        <p className="text-blue-300/80 text-sm font-medium flex items-center">
          <Power size={16} className="mr-2" />
          When clients reply to your email campaigns expressing interest, the AI agent will automatically provide your scheduling link to book discovery or screening calls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Google Calendar</h3>
              <p className="text-slate-400 text-sm">Sync your availability and events.</p>
            </div>
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
              <Calendar size={18} className="text-slate-400" />
            </div>
          </div>
          
          <button disabled className="w-full bg-slate-800 text-slate-500 px-6 py-3 rounded-xl font-medium cursor-not-allowed flex items-center justify-center space-x-2">
            <span>Connect Google Calendar</span>
            <ShieldAlert size={16} />
          </button>
        </div>

        <div className="glass p-8 rounded-2xl border border-slate-800 space-y-6 opacity-75">
          <h3 className="text-lg font-bold text-white mb-4">Availability Settings</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Meeting Duration</label>
              <select disabled className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed appearance-none">
                <option>15 Minutes</option>
                <option>30 Minutes (Discovery Call)</option>
                <option>45 Minutes</option>
                <option>60 Minutes (Deep Dive)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Working Hours</label>
              <div className="flex space-x-2">
                <select disabled className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed appearance-none">
                  <option>09:00 AM</option>
                </select>
                <span className="flex items-center text-slate-500">to</span>
                <select disabled className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed appearance-none">
                  <option>05:00 PM</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-800">
              <div className="flex items-center space-x-3 text-slate-400">
                <Video size={18} />
                <span className="text-sm font-medium">Add Google Meet link</span>
              </div>
              <div className="w-10 h-6 bg-slate-800 rounded-full relative opacity-50">
                <div className="absolute left-1 top-1 w-4 h-4 bg-slate-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
