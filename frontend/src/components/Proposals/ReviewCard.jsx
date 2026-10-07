import { useState } from "react"
import { NavLink } from "react-router-dom"
import ProposalChanges from "./ProposalChanges"
import { useDocumentationsContext } from "../../hooks/useDocumentationsContext"
import { api } from "../../api"
import { emit, PROPOSALS_CHANGED } from "../../events"
import { docLink, formatDate } from "./proposalFormat"

// Proposition à relire : changements + accepter / refuser
const ReviewCard = ({ proposal, onDone }) => {
  const [comment, setComment] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const { notifyDocumentationsChanged } = useDocumentationsContext()
  const outdated = new Date(proposal.documentation_updated_at) > new Date(proposal.created_at)

  const decide = async (action) => {
    setBusy(true)
    setError(null)
    try {
      await api.put(`/api/proposals/${proposal.id}/${action}`, { comment })
      if (action === "accept") notifyDocumentationsChanged()
      emit(PROPOSALS_CHANGED)
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du traitement")
      setBusy(false)
    }
  }

  return (
    <article className="card bg-base-100 border border-base-300">
      <div className="card-body gap-4">
        <div className="flex flex-wrap justify-between gap-2">
          <div>
            <h3 className="card-title">
              <NavLink to={docLink(proposal)} className="hover:underline">{proposal.current_title}</NavLink>
            </h3>
            <p className="text-sm text-base-content/70">
              {proposal.project_title} · proposé par {proposal.proposed_by_name} le {formatDate(proposal.created_at)}
            </p>
          </div>
        </div>

        {proposal.message && (
          <blockquote className="border-l-4 border-base-300 pl-3 italic">{proposal.message}</blockquote>
        )}

        {outdated && (
          <div role="alert" className="alert alert-warning alert-soft text-sm">
            La documentation a été modifiée depuis cette proposition : l'accepter remplacera ces modifications.
          </div>
        )}

        <ProposalChanges proposal={proposal} />

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Commentaire (optionnel)</legend>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows="2"
            className="textarea w-full resize-none"
            placeholder="Un mot pour l'auteur de la proposition"
          />
        </fieldset>

        {error && <div role="alert" className="alert alert-error alert-soft">{error}</div>}

        <div className="card-actions justify-end">
          <button type="button" className="btn btn-error btn-outline" disabled={busy} onClick={() => decide("reject")}>
            Refuser
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => decide("accept")}>
            Accepter et publier
          </button>
        </div>
      </div>
    </article>
  )
}

export default ReviewCard
