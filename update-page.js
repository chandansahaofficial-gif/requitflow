const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/dashboard/companies-hiring/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the "Refresh Job Data" and "Sync Job Data" buttons in the header
content = content.replace(
  /<div className="flex gap-3">\s*<button onClick=\{\(\) => setIsApifySyncModalOpen\(true\)\}[\s\S]*?<RefreshCw size=\{16\} \/> Refresh Hiring Data\s*<\/button>\s*<Link href="\/dashboard\/job-search"/,
  `<div className="flex gap-3">
          <Link href="/dashboard/job-search"`
);

// 2. Insert the Top Sync Panel
const syncPanel = `
      {/* Top Sync Panel */}
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <RefreshCw size={20} className="text-green-500" /> Sync Job Data
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Source</label>
            <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={apifySource} onChange={(e) => setApifySource(e.target.value)}>
              <option value="linkedin">LinkedIn Jobs</option>
              <option value="indeed">Indeed Jobs</option>
              <option value="google_jobs">Google Jobs</option>
              <option value="remote_jobs">Remote Jobs</option>
              <option value="world_jobs">World Jobs</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Keyword</label>
            <input type="text" placeholder="e.g. Software Developer" className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={apifyKeyword} onChange={(e) => setApifyKeyword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Location</label>
            <input type="text" placeholder="e.g. India, United States, Worldwide" className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={apifyLocation} onChange={(e) => setApifyLocation(e.target.value)} />
          </div>
          <div className="flex gap-2 col-span-1 md:col-span-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-400 mb-1">Country</label>
              <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={apifyCountry} onChange={(e) => setApifyCountry(e.target.value)}>
                <option value="Worldwide">Worldwide</option>
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="UAE">UAE</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-400 mb-1">Max Results</label>
              <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={apifyMaxResults} onChange={(e) => setApifyMaxResults(e.target.value)}>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
              </select>
            </div>
          </div>
          <div className="md:col-span-5 flex justify-between items-center mt-2">
             <div className="text-sm">
                {apifySyncResult && (
                  <span className={apifySyncResult.success ? 'text-green-400' : 'text-red-400'}>
                    {apifySyncResult.success ? \`\${apifySyncResult.jobsFound} jobs found, \${apifySyncResult.companiesUpdated + apifySyncResult.companiesCreated} hiring companies updated.\` : (apifySyncResult.message || apifySyncResult.error || 'Apify is not connected. Add APIFY_API_TOKEN in environment variables.')}
                  </span>
                )}
             </div>
             <button onClick={handleApifySync} disabled={isApifySyncing} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
               {isApifySyncing ? <span className="animate-spin text-white">⏳</span> : <RefreshCw size={16} />}
               {isApifySyncing ? 'Fetching job data...' : 'Refresh Job Data'}
             </button>
          </div>
        </div>
      </div>
`;

content = content.replace(
  /\{\/\* Notice Area \*\/\}/,
  syncPanel + '\n\n      {/* Notice Area */}'
);

// 3. Remove "Jooble" mentions
content = content.replace(/connected providers \(Jooble\/Adzuna\)/g, 'connected providers');
content = content.replace(/Jooble\/Adzuna/g, '');
content = content.replace(/providers \(Jooble\)/g, 'providers');

// 4. Remove old refresh modal and Apify Sync modal code
content = content.replace(/\{\/\* Refresh Modal \*\/\}[\s\S]*?\{\/\* View Jobs Drawer \*\/\}/, '{/* View Jobs Drawer */}');
content = content.replace(/\{\/\* Sync Modal \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\)\}\s*<\/div>/, '</div>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated page.tsx');
