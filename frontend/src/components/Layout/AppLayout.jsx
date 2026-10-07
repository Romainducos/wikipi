import NavigationBar from "./NavigationBar"
import ProjectSidebar from "./ProjectSidebar"
import DocumentCreationModal from "../Documents/DocumentCreationModal"
import ProjectCreationModal from "../Projects/ProjectCreationModal"

// Modales de création disponibles sur toutes les pages (sidebar, bandeau...)
const AppLayout = ({ children }) => {
  return (
    <div>
      <NavigationBar />
      <ProjectSidebar>
        {children}
      </ProjectSidebar>
      <DocumentCreationModal />
      <ProjectCreationModal />
    </div>
  )
}

export default AppLayout
