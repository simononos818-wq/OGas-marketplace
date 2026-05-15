export function SkeletonCard() {
  return (
    <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-xl skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 rounded-lg skeleton w-3/4" />
          <div className="h-3 rounded-lg skeleton w-1/2" />
          <div className="h-3 rounded-lg skeleton w-1/3" />
        </div>
      </div>
      <div className="h-8 rounded-lg skeleton w-full" />
    </div>
  );
}

export function SkeletonHome() {
  return (
    <div className="space-y-4 px-4">
      <div className="h-40 rounded-2xl skeleton" />
      <div className="flex gap-3">
        <div className="h-20 flex-1 rounded-xl skeleton" />
        <div className="h-20 flex-1 rounded-xl skeleton" />
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
