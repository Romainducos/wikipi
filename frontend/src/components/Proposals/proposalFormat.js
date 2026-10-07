export const formatDate = (date) => new Date(date).toLocaleDateString("fr-FR")

export const docLink = (proposal) =>
  `/project/${proposal.project_id}/documentation/${proposal.documentation_id}`
