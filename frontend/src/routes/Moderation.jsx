import { useCallback, useEffect, useState } from "react"
import AppLayout from "../components/Layout/AppLayout"
import ReviewCard from "../components/Proposals/ReviewCard"
import ActivityList from "../components/Moderation/ActivityList"
import ModeratorRequestRow from "../components/Moderation/ModeratorRequestRow"
import { useAuthProtection } from "../hooks/useAuthProtection"
import { useAuth } from "../hooks/useAuth"
import { isAdminRole, isModeratorOrAdminRole } from "../roles"
import { api } from "../api"

// Espace de travail des modos et des admins
const Moderation = () => {
  const { loading: authLoading } = useAuthProtection()
  const { user: authUser } = useAuth()
  const role = authUser?.user.role
  const allowed = isModeratorOrAdminRole(role)
  const [tab, setTab] = useState("proposals")
  const [proposals, setProposals] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const [proposalsRes, requestsRes] = await Promise.all([
        api.get("/api/proposals/to-review"),
        api.get("/api/moderator-requests"),
      ])
      setProposals(proposalsRes.data.proposals)
      setRequests(requestsRes.data.requests)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (allowed) load()
  }, [allowed, load])

  const tabs = [
    { value: "proposals", label: "Propositions à traiter", count: proposals.length },
    { value: "activity", label: "Activité récente" },
    { value: "requests", label: "Demandes de modération", count: requests.length },
  ]

  return (
    <AppLayout>
      <main className="p-6 m-6 mt-26 flex flex-col gap-6 max-w-5xl">
        <h1 className="text-4xl font-bold">Modération</h1>

        {authLoading ? (
          <span className="loading loading-spinner loading-lg"></span>
        ) : !allowed ? (
          <div role="alert" className="alert alert-error alert-soft">
            Accès refusé. Cette page est réservée aux modérateurs et aux administrateurs.
          </div>
        ) : (
          <>
            <div role="tablist" className="tabs tabs-box w-fit">
              {tabs.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  className={`tab ${tab === t.value ? "tab-active" : ""}`}
                  onClick={() => setTab(t.value)}
                >
                  {t.label}
                  {t.count > 0 && <span className="badge badge-primary badge-sm ml-2">{t.count}</span>}
                </button>
              ))}
            </div>

            {loading ? (
              <span className="loading loading-spinner loading-lg"></span>
            ) : error ? (
              <div role="alert" className="alert alert-error alert-soft">{error}</div>
            ) : tab === "proposals" ? (
              proposals.length === 0 ? (
                <p className="text-base-content/70">Aucune proposition à traiter.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {proposals.map((p) => <ReviewCard key={p.id} proposal={p} onDone={load} />)}
                </div>
              )
            ) : tab === "activity" ? (
              <ActivityList />
            ) : requests.length === 0 ? (
              <p className="text-base-content/70">Aucune demande en attente.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {requests.map((request) => (
                  <ModeratorRequestRow
                    key={request.id}
                    request={request}
                    onDone={load}
                    readOnly={!isAdminRole(role)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </AppLayout>
  )
}

export default Moderation
