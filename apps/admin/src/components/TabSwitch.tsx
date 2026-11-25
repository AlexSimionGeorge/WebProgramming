type Tab<T extends string> = { id: T; label: string; disabled?: boolean }

type TabSwitchProps<T extends string> = {
  tabs: readonly Tab<T>[]
  activeTab: T
  onSelect: (tab: T) => void
}

export function TabSwitch<T extends string>({ tabs, activeTab, onSelect }: TabSwitchProps<T>) {
  return (
    <nav role="tablist" className="inline-flex gap-1 rounded-2xl border border-line bg-surface p-1">
      {tabs.map((tab) => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={tab.disabled}
            onClick={() => onSelect(tab.id)}
            className={`pressable h-10 rounded-xl px-5 text-[14.5px] font-semibold ${
              active ? 'bg-primary text-on-primary' : 'text-muted hover:text-white disabled:text-faint'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
