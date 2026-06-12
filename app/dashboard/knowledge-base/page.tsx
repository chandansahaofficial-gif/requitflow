import { BookOpen, UploadCloud, FileText, BrainCircuit } from "lucide-react";

export default function KnowledgeBasePlaceholder() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-2">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <BookOpen className="text-blue-400" size={24} />
        </div>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">Agency Knowledge Base</h1>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20">
              This feature is planned
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">Train your AI agent with your recruitment agency's unique value proposition.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass p-8 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-4">Upload Documents</h3>
          
          <div className="border-2 border-dashed border-slate-700/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-slate-900/20 hover:bg-slate-900/40 transition-all">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 flex items-center justify-center rounded-full mb-4">
              <UploadCloud size={32} />
            </div>
            <h4 className="text-white font-medium text-lg mb-2">Click to upload or drag and drop</h4>
            <p className="text-slate-400 text-sm max-w-sm mb-6">
              Supported formats: PDF, DOCX, TXT, CSV, Markdown
              <br />
              Maximum size: 30 MB per file
            </p>
            <button disabled className="bg-slate-800 text-slate-500 px-6 py-2.5 rounded-xl font-medium cursor-not-allowed">
              Browse Files
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-slate-800 bg-blue-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit size={64} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center">
              <BrainCircuit size={20} className="text-blue-400 mr-2" />
              How AI uses this
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed relative z-10">
              The AI Email Agent will use your uploaded documents to improve email sequences. By learning your agency offers, case studies, FAQs, common objections, and specific tone of voice, the AI writes highly personalized and convincing outreach emails automatically.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-slate-500">Recommended Uploads</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-slate-400">
                <FileText size={16} className="text-blue-400/70 mr-3" />
                Case Studies & Testimonials
              </li>
              <li className="flex items-center text-sm text-slate-400">
                <FileText size={16} className="text-purple-400/70 mr-3" />
                Service Agreements & Terms
              </li>
              <li className="flex items-center text-sm text-slate-400">
                <FileText size={16} className="text-pink-400/70 mr-3" />
                Objection Handling Scripts
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
