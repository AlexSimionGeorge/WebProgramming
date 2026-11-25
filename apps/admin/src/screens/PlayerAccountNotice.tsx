import { useSession } from '../auth/useSession'
import { Button } from '../components/Button'
import { CenteredPanel } from '../components/CenteredPanel'

export function PlayerAccountNotice() {
  const { account, logOut } = useSession()
  return (
    <CenteredPanel>
      <h1 className="font-display text-[26px] font-semibold leading-tight">This page is for padel centres</h1>
      <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
        {account?.email} is a player account. Book courts in the player app, or log out and use a centre account here.
      </p>
      <Button variant="secondary" onClick={logOut} className="mt-7 w-full">
        Log out
      </Button>
    </CenteredPanel>
  )
}
