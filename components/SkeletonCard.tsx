'use client'

export function SkeletonCard() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-800 rounded w-3/4" />
          <div className="h-3 bg-gray-800 rounded w-1/2" />
          <div className="h-3 bg-gray-800 rounded w-2/3" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 bg-gray-800 rounded w-12" />
            <div className="h-5 bg-gray-800 rounded w-12" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-gray-800 rounded w-16" />
          <div className="h-3 bg-gray-800 rounded w-16" />
        </div>
      </div>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800">
        <div className="flex gap-3">
          <div className="h-3 bg-gray-800 rounded w-12" />
          <div className="h-3 bg-gray-800 rounded w-12" />
        </div>
        <div className="h-3 bg-gray-800 rounded w-14" />
      </div>
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[1,2,3].map(i => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-3 animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-8 mx-auto mb-1" />
          <div className="h-3 bg-gray-800 rounded w-16 mx-auto" />
        </div>
      ))}
    </div>
  )
}
