import { useState } from "react"
import { NavLink } from "react-router-dom"
import { useForm } from "react-hook-form"
import AuthCard from "../components/Auth/AuthCard"
import { api } from "../api"

const ForgotPassword = () => {
  const [sentMessage, setSentMessage] = useState(null)
  const [error, setError] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    setError(null)
    try {
      const res = await api.post("/auth/forgot-password", { email: data.email.trim() })
      setSentMessage(res.data.message)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi")
    }
  }

  return (
    <AuthCard title="Mot de passe oublié">
      {sentMessage ? (
        <div className="flex flex-col gap-4 w-full">
          <div role="status" className="alert alert-success alert-soft">{sentMessage}</div>
          <p className="text-sm text-base-content/70">Le lien est valable 1 heure. Pensez à vérifier vos spams.</p>
          <NavLink to="/login" className="btn btn-primary w-full">Retour à la connexion</NavLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 w-full">
          <p className="text-sm text-base-content/70">
            Indiquez l'email de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.
          </p>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Email</legend>
            <input
              {...register("email", {
                required: "Email obligatoire",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Adresse email invalide" },
              })}
              type="email"
              placeholder="Email"
              className={`input w-full ${errors.email ? "input-error" : ""}`}
            />
            {errors.email && <p className="label text-error">{errors.email.message}</p>}
          </fieldset>
          {error && <div role="alert" className="alert alert-error alert-soft">{error}</div>}
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full mt-2">
            {isSubmitting ? "Envoi..." : "Envoyer le lien"}
          </button>
          <NavLink to="/login" className="label text-xs text-text-link justify-center mt-2">
            Retour à la connexion
          </NavLink>
        </form>
      )}
    </AuthCard>
  )
}

export default ForgotPassword
