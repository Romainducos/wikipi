import logoWikipi from '../../assets/Logo_wikiPi.png'
import user from '../../assets/default-user-icon.webp'
import { useEffect, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from '../../hooks/useAuth'
import { api, assetUrl } from '../../api'
import { subscribe, PROPOSALS_CHANGED, GROUPS_CHANGED } from '../../events'
import { isAdminRole, ROLE_LABELS } from '../../roles'

// Compteurs de la navbar : propositions à relire et invitations reçues
const useNotificationCounts = (enabled) => {
  const [counts, setCounts] = useState({ proposals: 0, invitations: 0 })
  const { pathname } = useLocation()

  useEffect(() => {
    if (!enabled) return
    const refresh = () => {
      Promise.all([
        api.get('/api/proposals/to-review/count'),
        api.get('/api/groups/me/invitations/count'),
      ])
        .then(([proposals, invitations]) => setCounts({
          proposals: proposals.data.count,
          invitations: invitations.data.count,
        }))
        .catch(() => {})
    }
    refresh()
    const unsubscribeProposals = subscribe(PROPOSALS_CHANGED, refresh)
    const unsubscribeGroups = subscribe(GROUPS_CHANGED, refresh)
    return () => {
      unsubscribeProposals()
      unsubscribeGroups()
    }
  }, [enabled, pathname])

  return counts
}

const Navbar = () => {
  const { user: authUser, logout } = useAuth()
  const { proposals: proposalsCount, invitations: invitationsCount } = useNotificationCounts(!!authUser)
  const totalCount = proposalsCount + invitationsCount

  return (
    <div className="navbar fixed top-0 left-0 w-full z-50 bg-base-100 px-6 py-4 flex justify-between border-b-1 border-base-300">
      <div className="flex items-center gap-1"> {/* Left side of the navbar (logo and menu icon) */}
        <label htmlFor="sidebar-drawer" tabIndex={0} role="button" aria-label="Ouvrir le menu" className="btn btn-ghost lg:hidden"> {/* Menu icon for small screens */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </label>
        <div>
          <NavLink to="/">
            <img src={logoWikipi} className="h-12" alt="Wikipi Logo"></img>
          </NavLink>
        </div>
      </div>
      <div className="flex items-center"> {/* Right side of the navbar (user avatar with dropdown menu) */}
        <div className="dropdown dropdown-end indicator">
          {totalCount > 0 && (
            <span className="indicator-item badge badge-primary badge-sm" aria-label={`${totalCount} notification(s)`}>
              {totalCount}
            </span>
          )}
          <div tabIndex={0} role="button" className="avatar w-[42px] rounded-full m-1"><img src={assetUrl(authUser?.user.avatar_url) || user} alt="User Avatar" className="object-cover rounded-full" /></div> {/* User avatar */}
          <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 mt-12 shadow-lg"> {/* Dropdown menu */}
            <li className="menu-title border-b-1 border-base-300">
              {authUser?.user.name || 'User'}
              {authUser && authUser.user.role !== 'member' && (
                <span className="block text-xs font-normal">{ROLE_LABELS[authUser.user.role]}</span>
              )}
            </li>
            {isAdminRole(authUser?.user.role) && (
              <li><NavLink to="/admin">Tableau de bord Admin</NavLink></li>
            )}
            <li>
              <NavLink to="/group">
                {authUser?.user.group_name ? `Groupe ${authUser.user.group_name}` : 'Mon groupe'}
                {invitationsCount > 0 && <span className="badge badge-primary badge-sm">{invitationsCount}</span>}
              </NavLink>
            </li>
            <li>
              <NavLink to="/proposals">
                Propositions
                {proposalsCount > 0 && <span className="badge badge-primary badge-sm">{proposalsCount}</span>}
              </NavLink>
            </li>
            <li><NavLink to="/settings">Settings</NavLink></li>
            <li ><button onClick={logout}>Log out</button></li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar