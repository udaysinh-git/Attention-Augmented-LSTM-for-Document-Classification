export function SkeletonCard({ featured }: { featured?: boolean }) {
  return (
    <div className={["rounded-xl overflow-hidden bg-zinc-900 border border-white/5", featured ? "md:col-span-2" : ""].join(" ")}>
      <div className={["skeleton", featured ? "aspect-16/7" : "aspect-video"].join(" ")} />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="skeleton h-5 w-24 rounded-full" />
          <div className="skeleton h-5 w-10 rounded-full" />
        </div>
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="flex items-center justify-between pt-1">
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="skeleton w-1.5 h-1.5 rounded-full shrink-0" />
      <div className="skeleton hidden sm:block h-3 w-24 rounded shrink-0" />
      <div className="skeleton flex-1 h-4 rounded" />
      <div className="skeleton hidden md:block h-3 w-20 rounded shrink-0" />
      <div className="skeleton h-3 w-8 rounded shrink-0" />
      <div className="skeleton h-3 w-10 rounded shrink-0" />
    </div>
  );
}
