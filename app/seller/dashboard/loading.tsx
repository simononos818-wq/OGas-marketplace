export default function Loading() {
  return (
    <div className="min-h-screen bg-white text-[#16305e] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#12a5b0] mx-auto mb-4"></div>
        <p className="text-[#8a8f98]">Loading dashboard...</p>
      </div>
    </div>
  );
}
