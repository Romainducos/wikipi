import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useProjectsContext } from '../../hooks/useProjectsContext'
import { focusAfterOpen } from '../../focusAfterOpen'

// Modification d'un projet existant (titre, description, visibilité)
const ProjectEditModal = ({ project, open, onClose, onSaved }) => {
  const dialogRef = useRef(null)
  const [submitError, setSubmitError] = useState(null)
  const { register, handleSubmit, watch, reset, setFocus, formState: { errors, isSubmitting } } = useForm()
  const description = watch("description") || ""
  const { updateProject } = useProjectsContext()

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) {
      reset({
        title: project.title,
        description: project.description || "",
        is_public: !!project.is_public,
      })
      setSubmitError(null)
      dialog.showModal()
      focusAfterOpen(dialog, () => setFocus("title"))
    }
    if (!open && dialog.open) dialog.close()
  }, [open, project, reset, setFocus])

  const onSubmit = async (data) => {
    setSubmitError(null)
    try {
      const updated = await updateProject(project.id, {
        title: data.title.trim(),
        description: data.description.trim() || null,
        is_public: data.is_public,
      })
      onSaved(updated)
      onClose()
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Erreur lors de la mise à jour du projet")
    }
  }

  return (
    <dialog ref={dialogRef} className="modal backdrop-blur-lg" onClose={onClose}>
      <div className="modal-box flex flex-col items-center p-10 w-[420px]">
        <h2 className="text-3xl font-bold text-center mb-6">Modifier le projet</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 w-full">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              Intitulé du projet <span className="text-error">*</span>
            </legend>
            <input
              {...register("title", { required: "Intitulé du projet obligatoire" })}
              type="text"
              className={`input w-full ${errors.title ? "input-error" : ""}`}
            />
            {errors.title && <p className="label text-error">{errors.title.message}</p>}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Description</legend>
            <textarea
              {...register("description")}
              maxLength={350}
              className="textarea w-full h-24 resize-none"
            />
            <p className="label justify-end">{description.length}/350 caractères</p>
          </fieldset>

          <label className="label cursor-pointer gap-3">
            <input type="checkbox" {...register("is_public")} className="toggle toggle-primary" />
            <span>Projet public : visible par tous les utilisateurs</span>
          </label>

          {submitError && (
            <div role="alert" className="alert alert-error alert-soft">{submitError}</div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full mt-4">
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>Fermer</button>
      </form>
    </dialog>
  )
}

export default ProjectEditModal
