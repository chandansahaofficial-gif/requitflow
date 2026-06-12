import { Suspense } from 'react';
import AIMatchResultsClient from './AIMatchResultsClient';
import { Loader2 } from 'lucide-react';

function AIMatchResultsLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <Loader2 className="animate-spin text-purple-500" size={64} />
      <h2 className="text-2xl font-bold text-white">Loading Results...</h2>
      <p className="text-slate-400 text-center max-w-md">Preparing your AI match analysis.</p>
    </div>
  );
}

export default function AIMatchResultsPage() {
  return (
    <Suspense fallback={<AIMatchResultsLoading />}>
      <AIMatchResultsClient />
    </Suspense>
  );
}
