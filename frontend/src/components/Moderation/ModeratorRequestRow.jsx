import { useState } from "react"
import { api } from "../../api"

const formatDate = (date) => new Date(date).toLocaleDateString("fr-FR")

// Demande pour devenir modérateur : accepter / refuser (admins),
// lecture seule pour les modos (`readOnly`)
const ModeratorRequestRow = ({ request, onDone, readOnly = false }) => {
  const [comment, setComment] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const decide = async (action) => {
    setBusy(true)
    setError(null)
    try {
      await api.put(`/api/moderator-requests/${request.id}/${action}`, { comment })
      await onDone()
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du traitement")
      setBusy(false)
    }
  }

  return (
    <li className="flex flex-col gap-2 border border-base-300 rounded-box p-4">
      <div>
        <span className="font-medium">{request.user_name}</span>{" "}
        <span className="text-sm text-base-content/70">{request.user_email} · {formatDate(request.created_at)}</span>
      </div>
      <blockquote className="border-l-4 border-base-300 pl-3 italic whitespace-pre-line">{request.motivation}</blockquote>
      {readOnly ? (
        <p className="text-sm text-base-content/70">Seul un administrateur peut valider cette demande.</p>
      ) : (
        <>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            placeholder="Commentaire (optionnel)"
            aria-label={`Commentaire pour ${request.user_name}`}
            className="input input-sm w-full"
          />
          {error && <div role="alert" className="alert alert-error alert-soft">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-sm btn-error btn-outline" disabled={busy} onClick={() => decide("reject")}>Refuser</button>
            <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => decide("accept")}>Nommer modérateur</button>
          </div>
        </>
      )}
    </li>
  )
}

export default ModeratorRequestRow
