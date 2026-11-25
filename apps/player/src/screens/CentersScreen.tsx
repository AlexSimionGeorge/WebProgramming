import { describeError } from '../api/errorMessage'
import { listCenters } from '../api/centers'
import type { CenterSummary } from '../api/types'
import { CenterCard } from '../components/CenterCard'
import { Notice } from '../components/Notice'
import { ScreenHeader } from '../components/ScreenHeader'
import { SkeletonList } from '../components/SkeletonList'
import { useRemote } from '../lib/useRemote'

export function CentersScreen({ onOpenCenter }: { onOpenCenter: (center: CenterSummary) => void }) {
  const centers = useRemote(listCenters, [])

  return (
    <div className="h-full overflow-y-auto noscroll pb-8">
      <ScreenHeader kicker="Padel" title="Centres" subtitle="Pick a centre to see which courts are free." />
      <div className="px-5">
        {centers.status === 'loading' && <SkeletonList count={4} rowHeight={78} />}
        {centers.status === 'failed' && (
          <Notice tone="warm" message={describeError(centers.error)} action={{ label: 'Try again', onClick: centers.reload }} />
        )}
        {centers.status === 'ready' && centers.data.length === 0 && (
          <Notice message="No centres have opened their courts yet. Check back soon." />
        )}
        {centers.status === 'ready' && centers.data.length > 0 && (
          <div className="flex flex-col" style={{ gap: 'var(--row-gap)' }}>
            {centers.data.map((center, index) => (
              <CenterCard key={center.id} center={center} index={index} onOpen={() => onOpenCenter(center)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
