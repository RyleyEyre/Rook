import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@shared/utils/cn.js'
import { Icon } from '@shared/components/primitives/Icon'
import { IconButton } from '@shared/components/composite/Button'
import { HoldToConfirmButton } from '@shared/components/composite/HoldToConfirmButton'
import './Menu.css'

/**
 * A "..." trigger that opens a small floating list of actions.
 *
 * Rendered through a portal into document.body at a *fixed* position
 * computed from the trigger's own bounding box, rather than a plain
 * `position: absolute` panel nested inside the trigger. That's not
 * decorative — this is built to live inside DataTable's per-row actions
 * cell, and `.table-scroll` (DataTable's scrolling wrapper) has
 * `overflow-y: auto`. A row near the bottom of a tall table would clip an
 * absolutely-positioned panel the moment it tried to open downward, so the
 * portal is what lets the panel escape that clipping and paint on top of
 * everything else instead.
 *
 * `items`: [{ key, label, icon?, onClick, variant?: 'danger', disabled? }]
 * A `{ key, type: 'divider' }` entry renders a thin separator line instead
 * of a button — used to visually group related items apart from the rest.
 * An item can also opt into `type: 'hold'` instead of a plain click —
 * renders as a press-and-hold fill button right inside the panel (needs
 * `holdMs`, and `holdingLabel`/`doneLabel` for the mid-hold/done text) so
 * a destructive action can require a deliberate hold without needing a
 * separate confirmation modal at all. `onClick` still fires once the hold
 * completes, same contract as a normal item — it's the *trigger* that's
 * different, not what happens after.
 * `align`: which edge of the trigger the panel hangs from — 'end' (right
 * edge, opens leftward) is the sensible default for a rightmost table
 * column so the panel doesn't run off the viewport edge.
 */
export function Menu({ items, label = 'Actions', align = 'end', triggerIcon = 'dotsVertical', triggerSize = 24 }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState(null)
  const anchorRef = useRef(null)

  function openMenu(e) {
    e.stopPropagation()
    const rect = anchorRef.current.getBoundingClientRect()
    setCoords(
      align === 'end'
        ? { top: rect.bottom + 6, right: window.innerWidth - rect.right }
        : { top: rect.bottom + 6, left: rect.left }
    )
    setOpen(true)
  }

  function closeMenu() {
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return

    function onKey(e) {
      if (e.key === 'Escape') closeMenu()
    }
    // Closing on scroll/resize rather than re-measuring and repositioning
    // — cheaper, and avoids a floating panel visibly swimming around while
    // the table body is mid-scroll. Reopening it is one click.
    function onScrollOrResize() {
      closeMenu()
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open])

  return (
    <>
      <span ref={anchorRef} className="menu-anchor" onClick={(e) => e.stopPropagation()}>
        <IconButton icon={triggerIcon} label={label} size={triggerSize} onClick={(e) => (open ? closeMenu() : openMenu(e))} />
      </span>

      {open && coords && createPortal(
        <>
          <div className="menu-scrim" onClick={closeMenu} />
          <div className="menu__panel" style={coords} role="menu">
            {items.map((item) => (
              item.type === 'divider' ? (
                <div key={item.key} className="menu__divider" role="separator" />
              ) : item.type === 'hold' ? (
                <div key={item.key} className="menu__item-hold">
                  <HoldToConfirmButton
                    label={item.label}
                    holdingLabel={item.holdingLabel}
                    confirmingLabel={item.confirmingLabel}
                    doneLabel={item.doneLabel}
                    failedLabel={item.failedLabel}
                    holdMs={item.holdMs}
                    disabled={item.disabled}
                    onConfirm={async () => {
                      // Awaiting (not firing-and-forgetting) means a
                      // rejection here correctly reaches this button's own
                      // done/failed animation — and, just as importantly,
                      // skips the auto-close below entirely (the `await`
                      // throws before reaching it), so a failure stays
                      // visible instead of the menu vanishing over it.
                      await item.onClick?.()
                      // Same beat ConfirmModal uses after its own hold
                      // completes — long enough to see the checkmark
                      // before the panel disappears out from under it.
                      setTimeout(closeMenu, 700)
                    }}
                  />
                </div>
              ) : (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  className={cn('menu__item', item.variant === 'danger' && 'menu__item--danger')}
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation()
                    closeMenu()
                    // A plain item's onClick can itself return a
                    // rejecting promise (e.g. requestDeleteFromMenu, when
                    // deleteConfirmSeconds is 0) — nothing here needs to
                    // react to that (the caller's own toast already
                    // explains the failure), but nothing catches it
                    // either, which would otherwise surface as a stray
                    // unhandled-rejection console warning.
                    Promise.resolve(item.onClick?.()).catch(() => {})
                  }}
                >
                  {item.icon && <Icon name={item.icon} size={15} />}
                  <span>{item.label}</span>
                </button>
              )
            ))}
            {items.length === 0 && <div className="menu__empty">No actions</div>}
          </div>
        </>,
        document.body
      )}
    </>
  )
}
