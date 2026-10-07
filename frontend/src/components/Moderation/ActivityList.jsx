import { useCallback, useEffect, useState } from "react"
import { NavLink } from "react-router-dom"
import ConfirmDialog from "../Shared/ConfirmDialog"
import { useDocumentationsContext } from "../../hooks/useDocumentationsContext"
import { VISIBILITY_LABELS } from "../Projects/visibility"
import { api } from "../../api"

const FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "created", label: "Créées" },
  { value: "updated", label: "Modifiées" },
]

const formatDateTime = (date) =>
  new Date(date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })

// Dernières documentations du site, pour repérer ce qui doit être relu
const ActivityList = () => {
  const { deleteDocumentation } = useDocumentationsContext()
  const [filter, setFilter] = useState("all")
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/moderation/activity?type=${filter}`)
      setDocs(res.data.documentations)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du chargement de l'activité")
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteDocumentation(toDelete.id)
      setToDelete(null)
      await load()
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="join" role="radiogroup" aria-label="Filtrer l'activité">
        {FILTERS.map((option) => (
          <input
            key={option.value}
            type="radio"
            name="activity-filter"
            className="join-item btn btn-sm"
            aria-label={option.label}
            checked={filter === option.value}
            onChange={() => setFilter(option.value)}
          />
        ))}
      </div>

      {loading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : error ? (
        <div role="alert" className="alert alert-error alert-soft">{error}</div>
      ) : docs.length === 0 ? (
        <p className="text-base-content/70">Aucune documentation.</p>
      ) : (
        <ul className="list bg-base-100 rounded-box border border-base-300">
          {docs.map((doc) => {
            const docUrl = `/project/${doc.project_id}/documentation/${doc.id}`
            return (
              <li key={doc.id} className="list-row items-center">
                <div className="list-col-grow">
                  <NavLink to={docUrl} className="font-medium hover:underline">{doc.title}</NavLink>
                  <div className="text-sm text-base-content/70">
                    {doc.project_title}{" "}
                    <span className="badge badge-xs badge-outline">
                      {doc.project_visibility === "group" ? `Groupe ${doc.group_name}` : VISIBILITY_LABELS[doc.project_visibility]}
                    </span>
                  </div>
                  <div className="text-xs text-base-content/70">
                    {doc.was_updated
                      ? `Modifiée par ${doc.last_modified_by_name || doc.author_name} le ${formatDateTime(doc.updated_at)} · créée par ${doc.author_name}`
                      : `Créée par ${doc.author_name} le ${formatDateTime(doc.created_at)}`}
                  </div>
                </div>
                <NavLink to={`${docUrl}/edit`} className="btn btn-xs">Modifier</NavLink>
                <button type="button" className="btn btn-xs btn-error btn-outline" onClick={() => { setDeleteError(null); setToDelete(doc) }}>
                  Supprimer
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer la documentation ?"
        message={toDelete ? `« ${toDelete.title} » (${toDelete.project_title}) sera définitivement supprimée.` : ""}
        confirmLabel="Supprimer"
        busy={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}

export default ActivityList
