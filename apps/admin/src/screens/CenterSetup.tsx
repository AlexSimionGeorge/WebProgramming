import { useState, type FormEvent } from 'react'
import { saveCenter } from '../api/admin'
import { ApiError, errorMessage } from '../api/client'
import type { CenterConfiguration, CenterDetails } from '../api/types'
import { Button } from '../components/Button'
import { ErrorNotice } from '../components/ErrorNotice'
import { FormSection } from '../components/FormSection'
import { SegmentedControl } from '../components/SegmentedControl'
import { Stepper } from '../components/Stepper'
import { TextField } from '../components/TextField'
import {
  MAX_COURTS,
  MIN_COURTS,
  SLOT_LENGTH_OPTIONS,
  initialConfiguration,
  trimConfiguration,
  validateCenterFields,
} from '../lib/centerForm'

type CenterSetupProps = {
  center: CenterDetails | null
  onSaved: (center: CenterDetails) => void
}

export function CenterSetup({ center, onSaved }: CenterSetupProps) {
  const [configuration, setConfiguration] = useState<CenterConfiguration>(() => initialConfiguration(center))
  const [showFieldErrors, setShowFieldErrors] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedNotice, setSavedNotice] = useState(false)

  const fieldErrors = validateCenterFields(configuration)
  const isValid = Object.keys(fieldErrors).length === 0
  const visibleErrors = showFieldErrors ? fieldErrors : {}
  const isFirstSetup = center === null

  function update<Key extends keyof CenterConfiguration>(key: Key, value: CenterConfiguration[Key]) {
    setConfiguration((current) => ({ ...current, [key]: value }))
    setSavedNotice(false)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setShowFieldErrors(true)
    if (!isValid) return
    setSaving(true)
    setSaveError(null)
    try {
      const saved = await saveCenter(trimConfiguration(configuration))
      setSavedNotice(true)
      onSaved(saved)
    } catch (error) {
      setSaveError(describeSaveError(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-[30px] font-semibold leading-tight">
          {isFirstSetup ? 'Set up your centre' : 'Your centre'}
        </h1>
        <p className="mt-1.5 text-[14.5px] text-muted">
          {isFirstSetup
            ? 'Players will see this as soon as you save.'
            : 'Changes are visible to players straight after saving.'}
        </p>
      </header>

      <FormSection title="Where to find you">
        <TextField label="Centre name" value={configuration.name} onChange={(value) => update('name', value)} error={visibleErrors.name} />
        <TextField
          label="Address"
          value={configuration.address}
          onChange={(value) => update('address', value)}
          autoComplete="street-address"
          error={visibleErrors.address}
        />
        <TextField
          label="City"
          value={configuration.city}
          onChange={(value) => update('city', value)}
          autoComplete="address-level2"
          error={visibleErrors.city}
        />
      </FormSection>

      <FormSection title="Courts and slots" columns>
        <Stepper
          label="Courts"
          value={configuration.courtCount}
          min={MIN_COURTS}
          max={MAX_COURTS}
          onChange={(value) => update('courtCount', value)}
          unit={(count) => (count === 1 ? 'court' : 'courts')}
        />
        <SegmentedControl
          label="Slot length"
          options={SLOT_LENGTH_OPTIONS}
          value={configuration.slotMinutes}
          onChange={(value) => update('slotMinutes', value)}
        />
      </FormSection>

      <div className="space-y-3">
        <ErrorNotice message={saveError} />
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" busy={saving} className="min-w-40">
            {saving ? 'Saving…' : isFirstSetup ? 'Create centre' : 'Save changes'}
          </Button>
          {savedNotice && <span className="text-[14px] text-primary-fg">Saved.</span>}
        </div>
      </div>
    </form>
  )
}

function describeSaveError(error: unknown): string {
  if (error instanceof ApiError && error.code === 'COURT_HAS_BOOKINGS') {
    return `${error.message} Keep those courts until their bookings have been played.`
  }
  return errorMessage(error)
}
