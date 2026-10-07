import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import AppLayout from "../components/Layout/AppLayout"
import DocumentPage from "../components/Documents/DocumentPage"
import ProjectOverview from "../components/Projects/ProjectOverview"
import { useProjectsContext } from "../hooks/useProjectsContext"
import { useDocumentationsContext } from "../hooks/useDocumentationsContext"
import { useAuthProtection } from "../hooks/useAuthProtection"

const notFoundMessage = (err, what) =>
  err.response?.status === 404
    ? `${what} introuvable, ou vous n'y avez pas accès.`
    : "Une erreur est survenue lors du chargement des données."

const Project = () => {
  useAuthProtection();

  const { projectId, docId } = useParams()
  const { loadProject } = useProjectsContext()
  const { loadDocumentation, docsVersion } = useDocumentationsContext()

  const [project, setProject] = useState(null)
  const [documentation, setDocumentation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    let cancelled = false

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const loadedProject = await loadProject(projectId)
        if (cancelled) return
        setProject(loadedProject)
      } catch (err) {
        if (!cancelled) {
          setError(notFoundMessage(err, "Projet"))
          setLoading(false)
        }
        return
      }

      if (docId) {
        try {
          const loadedDoc = await loadDocumentation(docId)
          if (!cancelled) setDocumentation(loadedDoc)
        } catch (err) {
          if (!cancelled) setError(notFoundMessage(err, "Documentation"))
        }
      } else {
        setDocumentation(null)
      }
      if (!cancelled) setLoading(false)
    }

    fetchData()
    return () => { cancelled = true }
  }, [projectId, docId, loadProject, loadDocumentation])

  // Une doc modifiée ailleurs (ex. proposition acceptée) : on recharge celle affichée
  useEffect(() => {
    if (docId && docsVersion > 0) {
      loadDocumentation(docId).then(setDocumentation).catch(() => {})
    }
  }, [docsVersion, docId, loadDocumentation])

  if (loading) {
    return (
      <AppLayout>
        <main className="p-6 mt-30 mx-5 flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="ml-4">Chargement...</span>
        </main>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <main className="p-6 mt-30 mx-5">
          <div role="alert" className="alert alert-error alert-soft">{error}</div>
        </main>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      {docId ? (
        <DocumentPage project={project} documentation={documentation} />
      ) : (
        <ProjectOverview project={project} onProjectChanged={setProject} />
      )}
    </AppLayout>
  )
}

export default Project
