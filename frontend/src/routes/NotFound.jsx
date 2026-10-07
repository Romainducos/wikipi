import { NavLink } from "react-router-dom"
import AuthCard from "../components/Auth/AuthCard"

const NotFound = () => (
  <AuthCard title="Page introuvable">
    <div className="flex flex-col gap-4 w-full">
      <p className="text-base-content/70">Cette page n'existe pas ou a été déplacée.</p>
      <NavLink to="/" className="btn btn-primary w-full">Retour à l'accueil</NavLink>
    </div>
  </AuthCard>
)

export default NotFound
