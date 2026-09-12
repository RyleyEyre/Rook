import './CreateShiftPatternPage.css'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiFetch } from '@services/api/useApiFetch.js'
import { useToast } from '@app/providers/ToastProvider.jsx'
import { createShiftPattern } from '@services/api/shiftPatternsApi.js'
import { WeekSchedule } from '@shared/components/composite/WeekSchedule'
import { WeekScheduleEditor } from '@shared/components/composite/WeekScheduleEditor'
import { TextInput } from '@shared/components/composite/Field'
import { Button } from '@shared/components/composite/Button'
import { Card } from '@shared/components/primitives/Card'

export function CreateShiftPatternPage() {
  const apiFetch = useApiFetch()
  const { push } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(null)
  const [days, setDays] = useState([])
  const [timeFormat, setTimeFormat] = useState('12h') // preview-only; this page doesn't read the list page's stored preference — no shared state between them worth wiring up for one toggle
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()

    if (!trimmed) {
      setNameError('Name is required.')
      return
    }

    setSaving(true)
    setNameError(null)

    try {
      const created = await createShiftPattern(apiFetch, trimmed, days)
      push({ tone: 'success', title: 'Shift pattern created', message: `${created.name} was added.` })
      navigate('/shift-patterns')
    } catch (err) {
      if (err.status === 409 && err.problem?.errors?.some((e) => e.code === 'DUPLICATE_VALUE')) {
        setNameError(err.message)
      } else {
        push({ tone: 'error', title: "Couldn't create shift pattern", message: err.message })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="table-page">
      <div className="table-page__header">
        <div>
          <button type="button" className="create-shift-pattern-page__back" onClick={() => navigate('/shift-patterns')}>
            {'\u2039'} Back to shift patterns
          </button>
          <h1 className="table-page__title">Add shift pattern</h1>
          <p className="table-page__subtitle">Drag on a day's timeline to set its hours — a day left blank means not working that day.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="create-shift-pattern-page__form">
        <Card title="Name">
          <TextInput
            label="Pattern name"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(null) }}
            error={nameError}
            placeholder="e.g. Early shift"
            autoFocus
            required
          />
        </Card>

        <Card title="Preview" description="Updates live as you set each day below.">
          <WeekSchedule days={days} timeFormat={timeFormat} />
        </Card>

        <Card title="Hours">
          <WeekScheduleEditor days={days} onChange={setDays} timeFormat={timeFormat} />
        </Card>

        <div className="create-shift-pattern-page__actions">
          <Button variant="secondary" type="button" onClick={() => navigate('/shift-patterns')} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>Create shift pattern</Button>
        </div>
      </form>
    </div>
  )
}
