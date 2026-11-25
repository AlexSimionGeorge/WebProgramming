import { Button } from './Button'

type TopBarProps = {
  centerName: string | null
  accountEmail: string
  onLogOut: () => void
}

export function TopBar({ centerName, accountEmail, onLogOut }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/icon.svg" alt="" className="h-8 w-8 shrink-0" />
          <span className="truncate font-display text-[19px] font-semibold">{centerName ?? 'New centre'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden truncate text-[13.5px] text-muted sm:block">{accountEmail}</span>
          <Button variant="secondary" onClick={onLogOut} className="h-10 px-4 text-[14px]">
            Log out
          </Button>
        </div>
      </div>
    </header>
  )
}
