import { useState, useEffect, useCallback } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { useDocumentationsContext } from '../../hooks/useDocumentationsContext'

const ProjectListItem = ({ project }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [projectDocs, setProjectDocs] = useState([])
  const [, setSearchParams] = useSearchParams()
  const { loadProjectDocumentations, docsVersion } = useDocumentationsContext()

  const loadDocs = useCallback(async () => {
    try {
      const docs = await loadProjectDocumentations(project.id)
      setProjectDocs(docs)
    } catch (error) {
      console.error('Erreur chargement docs:', error)
    }
  }, [loadProjectDocumentations, project.id])

  // Charge à l'ouverture, puis recharge après chaque création / modification de doc
  useEffect(() => {
    if (isOpen) loadDocs()
  }, [isOpen, docsVersion, loadDocs])

  const handleNewDoc = () => {
    setSearchParams((params) => {
      params.set('nouvelleDoc', project.id)
      return params
    })
  }

  return (
    <li>
      <details open={isOpen} onToggle={(e) => setIsOpen(e.currentTarget.open)}>
        <summary className="cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          {project.title}
        </summary>

        {isOpen && (
          <ul className="ml-4 mt-2 space-y-1">
            <li>
              <NavLink
                to={`/project/${project.id}`}
                end
                className={({ isActive }) =>
                  `block px-2 py-1 rounded font-medium hover:bg-base-300 ${isActive ? 'bg-base-300' : ''}`
                }
              >
                Vue d'ensemble
              </NavLink>
            </li>
            <li>
              <button
                type="button"
                className="btn btn-sm flex justify-start"
                onClick={handleNewDoc}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Nouvelle Documentation
              </button>
            </li>

            {projectDocs.length === 0 ? (
              <li className="text-base-content/70 text-sm py-2 text-center">
                Aucune documentation
              </li>
            ) : (
              projectDocs.map(doc => (
                <li key={doc.id}>
                  <NavLink
                    to={`/project/${project.id}/documentation/${doc.id}`}
                    className={({ isActive }) =>
                      `block px-2 py-1 rounded hover:bg-base-300 ${isActive ? 'bg-base-300' : ''}`
                    }
                  >
                    {doc.title}
                  </NavLink>
                </li>
              ))
            )}
          </ul>
        )}
      </details>
    </li>
  )
}

export default ProjectListItem
