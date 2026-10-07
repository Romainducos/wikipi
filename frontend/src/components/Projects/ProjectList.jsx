import ProjectListItem from './ProjectListItem'

const ProjectList = ({ projects, loading, error, searchTerm }) => {
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

  return (
    <>
      {filteredProjects.map(project => (
        <ProjectListItem
          key={project.id}
          project={project}
        />
      ))}
    </>
  )
}

export default ProjectList