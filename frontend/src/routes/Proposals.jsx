import { useCallback, useEffect, useState } from "react"
import { NavLink } from "react-router-dom"
import AppLayout from "../components/Layout/AppLayout"
import ProposalChanges from "../components/Proposals/ProposalChanges"
import { useAuthProtection } from "../hooks/useAuthProtection"
import { useDocumentationsContext } from "../hooks/useDocumentationsContext"
import { api } from "../api"
import { emit, PROPOSALS_CHANGED } from "../events"

const STATUS_BADGES = {
  pending: { label: "En attente", className: "badge-warning" },
  accepted: { label: "Acceptée", className: "badge-success" },
  rejected: { label: "Refusée", className: "badge-error" },
}

const formatDate = (date) => new Date(date).toLocaleDateString("fr-FR")

const docLink = (proposal) => `/project/${proposal.project_id}/documentation/${proposal.documentation_id}`

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

// Une de mes propositions et son statut
const MyProposalCard = ({ proposal }) => {
  const badge = STATUS_BADGES[proposal.status]
  return (
    <article className="card bg-base-100 border border-base-300">
      <div className="card-body gap-3">
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div>
            <h3 className="card-title">
              <NavLink to={docLink(proposal)} className="hover:underline">{proposal.current_title}</NavLink>
            </h3>
            <p className="text-sm text-base-content/70">
              {proposal.project_title} · envoyée le {formatDate(proposal.created_at)}
            </p>
          </div>
          <span className={`badge badge-soft ${badge.className}`}>{badge.label}</span>
        </div>
        {proposal.status !== "pending" && (
          <p className="text-sm">
            {proposal.status === "accepted" ? "Acceptée" : "Refusée"} par {proposal.reviewed_by_name} le {formatDate(proposal.reviewed_at)}
            {proposal.review_comment && <> : <span className="italic">« {proposal.review_comment} »</span></>}
          </p>
        )}
        <details className="collapse collapse-arrow border border-base-300">
          <summary className="collapse-title text-sm font-medium">Voir les changements proposés</summary>
          <div className="collapse-content">
            <ProposalChanges proposal={proposal} />
          </div>
        </details>
      </div>
    </article>
  )
}

const Proposals = () => {
  useAuthProtection()
  const [tab, setTab] = useState("review")
  const [toReview, setToReview] = useState([])
  const [mine, setMine] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [reviewRes, mineRes] = await Promise.all([
        api.get("/api/proposals/to-review"),
        api.get("/api/proposals/mine"),
      ])
      setToReview(reviewRes.data.proposals)
      setMine(mineRes.data.proposals)
    } catch {
      setError("Erreur lors du chargement des propositions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const list = tab === "review" ? toReview : mine

  return (
    <AppLayout>
      <main className="p-6 m-6 mt-26 flex flex-col gap-6 max-w-4xl">
        <h1 className="text-4xl font-bold">Propositions de modification</h1>

        <div role="tablist" className="tabs tabs-box w-fit">
          <button type="button" role="tab" className={`tab ${tab === "review" ? "tab-active" : ""}`} onClick={() => setTab("review")}>
            À traiter
            {toReview.length > 0 && <span className="badge badge-primary badge-sm ml-2">{toReview.length}</span>}
          </button>
          <button type="button" role="tab" className={`tab ${tab === "mine" ? "tab-active" : ""}`} onClick={() => setTab("mine")}>
            Mes propositions
          </button>
        </div>

        {loading ? (
          <span className="loading loading-spinner loading-lg"></span>
        ) : error ? (
          <div role="alert" className="alert alert-error alert-soft">{error}</div>
        ) : list.length === 0 ? (
          <p className="text-base-content/70">
            {tab === "review" ? "Aucune proposition à traiter." : "Vous n'avez envoyé aucune proposition."}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {tab === "review"
              ? list.map((p) => <ReviewCard key={p.id} proposal={p} onDone={load} />)
              : list.map((p) => <MyProposalCard key={p.id} proposal={p} />)}
          </div>
        )}
      </main>
    </AppLayout>
  )
}

export default Proposals
