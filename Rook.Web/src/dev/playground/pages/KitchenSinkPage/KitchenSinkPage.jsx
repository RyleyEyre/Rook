import { useState } from 'react'
import { Button, IconButton } from '@shared/components/composite/Button'
import { HoldToConfirmButton } from '@shared/components/composite/HoldToConfirmButton'
import { TextInput, Textarea, Select, Checkbox, RadioGroup, ToggleSwitch } from '@shared/components/composite/Field'
import { Badge } from '@shared/components/primitives/Badge'
import { Banner } from '@shared/components/composite/Banner'
import { Card, CardRow } from '@shared/components/primitives/Card'
import { Avatar } from '@shared/components/primitives/Avatar'
import { ProgressBar } from '@shared/components/primitives/ProgressBar'
import { Skeleton } from '@shared/components/primitives/Skeleton'
import { Tabs } from '@shared/components/primitives/Tabs'
import { Tooltip } from '@shared/components/primitives/Tooltip'
import { Modal } from '@shared/components/composite/Modal'
import { ConfirmModal } from '@shared/components/composite/ConfirmModal'
import { Icon } from '@shared/components/primitives/Icon'
import { useToast } from '@app/providers/ToastProvider.jsx'
import './KitchenSinkPage.css'

export function KitchenSinkPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [tab, setTab] = useState('overview')
  const [radio, setRadio] = useState('user')
  const [toggle1, setToggle1] = useState(true)
  const [toggle2, setToggle2] = useState(false)
  const [errorField, setErrorField] = useState(true)
  const { push } = useToast()

  return (
    <div className="sink-page">
      <h1>Component Reference</h1>
      <p className="sink-intro">Every shared element in its default, hover, focus, disabled, loading and error states — this is what changes when you switch style, mode, or accent above.</p>

      <section className="sink-section">
        <h2>Buttons</h2>
        <p className="sink-section__desc">Hover and press any of these — hover/active states are handled by the shared stylesheet per visual style.</p>
        <div className="sink-row">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger" icon="trash">Danger</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
        <div className="sink-row">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <IconButton icon="edit" label="Edit" />
          <IconButton icon="trash" label="Delete" variant="danger" />
          <IconButton icon="refresh" label="Refresh" />
        </div>
      </section>

      <section className="sink-section">
        <h2>Destructive actions</h2>
        <p className="sink-section__desc">
          Danger should feel different, not just red. Two friction patterns are used throughout Rook: a press-and-hold
          fill (fast, single-step actions) and a typed-confirmation modal, GitHub-settings style (higher-stakes,
          harder-to-reverse actions like the employee table's delete).
        </p>
        <div className="sink-row">
          <div>
            <div className="state-label">Hold for 2 seconds</div>
            <HoldToConfirmButton label="Hold to revoke API token" onConfirm={() => push({ tone: 'success', title: 'Token revoked' })} />
          </div>
          <div>
            <div className="state-label">Type-to-confirm modal</div>
            <Button variant="danger" icon="trash" onClick={() => setDeleteOpen(true)}>Delete department…</Button>
          </div>
        </div>
        <Card
          danger
          title="Danger Zone"
          description="Actions here are permanent or hard to reverse."
        >
          <CardRow
            title="Transfer ownership"
            description="Move this department's records to another admin."
            action={<Button variant="secondary" size="sm">Transfer</Button>}
          />
          <CardRow
            title="Delete this department"
            description="Fails if any employee still references it (RECORD_IN_USE)."
            action={<Button variant="danger" size="sm" icon="trash" onClick={() => setDeleteOpen(true)}>Delete</Button>}
          />
        </Card>
      </section>

      <section className="sink-section">
        <h2>Text inputs</h2>
        <div className="sink-grid">
          <TextInput label="Default" placeholder="Jane Cooper" hint="Helper text goes here." />
          <TextInput label="With icon" placeholder="Search…" icon="search" />
          <TextInput label="Password" type="password" placeholder="••••••••" icon="lock" />
          <TextInput
            label="Error state"
            placeholder="taken.username"
            value="taken.username"
            onChange={() => setErrorField(true)}
            error={errorField ? 'DUPLICATE_VALUE — a record with this value already exists.' : undefined}
          />
          <TextInput label="Disabled" placeholder="Can't edit this" disabled />
          <Select label="Select">
            <option>Engineering</option>
            <option>Customer Support</option>
            <option>Finance</option>
          </Select>
        </div>
        <Textarea label="Textarea" placeholder="Notes about this record…" hint="Optional, up to 500 characters." />
      </section>

      <section className="sink-section">
        <h2>Selection controls</h2>
        <div className="sink-row">
          <Checkbox label="Send welcome email" defaultChecked />
          <Checkbox label="Unchecked option" />
          <ToggleSwitch label="Enable live presence" checked={toggle1} onChange={setToggle1} />
          <ToggleSwitch label="Maintenance mode" checked={toggle2} onChange={setToggle2} />
        </div>
        <RadioGroup
          name="role"
          value={radio}
          onChange={setRadio}
          options={[
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' },
          ]}
        />
      </section>

      <section className="sink-section">
        <h2>Badges &amp; status</h2>
        <div className="sink-row">
          <Badge tone="neutral">Neutral</Badge>
          <Badge tone="success" dot>Active</Badge>
          <Badge tone="warning">Incomplete profile</Badge>
          <Badge tone="danger" dot>Terminated</Badge>
          <Badge tone="info">Admin</Badge>
        </div>
      </section>

      <section className="sink-section">
        <h2>Banners</h2>
        <Banner tone="info" title="Heads up">This is an informational banner, e.g. for background sync status.</Banner>
        <Banner tone="success" title="Saved">Your changes have been saved successfully.</Banner>
        <Banner tone="warning" title="List changed" dismissible>
          Another admin updated this list. <a href="#refresh" onClick={(e) => e.preventDefault()}>Refresh to see the latest.</a>
        </Banner>
        <Banner tone="error" title="Something went wrong">RECORD_IN_USE — can't delete, 3 employee(s) still reference this department.</Banner>
      </section>

      <section className="sink-section">
        <h2>Toasts</h2>
        <p className="sink-section__desc">Transient confirmations for actions that already happened, stacked bottom-right.</p>
        <div className="sink-row">
          <Button variant="secondary" onClick={() => push({ tone: 'success', title: 'Saved', message: 'Department updated.' })}>Trigger success</Button>
          <Button variant="secondary" onClick={() => push({ tone: 'error', title: 'Failed', message: 'VALIDATION_FAILED — Name is required.' })}>Trigger error</Button>
          <Button variant="secondary" onClick={() => push({ tone: 'info', title: 'Heads up', message: 'Refreshing employee list…' })}>Trigger info</Button>
        </div>
      </section>

      <section className="sink-section">
        <h2>Tabs</h2>
        <Tabs
          tabs={[
            { value: 'overview', label: 'Overview' },
            { value: 'activity', label: 'Activity' },
            { value: 'danger', label: 'Danger Zone' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <p className="sink-section__desc">Selected: <strong>{tab}</strong></p>
      </section>

      <section className="sink-section">
        <h2>Avatars, progress &amp; loading</h2>
        <div className="sink-row">
          <Avatar name="Ava Nguyen" />
          <Avatar name="Liam Smith" size={44} />
          <Tooltip label="Presence: viewing this row"><Avatar name="Noah Kim" size={26} /></Tooltip>
        </div>
        <ProgressBar value={62} label={<><span>Profile completeness</span><span>62%</span></>} />
        <div className="sink-row" style={{ marginTop: 12 }}>
          <Skeleton width={220} />
          <Skeleton width={120} />
          <Skeleton width={60} height={24} />
        </div>
      </section>

      <section className="sink-section">
        <h2>Cards &amp; modals</h2>
        <Card title="Shift Pattern: Day Shift (M-F)" description="5 days configured" actions={<Button size="sm" variant="secondary">Edit</Button>}>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-text-muted)' }}>Mon–Fri, 09:00–17:00</p>
        </Card>
        <Button variant="secondary" onClick={() => setModalOpen(true)}>Open example modal</Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Example dialog"
          footer={<>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setModalOpen(false)}>Confirm</Button>
          </>}
        >
          <p style={{ marginTop: 0 }}>Standard, non-destructive dialog — used for create/edit forms.</p>
        </Modal>
        <ConfirmModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          recordLabel="department"
          recordName="Customer Support"
          consequence="Any employees currently assigned to it will need reassignment first."
          onConfirm={() => push({ tone: 'success', title: 'Deleted', message: 'Customer Support was deleted.' })}
        />
      </section>

      <section className="sink-section">
        <h2>Iconography</h2>
        <p className="sink-section__desc">Hover (or Tab to) any icon to see its animation — each one is purpose-built for what the icon means, not a generic effect.</p>
        <div className="sink-row">
          {[
            'search', 'edit', 'trash', 'sun', 'moon', 'check', 'x', 'warning', 'info', 'plus',
            'user', 'bell', 'lock', 'refresh', 'filter', 'dots', 'eye', 'eyeOff',
            'chevronDown', 'chevronRight', 'sortUp', 'sortDown', 'sortBoth',
          ].map((name) => (
            <Tooltip key={name} label={name}>
              <span className="icon-preview" tabIndex={0}>
                <Icon name={name} size={17} />
              </span>
            </Tooltip>
          ))}
        </div>
      </section>
    </div>
  )
}
