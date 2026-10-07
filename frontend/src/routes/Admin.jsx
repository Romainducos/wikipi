import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAuthProtection } from '../hooks/useAuthProtection';
import { api } from '../api';
import AppLayout from "../components/Layout/AppLayout"
import Dashboard from "../components/Layout/Dashboard"

const ROLE_LABELS = { admin: "Admin", modo: "Modérateur", member: "Membre" }
const formatDate = (date) => new Date(date).toLocaleDateString("fr-FR")

const Card = ({ title, children }) => (
  <section className="card bg-base-100 border border-base-300">
    <div className="card-body gap-4">
      <h2 className="card-title">{title}</h2>
      {children}
    </div>
  </section>
)

// Demande pour devenir modérateur : accepter / refuser
const ModeratorRequestRow = ({ request, onDone }) => {
  const [comment, setComment] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const decide = async (action) => {
    setBusy(true)
    setError(null)
    try {
      await api.put(`/api/moderator-requests/${request.id}/${action}`, { comment })
      await onDone()
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du traitement")
      setBusy(false)
    }
  }

  return (
    <li className="flex flex-col gap-2 border border-base-300 rounded-box p-4">
      <div>
        <span className="font-medium">{request.user_name}</span>{" "}
        <span className="text-sm text-base-content/70">{request.user_email} · {formatDate(request.created_at)}</span>
      </div>
      <blockquote className="border-l-4 border-base-300 pl-3 italic whitespace-pre-line">{request.motivation}</blockquote>
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        placeholder="Commentaire (optionnel)"
        aria-label={`Commentaire pour ${request.user_name}`}
        className="input input-sm w-full"
      />
      {error && <div role="alert" className="alert alert-error alert-soft">{error}</div>}
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn btn-sm btn-error btn-outline" disabled={busy} onClick={() => decide("reject")}>Refuser</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => decide("accept")}>Nommer modérateur</button>
      </div>
    </li>
  )
}

const Admin = () => {
  const { loading: authLoading } = useAuthProtection();
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.user.role === 'admin';
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
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>
                          {user.id === authUser.user.id ? (
                            <span className="badge badge-primary badge-soft">{ROLE_LABELS[user.role]} (vous)</span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => changeRole(user, e.target.value)}
                              aria-label={`Rôle de ${user.name}`}
                              className="select select-sm"
                            >
                              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
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
