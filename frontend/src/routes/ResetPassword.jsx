import { useState } from "react"
import { NavLink, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import AuthCard from "../components/Auth/AuthCard"
import { api } from "../api"

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [done, setDone] = useState(null)
  const [error, setError] = useState(null)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const password = watch("password")

  const onSubmit = async (data) => {
    setError(null)
    try {
      const res = await api.post("/auth/reset-password", { token, password: data.password })
      setDone(res.data.message)
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la réinitialisation")
    }
  }

  if (!token) {
    return (
      <AuthCard title="Lien incomplet">
        <div className="flex flex-col gap-4 w-full">
          <div role="alert" className="alert alert-error alert-soft">Ce lien de réinitialisation est incomplet.</div>
          <NavLink to="/forgot-password" className="btn btn-primary w-full">Refaire une demande</NavLink>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Nouveau mot de passe">
      {done ? (
        <div className="flex flex-col gap-4 w-full">
          <div role="status" className="alert alert-success alert-soft">{done}</div>
          <NavLink to="/login" className="btn btn-primary w-full">Se connecter</NavLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 w-full">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Nouveau mot de passe</legend>
            <input
              {...register("password", {
                required: "Mot de passe obligatoire",
                minLength: { value: 8, message: "Minimum 8 caractères" },
              })}
              type="password"
              className={`input w-full ${errors.password ? "input-error" : ""}`}
            />
            {errors.password && <p className="label text-error">{errors.password.message}</p>}
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Confirmation</legend>
            <input
              {...register("confirmPassword", {
                required: "Confirmation obligatoire",
                validate: (value) => value === password || "Les mots de passe ne correspondent pas",
              })}
              type="password"
              className={`input w-full ${errors.confirmPassword ? "input-error" : ""}`}
            />
            {errors.confirmPassword && <p className="label text-error">{errors.confirmPassword.message}</p>}
          </fieldset>
          {error && (
            <div role="alert" className="alert alert-error alert-soft flex-col items-start">
              <span>{error}</span>
              <NavLink to="/forgot-password" className="link">Refaire une demande</NavLink>
            </div>
          )}
          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full mt-2">
            {isSubmitting ? "Enregistrement..." : "Changer le mot de passe"}
          </button>
        </form>
      )}
    </AuthCard>
  )
}

export default ResetPassword
