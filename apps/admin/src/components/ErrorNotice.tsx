export function ErrorNotice({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-2xl border border-warm/40 bg-warm/10 px-4 py-3 text-[14px] text-warm">
      {message}
    </p>
  )
}
