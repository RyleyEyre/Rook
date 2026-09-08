import { useState } from 'react'
import { Modal } from '@shared/components/composite/Modal'
import { Icon } from '@shared/components/primitives/Icon'
import { Button } from '@shared/components/composite/Button'
import { HoldToConfirmButton } from '@shared/components/composite/HoldToConfirmButton'
import './ConfirmModal.css'

const CONFIRM_WORD = 'CONFIRM'

/**
 * GitHub-settings-style destructive confirmation, covering both flows the
 * app needs from one component:
 * - a single record (pass `recordName`): explain the consequence, require
 *   typing the record's name back, then require a 2-second hold on the
 *   final button before it fires.
 * - more than one record (pass `count` > 1, no `recordName`): the
 *   toolbar's Delete control already required a hold to get here, so this
 *   asks the user to type the literal word CONFIRM instead of holding
 *   again, naming the exact count and record type.
 */
export function ConfirmModal({
  open, onClose, count = 1, recordLabel = 'record', recordLabelPlural, recordName, consequence, onConfirm, holdMs = 2000,
}) {
  const [typed, setTyped] = useState('')
  const isSingle = Boolean(recordName)
  const plural = recordLabelPlural || `${recordLabel}s`
  const noun = count === 1 ? recordLabel : plural
  const matches = isSingle
    ? typed.trim().toLowerCase() === recordName.trim().toLowerCase()
    : typed.trim().toUpperCase() === CONFIRM_WORD

  const close = () => { setTyped(''); onClose?.() }

  return (
    <Modal open={open} onClose={close} title={isSingle ? `Delete ${recordLabel}` : `Delete ${count} ${noun}?`} tone="danger">
      <div className="danger-notice">
        <Icon name="warning" size={20} />
        {isSingle ? (
          <p>
            You are about to delete <strong>{recordName}</strong>. {consequence}
            {' '}This action is logged and cannot be undone from this screen.
          </p>
        ) : (
          <p>
            You are about to delete <strong>{count} {noun}</strong>. This action is logged and cannot be undone from this screen.
          </p>
        )}
      </div>

      <label className="field__label" htmlFor="confirm-type">
        {isSingle ? <>Type <strong>{recordName}</strong> to confirm</> : <>Type <strong>{CONFIRM_WORD}</strong> to continue</>}
      </label>
      <input
        id="confirm-type"
        className="field__input confirm-type-input"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={isSingle ? recordName : CONFIRM_WORD}
        autoComplete="off"
        autoFocus
      />

      <div className="confirm-delete-actions">
        <Button variant="secondary" onClick={close}>Cancel</Button>
        {isSingle ? (
          <HoldToConfirmButton
            label={matches ? 'Hold to delete' : 'Type the name to unlock'}
            holdingLabel="Keep holding to delete…"
            doneLabel="Deleted"
            disabled={!matches}
            holdMs={holdMs}
            onConfirm={() => {
              onConfirm?.()
              setTimeout(close, 700)
            }}
          />
        ) : (
          <Button variant="danger" icon="trash" disabled={!matches} onClick={() => { onConfirm?.(); close() }}>
            Delete {count} {noun}
          </Button>
        )}
      </div>
    </Modal>
  )
}
