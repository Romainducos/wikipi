import { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthProtection } from '../hooks/useAuthProtection';
import { api } from '../api';
import AppLayout from "../components/Layout/AppLayout"
import Dashboard from "../components/Layout/Dashboard"
import { ROLE_LABELS, isAdminRole, assignableRoles } from "../roles"
import ModeratorRequestRow from "../components/Moderation/ModeratorRequestRow"
const formatDate = (date) => new Date(date).toLocaleDateString("fr-FR")

const Card = ({ title, children }) => (
  <section className="card bg-base-100 border border-base-300">
    <div className="card-body gap-4">
      <h2 className="card-title">{title}</h2>
      {children}
    </div>
  </section>
)

const Admin = () => {
  const { loading: authLoading } = useAuthProtection();
  const { user: authUser } = useAuth();
  const myRole = authUser?.user.role;
  const isAdmin = isAdminRole(myRole);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleStatus, setRoleStatus] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, statsRes, requestsRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/users/admin/stats').catch(() => null),
        api.get('/api/moderator-requests'),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes?.data.stats || null);
      setRequests(requestsRes.data.requests);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du chargement du tableau de bord");
    } finally {
      setLoading(false);
    }
  }, []);

  // charge les données que si admin
  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  const changeRole = async (user, role) => {
    setRoleStatus(null);
    try {
      await api.put(`/api/users/${user.id}/role`, { role });
      setRoleStatus({ type: "success", message: `${user.name} est maintenant ${ROLE_LABELS[role].toLowerCase()}` });
      await fetchData();
    } catch (err) {
      setRoleStatus({ type: "error", message: err.response?.data?.message || "Erreur lors du changement de rôle" });
    }
  };

  return (
    <AppLayout>
      <main className="p-6 m-6 mt-26 flex flex-col gap-6 max-w-5xl">
        <h1 className="text-4xl font-bold">Tableau de bord</h1>

        {authLoading ? (
          <span className="loading loading-spinner loading-lg"></span>
        ) : !isAdmin ? (
          <div role="alert" className="alert alert-error alert-soft">
            Accès refusé. Vous devez être administrateur pour accéder à cette page.
          </div>
        ) : loading ? (
          <span className="loading loading-spinner loading-lg"></span>
        ) : error ? (
          <div role="alert" className="alert alert-error alert-soft">{error}</div>
        ) : (
          <>
            <Dashboard stats={stats} />

            <Card title={`Demandes de modération (${requests.length})`}>
              <p className="text-sm text-base-content/70">
                Également visibles par les modérateurs, en lecture seule, sur la page{" "}
                <NavLink to="/moderation" className="link">Modération</NavLink>.
              </p>
              {requests.length === 0 ? (
                <p className="text-base-content/70">Aucune demande en attente.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {requests.map((request) => (
                    <ModeratorRequestRow key={request.id} request={request} onDone={fetchData} />
                  ))}
                </ul>
              )}
            </Card>

            <Card title={`Utilisateurs (${users.length})`}>
              {roleStatus && (
                <div role="alert" className={`alert alert-soft ${roleStatus.type === "success" ? "alert-success" : "alert-error"}`}>
                  {roleStatus.message}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr><th>Nom</th><th>Email</th><th>Inscrit le</th><th>Rôle</th></tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const isMe = user.id === authUser.user.id
                      const choices = isMe ? [] : assignableRoles(myRole, user.role)
                      return (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{formatDate(user.created_at)}</td>
                          <td>
                            {choices.length > 0 ? (
                              <select
                                value={user.role}
                                onChange={(e) => changeRole(user, e.target.value)}
                                aria-label={`Rôle de ${user.name}`}
                                className="select select-sm"
                              >
                                {/* Le rôle actuel reste affiché même s'il n'est pas attribuable */}
                                {[...new Set([user.role, ...choices])].map((value) => (
                                  <option key={value} value={value}>{ROLE_LABELS[value]}</option>
                                ))}
                              </select>
                            ) : (
                              <span
                                className={`badge ${isAdminRole(user.role) ? "badge-primary badge-soft" : "badge-outline"}`}
                                title={isMe ? undefined : "Seul le super admin peut gérer les administrateurs"}
                              >
                                {ROLE_LABELS[user.role]}{isMe && " (vous)"}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </AppLayout>
  );
};

export default Admin;
