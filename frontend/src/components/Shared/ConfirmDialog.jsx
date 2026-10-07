import { useEffect, useRef } from "react"

// Boîte de confirmation (suppression...) : ouverte tant que `open` est vrai
const ConfirmDialog = ({ open, title, message, confirmLabel = "Confirmer", busy, error, onConfirm, onCancel }) => {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={dialogRef} className="modal" onClose={onCancel}>
      <div className="modal-box">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="py-4">{message}</p>
        {error && <div role="alert" className="alert alert-error alert-soft mb-4">{error}</div>}
        <div className="modal-action">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            Annuler
          </button>
          <button type="button" className="btn btn-error" onClick={onConfirm} disabled={busy}>
            {busy ? "..." : confirmLabel}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>Fermer</button>
      </form>
    </dialog>
  )
}

export default ConfirmDialog
