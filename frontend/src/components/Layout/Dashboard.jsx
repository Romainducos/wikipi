// Statistiques générales du tableau de bord admin
const Dashboard = ({ stats }) => {
  if (!stats) {
    return <p className="text-base-content/70">Statistiques indisponibles.</p>
  }

  return (
    <div className="stats stats-vertical sm:stats-horizontal border border-base-300 w-full">
      <div className="stat">
        <div className="stat-title">Utilisateurs</div>
        <div className="stat-value">{stats.users}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Projets</div>
        <div className="stat-value">{stats.projects}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Documentations</div>
        <div className="stat-value">{stats.documents}</div>
      </div>
    </div>
  )
}

export default Dashboard
