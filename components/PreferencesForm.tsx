'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { savePreferences } from '@/app/actions'
import type { Preferences } from '@/lib/db'

export default function PreferencesForm({
  initial,
  mode = 'onboarding',
}: {
  initial: Preferences
  mode?: 'onboarding' | 'edit'
}) {
  const [artists, setArtists] = useState(initial.artists.join(', '))
  const [cities, setCities] = useState(initial.cities.join(', '))
  const [venues, setVenues] = useState(initial.venues.join(', '))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const parse = (s: string) =>
      s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    const prefs: Preferences = {
      artists: parse(artists),
      cities: parse(cities),
      venues: parse(venues),
    }
    startTransition(async () => {
      try {
        await savePreferences(prefs)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-2xl">
      {mode === 'onboarding' ? (
        <div>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-3">
            Tell us what you like
          </h2>
          <p className="text-neutral-600">
            We&apos;ll suggest upcoming exhibitions that match. You can change
            this anytime.
          </p>
        </div>
      ) : null}

      <Field
        label="Artists"
        hint="Comma separated. e.g. Yayoi Kusama, Kerry James Marshall"
        value={artists}
        onChange={setArtists}
      />
      <Field
        label="Cities"
        hint="Where do you visit? e.g. New York, London, Paris"
        value={cities}
        onChange={setCities}
      />
      <Field
        label="Museums / galleries"
        hint="Specific venues to follow. e.g. MoMA, Tate Modern, Gagosian"
        value={venues}
        onChange={setVenues}
      />

      {error ? <div className="text-sm text-red-700">{error}</div> : null}

      <div className="pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="text-xs uppercase tracking-widest border border-black px-6 py-3 hover:bg-black hover:text-white transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving…' : mode === 'onboarding' ? 'Continue' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-neutral-500 block mb-2">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-b border-black py-2 text-lg font-light focus:outline-none focus:border-b-2"
      />
      {hint ? (
        <span className="text-xs text-neutral-500 block mt-2">{hint}</span>
      ) : null}
    </label>
  )
}
