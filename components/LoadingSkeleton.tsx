'use client';

export function VendorCardSkeleton() {
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden animate-pulse">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-zinc-800 rounded w-3/4"></div>
            <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
            <div className="h-3 bg-zinc-800 rounded w-1/3"></div>
          </div>
          <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
        </div>
      </div>
      <div className="divide-y divide-zinc-800">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-24"></div>
              <div className="h-3 bg-zinc-800 rounded w-16"></div>
            </div>
            <div className="space-y-2 text-right">
              <div className="h-5 bg-zinc-800 rounded w-20"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-zinc-800 rounded w-16"></div>
                <div className="h-8 bg-zinc-800 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-20"></div>
          <div className="h-3 bg-zinc-800 rounded w-32"></div>
        </div>
        <div className="h-6 bg-zinc-800 rounded w-20"></div>
      </div>
      <div className="h-8 bg-zinc-800 rounded w-full mt-4"></div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-zinc-900 rounded-2xl"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-zinc-900 rounded-2xl"></div>
        <div className="h-24 bg-zinc-900 rounded-2xl"></div>
      </div>
      <div className="h-64 bg-zinc-900 rounded-2xl"></div>
    </div>
  );
}
