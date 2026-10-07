import ProjectListItem from './ProjectListItem'
import { useAuth } from '../../hooks/useAuth'

// Section de la sidebar où ranger un projet
const sectionOf = (project, user) => {
  if (project.visibility === 'group') {
    return project.group_id === user?.group_id ? 'group' : 'other'
  }
  if (project.visibility === 'public') return 'public'
  return project.created_by === user?.id ? 'mine' : 'other'
}

const ProjectList = ({ projects, loading, error, searchTerm }) => {
  const { user: authUser } = useAuth()
  const currentUser = authUser?.user

  const filteredProjects = searchTerm
    ? projects.filter(project =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : projects

  if (loading) {
    return (
      <li className="text-base-content/70 italic text-center py-4">
        Chargement des projets...
      </li>
    )
  }

  if (error) {
    return (
      <li className="text-error italic text-center py-4">
        {error}
      </li>
    )
  }

  if (filteredProjects.length === 0) {
    return (
      <li className="text-base-content/70 italic text-center py-4">
        {searchTerm ? 'Aucun projet trouvé' : 'Aucun projet'}
      </li>
    )
  }

  const sections = [
    { key: 'group', title: currentUser?.group_name ? `Groupe ${currentUser.group_name}` : 'Mon groupe' },
    { key: 'mine', title: 'Mes projets privés' },
    { key: 'public', title: 'Publics' },
    { key: 'other', title: 'Autres projets' },
  ]

  return (
    <>
      {sections.map(({ key, title }) => {
        const sectionProjects = filteredProjects.filter(p => sectionOf(p, currentUser) === key)
        if (sectionProjects.length === 0) return null
        return [
          <li key={`title-${key}`} className="menu-title mt-2">{title}</li>,
          ...sectionProjects.map(project => (
            <ProjectListItem key={project.id} project={project} />
          )),
        ]
      })}
    </>
  )
}

export default ProjectList
