import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useProjectsContext } from '../../hooks/useProjectsContext'
import { subscribe, OPEN_PROJECT_MODAL } from '../../events'
import { focusAfterOpen } from '../../focusAfterOpen'
import VisibilityField from './VisibilityField'

const ProjectCreationModal = () => {
  const dialogRef = useRef(null)
  const [submitError, setSubmitError] = useState(null)
  const { register, handleSubmit, watch, reset, setFocus, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { title: "", description: "", visibility: "private" },
  })
  const description = watch("description") || ""

  const { createProject } = useProjectsContext()

  useEffect(() => {
    return subscribe(OPEN_PROJECT_MODAL, () => {
      dialogRef.current?.showModal()
      focusAfterOpen(dialogRef.current, () => setFocus("title"))
    })
  }, [setFocus])

  const handleClose = () => {
    reset()
    setSubmitError(null)
  }

  const onSubmit = async (data) => {
    setSubmitError(null)
    try {
      await createProject({
        title: data.title.trim(),
        description: data.description?.trim() || null,
        visibility: data.visibility
      })
      dialogRef.current?.close()
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Erreur lors de la création du projet")
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id="project-modal"
      className="modal backdrop-blur-lg"
      onClose={handleClose}
    >
      <div className="modal-box flex flex-col items-center p-10 w-[420px]">
        <h2 className="text-3xl font-bold text-center mb-6">
          Créer un projet
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 w-full">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              Intitulé du projet <span className="text-error">*</span>
            </legend>
            <input
              {...register("title", { required: "Intitulé du projet obligatoire" })}
              type="text"
              placeholder="Intitulé du projet"
              className={`input w-full ${errors.title ? "input-error" : ""}`}
            />
            {errors.title && (
              <p className="label text-error">{errors.title.message}</p>
            )}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Description</legend>
            <textarea
              {...register("description")}
              placeholder="Description"
              maxLength={350}
              className="textarea w-full h-24 resize-none"
            />
            <p className="label justify-end">
              {description.length}/350 caractères
            </p>
          </fieldset>

          <VisibilityField register={register} />

          {submitError && (
            <div role="alert" className="alert alert-error alert-soft">{submitError}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full mt-4"
          >
            {isSubmitting ? "Création..." : "Créer le projet"}
          </button>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>Fermer</button>
      </form>
    </dialog>
  )
}

export default ProjectCreationModal
