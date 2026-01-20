import { Skeleton } from "@/components/ui/skeleton";

export function BookingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          {/* Date header skeleton */}
          <div className="flex items-center gap-2 px-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          
          {/* Card skeleton */}
          <div className="ios-card p-4 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <Skeleton className="h-5 w-12 mt-2" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-border/50">
              <Skeleton className="flex-1 h-10 rounded-xl" />
              <Skeleton className="flex-1 h-10 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
