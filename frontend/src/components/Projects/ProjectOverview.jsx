import { useEffect, useState } from "react"
import { NavLink, useNavigate, useSearchParams } from "react-router-dom"
import { useDocumentationsContext } from "../../hooks/useDocumentationsContext"
import { useProjectsContext } from "../../hooks/useProjectsContext"
import ProjectEditModal from "./ProjectEditModal"
import ConfirmDialog from "../Shared/ConfirmDialog"
import { VISIBILITY_LABELS } from "./visibility"

const VISIBILITY_BADGES = { public: "badge-success badge-soft", group: "badge-info badge-soft", private: "badge-outline" }

// Page d'accueil d'un projet : infos, documentations, gestion
const ProjectOverview = ({ project, onProjectChanged }) => {
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()
  const { loadProjectDocumentations, docsVersion } = useDocumentationsContext()
  const { deleteProject } = useProjectsContext()
  const [docs, setDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setDocsLoading(true)
    loadProjectDocumentations(project.id)
      .then((list) => { if (!cancelled) setDocs(list) })
      .catch(() => { if (!cancelled) setDocs([]) })
      .finally(() => { if (!cancelled) setDocsLoading(false) })
    return () => { cancelled = true }
  }, [project.id, docsVersion, loadProjectDocumentations])

  const handleNewDoc = () => {
    setSearchParams((params) => {
      params.set("nouvelleDoc", project.id)
      return params
    })
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteProject(project.id)
      navigate("/")
    } catch (error) {
      setDeleteError(error.response?.data?.message || "Erreur lors de la suppression du projet")
      setDeleting(false)
    }
  }

  const canManage = project.permissions?.canManage

  return (
    <main className="p-6 mt-30 mx-5 border-1 border-dashed border-base-300 rounded">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-6 border-b border-base-300">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <span className={`badge ${VISIBILITY_BADGES[project.visibility]}`}>
              {project.visibility === "group" ? `Groupe ${project.group_name}` : VISIBILITY_LABELS[project.visibility]}
            </span>
          </div>
          <p className="text-sm text-base-content/70 mt-1">
            Créé par {project.creator_name} le {new Date(project.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <button type="button" className="btn btn-sm" onClick={() => setEditOpen(true)}>
              Modifier
            </button>
            <button type="button" className="btn btn-sm btn-error btn-outline" onClick={() => setDeleteOpen(true)}>
              Supprimer
            </button>
          </div>
        )}
      </div>

      <p className="mb-8 whitespace-pre-line">
        {project.description || <span className="text-base-content/50">Pas de description</span>}
      </p>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Documentations</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={handleNewDoc}>
          Nouvelle documentation
        </button>
      </div>

      {docsLoading ? (
        <span className="loading loading-spinner"></span>
      ) : docs.length === 0 ? (
        <p className="text-base-content/70">Aucune documentation pour le moment.</p>
      ) : (
        <ul className="list bg-base-100 rounded-box border border-base-300">
          {docs.map((doc) => (
            <li key={doc.id} className="list-row">
              <NavLink to={`/project/${project.id}/documentation/${doc.id}`} className="list-col-grow hover:underline">
                <div className="font-medium">{doc.title}</div>
                {doc.excerpt && <div className="text-sm text-base-content/70">{doc.excerpt}</div>}
              </NavLink>
              <div className="text-sm text-base-content/70 text-right">
                {doc.author_name}
                <div>{new Date(doc.updated_at || doc.created_at).toLocaleDateString("fr-FR")}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <>
          <ProjectEditModal
            project={project}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSaved={onProjectChanged}
          />
          <ConfirmDialog
            open={deleteOpen}
            title="Supprimer le projet ?"
            message={`« ${project.title} » et ses ${docs.length} documentation(s) seront définitivement supprimés.`}
            confirmLabel="Supprimer"
            busy={deleting}
            error={deleteError}
            onConfirm={handleDelete}
            onCancel={() => { setDeleteOpen(false); setDeleteError(null) }}
          />
        </>
      )}
    </main>
  )
}

export default ProjectOverview
