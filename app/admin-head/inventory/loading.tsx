import { Skeleton } from '@/components/ui/skeleton'

export default function InventoryLoading() {
  return (
    <div className="min-h-screen bg-[#F5F6F8] p-6 md:p-8 space-y-6">
      <div className="relative overflow-hidden rounded-sm border border-slate-200 bg-white px-6 py-7">
        <Skeleton className="h-8 w-72 bg-slate-200/90" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full bg-slate-200/80" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#A4163A]/10 via-[#A4163A]/40 to-[#A4163A]/10 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={`inventory-loading-stat-${idx}`} className="rounded-sm border border-slate-200 bg-white p-4 space-y-3 animate-pulse" style={{ animationDelay: `${idx * 80}ms` }}>
            <Skeleton className="h-3 w-28 bg-slate-200/90" />
            <Skeleton className="h-8 w-20 bg-slate-200/90" />
            <Skeleton className="h-2 w-full bg-slate-200/70" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-sm border border-slate-200 bg-white p-5 space-y-4 animate-pulse">
          <Skeleton className="h-6 w-56 bg-slate-200/90" />
          <Skeleton className="h-10 w-full bg-slate-200/80" />
          <Skeleton className="h-10 w-full bg-slate-200/80" />
          <Skeleton className="h-28 w-full bg-slate-200/70" />
          <Skeleton className="h-10 w-full bg-slate-200/90" />
        </div>
        <div className="rounded-sm border border-slate-200 bg-white p-5 space-y-4 animate-pulse">
          <Skeleton className="h-6 w-56 bg-slate-200/90" />
          <Skeleton className="h-10 w-full bg-slate-200/80" />
          <Skeleton className="h-10 w-full bg-slate-200/80" />
          <Skeleton className="h-28 w-full bg-slate-200/70" />
          <Skeleton className="h-10 w-full bg-slate-200/90" />
        </div>
      </div>

      <div className="rounded-sm border border-slate-200 bg-white p-5 space-y-4 animate-pulse">
        <Skeleton className="h-6 w-56 bg-slate-200/90" />
        <Skeleton className="h-10 w-full bg-slate-200/80" />
        <Skeleton className="h-64 w-full bg-slate-200/70" />
      </div>
    </div>
  )
}
