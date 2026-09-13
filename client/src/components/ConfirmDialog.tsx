import { useEffect } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-heading text-2xl uppercase">
          {title}
        </h2>
        <p className="mt-2 text-sm text-charcoal-light">{message}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn btn-secondary" autoFocus>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="btn btn-primary" disabled={busy}>
            {busy ? 'Un instant…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
