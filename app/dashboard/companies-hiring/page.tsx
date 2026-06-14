"use client";
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { 
  Building2, MapPin, Briefcase, Calendar, Info, Activity, TrendingUp, AlertCircle, 
  ArrowRight, Eye, PlusCircle, Search, Filter, X, LayoutGrid, List, MoreVertical, 
  Trash2, Download, UserPlus, FileText, CheckSquare, Square, Inbox, RefreshCw, 
  Save, Bookmark, ExternalLink
} from 'lucide-react';

function CompaniesHiringContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL State
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const country = searchParams.get('country') || '';
  const city = searchParams.get('city') || '';
  const region = searchParams.get('region') || '';
  const jobTitle = searchParams.get('jobTitle') || '';
  const skill = searchParams.get('skill') || '';
  const workMode = searchParams.get('workMode') || '';
  const jobType = searchParams.get('jobType') || '';
  const hiringActivity = searchParams.get('hiringActivity') || '';
  const hiringDemand = searchParams.get('hiringDemand') || '';
  const postedWithin = searchParams.get('postedWithin') || '';
  const minActiveJobPosts = searchParams.get('minActiveJobPosts') || '';
  const maxActiveJobPosts = searchParams.get('maxActiveJobPosts') || '';
  const provider = searchParams.get('provider') || '';
  const hasWebsite = searchParams.get('hasWebsite') || '';
  const exactVacanciesDisclosed = searchParams.get('exactVacanciesDisclosed') || '';
  const companyStatus = searchParams.get('companyStatus') || 'Active';
  const addedToLeads = searchParams.get('addedToLeads') || '';
  const addedToCampaign = searchParams.get('addedToCampaign') || '';
  
  const sort = searchParams.get('sort') || 'most-active';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);
  const viewMode = searchParams.get('viewMode') || 'card';
  const activeTab = searchParams.get('tab') || 'companies'; // 'companies' or 'category-breakdown'

  // Local UI State
  const [searchInput, setSearchInput] = useState(q);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isApifySyncModalOpen, setIsApifySyncModalOpen] = useState(false);
  const [apifySource, setApifySource] = useState('all');
  const [apifyKeyword, setApifyKeyword] = useState('');
  const [apifyLocation, setApifyLocation] = useState('');
  const [apifyCountry, setApifyCountry] = useState('Worldwide');
  const [apifyMaxResults, setApifyMaxResults] = useState('25');
  const [isApifySyncing, setIsApifySyncing] = useState(false);
  const [apifySyncResult, setApifySyncResult] = useState<any>(null);
  const [apifyConnectionStatus, setApifyConnectionStatus] = useState<any>(null);
  
  // Data State
  const [companies, setCompanies] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [pagination, setPagination] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Auxiliary Data
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);

  // Action State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionProgress, setActionProgress] = useState<string | null>(null);
  const [targetCompanyForCampaign, setTargetCompanyForCampaign] = useState<string | null>(null);
  const [selectedCompanyIdForDrawer, setSelectedCompanyIdForDrawer] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<any>(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== q) updateUrlParams({ q: searchInput, page: '1' });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, q]);

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qs = searchParams.toString();
      const [res, apifyStatusRes] = await Promise.all([
        fetch(`/api/companies-hiring?${qs}&includeCategoryBreakdown=true`, { credentials: 'include' }),
        fetch('/api/companies-hiring/sync-apify', { credentials: 'include' })
      ]);

      if (apifyStatusRes.ok) {
        const apifyData = await apifyStatusRes.json();
        setApifyConnectionStatus(apifyData);
      }

      if (!res.ok) {
        if (res.status === 401) throw new Error('Your session has expired. Please log in again.');
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Company hiring data could not be loaded.');
      }
      const data = await res.json();
      setCompanies(data.companies || []);
      setSummary(data.summary || {});
      setPagination(data.pagination || {});
      setCategoryBreakdown(data.categoryCounts || []);
    } catch (err: any) {
      setError(err.message || 'Company hiring data could not be loaded. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPresets = async () => {
    try {
      const res = await fetch('/api/company-filter-presets');
      if (res.ok) setPresets(await res.json());
    } catch (e) {}
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) setCampaigns(await res.json());
    } catch (e) {}
  };

  const updateUrlParams = useCallback((newParams: Record<string, string | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') current.delete(key);
      else current.set(key, value);
    });
    router.push(`${pathname}?${current.toString()}`);
  }, [searchParams, router, pathname]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === companies.length && companies.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(companies.map(c => c.id)));
  };

  const openViewJobsDrawer = async (companyId: string) => {
    setSelectedCompanyIdForDrawer(companyId);
    setIsDrawerLoading(true);
    try {
      const res = await fetch(`/api/companies-hiring/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setDrawerData(data.company);
      }
    } catch (e) {
    } finally {
      setIsDrawerLoading(false);
    }
  };

  // --- ACTIONS ---
  
  const handleArchiveCompany = async (id: string) => {
    if (!confirm("This company will be removed from the active Companies Hiring view. Existing jobs, client leads, campaign history, saved jobs, applications, and analytics will remain unchanged.")) return;
    try {
      await fetch(`/api/companies-hiring/${id}`, { method: 'DELETE', body: JSON.stringify({ archiveReason: 'Archived by user' }) });
      fetchData();
    } catch (e) {}
  };

  const handleRestoreCompany = async (id: string) => {
    try {
      await fetch(`/api/companies-hiring/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'restore' }) });
      fetchData();
    } catch (e) {}
  };

  const handleBulkArchive = async () => {
    if (!confirm(`Are you sure you want to archive ${selectedIds.size} companies?`)) return;
    try {
      setActionProgress(`Archiving ${selectedIds.size} companies...`);
      await fetch(`/api/companies-hiring/bulk-archive`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyIds: Array.from(selectedIds) }) });
      setSelectedIds(new Set());
      fetchData();
    } catch (e) {} finally { setActionProgress(null); }
  };

  const handleBulkRestore = async () => {
    try {
      setActionProgress(`Restoring ${selectedIds.size} companies...`);
      await fetch(`/api/companies-hiring/bulk-restore`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyIds: Array.from(selectedIds) }) });
      setSelectedIds(new Set());
      fetchData();
    } catch (e) {} finally { setActionProgress(null); }
  };

  const handleApifySync = async () => {
    if (!apifyKeyword.trim()) {
      alert('Keyword is required');
      return;
    }
    setIsApifySyncing(true);
    setApifySyncResult(null);
    try {
      const res = await fetch('/api/companies-hiring/sync-apify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: apifySource,
          keyword: apifyKeyword,
          location: apifyLocation,
          country: apifyCountry,
          maxResults: apifyMaxResults
        })
      });
      const data = await res.json();
      setApifySyncResult(data);
      if (data.success) {
        fetchData();
      }
    } catch (e: any) {
      setApifySyncResult({ success: false, message: e.message || 'Sync failed.' });
    } finally {
      setIsApifySyncing(false);
    }
  };

  const handleAddToLead = async (id: string) => {
    try {
      setActionProgress('Adding to Client Leads...');
      const res = await fetch(`/api/companies-hiring/${id}/add-to-leads`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'Already Exists') alert('Company is already in Client Leads and was updated.');
      else if (data.status === 'Added') alert('Company added to Client Leads successfully.');
      fetchData();
    } catch (e) {
      alert('Failed to add to Leads.');
    } finally {
      setActionProgress(null);
    }
  };

  const handleBulkAddToLeads = async () => {
    setActionProgress(`Adding ${selectedIds.size} companies to Client Leads...`);
    let added = 0, updated = 0, failed = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        const res = await fetch(`/api/companies-hiring/${id}/add-to-leads`, { method: 'POST' });
        const data = await res.json();
        if (data.status === 'Already Exists') updated++;
        else if (data.status === 'Added') added++;
        else failed++;
      } catch (e) { failed++; }
    }
    alert(`${selectedIds.size} companies processed: ${added} added, ${updated} already existed, ${failed} failed.`);
    setSelectedIds(new Set());
    setActionProgress(null);
    fetchData();
  };

  const handleOpenCampaignModal = (id?: string) => {
    if (campaigns.length === 0) fetchCampaigns();
    setTargetCompanyForCampaign(id || null);
    setIsCampaignModalOpen(true);
  };

  const handleAddToCampaign = async (campaignId: string) => {
    setIsCampaignModalOpen(false);
    const idsToProcess = targetCompanyForCampaign ? [targetCompanyForCampaign] : Array.from(selectedIds);
    setActionProgress(`Adding ${idsToProcess.length} companies to Campaign...`);
    
    let added = 0, updated = 0, failed = 0;
    for (const id of idsToProcess) {
      try {
        const res = await fetch(`/api/companies-hiring/${id}/add-to-campaign`, {
           method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId })
        });
        const data = await res.json();
        if (data.status === 'Already Exists') updated++;
        else if (data.status === 'Added') added++;
        else failed++;
      } catch (e) { failed++; }
    }
    alert(`${idsToProcess.length} companies processed: ${added} added, ${updated} already existed, ${failed} failed.`);
    setSelectedIds(new Set());
    setTargetCompanyForCampaign(null);
    setActionProgress(null);
    fetchData();
  };

  const handleExport = async () => {
    setActionProgress('Generating Export...');
    try {
      const payload = selectedIds.size > 0 ? { selectedIds: Array.from(selectedIds) } : {
        q, category, country, city, region, jobTitle, skill, workMode, jobType, hiringActivity, hiringDemand, postedWithin,
        minActiveJobPosts, maxActiveJobPosts, provider, hasWebsite, exactVacanciesDisclosed, companyStatus, addedToLeads, addedToCampaign
      };
      
      const res = await fetch('/api/companies-hiring/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `companies_hiring_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (e) {
      alert('Failed to generate export.');
    } finally {
      setActionProgress(null);
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshModalOpen(false);
    setActionProgress('Refreshing hiring data from providers...');
    try {
      const res = await fetch('/api/companies-hiring/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, category, country, city, region, jobTitle })
      });
      const data = await res.json();
      if (res.ok) alert(data.message);
      else alert(data.error);
      fetchData();
    } catch (e) {
      alert('Refresh failed.');
    } finally {
      setActionProgress(null);
    }
  };

  // --- FILTERS PRESETS ---
  const handleSavePreset = async (e: any) => {
    e.preventDefault();
    const name = e.target.presetName.value;
    const isDefault = e.target.isDefault.checked;
    const currentFilters = { q, category, country, city, region, jobTitle, skill, workMode, jobType, hiringActivity, hiringDemand, postedWithin, minActiveJobPosts, maxActiveJobPosts, provider, hasWebsite, exactVacanciesDisclosed, companyStatus, addedToLeads, addedToCampaign };
    
    try {
      await fetch('/api/company-filter-presets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, filters: currentFilters, isDefault })
      });
      setIsPresetModalOpen(false);
      fetchPresets();
    } catch (err) {}
  };

  const applyPreset = (preset: any) => {
    let f = typeof preset.filters === 'string' ? JSON.parse(preset.filters) : preset.filters;
    updateUrlParams({ ...f, page: '1' });
  };

  // --- RENDERING HELPERS ---
  const activeFiltersCount = [category, country, city, region, jobTitle, skill, workMode, jobType, hiringActivity, hiringDemand, postedWithin, minActiveJobPosts, maxActiveJobPosts, provider, hasWebsite, exactVacanciesDisclosed, addedToLeads, addedToCampaign].filter(v => Boolean(v) && v !== 'All' && v !== 'Any' && v !== 'Any time').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Building2 className="text-purple-500" /> Companies Hiring
          </h1>
          <p className="text-slate-400">Find companies actively hiring, open role count, hiring category, and add them to campaigns.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/job-search" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            Go to Job Search <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Top Sync Panel */}
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <RefreshCw size={20} className="text-green-500" /> Sync Job Data
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Source</label>
            <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={apifySource} onChange={(e) => setApifySource(e.target.value)}>
              <option value="all">⚡ All Sources (Run All)</option>
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
                {isApifySyncing ? (
                  /* Animated waiting logo */
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      {/* Outer radar ring */}
                      <span className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" style={{ animationDuration: '1.4s' }} />
                      {/* Middle ring */}
                      <span className="absolute inset-1 rounded-full border border-purple-400/50 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.3s' }} />
                      {/* Spinning arc */}
                      <svg className="absolute inset-0 w-8 h-8 animate-spin" style={{ animationDuration: '1s' }} viewBox="0 0 32 32">
                        <circle cx="16" cy="16" r="12" fill="none" stroke="url(#apifyGrad)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="28 50" />
                        <defs>
                          <linearGradient id="apifyGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Center dot */}
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-purple-300 font-semibold text-xs tracking-wide">Fetching from Apify…</span>
                      <span className="text-slate-500 text-[10px]">This may take up to 5 minutes</span>
                    </div>
                  </div>
                ) : apifySyncResult ? (
                  <div className="space-y-2">
                    <span className={apifySyncResult.success ? 'text-green-400 text-sm font-medium' : 'text-red-400 text-sm'}>
                      {apifySyncResult.success
                        ? `✓ ${apifySyncResult.jobsFound} jobs found, ${(apifySyncResult.companiesUpdated || 0) + (apifySyncResult.companiesCreated || 0)} companies updated.`
                        : (apifySyncResult.message || apifySyncResult.error || 'Sync failed.')}
                    </span>
                    {/* Per-source breakdown for All Sources run */}
                    {apifySyncResult.sourceBreakdown && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Object.entries(apifySyncResult.sourceBreakdown).map(([src, info]: [string, any]) => (
                          <span
                            key={src}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                              info.status === 'success'
                                ? 'bg-green-900/30 text-green-400 border-green-800'
                                : 'bg-red-900/30 text-red-400 border-red-800'
                            }`}
                            title={info.error || `${info.jobsFound} jobs`}
                          >
                            {src === 'linkedin' ? 'LinkedIn' : src === 'indeed' ? 'Indeed' : src === 'google_jobs' ? 'Google' : src === 'remote_jobs' ? 'Remote' : 'World'}
                            {' '}{info.status === 'success' ? `✓ ${info.jobsFound}` : '✗'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : apifyConnectionStatus ? (
                  apifyConnectionStatus.status === 'Apify connected' ? (
                    apifyConnectionStatus.actors?.[apifySource] ? (
                      /* Apify connected badge with animated logo */
                      <div className="flex items-center gap-2 bg-green-950/40 border border-green-800/50 rounded-full px-3 py-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                        </span>
                        <svg width="44" height="12" viewBox="0 0 44 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Apify">
                          <path d="M3.2 9H0L3.6 0h2.8L10 9H6.8L6.2 7.2H3.8L3.2 9zM5 2.8 4.3 5.6h1.4L5 2.8zM11 9V0h3.8c1.8 0 2.9 1 2.9 2.6 0 1.7-1.1 2.7-2.9 2.7H13V9h-2zm2-5.6V3.7h1.5c.6 0 .9.3.9.85 0 .5-.3.85-.9.85H13zm7.5 5.6V0H23c2.8 0 4.5 1.6 4.5 4.5S25.8 9 23 9h-2.5zm2-1.7H23c1.7 0 2.5-1 2.5-2.8S24.7 1.7 23 1.7h-.5v5.6zm7.5 1.7V0H35v3.5h3V0h2v9h-2V5.2h-3V9h-2zm10-9h2v9h-2V0z" fill="#4ade80"/>
                        </svg>
                        <span className="text-green-400 text-xs font-medium">Connected</span>
                      </div>
                    ) : (
                      <span className="text-yellow-400 text-xs">⚠ Apify actor is not configured for this source.</span>
                    )
                  ) : (
                    <span className="text-red-400 text-xs">{apifyConnectionStatus.status}</span>
                  )
                ) : null}
             </div>
             <button onClick={handleApifySync} disabled={isApifySyncing} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
               {isApifySyncing ? (
                 <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                 <RefreshCw size={16} />
               )}
               {isApifySyncing ? 'Fetching…' : 'Refresh Job Data'}
             </button>
          </div>
        </div>
      </div>

      {/* Notice Area */}
      <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg text-xs text-slate-400 flex items-center gap-2">
        <Info size={14} className="text-purple-500 shrink-0" />
        <p>Active job posts indicate hiring activity. They do not reveal the exact number of candidates the company plans to hire unless explicitly stated in the job description.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="glass p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Total Hiring Companies Found</p>
          <p className="text-2xl font-bold text-white">{isLoading ? '-' : summary.totalHiringCompanies || 0}</p>
        </div>
        <div className="glass p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Total Open Roles Found</p>
          <p className="text-2xl font-bold text-white">{isLoading ? '-' : summary.totalOpenRolesFound || 0}</p>
        </div>
        <div className="glass p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Remote Roles</p>
          <p className="text-2xl font-bold text-white">{isLoading ? '-' : summary.remoteRoles || 0}</p>
        </div>
        <div className="glass p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Hybrid Roles</p>
          <p className="text-2xl font-bold text-white">{isLoading ? '-' : summary.hybridRoles || 0}</p>
        </div>
        <div className="glass p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">On-site Roles</p>
          <p className="text-2xl font-bold text-white">{isLoading ? '-' : summary.onsiteRoles || 0}</p>
        </div>
        <div className="glass p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Top Hiring Category</p>
          <p className="text-lg font-bold text-white truncate" title={summary.topHiringCategory || 'N/A'}>{isLoading ? '-' : summary.topHiringCategory || 'N/A'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button onClick={() => updateUrlParams({ tab: 'companies', page: '1' })} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'companies' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}`}>Companies</button>
        <button onClick={() => updateUrlParams({ tab: 'category-breakdown', page: '1' })} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'category-breakdown' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}`}>Category Breakdown</button>
      </div>

      {/* Toolbar: Search & Views */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass p-4 rounded-xl border border-slate-800">
        <div className="relative w-full md:w-1/2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-slate-500"
            placeholder="Search company, industry, category, job title, skill, city, country, or website..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateUrlParams({ q: searchInput, page: '1' })}
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          <select className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 max-w-[150px] truncate" value={category} onChange={(e) => updateUrlParams({ category: e.target.value, page: '1' })}>
            <option value="">All Categories</option>
            <option value="Software Development">Software Development</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Data and Analytics">Data and Analytics</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="DevOps and Cloud">DevOps and Cloud</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Nursing">Nursing</option>
            <option value="Engineering">Engineering</option>
            <option value="Construction">Construction</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Customer Support">Customer Support</option>
            <option value="Education">Education</option>
            <option value="Hospitality">Hospitality</option>
            <option value="Retail">Retail</option>
            <option value="Other">Other</option>
          </select>

          <button onClick={() => setIsFilterDrawerOpen(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm border border-slate-700 whitespace-nowrap">
            <Filter size={16} /> Filters {activeFiltersCount > 0 && <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFiltersCount}</span>}
          </button>
          
          <select className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2" value={sort} onChange={(e) => updateUrlParams({ sort: e.target.value, page: '1' })}>
            <option value="highest-open-roles">Highest open roles</option>
            <option value="recently-updated">Recently updated</option>
            <option value="name-asc">Company Name A–Z</option>
            <option value="name-desc">Company Name Z–A</option>
            <option value="remote-roles">Remote roles count</option>
          </select>

          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button onClick={() => updateUrlParams({ viewMode: 'card' })} className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}><LayoutGrid size={16} /></button>
            <button onClick={() => updateUrlParams({ viewMode: 'table' })} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}><List size={16} /></button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
          <span className="text-sm text-slate-400 mr-2">Active Filters:</span>
          {category && <Chip label={`Category: ${category}`} onRemove={() => updateUrlParams({ category: '' })} />}
          {country && <Chip label={`Country: ${country}`} onRemove={() => updateUrlParams({ country: '' })} />}
          {city && <Chip label={`City: ${city}`} onRemove={() => updateUrlParams({ city: '' })} />}
          {jobTitle && <Chip label={`Title: ${jobTitle}`} onRemove={() => updateUrlParams({ jobTitle: '' })} />}
          {hiringActivity && <Chip label={`Activity: ${hiringActivity}`} onRemove={() => updateUrlParams({ hiringActivity: '' })} />}
          {postedWithin && <Chip label={`Posted: ${postedWithin}`} onRemove={() => updateUrlParams({ postedWithin: '' })} />}
          {exactVacanciesDisclosed === 'Yes' && <Chip label="Exact Vacancies Only" onRemove={() => updateUrlParams({ exactVacanciesDisclosed: '' })} />}
          {addedToLeads && <Chip label={`Added to Leads: ${addedToLeads}`} onRemove={() => updateUrlParams({ addedToLeads: '' })} />}
          {addedToCampaign && <Chip label={`Added to Campaign: ${addedToCampaign}`} onRemove={() => updateUrlParams({ addedToCampaign: '' })} />}
          
          <button onClick={() => updateUrlParams({ q: '', category: '', country: '', city: '', region: '', jobTitle: '', skill: '', workMode: '', jobType: '', hiringActivity: '', hiringDemand: '', postedWithin: '', minActiveJobPosts: '', maxActiveJobPosts: '', provider: '', hasWebsite: '', exactVacanciesDisclosed: '', companyStatus: 'Active', addedToLeads: '', addedToCampaign: '', page: '1' })} className="text-xs text-purple-400 hover:text-purple-300 ml-2">Clear All Filters</button>
          <button onClick={() => setIsPresetModalOpen(true)} className="text-xs text-slate-300 hover:text-white ml-auto flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700"><Save size={12}/> Save Preset</button>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-30 bg-purple-900/40 border border-purple-500/50 rounded-lg p-3 flex justify-between items-center shadow-2xl backdrop-blur-md">
          <span className="text-sm text-white font-bold">{selectedIds.size} companies selected</span>
          <div className="flex gap-2 overflow-x-auto">
            <button onClick={handleBulkAddToLeads} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-md border border-slate-700 flex items-center gap-1 whitespace-nowrap">
              <UserPlus size={14} /> Add to Leads
            </button>
            <button onClick={() => handleOpenCampaignModal()} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-md border border-slate-700 flex items-center gap-1 whitespace-nowrap">
              <FileText size={14} /> Add to Campaign
            </button>
            <button onClick={handleExport} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-md border border-slate-700 flex items-center gap-1 whitespace-nowrap">
              <Download size={14} /> Export
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-md border border-slate-700 whitespace-nowrap">
              Clear Selection
            </button>
            {companyStatus !== 'Archived' ? (
              <button onClick={handleBulkArchive} className="px-3 py-1.5 bg-red-900/50 hover:bg-red-900/70 text-red-200 text-xs rounded-md border border-red-900/50 flex items-center gap-1 whitespace-nowrap ml-auto">
                <Inbox size={14} /> Archive Selected
              </button>
            ) : (
              <button onClick={handleBulkRestore} className="px-3 py-1.5 bg-green-900/50 hover:bg-green-900/70 text-green-200 text-xs rounded-md border border-green-900/50 flex items-center gap-1 whitespace-nowrap ml-auto">
                <Inbox size={14} /> Restore Selected
              </button>
            )}
          </div>
        </div>
      )}

      {actionProgress && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3 items-center text-blue-400">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p>{actionProgress}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 items-center justify-between text-red-400">
          <div className="flex gap-3 items-start">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
          <button onClick={fetchData} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-md text-sm transition-colors border border-red-500/30 whitespace-nowrap">
            Retry
          </button>
        </div>
      )}

      {/* Content Area */}
      {activeTab === 'companies' ? (
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="glass p-6 rounded-2xl border border-slate-800 animate-pulse h-72"></div>)}
          </div>
        ) : companies.length === 0 && !error ? (
          <div className="glass p-12 rounded-2xl border border-slate-800 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              {companyStatus === 'Archived' ? <Inbox className="text-slate-400" size={32} /> : <Building2 className="text-slate-400" size={32} />}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No companies found</h3>
            <p className="text-slate-400">
              {companyStatus === 'Archived' ? "You don't have any archived companies." : "No active hiring companies match your current search or filters."}
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button onClick={() => router.push(pathname)} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">Clear All Filters</button>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="glass rounded-xl border border-slate-800 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase">
                  <th className="p-4 w-12"><button onClick={toggleAll}>{selectedIds.size === companies.length ? <CheckSquare size={16} className="text-purple-500" /> : <Square size={16} />}</button></th>
                  <th className="p-4 font-medium">Company Name</th>
                  <th className="p-4 font-medium">Open Roles Found</th>
                  <th className="p-4 font-medium">Categories & Roles</th>
                  <th className="p-4 font-medium">Work Modes</th>
                  <th className="p-4 font-medium">Locations</th>
                  <th className="p-4 font-medium">Source / Status</th>
                  <th className="p-4 font-medium">Exact Headcount</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-800/50">
                {companies.map(c => (
                  <tr key={c.id} className={`hover:bg-slate-800/50 transition-colors ${c.archived ? 'opacity-50' : ''}`}>
                    <td className="p-4"><button onClick={() => toggleSelection(c.id)}>{selectedIds.has(c.id) ? <CheckSquare size={16} className="text-purple-500" /> : <Square size={16} className="text-slate-500" />}</button></td>
                    <td className="p-4">
                      <p className="font-bold text-white">{c.companyName}</p>
                      <div className="flex gap-1 mt-1">
                        {c.archived && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Archived</span>}
                        {c.addedToLeads && <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-900">Lead</span>}
                        {c.addedToCampaign && <span className="text-[10px] bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded border border-purple-900">Campaign</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono bg-slate-900 px-2 py-1 rounded text-purple-400 border border-slate-700">{c.openRolesFound}</span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-slate-300 mb-1 max-w-xs truncate" title={c.categoryCounts?.map((cat:any) => `${cat.name} (${cat.count})`).join(', ')}>
                        {c.categoryCounts?.slice(0, 2).map((cat:any) => `${cat.name} (${cat.count})`).join(', ') || '-'}
                      </div>
                      <div className="text-[10px] text-slate-500 max-w-xs truncate" title={c.topRoles?.join(', ')}>
                        {c.topRoles?.join(', ') || '-'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-[10px]">
                        {c.remoteRolesCount > 0 && <span className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded w-fit border border-blue-900/50">Remote: {c.remoteRolesCount}</span>}
                        {c.hybridRolesCount > 0 && <span className="bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded w-fit border border-yellow-900/50">Hybrid: {c.hybridRolesCount}</span>}
                        {c.onsiteRolesCount > 0 && <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded w-fit border border-slate-700">On-site: {c.onsiteRolesCount}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 max-w-[150px] truncate" title={c.locations?.join(', ')}>
                      {c.locations?.join(', ') || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-[10px]">
                        <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded w-fit border border-slate-700">{c.source}</span>
                        <span className={`px-2 py-0.5 rounded w-fit border ${c.dataStatus === 'FRESH' ? 'bg-green-900/30 text-green-400 border-green-900/50' : 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50'}`}>{c.dataStatus}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      {c.exactHeadcount && c.exactHeadcount !== 'Not publicly disclosed' ? <span className="font-bold">{c.exactHeadcount}</span> : <span className="text-xs text-slate-500">Not publicly disclosed</span>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openViewJobsDrawer(c.id)} className="px-2 py-1.5 text-xs text-white bg-purple-600 hover:bg-purple-500 rounded font-medium shadow-lg shadow-purple-900/20 border border-purple-500">View Jobs</button>
                        <button onClick={() => handleAddToLead(c.id)} className="p-1.5 text-slate-400 hover:text-green-400 bg-slate-800 rounded border border-slate-700" title="Add to Leads"><UserPlus size={14}/></button>
                        <button onClick={() => handleOpenCampaignModal(c.id)} className="p-1.5 text-slate-400 hover:text-purple-400 bg-slate-800 rounded border border-slate-700" title="Add to Campaign"><FileText size={14}/></button>
                        {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded border border-slate-700" title="Open Career Page"><ExternalLink size={14}/></a>}
                        {!c.archived ? (
                           <button onClick={() => handleArchiveCompany(c.id)} className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 rounded border border-slate-700" title="Archive"><Inbox size={14}/></button>
                        ) : (
                           <button onClick={() => handleRestoreCompany(c.id)} className="p-1.5 text-slate-400 hover:text-green-400 bg-slate-800 rounded border border-slate-700" title="Restore"><RefreshCw size={14}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {companies.map(company => (
              <div key={company.id} className={`glass p-6 rounded-2xl border ${selectedIds.has(company.id) ? 'border-purple-500 bg-purple-500/5' : 'border-slate-800'} hover:border-purple-500/50 transition-all flex flex-col h-full relative ${company.archived ? 'opacity-70 grayscale-[50%]' : ''}`}>
                <div className="absolute top-4 left-4 z-10">
                   <button onClick={() => toggleSelection(company.id)}>
                     {selectedIds.has(company.id) ? <CheckSquare size={18} className="text-purple-500 bg-slate-900 rounded" /> : <Square size={18} className="text-slate-500 bg-slate-900 rounded" />}
                   </button>
                </div>
                <div className="flex justify-between items-start mb-4 pl-8">
                  <div>
                    <h3 className="text-xl font-bold text-white line-clamp-1" title={company.companyName}>{company.companyName}</h3>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {company.archived && <span className="text-[10px] uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">Archived</span>}
                      {company.addedToLeads && <span className="text-[10px] uppercase bg-green-900/30 border border-green-900 text-green-400 px-2 py-0.5 rounded font-bold">Added to Leads</span>}
                      {company.addedToCampaign && <span className="text-[10px] uppercase bg-purple-900/30 border border-purple-900 text-purple-400 px-2 py-0.5 rounded font-bold">In Campaign</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 relative group cursor-pointer shrink-0 ml-2">
                    <MoreVertical size={18} className="text-slate-500 hover:text-white" />
                    <div className="absolute right-0 top-6 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                       <button onClick={() => openViewJobsDrawer(company.id)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"><Eye size={14} className="inline mr-2"/> View Jobs</button>
                       <button onClick={() => handleAddToLead(company.id)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"><UserPlus size={14} className="inline mr-2"/> Add to Leads</button>
                       <button onClick={() => handleOpenCampaignModal(company.id)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"><FileText size={14} className="inline mr-2"/> Add to Campaign</button>
                       {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"><ExternalLink size={14} className="inline mr-2"/> Open Career Page</a>}
                       <div className="h-px bg-slate-700 my-1"></div>
                       {!company.archived ? (
                         <button onClick={() => handleArchiveCompany(company.id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700"><Inbox size={14} className="inline mr-2"/> Archive</button>
                       ) : (
                         <button onClick={() => handleRestoreCompany(company.id)} className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-slate-700"><RefreshCw size={14} className="inline mr-2"/> Restore</button>
                       )}
                    </div>
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/80">
                    <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Open Roles</p>
                    <p className="text-2xl font-black text-white">{company.openRolesFound}</p>
                    {company.hiringActivity === 'High' && <span className="text-[10px] bg-green-900/30 text-green-400 px-1 py-0.5 rounded">High Activity</span>}
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/80 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Exact Headcount</p>
                      <p className="text-sm font-bold text-slate-300">{company.exactHeadcount && company.exactHeadcount !== 'Not publicly disclosed' ? company.exactHeadcount : <span className="text-xs text-slate-500">Not publicly disclosed</span>}</p>
                    </div>
                  </div>
                </div>
  
                <div className="space-y-2 mb-6 flex-grow">
                  <div className="flex items-start gap-2 text-sm text-slate-300">
                    <Briefcase size={16} className="text-slate-500 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="line-clamp-2">{company.categoryCounts?.slice(0, 2).map((c:any) => `${c.name}`).join(', ') || 'Various categories'}</span>
                      <span className="text-xs text-slate-500 line-clamp-1">{company.topRoles?.slice(0, 2).join(', ') || ''}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-300">
                    <MapPin size={16} className="text-slate-500 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{company.locations?.slice(0, 3).join(', ') || 'Multiple locations'}</span>
                  </div>
                  {(company.remoteRolesCount > 0 || company.hybridRolesCount > 0) && (
                     <div className="flex gap-1 mt-2 flex-wrap">
                        {company.remoteRolesCount > 0 && <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-900/50">Remote: {company.remoteRolesCount}</span>}
                        {company.hybridRolesCount > 0 && <span className="text-[10px] bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded border border-yellow-900/50">Hybrid: {company.hybridRolesCount}</span>}
                     </div>
                  )}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/50 text-[10px] font-medium">
                    <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Source: {company.source}</span>
                    <span className={`px-2 py-0.5 rounded border ${company.dataStatus === 'FRESH' ? 'bg-green-900/30 text-green-400 border-green-900/50' : 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50'}`}>{company.dataStatus}</span>
                  </div>
                </div>
  
                <div className="flex gap-2 mt-auto pt-4 border-t border-slate-800">
                  <button onClick={() => openViewJobsDrawer(company.id)} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    View Jobs
                  </button>
                  <button onClick={() => handleAddToLead(company.id)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    Add Lead
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Category Breakdown Tab — real data from API */
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Job Category Breakdown</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Distribution of {summary.totalOpenRolesFound || 0} open roles across {summary.totalHiringCompanies || 0} hiring companies
                </p>
              </div>
              <button
                onClick={() => updateUrlParams({ tab: 'companies' })}
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 border border-purple-500/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                View Companies <ArrowRight size={14}/>
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : categoryBreakdown.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="text-slate-500" size={28} />
                </div>
                <p className="text-slate-400">No category data available yet.</p>
                <p className="text-slate-500 text-sm mt-1">Sync job data using the Refresh Job Data button above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((cat: any, idx: number) => {
                  const colors = [
                    'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
                    'bg-pink-500', 'bg-orange-500', 'bg-cyan-500', 'bg-red-500',
                    'bg-indigo-500', 'bg-teal-500'
                  ];
                  const barColor = colors[idx % colors.length];
                  return (
                    <button
                      key={cat.name}
                      onClick={() => updateUrlParams({ category: cat.name, tab: 'companies', page: '1' })}
                      className="w-full text-left bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 rounded-xl p-4 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${barColor} shrink-0`} />
                          <span className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-xs">{cat.percentage}%</span>
                          <span className="font-mono text-white font-bold text-sm bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
                            {cat.count} {cat.count === 1 ? 'role' : 'roles'}
                          </span>
                          <ArrowRight size={14} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Work Mode breakdown */}
          {!isLoading && (summary.remoteRoles > 0 || summary.hybridRoles > 0 || summary.onsiteRoles > 0) && (
            <div className="glass p-6 rounded-2xl border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4">Work Mode Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-blue-400">{summary.remoteRoles || 0}</p>
                  <p className="text-xs text-blue-300 mt-1 font-medium">Remote</p>
                </div>
                <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-yellow-400">{summary.hybridRoles || 0}</p>
                  <p className="text-xs text-yellow-300 mt-1 font-medium">Hybrid</p>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-300">{summary.onsiteRoles || 0}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">On-site</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {activeTab === 'companies' && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mt-8 gap-4">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <p>Showing {(pagination.page - 1) * pagination.pageSize + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.totalCompanies)} of {pagination.totalCompanies} hiring companies</p>
            <select 
              className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1"
              value={pagination.pageSize}
              onChange={(e) => updateUrlParams({ pageSize: e.target.value, page: '1' })}
            >
              <option value="10">10 results per page</option>
              <option value="25">25 results per page</option>
              <option value="50">50 results per page</option>
              <option value="100">100 results per page</option>
            </select>
          </div>
          
          <div className="flex gap-2 items-center">
            <button disabled={pagination.page <= 1} onClick={() => updateUrlParams({ page: (pagination.page - 1).toString() })} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm">Previous</button>
            <span className="text-slate-400 text-sm px-2">Page {pagination.page} of {pagination.totalPages || 1}</span>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => updateUrlParams({ page: (pagination.page + 1).toString() })} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm">Next</button>
          </div>
        </div>
      )}

      {/* MODALS & DRAWERS */}

      {/* Mobile Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterDrawerOpen(false)}></div>
          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Filter size={20}/> Advanced Filters</h2>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full"><X size={20}/></button>
            </div>

            <div className="space-y-5 flex-grow overflow-y-auto pr-2 custom-scrollbar">
              {/* Presets */}
              {presets.length > 0 && (
                <div className="mb-4 bg-purple-900/10 p-4 rounded-lg border border-purple-500/20">
                  <label className="block text-sm font-bold text-purple-300 mb-2 flex items-center gap-2"><Bookmark size={14}/> Saved Presets</label>
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p: any) => (
                      <button key={p.id} onClick={() => applyPreset(p)} className="text-xs bg-purple-600/20 border border-purple-500/30 text-purple-300 px-3 py-1.5 rounded-full hover:bg-purple-600/40">
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Company Status</label>
                  <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={companyStatus} onChange={(e) => updateUrlParams({ companyStatus: e.target.value })}>
                    <option value="Active">Active Companies</option>
                    <option value="Archived">Archived Companies</option>
                    <option value="All">All Companies</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Job Category</label>
                  <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={category} onChange={(e) => updateUrlParams({ category: e.target.value })}>
                    <option value="">All Categories</option>
                    <option value="Software Development">Software Development</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Data and Analytics">Data and Analytics</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="DevOps and Cloud">DevOps and Cloud</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Construction">Construction</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Education">Education</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Retail">Retail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Country</label>
                  <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={country} onChange={(e) => updateUrlParams({ country: e.target.value })}>
                    <option value="">All Countries</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="India">India</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">City</label>
                  <input type="text" className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={city} onChange={(e) => updateUrlParams({ city: e.target.value })} placeholder="e.g. London" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Job Title Contains</label>
                  <input type="text" className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={jobTitle} onChange={(e) => updateUrlParams({ jobTitle: e.target.value })} placeholder="e.g. React Developer" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Work Mode</label>
                  <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={workMode} onChange={(e) => updateUrlParams({ workMode: e.target.value })}>
                    <option value="Any">Any</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Job Type</label>
                  <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={jobType} onChange={(e) => updateUrlParams({ jobType: e.target.value })}>
                    <option value="Any">Any</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Hiring Activity</label>
                  <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={hiringActivity} onChange={(e) => updateUrlParams({ hiringActivity: e.target.value })}>
                    <option value="All">All</option>
                    <option value="High Activity">High Activity</option>
                    <option value="Medium Activity">Medium Activity</option>
                    <option value="Low Activity">Low Activity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Posted Within</label>
                  <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={postedWithin} onChange={(e) => updateUrlParams({ postedWithin: e.target.value })}>
                    <option value="Any time">Any time</option>
                    <option value="Last 24 hours">Last 24 hours</option>
                    <option value="Last 7 days">Last 7 days</option>
                    <option value="Last 30 days">Last 30 days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Min Active Posts</label>
                  <input type="number" min="0" className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={minActiveJobPosts} onChange={(e) => updateUrlParams({ minActiveJobPosts: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Exact Vacancies</label>
                  <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={exactVacanciesDisclosed} onChange={(e) => updateUrlParams({ exactVacanciesDisclosed: e.target.value })}>
                    <option value="All">All</option>
                    <option value="Yes">Yes (Disclosed)</option>
                    <option value="No">No (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Added to Leads</label>
                  <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={addedToLeads} onChange={(e) => updateUrlParams({ addedToLeads: e.target.value })}>
                    <option value="All">All</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Added to Campaign</label>
                  <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" value={addedToCampaign} onChange={(e) => updateUrlParams({ addedToCampaign: e.target.value })}>
                    <option value="All">All</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 flex gap-4 shrink-0">
              <button onClick={() => { updateUrlParams({ q: '', category: '', country: '', city: '', region: '', jobTitle: '', skill: '', workMode: '', jobType: '', hiringActivity: '', hiringDemand: '', postedWithin: '', minActiveJobPosts: '', maxActiveJobPosts: '', provider: '', hasWebsite: '', exactVacanciesDisclosed: '', companyStatus: 'Active', addedToLeads: '', addedToCampaign: '', page: '1' }); setIsFilterDrawerOpen(false); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg text-sm font-medium">Reset All</button>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg text-sm font-medium">Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Campaign Modal */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCampaignModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Add to Campaign</h3>
            <p className="text-slate-400 text-sm mb-6">Select a recruitment campaign to add these companies to. They will be automatically converted to Client Leads if they aren't already.</p>
            
            <div className="max-h-60 overflow-y-auto mb-6 space-y-2 custom-scrollbar pr-2">
              {campaigns.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No active campaigns found. Please create one first.</p>
              ) : (
                campaigns.map((camp: any) => (
                  <button key={camp.id} onClick={() => handleAddToCampaign(camp.id)} className="w-full text-left p-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-purple-500 transition-colors">
                    <p className="font-bold text-white">{camp.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{camp.status} • {camp.goal || 'No goal set'}</p>
                  </button>
                ))
              )}
            </div>
            
            <div className="flex justify-end">
              <button onClick={() => setIsCampaignModalOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {isPresetModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPresetModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Save Filter Preset</h3>
            <form onSubmit={handleSavePreset}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-400 mb-1">Preset Name</label>
                <input required name="presetName" type="text" className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2" placeholder="e.g. High Activity UK Tech" />
              </div>
              <div className="mb-6 flex items-center gap-2">
                <input type="checkbox" id="isDefault" name="isDefault" className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-600" />
                <label htmlFor="isDefault" className="text-sm text-slate-400">Set as default view</label>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsPresetModalOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium">Save Preset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Removed Refresh Modal */}

      {/* View Jobs Drawer */}
      {selectedCompanyIdForDrawer && (
         <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCompanyIdForDrawer(null)}></div>
           <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 p-6 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right flex flex-col custom-scrollbar">
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4 shrink-0">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Briefcase size={20}/> Open Roles for {drawerData?.name || drawerData?.companyName || 'Company'}</h2>
                 <button onClick={() => setSelectedCompanyIdForDrawer(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full"><X size={20}/></button>
              </div>
              <div className="flex-grow">
                {isDrawerLoading ? (
                  <div className="flex flex-col items-center justify-center h-40">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 mt-4">Loading jobs...</p>
                  </div>
                ) : drawerData?.jobs && drawerData.jobs.length > 0 ? (
                  <div className="space-y-4">
                    {drawerData.jobs.map((job: any) => (
                       <div key={job.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl hover:border-purple-500/50 transition-colors">
                          <div className="flex justify-between items-start">
                             <div>
                                <h4 className="font-bold text-white text-lg">{job.title}</h4>
                                <div className="flex gap-2 text-xs text-slate-400 mt-2 flex-wrap">
                                   {job.category && <span className="bg-slate-800 px-2 py-0.5 rounded">{job.category}</span>}
                                   <span className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded"><MapPin size={12}/> {job.location || job.city || job.country || 'Location hidden'}</span>
                                   {(job.workMode || job.jobType) && <span className="bg-slate-800 px-2 py-0.5 rounded">{[job.workMode, job.jobType].filter(Boolean).join(' - ')}</span>}
                                   {job.vacancies > 0 && <span className="bg-purple-900/30 text-purple-400 border border-purple-900/50 px-2 py-0.5 rounded">{job.vacancies} openings</span>}
                                </div>
                             </div>
                             {job.applicationUrl && (
                               <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg text-sm font-medium border border-purple-500/30 hover:bg-purple-600/40 whitespace-nowrap">Apply Now</a>
                             )}
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-800/50 flex justify-between text-[10px] text-slate-500 font-medium">
                             {job.datePosted ? <span>Posted: {new Date(job.datePosted).toLocaleDateString()}</span> : <span>Recently active</span>}
                             {job.source && <span>Source: {job.source}</span>}
                          </div>
                       </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                     <Briefcase size={48} className="text-slate-700 mb-4" />
                     <h3 className="text-lg font-bold text-white">No job records found</h3>
                     <p className="text-slate-400 mt-2 max-w-sm">The job postings for this company might have expired or were removed by the provider.</p>
                  </div>
                )}
              </div>
           </div>
         </div>
      )}

      {/* Existing Drawers and Modals... */}

      {/* Removed Sync Modal */}

    </div>
  );
}

function Chip({ label, onRemove }: { label: string, onRemove: () => void }) {
  return (
    <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full text-xs flex items-center gap-1 shrink-0">
      {label} <X size={12} className="cursor-pointer hover:text-white" onClick={onRemove} />
    </span>
  );
}

export default function CompaniesHiringPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400">Loading workspace...</p>
        </div>
      </div>
    }>
      <CompaniesHiringContent />
    </Suspense>
  );
}
