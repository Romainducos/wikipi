import { useState } from "react"
import { useForm } from "react-hook-form"

// Formulaire nom + description d'un groupe (création ou modification)
const GroupForm = ({ defaultValues, submitLabel, onSubmit, onCancel }) => {
  const [error, setError] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultValues || { name: "", description: "" },
  })

  const submit = async (data) => {
    setError(null)
    try {
      await onSubmit({ name: data.name.trim(), description: data.description.trim() || null })
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement")
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-2">
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Nom du groupe <span className="text-error">*</span></legend>
        <input
          {...register("name", {
            required: "Le nom est requis",
            minLength: { value: 2, message: "Minimum 2 caractères" },
            maxLength: { value: 100, message: "Maximum 100 caractères" },
          })}
          type="text"
          placeholder="Ex. : Équipe robotique"
          className={`input w-full ${errors.name ? "input-error" : ""}`}
        />
        {errors.name && <p className="label text-error">{errors.name.message}</p>}
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Description</legend>
        <textarea
          {...register("description", { maxLength: { value: 500, message: "Maximum 500 caractères" } })}
          rows="2"
          className="textarea w-full resize-none"
        />
        {errors.description && <p className="label text-error">{errors.description.message}</p>}
      </fieldset>
      {error && <div role="alert" className="alert alert-error alert-soft">{error}</div>}
      <div className="flex gap-2 mt-2">
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting ? "Enregistrement..." : submitLabel}
        </button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Annuler</button>}
      </div>
    </form>
  )
}

export default GroupForm
