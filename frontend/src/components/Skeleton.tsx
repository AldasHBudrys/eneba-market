import type { ReactNode } from 'react'

// Grey placeholders in the shape of the real content, so pages look like they're arriving, not missing
// (a Render cold start can take ~50 s). Grids reuse the real grid classes, so nothing jumps when data lands.

export const STORE_GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'
export const ROW_GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'

/** One grey block. `motion-safe:` = no pulsing for users who turned on "reduce motion". */
export function Bone({ className = '' }: { className?: string }) {
  return <div className={`bg-surface motion-safe:animate-pulse ${className}`} />
}

/** Screen readers hear "Loading" once; the grey shapes themselves are hidden from them. */
function Loading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-label="Loading" aria-busy="true">
      {/* layout classes go on the element that directly holds the shapes, or grid/flex wouldn't see them as children */}
      <div aria-hidden className={className}>{children}</div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="flex flex-col bg-surface-dark">
      <Bone className="aspect-[3/4] w-full" />
      {/* one bar per real line (platform, 2 title lines, region, "From", price) so the height matches the real card */}
      <div className="flex flex-col gap-2 p-3">
        <Bone className="h-3 w-1/3" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-2/3" />
        <Bone className="h-3 w-1/4" />
        <Bone className="h-3 w-2/5" />
        <Bone className="h-6 w-1/2" />
      </div>
    </div>
  )
}

export function CardGridSkeleton({ count, grid }: { count: number; grid: string }) {
  return (
    <Loading>
      <div className={grid}>{Array.from({ length: count }, (_, i) => <CardSkeleton key={i} />)}</div>
    </Loading>
  )
}

/** Homepage row: section title + one row of cards. */
export function RowSkeleton() {
  return (
    <Loading>
      <Bone className="mb-4 h-9 w-64" />
      <div className={ROW_GRID}>{Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}</div>
    </Loading>
  )
}

/** Homepage hero: one big 3:1 banner + two side tiles (same grid as BannerBlock). */
export function BannerSkeleton() {
  return (
    <Loading className="grid gap-3 md:grid-cols-[2fr_1fr]">
      <Bone className="aspect-[3/1] w-full" />
      <div className="hidden gap-3 md:grid md:grid-rows-2">
        <Bone />
        <Bone />
      </div>
    </Loading>
  )
}

/** Product page: cover, title + info rows, featured-offer box, offer rows (same grid as the page). */
export function ProductSkeleton() {
  return (
    <Loading>
      <Bone className="mb-4 h-4 w-56" />
      <div className="grid gap-6 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr_320px]">
        <Bone className="aspect-[3/4] w-full max-w-xs" />
        <div className="flex flex-col gap-3">
          <Bone className="h-8 w-4/5" />
          <Bone className="h-8 w-1/2" />
          {[0, 1, 2].map((i) => <Bone key={i} className="mt-3 h-10 w-2/3" />)}
        </div>
        <Bone className="h-56 md:col-span-2 lg:col-span-1" />
      </div>
      <Bone className="mb-3 mt-10 h-7 w-32" />
      <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <Bone key={i} className="h-16" />)}</div>
    </Loading>
  )
}

export function OrdersSkeleton() {
  return (
    <Loading className="flex flex-col gap-4">
      {[0, 1].map((i) => <Bone key={i} className="h-36" />)}
    </Loading>
  )
}
