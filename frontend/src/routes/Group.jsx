import { useCallback, useEffect, useState } from "react"
import { NavLink } from "react-router-dom"
import AppLayout from "../components/Layout/AppLayout"
import GroupForm from "../components/Groups/GroupForm"
import ConfirmDialog from "../components/Shared/ConfirmDialog"
import { useAuthProtection } from "../hooks/useAuthProtection"
import { useAuth } from "../hooks/useAuth"
import { useProjectsContext } from "../hooks/useProjectsContext"
import { api, assetUrl } from "../api"
import { emit, GROUPS_CHANGED } from "../events"
import defaultAvatar from "../assets/default-user-icon.webp"

const errorMessage = (err, fallback) => err.response?.data?.message || fallback
const formatDate = (date) => new Date(date).toLocaleDateString("fr-FR")

const Card = ({ title, children, actions }) => (
  <section className="card bg-base-100 border border-base-300">
    <div className="card-body gap-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="card-title">{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  </section>
)

const Feedback = ({ status }) =>
  status ? (
    <div role="alert" className={`alert alert-soft ${status.type === "success" ? "alert-success" : "alert-error"}`}>
      {status.message}
    </div>
  ) : null

// Invitations reçues : accepter / refuser
const ReceivedInvitations = ({ invitations, inGroup, onChanged }) => {
  const [status, setStatus] = useState(null)

  const respond = async (invitation, action) => {
    setStatus(null)
    try {
      const res = await api.post(`/api/groups/invitations/${invitation.id}/${action}`)
      await onChanged()
      setStatus({ type: "success", message: res.data.message })
    } catch (err) {
      setStatus({ type: "error", message: errorMessage(err, "Erreur lors de la réponse") })
    }
  }

  if (invitations.length === 0) return null

  return (
    <Card title={`Invitations reçues (${invitations.length})`}>
      {inGroup && (
        <p className="text-sm text-base-content/70">
          Vous faites déjà partie d'un groupe : quittez-le pour accepter une autre invitation.
        </p>
      )}
      <ul className="list">
        {invitations.map((invitation) => (
          <li key={invitation.id} className="list-row items-center">
            <div className="list-col-grow">
              <div className="font-medium">{invitation.group_name}</div>
              <div className="text-sm text-base-content/70">
                Invité par {invitation.invited_by_name} le {formatDate(invitation.created_at)}
              </div>
              {invitation.group_description && <div className="text-sm">{invitation.group_description}</div>}
            </div>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => respond(invitation, "decline")}>
              Refuser
            </button>
            <button type="button" className="btn btn-sm btn-primary" disabled={inGroup} onClick={() => respond(invitation, "accept")}>
              Accepter
            </button>
          </li>
        ))}
      </ul>
      <Feedback status={status} />
    </Card>
  )
}

const MembersCard = ({ group, currentUserId, onChanged, onLeave }) => {
  const [status, setStatus] = useState(null)
  const canManage = group.permissions.canManage

  const run = async (request, successMessage) => {
    setStatus(null)
    try {
      await request()
      await onChanged()
      setStatus({ type: "success", message: successMessage })
    } catch (err) {
      setStatus({ type: "error", message: errorMessage(err, "Erreur") })
    }
  }

  return (
    <Card title={`Membres (${group.members.length})`}>
      <ul className="list">
        {group.members.map((member) => {
          const isMe = member.id === currentUserId
          return (
            <li key={member.id} className="list-row items-center">
              <div className="avatar">
                <div className="w-10 rounded-full">
                  <img src={assetUrl(member.avatar_url) || defaultAvatar} alt="" className="object-cover" />
                </div>
              </div>
              <div className="list-col-grow">
                <div className="font-medium">
                  {member.name} {isMe && <span className="text-base-content/70">(vous)</span>}
                </div>
                <div className="text-sm text-base-content/70">{member.email}</div>
              </div>
              <span className={`badge ${member.role === "owner" ? "badge-primary badge-soft" : "badge-outline"}`}>
                {member.role === "owner" ? "Owner" : "Membre"}
              </span>
              {canManage && !isMe && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="btn btn-xs"
                    onClick={() => run(
                      () => api.put(`/api/groups/${group.id}/members/${member.id}`, { role: member.role === "owner" ? "member" : "owner" }),
                      "Rôle mis à jour"
                    )}
                  >
                    {member.role === "owner" ? "Passer membre" : "Nommer owner"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-error btn-outline"
                    onClick={() => run(() => api.delete(`/api/groups/${group.id}/members/${member.id}`), `${member.name} a été retiré du groupe`)}
                  >
                    Retirer
                  </button>
                </div>
              )}
              {isMe && (
                <button type="button" className="btn btn-xs btn-ghost" onClick={onLeave}>
                  Quitter le groupe
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <Feedback status={status} />
    </Card>
  )
}

const InvitationsCard = ({ group, onChanged }) => {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)

  const invite = async (event) => {
    event.preventDefault()
    setBusy(true)
    setStatus(null)
    try {
      const res = await api.post(`/api/groups/${group.id}/invitations`, { email: email.trim() })
      setEmail("")
      await onChanged()
      setStatus({ type: "success", message: res.data.message })
    } catch (err) {
      setStatus({ type: "error", message: errorMessage(err, "Erreur lors de l'invitation") })
    } finally {
      setBusy(false)
    }
  }

  const cancel = async (invitation) => {
    setStatus(null)
    try {
      await api.delete(`/api/groups/${group.id}/invitations/${invitation.id}`)
      await onChanged()
    } catch (err) {
      setStatus({ type: "error", message: errorMessage(err, "Erreur lors de l'annulation") })
    }
  }

  return (
    <Card title="Inviter des membres">
      <form onSubmit={invite} className="join w-full max-w-md">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemple.fr"
          aria-label="Email de la personne à inviter"
          className="input join-item w-full"
        />
        <button type="submit" disabled={busy} className="btn btn-primary join-item">Inviter</button>
      </form>
      <p className="text-sm text-base-content/70">La personne doit accepter l'invitation pour rejoindre le groupe.</p>
      <Feedback status={status} />
      {group.invitations.length > 0 && (
        <>
          <h3 className="font-semibold">En attente de réponse</h3>
          <ul className="list">
            {group.invitations.map((invitation) => (
              <li key={invitation.id} className="list-row items-center">
                <div className="list-col-grow">
                  <div>{invitation.name}</div>
                  <div className="text-sm text-base-content/70">{invitation.email} · {formatDate(invitation.created_at)}</div>
                </div>
                <button type="button" className="btn btn-xs btn-ghost" onClick={() => cancel(invitation)}>
                  Annuler
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}

const Group = () => {
  useAuthProtection()
  const { user: authUser, checkAuth } = useAuth()
  const { loadProjects } = useProjectsContext()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [confirmError, setConfirmError] = useState(null)
  const [confirmBusy, setConfirmBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.get("/api/groups/me")
      setData(res.data)
      setError(null)
    } catch (err) {
      setError(errorMessage(err, "Erreur lors du chargement du groupe"))
    }
  }, [])

  // Après un changement d'appartenance : profil, projets visibles, compteurs
  const refreshAll = useCallback(async () => {
    await Promise.all([load(), checkAuth()])
    loadProjects().catch(() => {})
    emit(GROUPS_CHANGED)
  }, [load, checkAuth, loadProjects])

  useEffect(() => {
    load()
  }, [load])

  const group = data?.group
  const currentUserId = authUser?.user.id

  const askConfirm = (config) => {
    setConfirmError(null)
    setConfirm(config)
  }

  const runConfirm = async () => {
    setConfirmBusy(true)
    setConfirmError(null)
    try {
      await confirm.action()
      setConfirm(null)
      await refreshAll()
    } catch (err) {
      setConfirmError(errorMessage(err, "Erreur"))
    } finally {
      setConfirmBusy(false)
    }
  }

  return (
    <AppLayout>
      <main className="p-6 m-6 mt-26 flex flex-col gap-6 max-w-3xl">
        <h1 className="text-4xl font-bold">Mon groupe</h1>

        {error && <div role="alert" className="alert alert-error alert-soft">{error}</div>}
        {!data && !error && <span className="loading loading-spinner loading-lg"></span>}

        {data && (
          <>
            <ReceivedInvitations invitations={data.invitations} inGroup={!!group} onChanged={refreshAll} />

            {!group && (
              <Card title="Créer un groupe">
                <p className="text-sm text-base-content/70">
                  Vous ne faites partie d'aucun groupe. Créez-en un pour partager des projets avec vos coéquipiers,
                  ou acceptez une invitation. On ne peut faire partie que d'un seul groupe à la fois.
                </p>
                <GroupForm
                  submitLabel="Créer le groupe"
                  onSubmit={async (values) => {
                    await api.post("/api/groups", values)
                    await refreshAll()
                  }}
                />
              </Card>
            )}

            {group && (
              <>
                <Card
                  title={group.name}
                  actions={group.permissions.canManage && !editing && (
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-sm" onClick={() => setEditing(true)}>Modifier</button>
                      <button
                        type="button"
                        className="btn btn-sm btn-error btn-outline"
                        onClick={() => askConfirm({
                          title: "Supprimer le groupe ?",
                          message: `« ${group.name} » sera supprimé. Ses ${group.projects.length} projet(s) partagé(s) redeviendront privés (visibles seulement par leur créateur).`,
                          label: "Supprimer",
                          action: () => api.delete(`/api/groups/${group.id}`),
                        })}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                >
                  {editing ? (
                    <GroupForm
                      defaultValues={{ name: group.name, description: group.description || "" }}
                      submitLabel="Enregistrer"
                      onCancel={() => setEditing(false)}
                      onSubmit={async (values) => {
                        await api.put(`/api/groups/${group.id}`, values)
                        setEditing(false)
                        await refreshAll()
                      }}
                    />
                  ) : (
                    <>
                      <p className="whitespace-pre-line">
                        {group.description || <span className="text-base-content/50">Pas de description</span>}
                      </p>
                      <p className="text-sm text-base-content/70">
                        Votre rôle : {group.my_role === "owner"
                          ? "owner (vous gérez le groupe, ses projets et validez les propositions de modification)"
                          : "membre"}
                      </p>
                    </>
                  )}
                </Card>

                <MembersCard
                  group={group}
                  currentUserId={currentUserId}
                  onChanged={refreshAll}
                  onLeave={() => askConfirm({
                    title: "Quitter le groupe ?",
                    message: `Vous n'aurez plus accès aux projets partagés avec « ${group.name} ».`,
                    label: "Quitter",
                    action: () => api.delete(`/api/groups/${group.id}/members/${currentUserId}`),
                  })}
                />

                {group.permissions.canManage && <InvitationsCard group={group} onChanged={load} />}

                <Card title={`Projets du groupe (${group.projects.length})`}>
                  {group.projects.length === 0 ? (
                    <p className="text-base-content/70">
                      Aucun projet partagé. Choisissez la visibilité « Mon groupe » en créant ou modifiant un projet.
                    </p>
                  ) : (
                    <ul className="list">
                      {group.projects.map((project) => (
                        <li key={project.id} className="list-row">
                          <NavLink to={`/project/${project.id}`} className="list-col-grow hover:underline">
                            <div className="font-medium">{project.title}</div>
                            {project.description && <div className="text-sm text-base-content/70">{project.description}</div>}
                          </NavLink>
                          <div className="text-sm text-base-content/70">{project.creator_name}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </>
            )}
          </>
        )}

        <ConfirmDialog
          open={!!confirm}
          title={confirm?.title}
          message={confirm?.message}
          confirmLabel={confirm?.label}
          busy={confirmBusy}
          error={confirmError}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
        />
      </main>
    </AppLayout>
  )
}

export default Group
